import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Zap, Database, 
  BookOpenCheck, UserCheck, TrendingUp, ShieldAlert, 
  ChevronRight, Clock, MapPin, Download, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- ADVANCED UI STYLING ---
const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-ultimate-v3')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-ultimate-v3';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-3px); }
    .stat-card { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; border-radius: 12px; padding: 14px; width: 100%; box-sizing: border-box; outline: none; font-weight: 600; }
    input:focus { border-color: #06b6d4 !important; box-shadow: 0 0 10px rgba(6, 182, 212, 0.2); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 12px; }
    .tab-btn { padding: 12px 24px; border-radius: 14px; border: none; font-weight: 800; color: #94a3b8; cursor: pointer; background: transparent; transition: 0.3s; font-size: 12px; }
    .tab-btn.active { background: #0891b2; color: #fff; box-shadow: 0 4px 15px rgba(8, 145, 178, 0.3); }
    .action-btn { background: #0891b2; color: #fff; border: none; padding: 16px; border-radius: 16px; font-weight: 800; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; }
    .action-btn:active { transform: scale(0.98); }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .scroll-hide::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel data file missing."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials.");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' }}>
      <div className="glass-card" style={{ padding: '45px', width: '300px', textAlign: 'center' }}>
        <img src="/logo.png" style={{width:'85px', marginBottom:'20px', borderRadius:'50%', border:'2px solid #06b6d4'}} alt="Logo" />
        <h1 style={{fontSize: '32px', margin: 0, fontWeight: 800, letterSpacing: '-1px'}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '3px', marginBottom: '35px'}}>MANAGEMENT SYSTEM</p>
        <input id="u" placeholder="Employee ID" style={{marginBottom: '12px'}} />
        <input id="p" type="password" placeholder="Security Key" />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="action-btn" style={{marginTop:'30px'}}>SIGN IN <ChevronRight size={20}/></button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], abs: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], abs: a || [] });
  };

  useEffect(() => { loadData(); }, []);

  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(l => l.time_str === todayStr);
  
  // BRANCH-WISE DEFAULTER LOGIC
  const defMap = db.abs.reduce((acc, curr) => {
    const key = `${curr.student_roll}-${curr.class_name}`;
    if (!acc[key]) acc[key] = { roll: curr.student_roll, cls: curr.class_name, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {});
  const defs = Object.values(defMap).filter(d => d.count >= 5);

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div><h2 style={{margin:0, fontWeight:800, fontSize:'28px'}}>HOD Command Center</h2></div>
        <button onClick={()=>setView('login')} style={{ background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'12px', borderRadius:'14px', cursor:'pointer' }}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={{ display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto' }}>
        {['dashboard', 'faculty-list', 'subject-map', 'defaulters', 'history'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass-card stat-card"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><ShieldAlert/></div><div><h2 style={{margin:0}}>{defs.length}</h2><p>DEFAULTERS</p></div></div>
          <div className="glass-card stat-card"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h2 style={{margin:0}}>{db.logs.length}</h2><p>TOTAL SESSIONS</p></div></div>
        </div>
      )}

      {tab === 'defaulters' && (
        <div className="glass-card" style={{padding:'25px'}}>
          <h4 style={{color:'#f43f5e', marginBottom:'20px'}}>BRANCH-WISE DEFAULTERS (≥ 5 Absents)</h4>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', paddingBottom:'10px', borderBottom:'1px solid #1e293b', fontWeight:800, fontSize:'12px', color:'#64748b'}}>
            <span>ROLL NO</span><span>BRANCH/CLASS</span><span style={{textAlign:'right'}}>ABSENTS</span>
          </div>
          {defs.map((d, i) => (
            <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', padding:'15px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span>{d.roll}</span><span style={{color:'#06b6d4'}}>{d.cls}</span><span style={{textAlign:'right', color:'#f43f5e', fontWeight:800}}>{d.count}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'faculty-list' && (
        <div>
           <div className="glass-card" style={{padding:'25px', marginBottom:'20px'}}>
            <input placeholder="Full Name" style={{marginBottom:'10px'}} onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'10px'}}><input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/><input placeholder="Pass" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/></div>
            <button className="action-btn" style={{marginTop:'15px'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>ADD STAFF</button>
           </div>
           {db.facs.map(f=><div key={f.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', padding:'15px', marginBottom:'10px'}}><span>{f.name}</span><button onClick={async()=>{await supabase.from('faculties').delete().eq('id',f.id); loadData();}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={18}/></button></div>)}
        </div>
      )}

      {tab === 'subject-map' && (
        <div className="glass-card" style={{padding:'25px'}}>
          <select style={{marginBottom:'10px'}} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginBottom:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button className="action-btn" style={{marginTop:'15px'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapped!");}}>ASSIGN SUBJECT</button>
        </div>
      )}

      {tab === 'history' && (
        <div>
          <button className="action-btn" style={{marginBottom:'15px', width:'auto'}} onClick={()=>{
            const ws = XLSX.utils.json_to_sheet(db.logs);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Logs");
            XLSX.writeFile(wb, "Attendance_Master_Log.xlsx");
          }}><Download size={18}/> EXPORT ALL</button>
          {db.logs.map(log=><div key={log.id} className="glass-card" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}><div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty}</small></div><b>{log.present}/{log.total}</b></div>)}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
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

  const startSession = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all details.");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())];
      const data = XLSX.utils.sheet_to_json(sh);
      setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim(), name: s['NAME'] || 'Unknown' })));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Not in Campus."); }
      
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: tStr 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl, subject: setup.sub, date: tStr 
      }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);

      // Branded Excel Download
      const reportRows = [[INSTITUTE_NAME],["ATTENDANCE REPORT - "+tStr],[""],["FACULTY:", user.name, "CLASS:", setup.cl],["SUBJECT:", setup.sub],[""],["ROLL NO", "NAME", "STATUS"]];
      students.forEach(s => reportRows.push([s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]));
      const ws = XLSX.utils.aoa_to_sheet(reportRows);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${setup.cl}_Attendance.xlsx`);

      alert("Synced!"); setView('login');
    }, () => { setLoading(false); alert("GPS Error."); });
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><h3>{user.name}</h3><button onClick={()=>setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button></div>
      <div className="roll-grid" style={{gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => <div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{padding:'20px', textAlign:'center', borderRadius:'15px', background:setup.cl===c?'#0891b2':'#1e293b', cursor:'pointer'}}>{c}</div>)}
      </div>
      {setup.cl && (
        <div style={{marginTop:'20px'}}>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{padding:'15px', marginBottom:'10px', borderRadius:'10px', textAlign:'center', background:setup.sub===j.subject_name?'#0891b2':'#1e293b', cursor:'pointer'}}>{j.subject_name}</div>)}
          <div style={{display:'flex', gap:'10px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          <button onClick={startSession} className="action-btn" style={{marginTop:'20px'}}>START</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}><button onClick={()=>setActive(false)} style={{background:'none', color:'#fff', border:'none'}}><ArrowLeft/></button><b>{setup.cl}</b><span style={{background:'#10b981', padding:'5px 10px', borderRadius:'10px'}}>{marked.length}/{students.length}</span></div>
      <div className="roll-grid">{students.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={{padding:'20px 0', textAlign:'center', borderRadius:'12px', background:marked.includes(s.id)?'#10b981':'#1e293b', cursor:'pointer'}}>{s.id}</div>)}</div>
      <button disabled={loading} onClick={submitAttendance} className="action-btn" style={{position:'fixed', bottom:'20px', left:'20px', right:'20px', width:'calc(100% - 40px)', background:'#10b981'}}>{loading ? "WAIT..." : "SYNC & DOWNLOAD"}</button>
    </div>
  );
  }
