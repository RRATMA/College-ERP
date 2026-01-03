import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, Users, Calendar, Download, UserPlus, PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER: CSS ANIMATIONS & GLOBAL UI ---
const injectGlobalStyles = () => {
  if (document.getElementById('amrit-core-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-core-styles';
  styleTag.innerHTML = `
    @keyframes logo-glow {
      0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); border-color: #6366f1; }
      50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.8); border-color: #a5b4fc; }
      100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); border-color: #6366f1; }
    }
    .glow-logo { animation: logo-glow 3s infinite ease-in-out; }
    .glass-effect { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
    input:focus { border-color: #6366f1 !important; outline: none; }
    button:active { transform: scale(0.96); }
  `;
  document.head.appendChild(styleTag);
};

// --- DEVELOPER: CONSTANTS ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    injectGlobalStyles();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Load Students List for Class Selection
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(err => console.log("Excel Sync Pending..."));
    
    return () => window.removeEventListener('resize', handleResize);
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
    <div style={styles.loginPage}>
      <div style={{...styles.glassCard, width: isMobile ? '90%' : '380px'}} className="glass-effect">
        <div className="glow-logo" style={styles.logoBox}>
          <img src="/logo.png" style={styles.mainLogo} alt="Logo" />
        </div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>ATTENDANCE SYSTEM</p>
        <div style={styles.inputBox}><User size={18} style={styles.inIcon}/><input id="u" placeholder="Faculty ID" style={styles.inputF}/></div>
        <div style={styles.inputBox}><Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>LOGIN <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <main style={styles.container}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (FULL FEATURES) ---
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

  const today = new Date().toLocaleDateString('en-GB');

  return (
    <div style={hStyles.wrapper}>
      <div style={hStyles.header}><h3>Admin Dashboard</h3><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      <div style={hStyles.tabs}>
        {['dashboard','master','faculty','mapping'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...hStyles.tabBtn, background: tab===t?'#6366f1':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div>
          <div style={hStyles.statsGrid}>
            <div style={hStyles.statCard}><Users size={20}/><br/><b>{db.logs.filter(l=>l.time_str===today).length}</b><p>Lectures Today</p></div>
            <div style={hStyles.statCard}><Layers size={20}/><br/><b>{db.facs.length}</b><p>Total Staff</p></div>
          </div>
          <h4 style={{margin:'20px 0 10px'}}>Attendance History</h4>
          {db.logs.slice(0, 10).map(log => (
            <div key={log.id} style={hStyles.row}><span>{log.class} - {log.sub}</span><b>{log.present}/{log.total}</b></div>
          ))}
        </div>
      )}

      {tab === 'faculty' && (
        <div>
          <div style={hStyles.formCard}>
            <input placeholder="Faculty Name" style={hStyles.input} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Staff ID" style={hStyles.input} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" type="password" style={hStyles.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>ADD STAFF</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={hStyles.recordCard}><span>{f.name}</span><button onClick={async()=>{if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}}><Trash2 size={16}/></button></div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div>
          <div style={hStyles.formCard}>
            <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Teacher</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>ASSIGN SUBJECT</button>
          </div>
          {db.maps.map(m => (<div key={m.id} style={hStyles.row}><span>{m.class_name}: {m.subject_name}</span><button onClick={async()=>{await supabase.from('assignments').delete().eq('id',m.id); loadData();}}><Trash2 size={16}/></button></div>))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (TESTER: GPS & LOGIC) ---
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
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    // TESTER: Geofencing Check
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ ERROR: Outside Campus Boundary!"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("✅ Attendance Locked & Saved!");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Denied!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}><div><h4>Prof. {user.name}</h4><small>AMRIT Digital</small></div><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      <label style={fStyles.label}>AVAILABLE CLASSES</label>
      <div style={fStyles.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...fStyles.tile, background: setup.cl===c?'#6366f1':'#0f172a', border: setup.cl===c?'none':'1px solid #1e293b'}}>{c}</div>))}</div>
      {setup.cl && <div style={{marginTop:'20px'}}><label style={fStyles.label}>SUBJECTS</label>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}>{j.subject_name}</div>))}</div>}
      <button onClick={launch} style={fStyles.launchBtn}>START SESSION</button>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}><button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button><span>{marked.length}/{students.length} Present</span></div>
      <div style={fStyles.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...fStyles.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={fStyles.submitBtn}>{loading ? "SAVING..." : "FINISH SESSION"}</button>
    </div>
  );
}

// --- STYLES (NO CHANGES TO HOME LOGO AS REQUESTED) ---
const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily:'sans-serif' },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'radial-gradient(circle, #0f172a, #020617)' },
  glassCard: { background:'rgba(15, 23, 42, 0.7)', padding:'40px', borderRadius:'40px', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)' },
  logoBox: { width:'100px', height:'100px', background:'#000', borderRadius:'50%', margin:'0 auto 20px', border:'2px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  mainLogo: { width:'100%', height:'100%', objectFit: 'cover' },
  title: { fontSize:'32px', fontWeight:'900', color:'#ffffff' },
  badge: { fontSize:'12px', color:'#818cf8', marginBottom:'30px', fontWeight:'bold' },
  inputBox: { position:'relative', marginBottom:'12px' },
  inIcon: { position:'absolute', left:'15px', top:'15px', color:'#6366f1' },
  inputF: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'15px', background:'#020617', border:'1px solid #1e293b', color:'#fff', boxSizing:'border-box' },
  btnMain: { width:'100%', padding:'18px', borderRadius:'15px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer' },
  container: { maxWidth:'1000px', margin:'0 auto' }
};

const hStyles = {
  wrapper: { padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', overflowX:'auto' },
  tabBtn: { padding: '10px 15px', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', minWidth:'90px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statCard: { background: '#0f172a', padding: '15px', borderRadius: '15px', border: '1px solid #1e293b', textAlign: 'center' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#0f172a', borderRadius: '12px', marginBottom: '8px', border:'1px solid #1e293b' },
  recordCard: { display: 'flex', justifyContent: 'space-between', background: '#0f172a', padding: '15px', borderRadius: '15px', marginBottom: '10px' },
  formCard: { background: '#0f172a', padding: '15px', borderRadius: '15px', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: '#fff', marginBottom: '10px', boxSizing:'border-box' },
  actionBtn: { width: '100%', padding: '15px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold' }
};

const fStyles = {
  mobileWrapper: { padding:'20px' },
  topBar: { display:'flex', justifyContent:'space-between', marginBottom:'30px' },
  exitBtn: { background:'#f43f5e', color:'#fff', border:'none', padding:'10px', borderRadius:'12px' },
  label: { fontSize:'11px', color:'#64748b', fontWeight:'800', marginBottom:'10px', display:'block' },
  tileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  tile: { padding:'20px', borderRadius:'18px', textAlign:'center', fontWeight:'bold' },
  subRow: { padding:'15px', borderRadius:'12px', marginTop:'8px', fontWeight:'bold' },
  launchBtn: { width:'100%', padding:'20px', borderRadius:'18px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', marginTop:'30px' },
  stickyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  circleBtn: { background:'#1e293b', color:'#fff', border:'none', width:'40px', height:'40px', borderRadius:'50%' },
  rollArea: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' },
  rollChip: { padding:'25px 10px', borderRadius:'15px', textAlign:'center', fontWeight:'800', fontSize:'18px' },
  submitBtn: { width:'100%', padding:'20px', borderRadius:'18px', background:'#10b981', color:'#fff', border:'none', fontWeight:'bold', marginTop:'20px' }
};
