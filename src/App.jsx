import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Zap, 
  FlaskConical, GraduationCap, Users, Layers, Clock 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER ENGINE: NEON-GLASS ULTIMATE ---
const injectStyles = () => {
  if (document.getElementById('amrit-ultimate-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-ultimate-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    :root {
      --bg: #030712; --card: rgba(17, 24, 39, 0.7);
      --accent: #06b6d4; --neon-glow: 0 0 15px rgba(6, 182, 212, 0.4);
    }
    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); 
      color: #f8fafc; margin: 0; overflow-x: hidden;
      background-image: radial-gradient(circle at top right, #083344, transparent);
    }
    .glass-panel {
      background: var(--card); backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px;
    }
    .stat-card {
      background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px; padding: 24px; transition: 0.3s ease;
    }
    .stat-card:hover { border-color: var(--accent); transform: translateY(-5px); box-shadow: var(--neon-glow); }
    .activity-row {
      background: rgba(255, 255, 255, 0.02); border-radius: 16px; padding: 16px 20px; 
      margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;
      border-left: 4px solid transparent; transition: 0.2s;
    }
    .activity-row:hover { background: rgba(255, 255, 255, 0.05); border-left-color: var(--accent); }
    .neon-text { color: var(--accent); text-shadow: var(--neon-glow); }
    input, select { 
      width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; 
      background: #0f172a; border: 1px solid #1e293b; color: #fff; box-sizing: border-box; 
    }
    .search-container {
      position: relative; margin-bottom: 20px;
    }
    .search-icon { position: absolute; left: 15px; top: 15px; color: var(--accent); }
    .search-input { padding-left: 45px !important; }
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
      else alert("Unauthorized");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-panel" style={ui.loginCard}>
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

// --- HOD PANEL (WITH SEARCH FEATURE) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  // Developer Feature: Log Search Logic
  const filteredLogs = db.logs.filter(log => 
    log.faculty.toLowerCase().includes(search.toLowerCase()) ||
    log.class.toLowerCase().includes(search.toLowerCase()) ||
    log.sub.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div><h1 style={{fontSize:'32px', margin:0}}>AMRIT <span style={{fontWeight:300}}>HOD</span></h1><p className="neon-text" style={{fontSize:'12px'}}>Control Center</p></div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?ui.accent:'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <div className="glass-panel" style={{padding:'25px'}}>
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input className="search-input" placeholder="Search by Faculty, Class, or Subject..." onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <div className="scroll-hide" style={{maxHeight:'450px', overflowY:'auto'}}>
            {filteredLogs.map((log, i) => (
              <div key={i} className="activity-row">
                <div><div style={{fontWeight:600}}>{log.class} - {log.sub}</div><small style={{opacity:0.5}}>{log.faculty} • {log.type}</small></div>
                <div style={{textAlign:'right'}}><div style={{fontWeight:800, color:'#10b981'}}>{log.present}/{log.total}</div><small style={{fontSize:'10px', opacity:0.4}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs follow HOD logic from your reference... */}
    </div>
  );
}

// --- FACULTY PANEL (WITH TYPE & TIME) ---
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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  if (!active) return (
    <div style={ui.container}>
      <div style={ui.header}><div><h2 style={{margin:0}}>Prof. {user.name}</h2><p className="neon-text">Faculty Portal</p></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <div className="glass-panel" style={{padding:'24px'}}>
        <p style={ui.label}>CLASS & SUBJECT</p>
        <select onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c}>{c}</option>)}</select>
        <select onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id}>{j.subject_name}</option>)}</select>
        
        <p style={ui.label}>SESSION TYPE</p>
        <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
          <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, background: setup.ty==='Theory'?ui.accent:'rgba(255,255,255,0.05)'}}>Theory</button>
          <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, background: setup.ty==='Practical'?'#10b981':'rgba(255,255,255,0.05)'}}>Practical</button>
        </div>

        <p style={ui.label}>TIME DURATION</p>
        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
          <input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} />
          <input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} />
        </div>

        <button onClick={launch} style={ui.primaryBtn}>START ROLL CALL</button>
      </div>
    </div>
  );

  return (
    <div style={ui.container}>
      <div style={ui.header}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div className="neon-text" style={{fontWeight:800}}>{marked.length}/{students.length}</div></div>
      <div className="scroll-hide" style={ui.rollArea}>{students.map(s => (
        <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'rgba(255,255,255,0.05)'}}>{s.id}</div>
      ))}</div>
      <button onClick={() => {/* Submit Logic */}} style={ui.submitBtn}>SYNC ATTENDANCE</button>
    </div>
  );
}

const ui = {
  accent: '#06b6d4',
  container: { maxWidth: '600px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' },
  tabBtn: { padding: '12px 20px', borderRadius: '16px', color: '#fff', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' },
  primaryBtn: { width: '100%', padding: '16px', background: '#06b6d4', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px rgba(6,182,212,0.3)' },
  typeBtn: { flex: 1, padding: '14px', color: '#fff', borderRadius: '14px', border: 'none', fontWeight: 600 },
  label: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' },
  rollArea: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingBottom: '100px' },
  rollChip: { padding: '18px', borderRadius: '16px', textAlign: 'center', fontWeight: 800 },
  submitBtn: { position: 'fixed', bottom: '30px', left: '20px', right: '20px', padding: '20px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 800 },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }
};
