import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, Fingerprint, Mail, AlertTriangle, 
  Clock, BookOpen, Layers, FileSpreadsheet, MapPin, 
  ChevronRight, CheckCircle2, Calendar, LayoutGrid
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL CONFIG ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => {});
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
      <div style={{...styles.glassCard, width: isMobile ? '88%' : '400px'}}>
        <div style={styles.logoBox}><img src="/logo.png" style={styles.mainLogo} alt="Logo" /></div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>SECURE FACULTY PORTAL</p>
        <div style={styles.inputBox}><User size={18} style={styles.inIcon}/><input id="u" placeholder="User ID" style={styles.inputF}/></div>
        <div style={styles.inputBox}><Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>AUTHENTICATE <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <nav style={styles.navbar}>
        <div style={styles.navIn}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>{user.name[0]}</div>
            {!isMobile && <div><b>{user.name}</b><br/><small style={{color:'#818cf8', fontWeight:'800', fontSize:'10px'}}>{user.role.toUpperCase()}</small></div>}
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> {!isMobile && 'EXIT'}</button>
        </div>
      </nav>
      <main style={{...styles.container, padding: isMobile ? '15px' : '30px 20px'}}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} isMobile={isMobile} /> : <FacultyPanel user={user} isMobile={isMobile} />}
      </main>
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, isMobile }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], critical: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', id: '', pass: '', fId: '', cls: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Master_Report.xlsx");
  };

  return (
    <div style={{animation: 'fadeIn 0.5s ease'}}>
      <div style={{...styles.tabGrid, overflowX: isMobile ? 'auto' : 'hidden'}}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab===t?'#6366f1':'#1e293b', color: tab===t?'#fff':'#94a3b8'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'faculties' && (
        <div style={styles.gridSystem}>
          {db.facs.map(f => (
            <div key={f.id} style={styles.facultyCard}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div><b>{f.name}</b><br/><small style={{color:'#64748b'}}>ID: {f.id}</small></div>
                <button style={styles.delBtn} onClick={async() => {if(confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}}><Trash2 size={16}/></button>
              </div>
              <div style={{marginTop:'15px', display:'flex', gap:'8px'}}>
                <span style={styles.pills}>Theory: {db.logs.filter(l=>l.faculty===f.name && l.type==='Theory').length}</span>
                <span style={{...styles.pills, background:'#10b98115', color:'#10b981'}}>Practical: {db.logs.filter(l=>l.faculty===f.name && l.type==='Practical').length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div style={{display:'flex', gap:'12px', marginBottom:'20px', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
            <div style={styles.searchBox}><Search size={18} color="#475569"/><input placeholder="Search records..." style={styles.searchIn} onChange={e=>setSearch(e.target.value.toLowerCase())}/></div>
            <button onClick={downloadMaster} style={styles.masterBtn}><FileSpreadsheet size={18}/> MASTER SHEET</button>
          </div>
          {db.logs.filter(l=>(l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.listRow}>
              <div><b>{log.class} | {log.sub}</b><br/><small style={{color:'#64748b'}}>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px', color:'#475569'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'manage' && (
        <div style={styles.gridSystem}>
          <div style={styles.formCard}>
            <h3 style={styles.cardT}>Add Faculty</h3>
            <input placeholder="Name" style={styles.uiIn} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="ID" style={styles.uiIn} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Pass" style={styles.uiIn} type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={styles.btnMain} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h3 style={styles.cardT}>Mapping</h3>
            <select style={styles.uiIn} onChange={e=>setForm({...form, fId:e.target.value})}><option>Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.uiIn} onChange={e=>setForm({...form, cls:e.target.value})}><option>Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={styles.uiIn} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...styles.btnMain, background:'#10b981'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapped!");}}>ASSIGN</button>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div style={styles.gridSystem}>
          <div style={styles.statC}><Users color="#6366f1" size={32}/><h3>{db.facs.length}</h3><p>Total Staff</p></div>
          <div style={styles.statC}><AlertTriangle color="#f43f5e" size={32}/><h3>{db.critical.length}</h3><p>Critical Alerts</p></div>
        </div>
      )}
    </div>
  );
}

// --- PERFECT MOBILE FACULTY PANEL ---
function FacultyPanel({ user, isMobile }) {
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
    if(!setup.cl || !setup.sub) return alert("Please select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
      window.scrollTo(0,0);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ OUTSIDE CAMPUS!"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Attendance Submitted!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={{...fStyles.container, maxWidth: isMobile ? '100%' : '500px'}}>
      <div style={fStyles.header}>
        <h2 style={fStyles.title}>Prof. {user.name.split(' ')[0]} 👋</h2>
        <p style={fStyles.subtitle}>Setup your session</p>
      </div>

      <div style={fStyles.setupCard}>
        <label style={fStyles.label}>CLASS & SUBJECT</label>
        <div style={fStyles.inWrap}><Layers size={18} style={fStyles.inIcon}/><select style={fStyles.select} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div style={fStyles.inWrap}><BookOpen size={18} style={fStyles.inIcon}/><select style={fStyles.select} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select></div>

        <label style={fStyles.label}>TYPE</label>
        <div style={fStyles.typeRow}>
           <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.typeBtn, background: setup.ty==='Theory'?'#6366f1':'#020617', color: setup.ty==='Theory'?'#fff':'#94a3b8'}}>Theory</button>
           <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.typeBtn, background: setup.ty==='Practical'?'#6366f1':'#020617', color: setup.ty==='Practical'?'#fff':'#94a3b8'}}>Practical</button>
        </div>
      </div>
      <button style={fStyles.startBtn} onClick={launch}>START ATTENDANCE <ChevronRight/></button>
    </div>
  );

  return (
    <div style={{animation:'fadeIn 0.3s ease'}}>
      <div style={fStyles.stickyNav}>
        <button onClick={()=>setActive(false)} style={fStyles.backBtn}><ArrowLeft size={22}/></button>
        <div style={{textAlign:'center'}}><b style={{fontSize:'16px'}}>{setup.cl}</b><br/><small style={{color:'#818cf8'}}>{setup.sub}</small></div>
        <div style={fStyles.counter}>{marked.length}/{students.length}</div>
      </div>

      <div style={{...fStyles.grid, gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(90px, 1fr))'}}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}
               style={{...fStyles.chip, background: marked.includes(s.id)?'linear-gradient(135deg, #6366f1, #4f46e5)':'#1e293b', border: marked.includes(s.id)?'none':'1px solid #334155'}}>
            <small style={{fontSize:'9px', opacity:0.5}}>ROLL</small>
            <span style={{fontSize:'24px', fontWeight:'900'}}>{s.id}</span>
            {marked.includes(s.id) && <CheckCircle2 size={14} style={fStyles.check}/>}
          </div>
        ))}
      </div>

      <div style={fStyles.floatFoot}>
        <button disabled={loading} onClick={submit} style={{...fStyles.submitBtn, background: loading?'#334155':'#10b981'}}>
          {loading ? "VERIFYING..." : `SUBMIT SESSION`}
        </button>
      </div>
    </div>
  );
}

