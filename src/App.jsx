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

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-v6')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-v6';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .stat-card-new { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tab-btn { padding: 14px 24px; border-radius: 16px; border: none; font-weight: 800; color: #fff; cursor: pointer; background: #1e293b; }
    .tab-btn.active { background: #0891b2; box-shadow: 0 4px 12px rgba(8,145,178,0.3); }
    .def-badge { background: rgba(244, 63, 94, 0.2); color: #f43f5e; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; border: 1px solid rgba(244, 63, 94, 0.3); }
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
    }).catch(e => console.error("Resource error", e));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Access Denied: Invalid Credentials");
    }
  };

  // --- HOME PAGE (MAZA CODE MODEL) ---
  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div style={ui.logoCircle}><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} alt="Logo" /></div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800, letterSpacing: '-1px'}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '3px', marginBottom: '30px', opacity: 0.8}}>VIRTUAL CAMPUS</p>
        <input id="u" placeholder="Admin/Faculty ID" />
        <input id="p" type="password" placeholder="Secure Passcode" style={{marginTop:'12px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{...ui.primaryBtn, marginTop:'24px'}}>LOGIN TO SYSTEM <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
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

  const todayStr = new Date().toLocaleDateString('en-GB');
  const logsToday = db.logs.filter(log => log.time_str === todayStr);
  const totalP = db.logs.reduce((acc, curr) => acc + (curr.present || 0), 0);
  const totalT = db.logs.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const avgAttendance = totalT > 0 ? ((totalP / totalT) * 100).toFixed(1) : 0;
  
  const defCounts = db.abs.reduce((acc, curr) => {
    acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1;
    return acc;
  }, {});
  const criticals = Object.entries(defCounts).filter(([_, count]) => count >= 5).map(([roll, count]) => ({ roll, count }));

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <img src="/logo.png" style={{width:'45px', height:'45px', borderRadius:'12px'}} alt="Logo" />
            <div><h3 style={{margin:0}}>HOD Dashboard</h3><small style={{color:'#64748b'}}>Central Control</small></div>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>
      
      <div style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'defaulters', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h2>{db.logs.length}</h2><p style={ui.label}>TOTAL LECTURES</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck/></div><div><h2>{db.facs.length}</h2><p style={ui.label}>FACULTY COUNT</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div><div><h2>{excelSheets.length}</h2><p style={ui.label}>CLASSES</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}><TrendingUp/></div><div><h2>{avgAttendance}%</h2><p style={ui.label}>AVG ATTENDANCE</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><Zap/></div><div><h2>{logsToday.length}</h2><p style={ui.label}>LOGS TODAY</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><ShieldAlert/></div><div><h2>{criticals.length}</h2><p style={ui.label}>DEFAULTERS</p></div></div>
        </div>
      )}

      {tab === 'defaulters' && (
        <div>
          <p style={ui.label}>STUDENTS WITH &ge; 5 ABSENT SESSIONS</p>
          {criticals.map(d => (
            <div key={d.roll} className="glass-card" style={ui.feedRow}>
                <span>Roll No: <b>{d.roll}</b></span>
                <span className="def-badge">{d.count} Lectures Missed</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'24px', marginBottom:'24px'}}>
            <p style={ui.label}>REGISTER NEW STAFF</p>
            <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'12px', marginTop:'12px'}}>
                <input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/>
                <input placeholder="Passcode" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={{...ui.primaryBtn, marginTop:'16px'}} onClick={async()=>{
                await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); 
                loadAll(); alert("Staff Registered!");
            }}>SAVE FACULTY</button>
          </div>
          {db.facs.map(f => {
            const sT = db.logs.filter(x => x.faculty === f.name && x.type === 'Theory').length;
            const sP = db.logs.filter(x => x.faculty === f.name && x.type === 'Practical').length;
            return (
              <div key={f.id} style={ui.feedRow} className="glass-card">
                <div><b>{f.name}</b><br/><small style={{color:'#64748b'}}>ID: {f.id} | Theory: {sT} | Practical: {sP}</small></div>
                <button onClick={async()=>{if(window.confirm('Delete?')){await supabase.from('faculties').delete().eq('id', f.id); loadAll();}}} style={ui.delBtn}><Trash2/></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'24px'}}>
          <p style={ui.label}>SUBJECT ALLOCATION</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'12px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" style={{marginTop:'12px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, marginTop:'20px', background:'#a855f7'}} onClick={async()=>{
              await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); 
              loadAll(); alert("Mapped!");
          }}>CONFIRM ALLOCATION</button>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button style={{background:'#10b981', color:'#fff', padding:'10px 15px', borderRadius:'10px', border:'none', marginBottom:'15px'}} onClick={()=>{
             const ws = XLSX.utils.json_to_sheet(db.logs);
             const wb = XLSX.utils.book_new();
             XLSX.utils.book_append_sheet(wb, ws, "Logs");
             XLSX.writeFile(wb, "Amrit_Master_Logs.xlsx");
          }}>Download Excel</button>
          {db.logs.map(log=>(
            <div key={log.id} style={ui.feedRow} className="glass-card">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div>
              <b>{log.present}/{log.total}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (TIME & TILES INCLUDED) ---
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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Please fill all details including Time.");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const sync = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("GPS Error: Not in Campus."); }
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: tStr 
      }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl, subject: setup.sub, date: tStr }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Attendance Saved!"); setView('login');
    }, () => { setLoading(false); alert("GPS Required!"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Teacher Mode</small><h4>{user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>SELECT CLASS</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      
      {setup.cl && (
        <div style={{marginTop:'24px'}}>
          <p style={ui.label}>SUBJECT</p>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}
          
          <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
            <div style={{flex:1}}><p style={ui.label}>START TIME</p><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/></div>
            <div style={{flex:1}}><p style={ui.label}>END TIME</p><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          </div>

          <div style={{display:'flex', gap:'12px', marginTop:'16px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.tabBtn, flex:1, background:setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>THEORY</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.tabBtn, flex:1, background:setup.ty==='Practical'?'#10b981':'#1e293b'}}>PRACTICAL</button>
          </div>
          <button onClick={launch} style={{...ui.primaryBtn, marginTop:'24px', padding:'20px'}}>START ATTENDANCE</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={sync} style={ui.submitBtn}>{loading ? "VERIFYING..." : "SYNC TO CLOUD"}</button>
    </div>
  );
}

// --- UI DEFINITIONS ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' },
  loginCard: { padding: '50px 40px', width: '320px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
  logoCircle: { width: '90px', height: '90px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', margin: '0 auto 24px', border: '2px solid #06b6d4', padding:'3px' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '35px', overflowX: 'auto' },
  primaryBtn: { width: '100%', padding: '18px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', cursor:'pointer' },
  exitBtn: { background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: 'none', padding:'10px', borderRadius:'12px', cursor:'pointer' },
  mobileWrap: { padding: '24px', maxWidth: '500px', margin: '0 auto' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tile: { padding: '30px 10px', borderRadius: '20px', textAlign: 'center', fontWeight: '800', color: '#fff', cursor: 'pointer' },
  subRow: { padding: '18px', borderRadius: '14px', textAlign: 'center', fontWeight: 'bold', color: '#fff', marginBottom: '10px' },
  label: { fontSize: '11px', color: '#64748b', fontWeight: '800', marginBottom: '8px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  rollChip: { padding: '20px 0', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor:'pointer' },
  submitBtn: { position: 'fixed', bottom: '24px', left: '24px', right: '24px', padding: '20px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: '800' },
  badge: { background: '#10b981', padding: '6px 14px', borderRadius: '12px', fontWeight: '900' },
  circleBtn: { width: '45px', height: '45px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor:'pointer' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius:'20px', marginBottom:'12px' }
};
