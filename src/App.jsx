import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Users, Download, PlusCircle, TrendingUp, Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- STYLING ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-dev-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-dev-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .neon-border { border: 1px solid rgba(6, 182, 212, 0.5); box-shadow: 0 0 15px rgba(6, 182, 212, 0.2); }
    .active-tab { background: #0891b2 !important; color: white !important; box-shadow: 0 0 15px rgba(8, 145, 178, 0.4); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .neon-logo-container { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; overflow: hidden; }
    @keyframes pulse { 0% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 20px #06b6d4; } 100% { box-shadow: 0 0 5px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
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
      else alert("Access Denied");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        {/* CUSTOM LOGO SECTION */}
        <div className="neon-logo-container" style={ui.logoCircle}>
          <img src="/logo.png" alt="Logo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '30px', letterSpacing: '2px'}}>ATTENDANCE SYSTEM</p>
        <input id="u" placeholder="User ID" style={ui.input} />
        <input id="p" type="password" placeholder="Passcode" style={ui.input} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>LOGIN <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });
  const [search, setSearch] = useState('');

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
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={ui.smallLogo}>A</div>
          <div><h2 style={{margin: 0}}>HOD Console</h2><small style={{color: '#06b6d4'}}>System Management</small></div>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={tab === t ? 'active-tab' : ''} style={ui.tabBtn}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{animation: 'fadeIn 0.5s'}}>
          <div style={ui.statsGrid}>
            <div className="glass-card neon-border" style={ui.statCard}><TrendingUp color="#10b981"/><h2>{db.logs.length}</h2><p>Sessions</p></div>
            <div className="glass-card" style={ui.statCard}><Users color="#06b6d4"/><h2>{db.facs.length}</h2><p>Staff</p></div>
            <div className="glass-card" style={ui.statCard}><Layers color="#8b5cf6"/><h2>{excelSheets.length}</h2><p>Classes</p></div>
          </div>
          <h4 style={ui.sectionTitle}>RECENT ACTIVITY</h4>
          <div className="glass-card" style={{overflow: 'hidden'}}>
            {db.logs.slice(0, 5).map((log, i) => (
              <div key={i} style={ui.feedRow}>
                <div style={{...ui.typeIcon, color: log.type === 'Theory' ? '#06b6d4' : '#10b981'}}>{log.type[0]}</div>
                <div style={{flex: 1}}><b>{log.class} - {log.sub}</b><br/><small>{log.faculty}</small></div>
                <div style={{textAlign: 'right'}}><b>{log.present}/{log.total}</b><br/><small style={{fontSize: '10px'}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other HOD Tabs (Staff, Mapping, Logs) go here... (Logic remains same as previous version) */}
    </div>
  );
}

// --- FACULTY PANEL (TYPE FEATURE ADDED) ---
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
    if(!setup.cl || !setup.sub || !setup.start) return alert("Fill Class, Subject & Time");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ OUTSIDE CAMPUS"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl 
      }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("✅ Attendance Saved!");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Failed!"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><h3>Prof. {user.name}</h3><small>Session Setup</small></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      
      <label style={ui.label}>SELECT CLASS</label>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      
      {setup.cl && (
        <div style={{marginTop: '20px'}}>
          <label style={ui.label}>SELECT SUBJECT</label>
          <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}</div>
          
          <label style={ui.label}>SESSION TYPE</label>
          <div style={{display:'flex', gap:'10px', marginBottom: '15px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, border: setup.ty==='Theory'?'2px solid #06b6d4':'1px solid #1e293b'}}>Theory</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, border: setup.ty==='Practical'?'2px solid #06b6d4':'1px solid #1e293b'}}>Practical</button>
          </div>

          <label style={ui.label}>TIME DURATION</label>
          <div style={{display:'flex', gap:'10px', marginBottom: '15px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={ui.input}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={ui.input}/></div>
          
          <button onClick={launch} style={ui.primaryBtn}>START ATTENDANCE</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl} ({setup.ty})</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div style={ui.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "GEOTAGGING..." : "FINALIZE SESSION"}</button>
    </div>
  );
}

// --- STYLES ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '50px 40px', width: '320px', textAlign: 'center' },
  logoCircle: { width: '90px', height: '90px', margin: '0 auto 20px' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  smallLogo: { width: '40px', height: '40px', background: '#0891b2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 'bold', fontSize: '11px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' },
  statCard: { padding: '20px', textAlign: 'center' },
  sectionTitle: { fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginBottom: '15px', fontWeight: '800' },
  feedRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  typeIcon: { width: '35px', height: '35px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  input: { width: '100%', padding: '14px', marginBottom: '12px', borderRadius: '12px', background: '#020617', border: '1px solid #1e293b', color: '#fff', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  typeBtn: { flex: 1, padding: '10px', background: '#1e293b', color: '#fff', borderRadius: '10px', cursor: 'pointer' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', display: 'block' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px', borderRadius: '12px' },
  mobileWrap: { padding: '20px' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { padding: '25px 10px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold' },
  subList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
  subRow: { padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' },
  stickyHeader: { position: 'sticky', top: 0, background: '#020617', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  rollArea: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingBottom: '100px' },
  rollChip: { padding: '20px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '20px', borderRadius: '15px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold' },
  badge: { background: '#10b981', padding: '5px 10px', borderRadius: '8px' },
  circleBtn: { width: '35px', height: '35px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff' }
};
