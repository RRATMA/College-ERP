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

// --- GLOBAL STYLES (Vercel Optimized) ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-v5')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-v5';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; }
    .stat-card { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; transition: 0.3s; border-radius: 24px; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tab-btn { padding: 12px 18px; border-radius: 12px; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; background: transparent; transition: 0.3s; }
    .tab-btn.active { background: #0891b2; color: #fff; box-shadow: 0 8px 15px rgba(8,145,178,0.3); }
    .def-badge { background: rgba(244, 63, 94, 0.1); color: #f43f5e; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; border: 1px solid rgba(244, 63, 94, 0.2); }
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
    }).catch(e => console.error("Assets Load Error", e));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Administrator", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Login Credentials");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass" style={ui.loginCard}>
        <div style={ui.logoBox}><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'contain'}} alt="Logo" /></div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '4px', marginBottom: '30px'}}>ADMIN ERP</p>
        <input id="u" placeholder="Admin/Faculty ID" />
        <input id="p" type="password" placeholder="Passcode" style={{marginTop:'12px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{...ui.primaryBtn, marginTop:'20px'}}>SECURE LOGIN</button>
      </div>
    </div>
  );

  return <div style={{minHeight:'100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadAll(); }, []);

  // Calculation Logic
  const todayStr = new Date().toLocaleDateString('en-GB');
  const logsToday = db.logs.filter(l => l.time_str === todayStr);
  const totalP = db.logs.reduce((acc, curr) => acc + (curr.present || 0), 0);
  const totalT = db.logs.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const attPct = totalT > 0 ? ((totalP / totalT) * 100).toFixed(1) : 0;

  const defCounter = db.abs.reduce((acc, curr) => {
    acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1;
    return acc;
  }, {});
  const criticals = Object.entries(defCounter).filter(([_, count]) => count >= 5).map(([r, c]) => ({ r, c }));

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'45px', height:'45px', borderRadius:'10px'}} alt="Logo" />
          <h3 style={{margin:0}}>HOD Dashboard</h3>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      <div style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'defaulters', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h2>{db.logs.length}</h2><p style={ui.label}>TOTAL RECORDS</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck/></div><div><h2>{db.facs.length}</h2><p style={ui.label}>ACTIVE STAFF</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div><div><h2>{excelSheets.length}</h2><p style={ui.label}>CLASSES</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}><TrendingUp/></div><div><h2>{attPct}%</h2><p style={ui.label}>AVG ATTENDANCE</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><Zap/></div><div><h2>{logsToday.length}</h2><p style={ui.label}>TODAY LOGS</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><ShieldAlert/></div><div><h2>{criticals.length}</h2><p style={ui.label}>DEFAULTERS</p></div></div>
        </div>
      )}

      {tab === 'defaulters' && (
        <div>
          <p style={ui.label}>CRITICAL LIST (&ge; 5 ABSENT)</p>
          {criticals.map(d => (
            <div key={d.r} className="glass" style={ui.feedRow}>
              <span>Roll: <b>{d.r}</b></span>
              <span className="def-badge">{d.c} Absents</span>
            </div>
          ))}
          {criticals.length === 0 && <p style={{textAlign:'center', opacity:0.5}}>No defaulters found.</p>}
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'20px', border:'1px solid rgba(6,182,212,0.1)'}}>
            <p style={ui.label}>ADD STAFF MEMBER</p>
            <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'12px', marginTop:'12px'}}>
              <input placeholder="User ID" onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Passcode" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={{...ui.primaryBtn, marginTop:'15px'}} onClick={async()=>{
                await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); 
                loadAll(); alert("Staff Registered");
            }}>SAVE FACULTY</button>
          </div>
          {db.facs.map(f => {
             const tCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
             const pCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
             return (
               <div key={f.id} style={ui.feedRow} className="glass">
                 <div><b>{f.name}</b><br/><small style={{color:'#64748b'}}>T: {tCount} | P: {pCount}</small></div>
                 <button onClick={async()=>{if(window.confirm('Delete?')){await supabase.from('faculties').delete().eq('id', f.id); loadAll();}}} style={ui.delBtn}><Trash2 size={18}/></button>
               </div>
             );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'25px'}}>
          <p style={ui.label}>ASSIGN ACADEMIC LOAD</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'12px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject" style={{marginTop:'12px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, marginTop:'15px', background:'#a855f7'}} onClick={async()=>{
              await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); 
              loadAll(); alert("Mapped Successfully");
          }}>ALLOCATE SUBJECT</button>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button style={{background:'#10b981', color:'#fff', padding:'10px 15px', borderRadius:'10px', border:'none', marginBottom:'15px', cursor:'pointer'}} onClick={()=>{
               const ws = XLSX.utils.json_to_sheet(db.logs);
               const wb = XLSX.utils.book_new();
               XLSX.utils.book_append_sheet(wb, ws, "Attendance");
               XLSX.writeFile(wb, "Amrit_Attendance_Report.xlsx");
          }}>Download Excel Report</button>
          {db.logs.map(log => (
            <div key={log.id} style={ui.feedRow} className="glass">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.type}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const startAtt = () => {
    if(!setup.cl || !setup.sub) return alert("Select details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const shName = wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase());
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[shName]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const submitAtt = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("GPS Error: You are not in campus!"); }
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, present: marked.length, total: students.length, time_str: tStr }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl, subject: setup.sub, date: tStr }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Attendance Synced"); setView('login');
    }, () => { setLoading(false); alert("GPS Required!"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Teacher Mode</small><h4>{user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button></div>
      <p style={ui.label}>CHOOSE CLASS</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      {setup.cl && (
        <div style={{marginTop:'25px'}}>
          <p style={ui.label}>SUBJECT</p>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}
          <div style={{display:'flex', gap:'12px', marginTop:'15px'}}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.primaryBtn, flex:1, background:setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>Theory</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.primaryBtn, flex:1, background:setup.ty==='Practical'?'#10b981':'#1e293b'}}>Practical</button>
          </div>
          <button onClick={startAtt} style={{...ui.primaryBtn, marginTop:'20px', padding:'20px'}}>START ATTENDANCE</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submitAtt} style={ui.submitBtn}>{loading ? "VERIFYING..." : "SYNC TO DATABASE"}</button>
    </div>
  );
}

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' },
  loginCard: { padding: '40px', width: '300px', textAlign: 'center' },
  logoBox: { width: '80px', height: '80px', margin: '0 auto 20px', background:'rgba(6,182,212,0.1)', borderRadius:'15px', padding:'10px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom:'5px' },
  primaryBtn: { width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor:'pointer' },
  exitBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor:'pointer' },
  mobileWrap: { padding: '20px' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { padding: '25px 10px', borderRadius: '20px', textAlign: 'center', fontWeight:'bold', color: '#fff', cursor:'pointer' },
  subRow: { padding: '15px', borderRadius: '12px', textAlign: 'center', color: '#fff', marginBottom: '8px', cursor:'pointer' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: '800', marginBottom: '8px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  rollChip: { padding: '20px 0', borderRadius: '15px', textAlign: 'center', fontWeight:'bold', color: '#fff', cursor:'pointer' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '18px', borderRadius: '15px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold' },
  badge: { background: '#10b981', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius:'15px', marginBottom:'10px' }
};
