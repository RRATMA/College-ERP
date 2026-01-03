import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  FileSpreadsheet, ChevronRight, LayoutGrid, Users, 
  Download, Zap, FlaskConical, GraduationCap, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER STYLESHEET (NEON-GLASS V3) ---
const injectStyles = () => {
  if (document.getElementById('amrit-v3-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v3-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    :root {
      --bg: #030712;
      --card: rgba(17, 24, 39, 0.7);
      --accent: #06b6d4;
      --neon-glow: 0 0 15px rgba(6, 182, 212, 0.4);
    }
    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      background: var(--bg); color: #f8fafc; margin: 0;
      background-image: radial-gradient(circle at top right, #083344, transparent);
      overflow-x: hidden;
    }
    .glass-panel {
      background: var(--card); backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px; padding: 24px; transition: all 0.3s ease;
    }
    .stat-card:hover { border-color: var(--accent); background: rgba(6, 182, 212, 0.05); transform: translateY(-5px); }
    .activity-row {
      background: rgba(255, 255, 255, 0.02); border-radius: 16px;
      padding: 16px 20px; margin-bottom: 12px; display: flex;
      justify-content: space-between; align-items: center;
      border-left: 4px solid transparent; transition: 0.2s;
    }
    .activity-row:hover { background: rgba(255, 255, 255, 0.05); border-left-color: var(--accent); }
    .type-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-right: 15px; font-weight: 800;
    }
    .neon-text { color: var(--accent); text-shadow: var(--neon-glow); }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { 
      width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; 
      background: #0f172a; border: 1px solid #1e293b; color: #fff; box-sizing: border-box; 
    }
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
    }).catch(() => console.error("Missing students_list.xlsx in public folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Unauthorized");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-panel" style={ui.loginCard}>
        <div style={ui.logoCircle}><img src="/logo.png" style={{width:'100%'}} alt="Logo" /></div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p className="neon-text" style={{fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px'}}>CONTROL CENTER</p>
        <input id="u" placeholder="User ID" />
        <input id="p" type="password" placeholder="Passcode" />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>ENTER SYSTEM</button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD DASHBOARD (DESIGNER & DEVELOPER HYBRID) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div>
          <h1 style={{fontSize:'32px', fontWeight:800, margin:0}}>AMRIT <span style={{fontWeight:300, fontSize:'18px'}}>HOD Panel</span></h1>
          <p className="neon-text" style={{fontSize:'12px', fontWeight:600}}>Control Center</p>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?ui.accent:'transparent', border: tab===t?'none':'1px solid rgba(255,255,255,0.1)'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div style={ui.statsGrid}>
            <div className="stat-card"><Zap size={24} color={ui.accent}/><h2 style={{fontSize:'32px', margin:'10px 0 0'}}>{db.logs.length}</h2><p style={{opacity:0.5, fontSize:'12px'}}>Today Sessions</p></div>
            <div className="stat-card"><Users size={24} color={ui.accent}/><h2 style={{fontSize:'32px', margin:'10px 0 0'}}>{db.facs.length}</h2><p style={{opacity:0.5, fontSize:'12px'}}>Faculties</p></div>
            <div className="stat-card"><Layers size={24} color={ui.accent}/><h2 style={{fontSize:'32px', margin:'10px 0 0'}}>{excelSheets.length}</h2><p style={{opacity:0.5, fontSize:'12px'}}>Active Classes</p></div>
          </div>
          <div className="glass-panel" style={{padding:'30px', marginTop:'30px'}}>
            <h3 style={{marginBottom:'20px', fontSize:'16px', opacity:0.8}}>RECENT ACTIVITY FEED</h3>
            {db.logs.slice(0,5).map((log, i) => (
              <div key={i} className="activity-row">
                <div style={{display:'flex', alignItems:'center'}}>
                  <div className="type-icon" style={{background: log.type==='Theory'?'rgba(6,182,212,0.1)':'rgba(16,185,129,0.1)', color: log.type==='Theory'?ui.accent:'#10b981'}}>{log.type[0]}</div>
                  <div><div style={{fontWeight:600}}>{log.class} - {log.sub}</div><small style={{opacity:0.5}}>{log.faculty}</small></div>
                </div>
                <div style={{textAlign:'right'}}><div style={{fontWeight:800, color:'#10b981'}}>{log.present}/{log.total}</div><small style={{fontSize:'10px', opacity:0.4}}>SYNCED</small></div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'staff' && (
        <div className="glass-panel" style={{padding:'20px'}}>
          <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
          <input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/>
          <input placeholder="Pass" onChange={e=>setForm({...form, pass:e.target.value})}/>
          <button style={ui.primaryBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>+ ADD STAFF</button>
          <div style={{marginTop:'20px'}}>{db.facs.map(f=><div key={f.id} className="activity-row"><span>{f.name}</span><button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadData();}} style={ui.delBtn}><Trash2 size={16}/></button></div>)}</div>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-panel" style={{padding:'20px'}}>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s}>{s}</option>)}</select>
          <input placeholder="Subject" onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={ui.primaryBtn} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>LINK SUBJECT</button>
          <div style={{marginTop:'20px'}}>{db.maps.map(m=><div key={m.id} className="activity-row"><span>{m.class_name}: {m.subject_name}</span><button onClick={async()=>{await supabase.from('assignments').delete().eq('id', m.id); loadData();}} style={ui.delBtn}><Trash2 size={16}/></button></div>)}</div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (DEVELOPER LOGIC + DESIGNER UI) ---
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
    if(!setup.cl || !setup.sub) return alert("Select Session Details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ OUTSIDE CAMPUS BOUNDARY"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("✅ Session Synced to Cloud");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Failed"); });
  };

  if (!active) return (
    <div style={ui.container}>
      <div style={ui.header}><div><h2 style={{margin:0}}>Prof. {user.name}</h2><p className="neon-text" style={{fontSize:'12px'}}>Faculty Portal</p></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <div className="glass-panel" style={{padding:'24px'}}>
        <p style={ui.label}>ASSIGNED CLASSES</p>
        <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?ui.accent:'rgba(255,255,255,0.05)', borderColor: setup.cl===c?ui.accent:'transparent'}}>{c}</div>))}</div>
        
        {setup.cl && (
          <div style={{marginTop: '25px'}}>
            <p style={ui.label}>SELECT SUBJECT</p>
            <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?ui.accent:'rgba(255,255,255,0.05)'}}>{j.subject_name}</div>))}</div>
            <div style={{display:'flex', gap:'10px', margin:'20px 0'}}>
              <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, background: setup.ty==='Theory'?ui.accent:'rgba(255,255,255,0.05)'}}><GraduationCap size={16}/> Theory</button>
              <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, background: setup.ty==='Practical'?'#10b981':'rgba(255,255,255,0.05)'}}><FlaskConical size={16}/> Practical</button>
            </div>
            <button onClick={launch} style={ui.primaryBtn}>START SESSION</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={ui.container}>
      <div style={ui.header}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl} <small style={{opacity:0.5}}>{setup.sub}</small></h3><div className="neon-text" style={{fontWeight:800}}>{marked.length}/{students.length}</div></div>
      <div className="scroll-hide" style={ui.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'rgba(255,255,255,0.05)', color: marked.includes(s.id)?'#fff':'rgba(255,255,255,0.6)'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "VERIFYING CAMPUS LOCATION..." : "SYNC ATTENDANCE"}</button>
    </div>
  );
}

const ui = {
  accent: '#06b6d4',
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginCard: { padding: '50px 40px', width: '320px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', margin: '0 auto 20px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #06b6d4' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' },
  tabBtn: { padding: '12px 20px', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  primaryBtn: { width: '100%', padding: '16px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(6,182,212,0.3)' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tile: { padding: '20px', borderRadius: '18px', textAlign: 'center', fontWeight: 800, border: '1px solid transparent', transition: '0.3s' },
  subList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  subRow: { padding: '16px', borderRadius: '14px', textAlign: 'center', fontWeight: 600 },
  typeBtn: { flex: 1, padding: '14px', color: '#fff', borderRadius: '14px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 },
  label: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '12px', letterSpacing: '1px' },
  rollArea: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingBottom: '100px' },
  rollChip: { padding: '18px', borderRadius: '16px', textAlign: 'center', fontWeight: 800, transition: '0.2s' },
  submitBtn: { position: 'fixed', bottom: '30px', left: '20px', right: '20px', padding: '20px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, maxWidth: '760px', margin: '0 auto' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e' }
};
