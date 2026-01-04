import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Zap, Database, 
  BookOpenCheck, UserCheck, TrendingUp, ShieldAlert, 
  ChevronRight, Clock, MapPin, PlusCircle, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-final-style')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-final-style';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass { background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .stat-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; outline: none; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tab-btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; background: transparent; }
    .tab-btn.active { background: #0891b2; color: #fff; box-shadow: 0 4px 15px rgba(8, 145, 178, 0.3); }
    .type-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #1e293b; background: #0f172a; color: #64748b; font-weight: 800; cursor: pointer; }
    .type-btn.active { border-color: #06b6d4; color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
    .action-btn { background: #0891b2; color: #fff; border: none; padding: 15px; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
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
    }).catch(e => console.error("Excel Error:", e));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Administrator", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid ID or Password");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' }}>
      <div className="glass" style={{ padding: '40px', width: '320px', textAlign: 'center' }}>
        <img src="/logo.png" style={{width:'85px', marginBottom:'15px'}} alt="Logo" />
        <h1 style={{fontSize: '32px', margin: 0, fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '11px', fontWeight: '800', letterSpacing: '4px', marginBottom: '35px'}}>ERP SYSTEM</p>
        <input id="u" placeholder="Admin/Faculty ID" />
        <input id="p" type="password" placeholder="Password" style={{marginTop:'12px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="action-btn" style={{marginTop:'25px'}}>LOGIN <ChevronRight size={20}/></button>
      </div>
    </div>
  );

  return (
    <div>
      {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
    </div>
  );
}

// --- HOD PANEL (COMPLETE) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], abs: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], abs: a || [] });
  };

  useEffect(() => { loadData(); }, []);

  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(l => l.time_str === todayStr);
  const defMap = db.abs.reduce((acc, curr) => { acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1; return acc; }, {});
  const defs = Object.entries(defMap).filter(([_, c]) => c >= 5).map(([r, c]) => ({ r, c }));
  const avg = db.logs.length > 0 ? ((db.logs.reduce((s, a) => s + a.present, 0) / db.logs.reduce((s, a) => s + a.total, 0)) * 100).toFixed(1) : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{margin:0, fontWeight:800}}>HOD Portal</h2>
        <button onClick={()=>setView('login')} className="glass" style={{ color: '#f43f5e', padding: '10px 15px', cursor:'pointer', border:'none' }}><LogOut size={22}/></button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto' }}>
        {['dashboard', 'staff', 'mapping', 'defaulters', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h1 style={{margin:0}}>{db.logs.length}</h1><p style={{fontSize:'10px', fontWeight:800}}>TOTAL LOGS</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><Users/></div><div><h1 style={{margin:0}}>{db.facs.length}</h1><p style={{fontSize:'10px', fontWeight:800}}>STAFF</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div><div><h1 style={{margin:0}}>{excelSheets.length}</h1><p style={{fontSize:'10px', fontWeight:800}}>CLASSES</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><TrendingUp/></div><div><h1 style={{margin:0}}>{avg}%</h1><p style={{fontSize:'10px', fontWeight:800}}>AVG ATTENDANCE</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(14,165,233,0.1)', color:'#0ea5e9'}}><Zap/></div><div><h1 style={{margin:0}}>{todayLogs.length}</h1><p style={{fontSize:'10px', fontWeight:800}}>LOGS TODAY</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><ShieldAlert/></div><div><h1 style={{margin:0}}>{defs.length}</h1><p style={{fontSize:'10px', fontWeight:800}}>DEFAULTERS</p></div></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={{fontSize:'11px', fontWeight:800, color:'#06b6d4', marginBottom:'10px'}}>ADD FACULTY</p>
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
              <input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Pass" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button className="action-btn" style={{marginTop:'15px', width:'200px'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Staff Registered");}}>REGISTER</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={{ display:'flex', justifyContent:'space-between', padding:'15px', marginBottom:'10px'}} className="glass">
              <span><b>{f.name}</b> (ID: {f.id})</span>
              <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadData();}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'25px'}}>
          <p style={{fontSize:'11px', fontWeight:800, color:'#a855f7', marginBottom:'15px'}}>SUBJECT ALLOCATION</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" style={{marginTop:'10px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button className="action-btn" style={{marginTop:'20px', background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Saved");}}>SAVE MAPPING</button>
        </div>
      )}

      {tab === 'defaulters' && (
        <div>
          <h4 style={{color:'#f43f5e'}}>DEFAULTER LIST (&ge; 5 Absents)</h4>
          {defs.map(d => (
            <div key={d.r} className="glass" style={{ display:'flex', justifyContent:'space-between', padding:'15px', marginBottom:'10px', borderLeft:'5px solid #f43f5e'}}>
              <span>Roll No: <b>{d.r}</b></span>
              <span style={{color:'#f43f5e', fontWeight:'bold'}}>{d.c} Absents</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet(db.logs);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Logs");
            XLSX.writeFile(wb, "Master_Report.xlsx");
          }} className="action-btn" style={{marginBottom:'20px'}}><Download/> DOWNLOAD MASTER EXCEL</button>
          {db.logs.map(log => (
            <div key={log.id} style={{ display:'flex', justifyContent:'space-between', padding:'15px', marginBottom:'10px'}} className="glass">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.type}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (COMPLETE) ---
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

  const startAtt = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all session details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())];
      const jsonData = XLSX.utils.sheet_to_json(sh);
      setStudents(jsonData.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim(), name: s['NAME'] || 'N/A' })));
      setActive(true);
    });
  };

  const submitAtt = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Location outside campus!"); }
      
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: tStr 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl, subject: setup.sub, date: tStr 
      }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      // DOWNLOAD REPORT
      const report = [["ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH"], ["Attendance Report - " + tStr], ["Class:", setup.cl, "Subject:", setup.sub], ["Faculty:", user.name, "Type:", setup.ty], ["Roll No", "Name", "Status"]];
      students.forEach(s => report.push([s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]));
      const ws = XLSX.utils.aoa_to_sheet(report);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `Attendance_${setup.cl}_${setup.sub}.xlsx`);

      alert("Attendance Saved & Report Downloaded!"); setView('login');
    }, () => { setLoading(false); alert("GPS Denied!"); });
  };

  if (!active) return (
    <div style={{padding:'25px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <div><h2 style={{margin:0}}>Hi, {user.name.split(' ')[0]}</h2><p style={{margin:0, color:'#64748b'}}>Setup Session</p></div>
        <button onClick={()=>setView('login')} className="glass" style={{ color: '#f43f5e', padding: '10px', border:'none' }}><LogOut/></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
          <div key={c} onClick={()=>setSetup({...setup, cl:c})} className="tile glass" style={{ background: setup.cl===c?'#0891b2':'' }}>{c}</div>
        ))}
      </div>

      {setup.cl && (
        <div style={{marginTop:'30px'}}>
          <select style={{marginBottom:'15px'}} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
          <div style={{display:'flex', gap:'12px', marginBottom:'15px'}}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} className={`type-btn ${setup.ty==='Theory'?'active':''}`}>THEORY</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} className={`type-btn ${setup.ty==='Practical'?'active':''}`}>PRACTICAL</button>
          </div>
          <div style={{display:'flex', gap:'12px'}}>
            <input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/>
            <input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/>
          </div>
          <button onClick={startAtt} className="action-btn" style={{marginTop:'25px'}}>PROCEED</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:'25px', paddingBottom:'100px'}}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'#fff'}}><ArrowLeft size={30}/></button>
        <b>{setup.cl} | {setup.sub}</b>
        <span style={{background:'#10b981', padding:'5px 10px', borderRadius:'10px'}}>{marked.length}/{students.length}</span>
      </div>
      <div className="roll-grid">{students.map(s => (
        <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{ padding: '20px 5px', borderRadius: '15px', textAlign: 'center', background: marked.includes(s.id)?'#10b981':'rgba(30,41,59,0.45)', border: marked.includes(s.id)?'1px solid #34d399':'1px solid rgba(255,255,255,0.1)' }}>{s.id}</div>
      ))}</div>
      <button disabled={loading} onClick={submitAtt} className="action-btn" style={{ position:'fixed', bottom:'25px', left:'25px', right:'25px', width:'calc(100% - 50px)', background:'#10b981' }}>
        {loading ? <Clock className="animate-spin"/> : <MapPin/>} {loading ? 'VERIFYING...' : 'FINALIZE & DOWNLOAD'}
      </button>
    </div>
  );
}
