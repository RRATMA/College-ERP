import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Download, Zap, 
  Database, UserCheck, TrendingUp, ChevronRight, Layers, 
  Clock, MapPin, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- STYLING (Tumchya Reference Code Pramane) ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-css')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-css';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 20px; transition: 0.3s ease; }
    .stat-card { min-height: 120px; display: flex; flex-direction: column; justify-content: space-between; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; width: 100%; margin-bottom: 10px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tile-btn { padding: 20px; border-radius: 18px; text-align: center; font-weight: bold; cursor: pointer; border: none; color: white; transition: 0.2s; }
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
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed!");
    }
  };

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div className="glass-card" style={{width:'280px', textAlign:'center'}}>
        <div style={{width:'70px', height:'70px', background:'#06b6d422', borderRadius:'50%', margin:'0 auto 15px', overflow:'hidden'}}><img src="/logo.png" style={{width:'100%'}}/></div>
        <h1 style={{margin:0, fontWeight:800}}>AMRIT</h1>
        <p style={{fontSize:'10px', color:'#06b6d4', letterSpacing:'2px', marginBottom:'25px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" />
        <input id="p" type="password" placeholder="Passcode" />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{width:'100%', padding:'15px', background:'#0891b2', border:'none', borderRadius:'12px', color:'white', fontWeight:'bold'}}>ENTER SYSTEM</button>
      </div>
    </div>
  );

  return <div style={{minHeight:'100vh'}}>{view === 'hod' ? <HODPanel sheets={excelSheets} setView={setView}/> : <FacultyPanel user={user} setView={setView}/>}</div>;
}

// --- HOD PANEL ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const load = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };
  useEffect(() => { load(); }, []);

  return (
    <div style={{padding:'20px', maxWidth:'1000px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px'}}>
        <h3>HOD Dashboard</h3>
        <button onClick={()=>setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={{display:'flex', gap:'10px', marginBottom:'25px', overflowX:'auto'}}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px', borderRadius:'12px', border:'none', background: tab===t?'#0891b2':'#1e293b', color:'white', fontWeight:'bold', fontSize:'11px'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
          <div className="glass-card stat-card"><div><Database color="#06b6d4"/></div><div><h2>{db.logs.length}</h2><small>TOTAL LOGS</small></div></div>
          <div className="glass-card stat-card"><div><UserCheck color="#a855f7"/></div><div><h2>{db.facs.length}</h2><small>STAFF</small></div></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{marginBottom:'20px'}}>
            <p style={{fontSize:'10px', fontWeight:'bold', marginBottom:'10px'}}>ADD FACULTY</p>
            <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={{width:'100%', padding:'12px', background:'#0891b2', border:'none', borderRadius:'10px', color:'white'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); load();}}>SAVE</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
              <span>{f.name} (ID: {f.id})</span>
              <Trash2 size={18} color="#f43f5e" onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); load();}}/>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div>
          <div className="glass-card">
            <p style={{fontSize:'10px', fontWeight:'bold'}}>ASSIGN LOAD</p>
            <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select onChange={e=>setForm({...form, cls:e.target.value})}><option>Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{width:'100%', padding:'12px', background:'#a855f7', border:'none', borderRadius:'10px', color:'white'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); load();}}>MAP</button>
          </div>
        </div>
      )}

      {tab === 'logs' && db.logs.map(log => (
        <div key={log.id} className="glass-card" style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
          <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
          <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
        </div>
      ))}
    </div>
  );
}

// --- FACULTY PANEL (WITH ABSENTEE TRACKING & GPS) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl:'', sub:'', ty:'Theory', start:'', end:'' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const startSession = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Sub!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[sheets.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const finalSync = () => {
    setLoading(true);
    // GPS MANDATORY
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Out of Campus!"); }

      const { data: att } = await supabase.from('attendance').insert([{
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty,
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length,
        time_str: new Date().toLocaleDateString('en-GB')
      }]).select().single();

      // ABSENTEE LOGIC (Tumchya code madhle imp feature)
      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({
        attendance_id: att.id,
        student_roll: s.id,
        class_name: setup.cl
      }));
      
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);

      alert("Synced Successfully!"); setView('login');
    }, () => { setLoading(false); alert("GPS Required!"); });
  };

  if (!active) return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px'}}>
        <div><small>Faculty</small><h4>{user.name}</h4></div>
        <button onClick={()=>setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      <p style={{fontSize:'10px', fontWeight:'bold', color:'#64748b', marginBottom:'10px'}}>SELECT CLASS (TILE)</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
          <button key={c} onClick={()=>setSetup({...setup, cl:c})} className="tile-btn" style={{background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</button>
        ))}
      </div>

      {setup.cl && (
        <div style={{marginTop:'20px'}}>
          <p style={{fontSize:'10px', fontWeight:'bold', color:'#64748b', marginBottom:'10px'}}>SELECT SUBJECT (TOGGLE)</p>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
            <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} className="tile-btn" style={{background: setup.sub===j.subject_name?'#0891b2':'#1e293b', padding:'15px', marginBottom:'8px', width:'100%'}}>{j.subject_name}</div>
          ))}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
            <input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/>
            <input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', background:setup.ty==='Theory'?'#06b6d4':'#1e293b', color:'white'}}>Theory</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', background:setup.ty==='Practical'?'#10b981':'#1e293b', color:'white'}}>Practical</button>
          </div>
          <button onClick={startSession} style={{width:'100%', padding:'18px', background:'#0891b2', border:'none', borderRadius:'15px', color:'white', fontWeight:'bold', marginTop:'20px'}}><Zap size={18}/> START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={{background:'#1e293b', border:'none', padding:'10px', borderRadius:'50%', color:'white'}}><ArrowLeft/></button>
        <h3>{setup.cl}</h3>
        <span style={{background:'#10b981', padding:'5px 12px', borderRadius:'10px', fontWeight:'bold'}}>{marked.length}/{students.length}</span>
      </div>
      <div className="roll-grid">
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{padding:'15px 5px', borderRadius:'12px', textAlign:'center', fontWeight:'bold', background: marked.includes(s.id)?'#10b981':'#1e293b', color:'white'}}>{s.id}</div>
        ))}
      </div>
      <button disabled={loading} onClick={finalSync} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px', padding:'18px', background:'#10b981', color:'white', border:'none', borderRadius:'18px', fontWeight:'bold'}}>
        {loading ? "CHECKING GPS..." : "SYNC TO SERVER"}
      </button>
    </div>
  );
  }
