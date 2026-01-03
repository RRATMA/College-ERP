import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Download, 
  Zap, FlaskConical, GraduationCap, Users, Layers, Clock, MapPin 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER ENGINE: NEON-GLASS V4 (FINAL) ---
const injectStyles = () => {
  if (document.getElementById('amrit-ultimate-v4')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-ultimate-v4';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    :root { --bg: #020617; --card: rgba(15, 23, 42, 0.6); --accent: #06b6d4; --neon: 0 0 20px rgba(6, 182, 212, 0.4); }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: #f8fafc; margin: 0; background-image: radial-gradient(circle at top right, #083344, transparent); }
    .glass-panel { background: var(--card); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; }
    .stat-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; padding: 20px; transition: 0.3s ease; }
    .stat-card:hover { border-color: var(--accent); transform: translateY(-5px); box-shadow: var(--neon); }
    .search-bar { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px 15px; display: flex; align-items: center; gap: 10px; }
    .search-bar:focus-within { border-color: var(--accent); }
    .activity-row { background: rgba(255, 255, 255, 0.02); border-radius: 16px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .neon-text { color: var(--accent); text-shadow: var(--neon); }
    input, select { width: 100%; padding: 12px; border-radius: 10px; background: #0f172a; border: 1px solid #1e293b; color: #fff; box-sizing: border-box; }
    .primary-btn { background: var(--accent); color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
    .primary-btn:active { transform: scale(0.98); }
    .scroll-hide::-webkit-scrollbar { display: none; }
    .type-chip { flex: 1; padding: 12px; border-radius: 10px; border: none; font-weight: 700; color: #fff; cursor: pointer; transition: 0.2s; }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
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
      else alert("Login Failed");
    }
  };

  if (view === 'login') return (
    <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div className="glass-panel" style={{padding: '40px', width: '300px', textAlign: 'center'}}>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p className="neon-text" style={{fontSize: '10px', fontWeight: 800, letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" style={{marginBottom:'10px'}} />
        <input id="p" type="password" placeholder="Passcode" style={{marginBottom:'20px'}} />
        <button className="primary-btn" style={{width:'100%'}} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>ENTER</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL (DEVELOPER SEARCH + DESIGNER DASHBOARD) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  const filteredLogs = db.logs.filter(l => 
    l.faculty.toLowerCase().includes(search.toLowerCase()) ||
    l.class.toLowerCase().includes(search.toLowerCase()) ||
    l.sub.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{maxWidth: '900px', margin: '0 auto', padding: '30px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <h1 style={{margin:0, fontWeight:800}}>AMRIT <span style={{fontWeight:300}}>HOD</span></h1>
        <button onClick={()=>setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'10px', marginBottom:'30px', overflowX:'auto'}} className="scroll-hide">
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 20px', borderRadius:'10px', border:'none', background:tab===t?'#06b6d4':'rgba(255,255,255,0.05)', color:'#fff', fontWeight:700}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px'}}>
          <div className="stat-card"><Zap color="#06b6d4"/><h2>{db.logs.length}</h2><p>Sessions</p></div>
          <div className="stat-card"><Users color="#06b6d4"/><h2>{db.facs.length}</h2><p>Staff</p></div>
          <div className="stat-card"><Layers color="#06b6d4"/><h2>{excelSheets.length}</h2><p>Classes</p></div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="glass-panel" style={{padding:'25px'}}>
          <div className="search-bar" style={{marginBottom:'20px'}}>
            <Search size={18} color="#06b6d4"/>
            <input placeholder="Search records..." style={{background:'transparent', border:'none', color:'#fff'}} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div style={{maxHeight:'400px', overflowY:'auto'}} className="scroll-hide">
            {filteredLogs.map((l, i) => (
              <div key={i} className="activity-row">
                <div><b>{l.class} | {l.sub}</b><br/><small style={{opacity:0.5}}>{l.faculty} • {l.type} • {l.duration}</small></div>
                <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{l.present}/{l.total}</b><br/><small style={{fontSize:'10px', opacity:0.4}}>{l.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="glass-panel" style={{padding:'20px'}}>
          <div style={{display:'grid', gap:'10px', marginBottom:'20px'}}>
            <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button className="primary-btn" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>ADD FACULTY</button>
          </div>
          {db.facs.map(f=><div key={f.id} className="activity-row"><span>{f.name} ({f.id})</span><button onClick={async()=>{await supabase.from('faculties').delete().eq('id',f.id); loadData();}} style={{background:'none', border:'none', color:'#f43f5e'}}><Trash2 size={16}/></button></div>)}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-panel" style={{padding:'20px'}}>
          <div style={{display:'grid', gap:'10px', marginBottom:'20px'}}>
            <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Staff</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s}>{s}</option>)}</select>
            <input placeholder="Subject" onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button className="primary-btn" onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>MAP SUBJECT</button>
          </div>
          {db.maps.map(m=><div key={m.id} className="activity-row"><span>{m.class_name}: {m.subject_name} ({m.fac_id})</span><button onClick={async()=>{await supabase.from('assignments').delete().eq('id',m.id); loadData();}} style={{background:'none', border:'none', color:'#f43f5e'}}><Trash2 size={16}/></button></div>)}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (ALL FEATURES: TYPE, TIME, GPS, SYNC) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Complete session details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const sync = () => {
    setSyncing(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setSyncing(false); return alert("❌ OUTSIDE CAMPUS"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);

      alert("✅ Attendance Synced"); setSyncing(false); setActive(false); setMarked([]);
    }, () => { setSyncing(false); alert("GPS Error"); });
  };

  if (!active) return (
    <div style={{maxWidth: '400px', margin: '0 auto', padding: '30px'}}>
      <h2 style={{margin:0}}>Prof. {user.name}</h2>
      <p className="neon-text" style={{fontSize:'12px', fontWeight:800, marginBottom:'25px'}}>SESSION SETUP</p>
      
      <div className="glass-panel" style={{padding:'20px'}}>
        <p style={{fontSize:'11px', opacity:0.5, marginBottom:'5px'}}>CLASS & SUBJECT</p>
        <select style={{marginBottom:'10px'}} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c}>{c}</option>)}</select>
        <select style={{marginBottom:'20px'}} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id}>{j.subject_name}</option>)}</select>

        <p style={{fontSize:'11px', opacity:0.5, marginBottom:'5px'}}>SESSION TYPE</p>
        <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
          <button onClick={()=>setSetup({...setup, ty:'Theory'})} className="type-chip" style={{background:setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>Theory</button>
          <button onClick={()=>setSetup({...setup, ty:'Practical'})} className="type-chip" style={{background:setup.ty==='Practical'?'#10b981':'#1e293b'}}>Practical</button>
        </div>

        <p style={{fontSize:'11px', opacity:0.5, marginBottom:'5px'}}>DURATION (START - END)</p>
        <div style={{display:'flex', gap:'8px', marginBottom:'25px'}}>
          <input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/>
          <input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/>
        </div>
        
        <button className="primary-btn" style={{width:'100%'}} onClick={launch}>START ROLL CALL</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:'20px', maxWidth:'600px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'#fff'}}><ArrowLeft/></button>
        <div style={{textAlign:'center'}}>
          <h3 style={{margin:0}}>{setup.cl}</h3>
          <small className="neon-text">{setup.ty} • {setup.start}-{setup.end}</small>
        </div>
        <div style={{background:'#06b6d4', padding:'5px 12px', borderRadius:'10px', fontWeight:800}}>{marked.length}/{students.length}</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:'10px', paddingBottom:'100px'}} className="scroll-hide">
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
               style={{padding:'15px 5px', borderRadius:'12px', textAlign:'center', fontWeight:800, cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)', background: marked.includes(s.id)?'#10b981':'rgba(255,255,255,0.03)'}}>
            {s.id}
          </div>
        ))}
      </div>

      <button className="primary-btn" disabled={syncing} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px', maxWidth:'560px', margin:'0 auto'}} onClick={sync}>
        {syncing ? "CHECKING GPS..." : "SYNC TO SERVER"}
      </button>
    </div>
  );
                     }
