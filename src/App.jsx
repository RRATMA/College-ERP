import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  ChevronRight, LayoutGrid, Users, Download, Zap, 
  FlaskConical, GraduationCap, PlusCircle, ClipboardList, 
  Settings, Database, Activity, BookOpenCheck, UserCheck, 
  Monitor, Clock, CheckCircle2, AlertCircle, BarChart3, TrendingUp, FileDown, ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- प्रीमियम डार्क थीम स्टाइलिंग ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-v4')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-v4';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; }
    .glass:hover { border-color: rgba(6, 182, 212, 0.3); }
    .stat-card { padding: 24px; display: flex; flex-direction: column; justify-content: space-between; min-height: 150px; transition: 0.3s; }
    .stat-card:hover { transform: translateY(-5px); background: rgba(30, 41, 59, 0.6); }
    .icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 14px; padding: 14px; width: 100%; transition: 0.2s; }
    input:focus { border-color: #06b6d4 !important; box-shadow: 0 0 0 2px rgba(6,182,212,0.1); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 12px; }
    .tab-btn { padding: 14px 24px; border-radius: 16px; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; transition: 0.3s; background: transparent; font-size: 13px; letter-spacing: 1px; }
    .tab-btn.active { background: #0891b2; color: #fff; box-shadow: 0 10px 20px -5px rgba(8,145,178,0.4); }
    .def-badge { background: rgba(244, 63, 94, 0.15); color: #f43f5e; padding: 5px 12px; border-radius: 10px; font-size: 11px; font-weight: 800; border: 1px solid rgba(244, 63, 94, 0.2); }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Logo or Excel source missing"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Administrator", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid credentials or unauthorized access.");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass" style={ui.loginCard}>
        <div style={ui.logoBox}><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'contain'}} alt="Logo" /></div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800, letterSpacing: '-1.5px'}}>AMRIT 0.2</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '4px', marginBottom: '35px', opacity: 0.8}}>COLLEGE ERP</p>
        <input id="u" placeholder="Admin/Faculty ID" />
        <input id="p" type="password" placeholder="Passcode" style={{marginTop:'12px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{...ui.primaryBtn, marginTop:'25px'}}> LOGIN <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- १. HOD पॅनेल (सर्व ६ डॅशबोर्ड्ससह) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadAll(); }, []);

  // डॅशबोर्ड कॅलक्युलेशन्स
  const today = new Date().toLocaleDateString('en-GB');
  const tLogs = db.logs.filter(l => l.time_str === today);
  const totalP = db.logs.reduce((a, b) => a + (b.present || 0), 0);
  const totalT = db.logs.reduce((a, b) => a + (b.total || 0), 0);
  const avgAtt = totalT > 0 ? ((totalP / totalT) * 100).toFixed(1) : 0;
  
  // डिफॉल्टर लॉजिक (>= ५ गैरहजेरी)
  const defMap = db.abs.reduce((acc, curr) => {
    acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1;
    return acc;
  }, {});
  const defs = Object.entries(defMap).filter(([_, c]) => c >= 5).map(([r, c]) => ({ r, c }));

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <img src="/logo.png" style={{width:'50px', height:'50px'}} alt="HOD Logo" />
            <div><h3 style={{margin:0}}>HOD Management</h3><small style={{color:'#64748b'}}>Central Control Panel</small></div>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>
      
      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'defaulters', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h2>{db.logs.length}</h2><p style={ui.label}>MASTER LOGS</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck/></div><div><h2>{db.facs.length}</h2><p style={ui.label}>REGISTERED STAFF</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div><div><h2>{excelSheets.length}</h2><p style={ui.label}>TOTAL CLASSES</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}><TrendingUp/></div><div><h2>{avgAtt}%</h2><p style={ui.label}>AVG ATTENDANCE</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><Zap/></div><div><h2>{tLogs.length}</h2><p style={ui.label}>SESSION TODAY</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><ShieldAlert/></div><div><h2>{defs.length}</h2><p style={ui.label}>CRITICAL DEFAULTERS</p></div></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'25px', marginBottom:'25px', border:'1px solid rgba(6,182,212,0.2)'}}>
            <p style={ui.label}>FACULTY REGISTRATION</p>
            <input placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'12px', marginTop:'12px'}}>
                <input placeholder="User ID" onChange={e=>setForm({...form, id:e.target.value})}/>
                <input placeholder="Passcode" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={{...ui.primaryBtn, marginTop:'18px'}} onClick={async()=>{
                await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); 
                loadAll(); alert("Faculty Registered Successfully");
            }}>ADD NEW FACULTY</button>
          </div>
          {db.facs.map(f => {
            const sT = db.logs.filter(x => x.faculty === f.name && x.type === 'Theory').length;
            const sP = db.logs.filter(x => x.faculty === f.name && x.type === 'Practical').length;
            return (
              <div key={f.id} style={ui.feedRow} className="glass">
                <div><b>{f.name}</b><br/><small style={{color:'#64748b'}}>ID: {f.id} | Theory: <span style={{color:'#06b6d4'}}>{sT}</span> | Practical: <span style={{color:'#10b981'}}>{sP}</span></small></div>
                <button onClick={async()=>{if(window.confirm('Remove staff?')){await supabase.from('faculties').delete().eq('id', f.id); loadAll();}}} style={ui.delBtn}><Trash2/></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'25px'}}>
          <p style={ui.label}>ACADEMIC LOAD ALLOCATION</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'12px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" style={{marginTop:'12px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, marginTop:'20px', background:'#a855f7'}} onClick={async()=>{
              await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); 
              loadAll(); alert("Subject Mapped");
          }}>MAP SUBJECT</button>
        </div>
      )}

      {tab === 'defaulters' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
            <p style={ui.label}>STUDENTS WITH >= 5 MISSING SESSIONS</p>
            <button style={{background:'#f59e0b', color:'#fff', padding:'10px 18px', borderRadius:'12px', border:'none', cursor:'pointer'}} onClick={()=>{
                 const ws = XLSX.utils.json_to_sheet(defs);
                 const wb = XLSX.utils.book_new();
                 XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
                 XLSX.writeFile(wb, "Defaulter_List.xlsx");
            }}><FileDown size={18}/></button>
          </div>
          {defs.map(d => (
            <div key={d.r} className="glass" style={ui.feedRow}>
                <span>Roll No: <b>{d.r}</b></span>
                <span className="def-badge">{d.c} Absents</span>
            </div>
          ))}
          {defs.length === 0 && <p style={{textAlign:'center', opacity:0.5}}>No critical absentees.</p>}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
            <input placeholder="Search records..." style={{flex:1}} onChange={e=>setSearchTerm(e.target.value)}/>
            <button style={{background:'#10b981', color:'#fff', padding:'12px', borderRadius:'14px', border:'none'}} onClick={()=>{
                 const ws = XLSX.utils.json_to_sheet(db.logs);
                 const wb = XLSX.utils.book_new();
                 XLSX.utils.book_append_sheet(wb, ws, "MasterAttendance");
                 XLSX.writeFile(wb, "Amrit_Master_Report.xlsx");
            }}><Download size={20}/></button>
          </div>
          <div className="scroll-hide" style={{maxHeight:'60vh', overflowY:'auto'}}>
            {db.logs.filter(l=>(l.class+l.sub+l.faculty).toLowerCase().includes(searchTerm.toLowerCase())).map(log=>(
              <div key={log.id} style={ui.feedRow} className="glass">
                <div><b>{log.class} | {log.sub}</b><br/><small style={{color:'#64748b'}}>{log.faculty} • {log.type}</small></div>
                <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small style={{color:'#06b6d4'}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- २. फॅकल्टी पॅनेल ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Details missing");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("GPS Warning: Go to campus!"); }
      
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: tStr 
      }]).select().single();
      
      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, 
        student_roll: s.id, 
        class_name: setup.cl,
        subject: setup.sub, 
        date: tStr 
      }));
      
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);
      alert("Attendance Saved!"); setView('login');
    }, () => { setLoading(false); alert("GPS Denied!"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small style={{color:'#06b6d4'}}>Welcome,</small><h4>{user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button></div>
      <p style={ui.label}>SELECT YOUR CLASS</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      
      {setup.cl && (
        <div style={{marginTop:'25px'}}>
          <p style={ui.label}>SUBJECT</p>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}
          <div style={{display:'flex', gap:'12px', marginTop:'15px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          <div style={{display:'flex', gap:'12px', marginTop:'12px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} className={`tab-btn ${setup.ty==='Theory'?'active':''}`} style={{flex:1, background:setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>THEORY</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} className={`tab-btn ${setup.ty==='Practical'?'active':''}`} style={{flex:1, background:setup.ty==='Practical'?'#10b981':'#1e293b'}}>PRACTICAL</button>
          </div>
          <button onClick={launch} style={{...ui.primaryBtn, marginTop:'25px', padding:'22px'}}><Zap size={18}/> START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b', border: marked.includes(s.id)?'none':'1px solid rgba(255,255,255,0.05)'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "VERIFYING GPS..." : "SUBMIT TO CLOUD"}</button>
    </div>
  );
}

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' },
  loginCard: { padding: '50px 40px', width: '320px', textAlign: 'center' },
  logoBox: { width: '100px', height: '100px', background: 'rgba(6,182,212,0.1)', borderRadius: '30px', margin: '0 auto 25px', border: '1px solid #06b6d4', padding:'10px' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '35px', overflowX: 'auto' },
  primaryBtn: { width: '100%', padding: '18px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '800', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', cursor:'pointer' },
  exitBtn: { background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: 'none', padding:'12px', borderRadius:'14px', cursor:'pointer' },
  mobileWrap: { padding: '24px', maxWidth: '500px', margin: '0 auto' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  tile: { padding: '35px 10px', borderRadius: '24px', textAlign: 'center', fontWeight: '800', color: '#fff', cursor:'pointer', fontSize:'20px' },
  subRow: { padding: '18px', borderRadius: '16px', textAlign: 'center', fontWeight: 'bold', color: '#fff', marginBottom: '10px' },
  label: { fontSize: '11px', color: '#64748b', fontWeight: '800', marginBottom: '8px', letterSpacing:'1px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  rollChip: { padding: '22px 0', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor:'pointer' },
  submitBtn: { position: 'fixed', bottom: '25px', left: '25px', right: '25px', padding: '22px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: '800', boxShadow: '0 10px 30px rgba(16,185,129,0.3)', maxWidth:'450px', margin:'0 auto' },
  badge: { background: '#10b981', padding: '8px 16px', borderRadius: '12px', fontWeight: '900' },
  circleBtn: { width: '48px', height: '48px', borderRadius: '16px', background: '#1e293b', border: 'none', color: '#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor:'pointer' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius:'22px', marginBottom:'12px' }
};
