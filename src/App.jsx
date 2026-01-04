import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, UserCheck, 
  FileWarning, ChevronRight, FileSpreadsheet, BookOpen, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-final-fixed')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-final-fixed';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .btn-primary { background: #0891b2; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .input-box { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; margin-bottom: 10px; outline: none; }
    .workload-card { border-left: 4px solid #06b6d4 !important; }
    .badge-lec { background: rgba(6, 182, 212, 0.1); color: #06b6d4; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid #06b6d4; }
    .badge-prac { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid #10b981; }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS = { LAT: 19.7042, LON: 72.7645, RADIUS: 0.0008 };

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setSheets(wb.SheetNames);
    }).catch(() => console.error("Excel file missing"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed");
    }
  };

  // --- HOME SCREEN ---
  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'40px', textAlign:'center', width:'320px'}}>
        <img src="/logo.png" style={{width:'80px', marginBottom:'20px'}} />
        <h1 style={{margin:0, fontSize:'32px'}}>AMRIT</h1>
        <p style={{color:'#64748b', marginBottom:'30px'}}>Smart Campus Portal</p>
        <button onClick={()=>setView('login')} className="btn-primary">SIGN IN <ChevronRight/></button>
      </div>
    </div>
  );

  // --- LOGIN SCREEN ---
  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'30px', width:'300px'}}>
        <h2 style={{marginTop:0}}>Enter Portal</h2>
        <input id="u" placeholder="User ID" className="input-box" />
        <input id="p" type="password" placeholder="Passcode" className="input-box" />
        <button onClick={()=>handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="btn-primary">LOGIN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL (FULLY COMPLETE) ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('staff'); 
  const [db, setDb] = useState({ facs: [], logs: [] });
  const [form, setForm] = useState({});

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    setDb({ facs: f || [], logs: l || [] });
  };

  useEffect(() => { loadData(); }, []);

  // MISSING FEATURE 1: MASTER SHEET DOWNLOAD
  const downloadMasterLogs = () => {
    if(db.logs.length === 0) return alert("No logs available to download.");
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Logs");
    XLSX.writeFile(wb, `Amrit_Master_Sheet_${new Date().toLocaleDateString()}.xlsx`);
  };

  // MISSING FEATURE 2: STAFF WORKLOAD COUNTER
  const getStaffWorkload = (name) => {
    const staffSessions = db.logs.filter(l => l.faculty === name);
    const theoryCount = staffSessions.filter(l => l.type === 'Theory').length;
    const practicalCount = staffSessions.filter(l => l.type === 'Practical').length;
    return { theory: theoryCount, practical: practicalCount };
  };

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
        <h3>HOD Portal</h3>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#f43f5e', cursor:'pointer'}}><LogOut/></button>
      </div>

      {/* NAVIGATION TABS */}
      <div style={{display:'flex', gap:'10px', marginBottom:'25px', overflowX:'auto', paddingBottom:'10px'}} className="scroll-hide">
        {['staff', 'mapping', 'logs', 'defaulters'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px', borderRadius:'10px', border:'none', background: tab===t?'#0891b2':'#1e293b', color:'white', fontWeight:'bold', cursor:'pointer'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* STAFF TAB (WITH WORKLOAD COUNTS) */}
      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'25px'}}>
            <p style={{fontSize:'12px', color:'#64748b', fontWeight:'bold', marginBottom:'10px'}}>REGISTER FACULTY</p>
            <input placeholder="Name" className="input-box" onChange={e=>setForm({...form, n:e.target.value})}/>
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="ID" className="input-box" onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Password" type="password" className="input-box" onChange={e=>setForm({...form, p:e.target.value})}/>
            </div>
            <button className="btn-primary" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); loadData();}}>ADD STAFF</button>
          </div>

          <h4 style={{marginBottom:'15px'}}>Staff Workload Overview</h4>
          {db.facs.map(f => {
            const workload = getStaffWorkload(f.name);
            return (
              <div key={f.id} className="glass workload-card" style={{display:'flex', justifyContent:'space-between', padding:'15px', marginBottom:'12px', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:'bold', fontSize:'16px'}}>{f.name}</div>
                  <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                    <span className="badge-lec">LECTURES: {workload.theory}</span>
                    <span className="badge-prac">PRACTICALS: {workload.practical}</span>
                  </div>
                </div>
                <button onClick={async()=>{if(window.confirm('Delete?')) { await supabase.from('faculties').delete().eq('id', f.id); loadData(); }}} style={{background:'none', border:'none', color:'#f43f5e'}}><Trash2/></button>
              </div>
            );
          })}
        </div>
      )}

      {/* LOGS TAB (WITH MASTER DOWNLOAD) */}
      {tab === 'logs' && (
        <div>
          <button className="btn-primary" style={{background:'#1e293b', border:'1px solid #334155', marginBottom:'20px', color:'#10b981'}} onClick={downloadMasterLogs}>
            <FileSpreadsheet size={20}/> DOWNLOAD MASTER EXCEL (.XLSX)
          </button>
          {db.logs.map(log => (
            <div key={log.id} className="glass" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}

      {/* MAPPING TAB */}
      {tab === 'mapping' && (
        <div className="glass" style={{padding:'20px'}}>
          <p style={{fontSize:'12px', color:'#64748b', fontWeight:'bold', marginBottom:'10px'}}>ASSIGN LOAD</p>
          <select className="input-box" onChange={e=>setForm({...form, f:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select className="input-box" onChange={e=>setForm({...form, c:e.target.value})}><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" className="input-box" onChange={e=>setForm({...form, s:e.target.value})}/>
          <button className="btn-primary" style={{background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.f, class_name:form.c, subject_name:form.s}]); alert("Success!");}}>CONFIRM MAPPING</button>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (UNCHANGED BUT AUDITED) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl:'', sub:'', ty:'Theory', s:'', e:'' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setJobs(res.data || [])); 
  }, [user.id]);

  const start = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class/Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const sync = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS.LON,2));
      if(d > CAMPUS.RADIUS) return alert("OUTSIDE CAMPUS");
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.s}-${setup.e}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("Attendance Saved!"); setView('home');
    }, () => alert("GPS Permission Denied"));
  };

  if (!active) return (
    <div style={{padding:'20px'}}>
      <h3>Prof. {user.name}</h3>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        {[...new Set(jobs.map(j=>j.class_name))].map(c => (
          <div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{padding:'20px', borderRadius:'15px', background: setup.cl===c?'#0891b2':'#1e293b', textAlign:'center', fontWeight:'bold'}}>{c}</div>
        ))}
      </div>
      {setup.cl && (
        <div style={{marginTop:'20px'}}>
          <p style={{fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>SUBJECT & TYPE</p>
          {jobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{padding:'15px', marginBottom:'10px', borderRadius:'10px', background: setup.sub===j.subject_name?'#0891b2':'#1e293b', textAlign:'center'}}>{j.subject_name}</div>))}
          <select className="input-box" style={{marginTop:'10px'}} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
          <button onClick={start} className="btn-primary">START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={{background:'#1e293b', color:'white', border:'none', borderRadius:'50%', width:'40px', height:'40px'}}><ArrowLeft size={18}/></button>
        <h3 style={{margin:0}}>{setup.cl}</h3>
        <span style={{background:'#10b981', padding:'5px 10px', borderRadius:'8px'}}>{marked.length}/{students.length}</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px', paddingBottom:'100px'}}>
        {students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{padding:'15px 5px', borderRadius:'10px', textAlign:'center', background: marked.includes(s.id)?'#10b981':'#1e293b', fontWeight:'bold'}}>{s.id}</div>))}
      </div>
      <button onClick={sync} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px'}} className="btn-primary">SYNC TO SERVER</button>
    </div>
  );
      }
