import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, BookOpen, Users, Zap, 
  Database, BookOpenCheck, UserCheck, TrendingUp, ShieldAlert, ChevronRight, Clock, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES (NO CHANGES TO UI) ---
const injectStyles = () => {
  if (document.getElementById('amrit-final-style')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-final-style';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass { background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .stat-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; transition: 0.3s; }
    .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; outline: none; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tab-btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; background: transparent; transition: 0.2s; }
    .tab-btn.active { background: #0891b2; color: #fff; box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3); }
    .tile { padding: 25px 10px; border-radius: 20px; text-align: center; font-weight: 800; cursor: pointer; transition: 0.2s; border: 2px solid transparent; }
    .tile:hover { transform: translateY(-3px); }
    .type-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid #1e293b; background: #0f172a; color: #64748b; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .type-btn.active { border-color: #06b6d4; color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
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
    }).catch(e => console.error("Excel File Not Found in Public Folder", e));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Authentication Failed!");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' }}>
      <div className="glass" style={{ padding: '40px', width: '320px', textAlign: 'center' }}>
        <div style={{ width: '85px', height: '85px', margin: '0 auto 20px' }}><img src="/logo.png" style={{width:'100%', height:'100%'}} alt="Amrit Logo" /></div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800, letterSpacing:'-1px'}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '11px', fontWeight: '800', letterSpacing: '4px', marginBottom: '35px'}}>ERP SYSTEM</p>
        <input id="u" placeholder="Admin/Faculty ID" />
        <input id="p" type="password" placeholder="Secure Password" style={{marginTop:'12px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{ width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', marginTop: '25px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
          SIGN IN <ChevronRight size={20}/>
        </button>
      </div>
    </div>
  );

  return <div>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadAll(); }, []);

  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(l => l.time_str === todayStr);
  const defMap = db.abs.reduce((acc, curr) => {
    acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1;
    return acc;
  }, {});
  const defs = Object.entries(defMap).filter(([_, count]) => count >= 5).map(([r, c]) => ({ r, c }));
  const avgPerc = db.logs.length > 0 ? ((db.logs.reduce((s, a) => s + a.present, 0) / db.logs.reduce((s, a) => s + a.total, 0)) * 100).toFixed(1) : 0;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <img src="/logo.png" style={{width:'45px', height:'45px'}} alt="Logo" />
          <h2 style={{margin:0, fontWeight:800}}>HOD Portal</h2>
        </div>
        <button onClick={()=>setView('login')} className="glass" style={{ color: '#f43f5e', padding: '12px', border: '1px solid rgba(244,63,94,0.2)', cursor:'pointer', borderRadius:'12px' }}><LogOut size={22}/></button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
        {['dashboard', 'staff', 'mapping', 'defaulters', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h1 style={{margin:0}}>{db.logs.length}</h1><p style={{fontSize:'11px', color:'#64748b', fontWeight:800}}>TOTAL RECORDS</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><Users/></div><div><h1 style={{margin:0}}>{db.facs.length}</h1><p style={{fontSize:'11px', color:'#64748b', fontWeight:800}}>ACTIVE STAFF</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div><div><h1 style={{margin:0}}>{excelSheets.length}</h1><p style={{fontSize:'11px', color:'#64748b', fontWeight:800}}>TOTAL CLASSES</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><TrendingUp/></div><div><h1 style={{margin:0}}>{avgPerc}%</h1><p style={{fontSize:'11px', color:'#64748b', fontWeight:800}}>AVG ATTENDANCE</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(14,165,233,0.1)', color:'#0ea5e9'}}><Zap/></div><div><h1 style={{margin:0}}>{todayLogs.length}</h1><p style={{fontSize:'11px', color:'#64748b', fontWeight:800}}>LOGS TODAY</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><ShieldAlert/></div><div><h1 style={{margin:0}}>{defs.length}</h1><p style={{fontSize:'11px', color:'#64748b', fontWeight:800}}>DEFAULTERS</p></div></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'25px', marginBottom:'25px'}}>
            <p style={{fontSize:'11px', color:'#06b6d4', fontWeight:'800', marginBottom:'15px'}}>ADD NEW FACULTY MEMBER</p>
            <input placeholder="Full Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'12px', marginTop:'12px'}}>
              <input placeholder="Login ID" onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Password" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={{ width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', marginTop: '20px' }} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadAll(); alert("Faculty Registered Successfully");}}>REGISTER STAFF</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '18px', marginBottom: '12px' }} className="glass">
              <div><b style={{fontSize:'16px'}}>{f.name}</b><br/><small style={{color:'#64748b'}}>UID: {f.id}</small></div>
              <button onClick={async()=>{if(window.confirm("Delete Faculty?")){await supabase.from('faculties').delete().eq('id', f.id); loadAll();}}} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor:'pointer' }}><Trash2/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'25px'}}>
          <p style={{fontSize:'11px', color:'#06b6d4', fontWeight:'800', marginBottom:'15px'}}>FACULTY SUBJECT ALLOCATION</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty Member</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'12px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Allocated Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Enter Subject Name" style={{marginTop:'12px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{ width: '100%', padding: '16px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', marginTop: '20px' }} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadAll(); alert("Subject Mapped Successfully");}}>SAVE ASSIGNMENT</button>
        </div>
      )}

      {tab === 'defaulters' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
             <p style={{fontSize:'11px', color:'#f43f5e', fontWeight:'800'}}>STUDENTS WITH &ge; 5 ABSENCES</p>
             <button onClick={() => {
               const ws = XLSX.utils.json_to_sheet(defs);
               const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
               XLSX.writeFile(wb, "Defaulter_Report.xlsx");
             }} className="glass" style={{color:'#fff', padding:'8px 15px', borderRadius:'10px', fontSize:'12px', fontWeight:800, cursor:'pointer'}}>DOWNLOAD LIST</button>
          </div>
          {defs.length === 0 ? <p style={{textAlign:'center', color:'#64748b'}}>No defaulters found yet.</p> : defs.map(d => (
            <div key={d.r} className="glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '18px', marginBottom: '12px', borderLeft:'4px solid #f43f5e' }}>
              <span>Roll Number: <b style={{fontSize:'16px'}}>{d.r}</b></span>
              <span style={{color:'#f43f5e', fontWeight:'800'}}>{d.c} Total Absents</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet(db.logs);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "AttendanceLogs");
            XLSX.writeFile(wb, "Master_Attendance_History.xlsx");
          }} className="glass" style={{width:'100%', color:'#06b6d4', padding:'15px', borderRadius:'15px', marginBottom:'20px', fontWeight:800, cursor:'pointer'}}>DOWNLOAD ALL ATTENDANCE DATA (EXCEL)</button>
          {db.logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', marginBottom: '12px' }} className="glass">
              <div><b style={{fontSize:'16px'}}>{log.class} • {log.sub}</b><br/><small style={{color:'#64748b'}}>{log.faculty} | {log.time_str} | {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{fontSize:'18px', color:'#06b6d4'}}>{log.present}/{log.total}</b><br/><small style={{color:'#64748b'}}>{log.duration}</small></div>
            </div>
          ))}
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

  const startAtt = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Please fill all session details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())];
      if(!sheet) return alert("Class sheet not found in Excel!");
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      setStudents(jsonData.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim(), name: s['NAME'] || 'N/A' })));
      setActive(true);
    });
  };

  const generateExcel = () => {
    const today = new Date().toLocaleDateString('en-GB');
    const data = [
      ["ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH"],
      ["OFFICIAL ATTENDANCE REPORT"],
      [""],
      ["FACULTY:", user.name, "DATE:", today],
      ["CLASS:", setup.cl, "SUBJECT:", setup.sub],
      ["TIME:", `${setup.start} - ${setup.end}`, "TYPE:", setup.ty],
      [""],
      ["SR.NO", "ROLL NO", "STUDENT NAME", "STATUS"]
    ];
    students.forEach((s, idx) => {
      data.push([idx + 1, s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]);
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Attendance_${setup.cl}_${setup.sub}_${today}.xlsx`);
  };

  const submitAtt = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Submission Failed: You are outside the campus radius!"); }
      
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
      
      generateExcel();
      alert("Attendance Saved Locally & Synced to Cloud!"); 
      setView('login');
    }, () => { setLoading(false); alert("GPS Error: Please enable location services."); });
  };

  if (!active) return (
    <div style={{padding:'25px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
        <div><h2 style={{margin:0, fontWeight:800}}>Hi, {user.name.split(' ')[0]}</h2><p style={{margin:0, fontSize:'13px', color:'#64748b'}}>Setup your session</p></div>
        <button onClick={()=>setView('login')} className="glass" style={{ color: '#f43f5e', padding: '12px', border: 'none', cursor:'pointer', borderRadius:'120px' }}><LogOut size={22}/></button>
      </div>
      
      <p style={{fontSize:'11px', color:'#06b6d4', fontWeight:'800', marginBottom:'15px'}}>CHOOSE CLASS</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
          <div key={c} onClick={()=>setSetup({...setup, cl:c})} className="tile glass" style={{ background: setup.cl===c?'#0891b2':'rgba(30,41,59,0.45)', border: setup.cl===c?'2px solid #06b6d4':'2px solid transparent' }}>{c}</div>
        ))}
      </div>

      {setup.cl && (
        <div style={{marginTop:'30px'}}>
          <p style={{fontSize:'11px', color:'#06b6d4', fontWeight:'800', marginBottom:'15px'}}>SESSION DETAILS</p>
          <select style={{marginBottom:'15px'}} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
          
          <div style={{display:'flex', gap:'12px', marginBottom:'20px'}}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} className={`type-btn ${setup.ty==='Theory'?'active':''}`}>THEORY</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} className={`type-btn ${setup.ty==='Practical'?'active':''}`}>PRACTICAL</button>
          </div>

          <div style={{display:'flex', gap:'12px'}}>
            <div style={{flex:1}}><small style={{color:'#64748b', fontWeight:800}}>START TIME</small><input type="time" style={{marginTop:'5px'}} onChange={e=>setSetup({...setup, start:e.target.value})}/></div>
            <div style={{flex:1}}><small style={{color:'#64748b', fontWeight:800}}>END TIME</small><input type="time" style={{marginTop:'5px'}} onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          </div>
          <button onClick={startAtt} style={{ width: '100%', padding: '18px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '800', marginTop: '30px', boxShadow:'0 8px 20px rgba