// --- STYLING SYSTEMS ---
const fStyles = {
  container: { margin: '0 auto' },
  header: { marginBottom:'25px' },
  title: { fontSize:'30px', fontWeight:'900', margin:0 },
  subtitle: { color:'#818cf8', fontWeight:'700', margin:0 },
  setupCard: { background:'#0f172a', padding:'25px', borderRadius:'30px', border:'1px solid #1e293b' },
  label: { fontSize:'10px', fontWeight:'900', color:'#475569', letterSpacing:'1px', display:'block', marginBottom:'10px' },
  inWrap: { position:'relative', marginBottom:'15px' },
  inIcon: { position:'absolute', left:'15px', top:'16px', color:'#6366f1' },
  select: { width:'100%', padding:'16px 15px 16px 45px', borderRadius:'18px', background:'#020617', border:'1px solid #334155', color:'#fff', appearance:'none', fontSize:'16px' },
  typeRow: { display:'flex', gap:'10px' },
  typeBtn: { flex:1, padding:'16px', borderRadius:'15px', border:'none', fontWeight:'900' },
  startBtn: { width:'100%', padding:'20px', borderRadius:'22px', border:'none', background:'linear-gradient(135deg, #6366f1, #a855f7)', color:'#fff', fontWeight:'900', fontSize:'16px', marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  
  stickyNav: { position:'sticky', top:'0', background:'rgba(2, 6, 23, 0.9)', backdropFilter:'blur(10px)', padding:'15px 0', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:100, marginBottom:'20px' },
  backBtn: { background:'#1e293b', border:'none', color:'#fff', padding:'10px', borderRadius:'12px' },
  counter: { background:'#6366f1', padding:'8px 15px', borderRadius:'12px', fontWeight:'900' },
  grid: { display:'grid', gap:'12px', paddingBottom:'140px' },
  chip: { height:'100px', borderRadius:'24px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' },
  check: { position:'absolute', top:'8px', right:'8px', color:'#fff' },
  floatFoot: { position:'fixed', bottom:'20px', left:'20px', right:'20px' },
  submitBtn: { width:'100%', padding:'22px', borderRadius:'24px', border:'none', color:'#fff', fontWeight:'900', fontSize:'18px', boxShadow:'0 10px 30px rgba(0,0,0,0.5)' }
};

const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily: 'Inter, sans-serif' },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'radial-gradient(circle at top right, #1e1b4b, #020617)' },
  glassCard: { background:'rgba(15, 23, 42, 0.6)', backdropFilter:'blur(20px)', padding:'40px', borderRadius:'40px', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center' },
  logoBox: { width:'80px', height:'80px', background:'#000', borderRadius:'24px', margin:'0 auto 20px', border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center' },
  mainLogo: { width:'60px', height:'60px', objectFit:'contain' },
  title: { fontSize:'28px', fontWeight:'900', color:'#fff', margin:0 },
  badge: { fontSize:'10px', color:'#818cf8', fontWeight:'800', marginBottom:'30px', letterSpacing:'1.5px' },
  inputBox: { position:'relative', marginBottom:'15px' },
  inIcon: { position:'absolute', left:'18px', top:'16px', color:'#475569' },
  inputF: { width:'100%', padding:'16px 15px 16px 52px', borderRadius:'18px', background:'#020617', border:'1px solid #1e293b', color:'#fff', outline:'none', boxSizing:'border-box' },
  btnMain: { width:'100%', padding:'18px', borderRadius:'18px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  navbar: { padding:'15px 25px', background:'rgba(2, 6, 23, 0.8)', backdropFilter:'blur(12px)', borderBottom:'1px solid #1e293b', position:'sticky', top:0, zIndex:100 },
  navIn: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1200px', margin:'0 auto' },
  avatar: { width:'38px', height:'38px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'12px', fontWeight:'800', fontSize:'11px' },
  container: { maxWidth:'1200px', margin:'0 auto' },
  tabGrid: { display:'flex', gap:'8px', background:'rgba(15, 23, 42, 0.8)', padding:'6px', borderRadius:'18px', marginBottom:'30px', border:'1px solid #1e293b' },
  tabBtn: { flex:1, padding:'12px', border:'none', borderRadius:'14px', fontWeight:'800', fontSize:'11px', cursor:'pointer' },
  gridSystem: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' },
  facultyCard: { background:'rgba(30, 41, 59, 0.3)', padding:'22px', borderRadius:'28px', border:'1px solid rgba(255,255,255,0.05)' },
  pills: { fontSize:'10px', background:'rgba(99, 102, 241, 0.1)', color:'#818cf8', padding:'5px 12px', borderRadius:'10px', fontWeight:'800' },
  searchBox: { flex:1, display:'flex', alignItems:'center', background:'#0f172a', padding:'0 15px', borderRadius:'18px', border:'1px solid #1e293b' },
  searchIn: { background:'none', border:'none', color:'#fff', padding:'14px', width:'100%', outline:'none' },
  masterBtn: { background:'linear-gradient(135deg, #10b981, #059669)', color:'#fff', padding:'14px 22px', borderRadius:'18px', border:'none', fontWeight:'800', display:'flex', alignItems:'center', gap:'8px' },
  listRow: { background:'rgba(30, 41, 59, 0.2)', padding:'18px 22px', borderRadius:'22px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  formCard: { background:'rgba(15, 23, 42, 0.5)', padding:'30px', borderRadius:'30px', border:'1px solid rgba(255,255,255,0.05)' },
  cardT: { margin:'0 0 20px 0', fontSize:'18px', fontWeight:'800' },
  uiIn: { width:'100%', padding:'15px', borderRadius:'15px', background:'#020617', border:'1px solid #1e293b', color:'#fff', marginBottom:'15px', boxSizing:'border-box' },
  statC: { background:'rgba(30, 41, 59, 0.2)', padding:'30px', borderRadius:'30px', textAlign:'center', border:'1px solid rgba(255,255,2
