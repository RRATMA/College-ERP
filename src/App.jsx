import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, UserCheck, 
  FileWarning, ChevronRight, FileSpreadsheet, Briefcase
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- INJECTED SYSTEM UI ---
const injectStyles = () => {
  if (document.getElementById('amrit-final-css')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-final-css';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .btn-primary { background: #0891b2; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .input-box { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 12px; border-radius: 10px; width: 100%; box-sizing: border-box; margin-bottom: 10px; outline: none; }
    .badge-lec { background: rgba(6, 182, 212, 0.15); color: #06b6d4; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid rgba(6, 182, 212, 0.3); }
    .badge-prac { background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid rgba(16, 185, 129, 0.3); }
    .scroll-hide::-webkit-scrollbar { display: none; }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS_COORDS = { LAT: 19.7042, LON: 72.7645, LIMIT: 0.0008 };

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

  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'40px', textAlign:'center', width:'320px'}}>
        <img src="/logo.png" style={{width:'80px', marginBottom:'20px'}} />
        <h1 style={{margin:0, fontSize:'32px'}}>AMRIT</h1>
        <p style={{color:'#64748b', marginBottom:'30px'}}>Engineering ERP</p>
        <button onClick={()=>setView('login')} className="btn-primary">GET STARTED <ChevronRight/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'30px', width:'300px'}}>
        <h2 style={{marginTop:0}}>Sign In</h2>
        <input id="u" placeholder="User ID" className="input-box" />
        <input id="p" type="password" placeholder="Passcode" className="input-box" />
        <button onClick={()=>handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="btn-primary">LOGIN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL (WITH ALL REQUESTED FEATURES) ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('staff'); // Set default to staff to check features
  const [db, setDb] = useState({ facs: [], logs: [] });
  const [form, setForm] = useState({});

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    setDb({ facs: f || [], logs: l || [] });
  };

  useEffect(() => { loadData(); }, []);

  // FEATURE 1: MASTER SHEET DOWNLOAD
  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Master");
    XLSX.writeFile(wb, "Amrit_Master_Logs.xlsx");
  };

  // FEATURE 2: WORKLOAD COUNTER LOGIC
  const calculateWorkload = (name) => {
    const sessions = db.logs.filter(l => l.faculty === name);
    const theory = sessions.filter(l => l.type === 'Theory').length;
    const practical = sessions.filter(l => l.type === 'Practical').length;
    return { theory, practical };
  };

  return (
    <div style={{padding:'20px', maxWidth:'800px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
        <h3>HOD Dashboard</h3>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={{display:'flex', gap:'10px', marginBottom:'25px', overflowX:'auto'}}>
        {['staff', 'mapping', 'logs', 'defaulters'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px', borderRadius:'10px', border:'none', background: tab===t?'#0891b2':'#1e293b', color:'white', fontWeight:'bold'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* STAFF VIEW WITH WORKLOAD FEATURE */}
      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>REGISTER NEW STAFF</p>
            <input placeholder="Name" className="input-box" onChange={e=>setForm({...form, n:e.target.value})}/>
            <input placeholder="ID" className="input-box" onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" type="password" className="input-box" onChange={e=>setForm({...form, p:e.target.value})}/>
            <button className="btn-primary" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); loadData();}}>ADD FACULTY</button>
          </div>
          
          <p style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>STAFF WORKLOAD (LEC/PRAC)</p>
          {db.facs.map(f => {
            const count = calculateWorkload(f.name);
            return (
              <div key={f.id} className="glass" style={{display:'flex', justifyContent:'space-between', padding:'15px', marginBottom:'10px', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:'bold'}}>{f.name}</div>
                  <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                    <span className="badge-lec">LECTURES: {count.theory}</span>
                    <span className="badge-prac">PRACTICALS: {count.practical}</span>
                  </div>
                </div>
                <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadData();}} style={{background:'none', border:'none', color:'#f43f5e'}}><Trash2 size={18}/></button>
              </div>
            );
          })}
        </div>
      )}

      {/* LOGS VIEW WITH MASTER DOWNLOAD FEATURE */}
      {tab === 'logs' && (
        <div>
          <button className="btn-primary" style={{background:'#1e293b', border:'1px solid #334155', marginBottom:'20px'}} onClick={downloadMaster}>
            <FileSpreadsheet size={18}/> DOWNLOAD MASTER SHEET (.XLSX)
          </button>
          {db.logs.map(log => (
            <div key={log.id} className="glass" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
              <div><b>{log.class} - {log.sub}</b><br/><small>{log.faculty} ({log.type})</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}

      {/* MAPPING VIEW */}
      {tab === 'mapping' && (
        <div className="glass" style={{padding:'20px'}}>
          <select className="input-box" onChange={e=>setForm({...form, f:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select className="input-box" onChange={e=>setForm({...form, c:e.target.value})}><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" className="input-box" onChange={e=>setForm({...form, s:e.target.value})}/>
          <button className="btn-primary" style={{background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.f, class_name:form.c, subject_name:form.s}]); alert("Mapped!");}}>ASSIGN SUBJECT</button>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (GPS + MARKING) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl:'', sub:'', ty:'Theory', s:'', e:'' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setJobs(res.data || [])); 
  }, [user.id]);

  const start = () => {
    if(!setup.cl || !setup.sub) return alert("Select details");
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
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_COORDS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_COORDS.LON,2));
      if(d > CAMPUS_COORDS.LIMIT) { setLoading(false); return alert("OUTSIDE CAMPUS"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.s}-${setup.e}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("Synced!"); setView('home');
    }, () => { setLoading(false); alert("GPS Required"); });
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
          {jobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{padding:'15px', marginBottom:'10px', borderRadius:'10px', background: setup.sub===j.subject_name?'#0891b2':'#1e293b', textAlign:'center'}}>{j.subject_name}</div>))}
          <select className="input-box" onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
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
      <button disabled={loading} onClick={sync} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px'}} className="btn-primary">{loading ? "VERIFYING GPS..." : "SYNC TO SERVER"}</button>
    </div>
  );
              }
