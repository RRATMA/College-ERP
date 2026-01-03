import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ArrowLeft, Trash2, Layers, 
  Users, Zap, FlaskConical, GraduationCap, 
  CheckCircle2, Box, Layout, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- AMRIT NEON-GLASS V4 ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-v4-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v4-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    :root {
      --bg: #020617;
      --accent: #22d3ee;
      --success: #10b981;
      --glass: rgba(15, 23, 42, 0.75);
      --border: rgba(255, 255, 255, 0.08);
    }
    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      background: var(--bg); color: #f8fafc; margin: 0;
      background-image: 
        radial-gradient(circle at 0% 0%, #083344 0%, transparent 40%),
        radial-gradient(circle at 100% 100%, #1e1b4b 0%, transparent 40%);
      background-attachment: fixed;
      overflow-x: hidden;
    }
    .glass { background: var(--glass); backdrop-filter: blur(20px); border: 1px solid var(--border); }
    .neon-glow { box-shadow: 0 0 20px rgba(34, 211, 238, 0.2); }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { 
      width: 100%; padding: 16px; margin-bottom: 12px; border-radius: 16px; 
      background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: #fff; 
      outline: none; transition: 0.3s;
    }
    input:focus { border-color: var(--accent); background: rgba(34, 211, 238, 0.05); }
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
    }).catch(() => console.error("Sheet Load Error"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '0 20px' }}>
      <AnimatePresence mode="wait">
        {view === 'login' && <LoginView onLogin={handleLogin} />}
        {view === 'hod' && <HODPanel excelSheets={excelSheets} setView={setView} />}
        {view === 'faculty' && <FacultyPanel user={user} setView={setView} />}
      </AnimatePresence>
    </div>
  );
}

// --- LOGIN COMPONENT ---
function LoginView({ onLogin }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={ui.centered}>
      <div className="glass neon-glow" style={ui.loginCard}>
        <div style={ui.logoBox}><Box color="#22d3ee" size={40}/></div>
        <h1 style={{fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', margin: '10px 0'}}>AMRIT <span style={{fontWeight:300}}>V4</span></h1>
        <p style={{fontSize: '12px', opacity: 0.5, marginBottom: '30px'}}>CENTRALIZED FACULTY COMMAND</p>
        <input id="u" placeholder="System ID" />
        <input id="p" type="password" placeholder="Access Key" />
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>AUTHENTICATE</motion.button>
      </div>
    </motion.div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };
  useEffect(() => { loadData(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={ui.container}>
      <div style={ui.header}>
        <div><h2 style={{margin:0}}>Control Center</h2><p style={{color: 'var(--accent)', fontSize: '12px', fontWeight:700}}>ADMINISTRATOR</p></div>
        <button onClick={()=>setView('login')} style={ui.iconBtn}><LogOut size={20}/></button>
      </div>

      <div style={ui.tabBar} className="scroll-hide">
        {['dashboard', 'staff', 'mapping'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabItem, color: tab===t?'#fff':'#64748b', borderBottom: tab===t?'2px solid var(--accent)':'none'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'dashboard' && (
          <motion.div key="dash" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
            <div style={ui.statsRow}>
              <StatCard icon={<Zap/>} label="Sessions" val={db.logs.length} />
              <StatCard icon={<Users/>} label="Faculties" val={db.facs.length} />
            </div>
            <div className="glass" style={{padding:'20px', borderRadius:'24px'}}>
              <h4 style={{marginTop:0, opacity:0.6}}>LIVE LOGS</h4>
              {db.logs.slice(0,6).map((log, i) => (
                <div key={i} style={ui.listRow}>
                  <div><div style={{fontWeight:700}}>{log.class}</div><div style={{fontSize:10, opacity:0.5}}>{log.faculty}</div></div>
                  <div style={{color:'var(--success)', fontWeight:800}}>{log.present}/{log.total}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Complete Configuration");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("ERROR: OUTSIDE CAMPUS"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: marked.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      setLoading(false); setActive(false); setMarked([]); alert("SYNCED SUCCESSFULLY");
    }, () => { setLoading(false); alert("GPS FAILED"); });
  };

  if (!active) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={ui.container}>
      <div style={ui.header}>
        <div><h2 style={{margin:0}}>Prof. {user.name}</h2><p style={{fontSize:12, color:'var(--accent)'}}>FACULTY ACCESS</p></div>
        <button onClick={()=>setView('login')} style={ui.iconBtn}><LogOut/></button>
      </div>

      <div className="glass" style={{padding:'24px', borderRadius:'28px'}}>
        <label style={ui.label}>SELECT CLASS</label>
        <div style={ui.grid2}>
          {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
            <motion.div key={c} whileTap={{scale:0.95}} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.selectable, borderColor: setup.cl===c?'var(--accent)':'transparent', background: setup.cl===c?'rgba(34,211,238,0.1)':'rgba(255,255,255,0.03)'}}>{c}</motion.div>
          ))}
        </div>

        {setup.cl && (
          <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} style={{marginTop:20}}>
            <label style={ui.label}>SELECT SUBJECT</label>
            {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
              <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subItem, background: setup.sub===j.subject_name?'var(--accent)':'rgba(255,255,255,0.05)', color: setup.sub===j.subject_name?'#000':'#fff'}}>{j.subject_name}</div>
            ))}
            <div style={{display:'flex', gap:10, margin:'20px 0'}}>
              <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.modeBtn, background: setup.ty==='Theory'?'var(--accent)':'rgba(255,255,255,0.05)', color: setup.ty==='Theory'?'#000':'#fff'}}><GraduationCap size={16}/> Theory</button>
              <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.modeBtn, background: setup.ty==='Practical'?'#10b981':'rgba(255,255,255,0.05)', color: setup.ty==='Practical'?'#fff':'#fff'}}><FlaskConical size={16}/> Lab</button>
            </div>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={launch} style={ui.primaryBtn}>BEGIN ROLL CALL</motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={ui.container}>
      <div style={ui.stickyHeader} className="glass">
        <button onClick={()=>setActive(false)} style={ui.iconBtn}><ArrowLeft/></button>
        <div style={{textAlign:'center'}}><div style={{fontWeight:800}}>{setup.cl}</div><div style={{fontSize:10, color:'var(--accent)'}}>{setup.sub}</div></div>
        <div style={ui.countBadge}>{marked.length}</div>
      </div>

      <div style={ui.rollGrid}>
        {students.map(s => (
          <motion.div 
            key={s.id} 
            whileTap={{scale:0.9}} 
            onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
            style={{...ui.rollBox, background: marked.includes(s.id)?'var(--success)':'rgba(255,255,255,0.03)', borderColor: marked.includes(s.id)?'#10b981':'var(--border)'}}
          >
            {marked.includes(s.id) && <CheckCircle2 size={12} style={{marginBottom:4}}/>}
            <div style={{fontWeight:700}}>{s.id}</div>
          </motion.div>
        ))}
      </div>

      <div style={ui.footer}>
        <motion.button disabled={loading} onClick={submit} style={{...ui.primaryBtn, background: 'var(--success)', boxShadow: '0 10px 30px rgba(16,185,129,0.3)'}}>{loading ? "VERIFYING LOCATION..." : "SYNC TO CLOUD"}</motion.button>
      </div>
    </motion.div>
  );
}

const StatCard = ({ icon, label, val }) => (
  <div className="glass" style={ui.statCard}>
    <div style={{color:'var(--accent)'}}>{icon}</div>
    <div style={{fontSize:24, fontWeight:800, margin:'5px 0'}}>{val}</div>
    <div style={{fontSize:10, opacity:0.5, textTransform:'uppercase'}}>{label}</div>
  </div>
);

// --- DESIGN SYSTEM UI OBJECT ---
const ui = {
  centered: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginCard: { padding: '40px', width: '320px', borderRadius: '32px', textAlign: 'center' },
  logoBox: { width: 60, height: 60, borderRadius: 20, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  container: { maxWidth: '600px', margin: '0 auto', padding: '40px 0 100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  stickyHeader: { position: 'fixed', top: 15, left: 15, right: 15, maxWidth: 570, margin: '0 auto', padding: '15px 25px', borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
  iconBtn: { padding: 10, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer' },
  primaryBtn: { width: '100%', padding: '18px', borderRadius: '18px', border: 'none', background: 'var(--accent)', color: '#000', fontWeight: 800, cursor: 'pointer' },
  tabBar: { display: 'flex', gap: 20, marginBottom: 25, borderBottom: '1px solid var(--border)' },
  tabItem: { padding: '10px 5px', background: 'none', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 20 },
  statCard: { padding: 20, borderRadius: 24, textAlign: 'center' },
  listRow: { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  label: { fontSize: 10, fontWeight: 800, opacity: 0.4, display: 'block', marginBottom: 12, letterSpacing: 1 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  selectable: { padding: 20, borderRadius: 20, textAlign: 'center', fontWeight: 700, border: '2px solid transparent', cursor: 'pointer' },
  subItem: { padding: 16, borderRadius: 16, marginBottom: 8, textAlign: 'center', fontWeight: 600, cursor: 'pointer' },
  modeBtn: { flex: 1, padding: 14, borderRadius: 14, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 700 },
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 100 },
  rollBox: { padding: 20, borderRadius: 18, border: '1px solid', textAlign: 'center', cursor: 'pointer' },
  countBadge: { padding: '5px 15px', borderRadius: 12, background: 'var(--accent)', color: '#000', fontWeight: 800 },
  footer: { position: 'fixed', bottom: 20, left: 20, right: 20, maxWidth: 560, margin: '0 auto' }
};
