import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, BarChart3, Plus, Fingerprint, Mail, AlertTriangle, MapPin, 
  Monitor, Calendar, Clock, BookOpen, Layers, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER CONFIG ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.log("Init Resources..."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Access Denied!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <div style={styles.logoBox}>
            <img src="/logo.png" style={styles.mainLogo} alt="Logo" />
        </div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>SECURE INSTITUTIONAL PORTAL</p>
        
        <div style={styles.inputBox}>
          <User size={18} style={styles.inIcon}/><input id="u" placeholder="Admin/Faculty ID" style={styles.inputF}/>
        </div>
        <div style={styles.inputBox}>
          <Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/>
        </div>
        
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <nav style={styles.navbar}>
        <div style={styles.navIn}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>{user.name[0]}</div>
            <div><b style={{fontSize:'14px'}}>{user.name}</b><br/><small style={{color:'#818cf8', fontWeight:'700'}}>{user.role.toUpperCase()}</small></div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> LOGOUT</button>
        </div>
      </nav>
      <main style={styles.container}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- DESIGNER HOD PANEL ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [], critical: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', id: '', pass: '', fId: '', cls: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb(prev => ({ ...prev, facs: f || [], logs: l || [], critical: c || [] }));
  };
  useEffect(() => { loadData(); }, []);

  const downloadMaster = () => {
    const data = db.logs.map(l => ({ 'Date': l.time_str, 'Faculty': l.faculty, 'Class': l.class, 'Subject': l.sub, 'Type': l.type, 'Present': l.present, 'Total': l.total }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "MasterLogs");
    XLSX.writeFile(wb, "Master_Attendance.xlsx");
  };

  return (
    <div style={{animation: 'fadeIn 0.5s ease'}}>
      <div style={styles.tabGrid}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab===t?'#6366f1':'transparent', color: tab===t?'#fff':'#94a3b8'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'faculties' && db.facs.map(f => {
        const facLogs = db.logs.filter(l => l.faculty === f.name);
        return (
          <div key={f.id} style={styles.listRow}>
            <div style={{flex:1}}>
              <b style={{fontSize:'16px'}}>{f.name}</b><br/>
              <div style={{display:'flex', gap:'10px', marginTop:'6px'}}>
                <span style={styles.pillLec}>Theory: {facLogs.filter(l=>l.type==='Theory').length}</span>
                <span style={styles.pillPrac}>Practical: {facLogs.filter(l=>l.type==='Practical').length}</span>
              </div>
            </div>
            <button style={styles.delBtn} onClick={async() => { if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}}><Trash2 size={16}/></button>
          </div>
        );
      })}

      {tab === 'logs' && (
        <>
          <div style={styles.logHeader}>
            <div style={styles.searchBox}><Search size={18}/><input placeholder="Search records..." style={styles.searchIn} onChange={e=>setSearch(e.target.value.toLowerCase())}/></div>
            <button onClick={downloadMaster} style={styles.masterBtn}><FileSpreadsheet size={18}/> MASTER SHEET</button>
          </div>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.listRow}>
              <div><b>{log.class} | {log.sub}</b><br/><small style={{color:'#94a3b8'}}>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'manage' && (
        <div style={styles.manageGrid}>
          <div style={styles.formCard}>
            <h5 style={styles.cardT}>Add New Faculty</h5>
            <input placeholder="Full Name" style={styles.uiIn} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Faculty ID" style={styles.uiIn} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Create Password" style={styles.uiIn} type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={styles.uiBtn} onClick={async() => {await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Success");}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h5 style={styles.cardT}>Subject Mapping</h5>
            <select style={styles.uiIn} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Teacher</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.uiIn} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.uiIn} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...styles.uiBtn, background:'#10b981'}} onClick={async() => {await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapped!");}}>LINK SUBJECT</button>
          </div>
        </div>
      )}
      
      {tab === 'analytics' && (
        <div style={styles.statsRow}>
            <div style={styles.statC}><Users color="#6366f1" size={32}/><h3>{db.facs.length}</h3><p>Total Staff</p></div>
            <div style={styles.statC}><AlertTriangle color="#f43f5e" size={32}/><h3>{db.critical.length}</h3><p>Critical Alerts</p></div>
        </div>
      )}
    </div>
  );
}

// --- DESIGNER FACULTY PANEL ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Missing Details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setIsSubmitting(false); return alert("❌ OUTSIDE PERIMETER"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Done!"); setIsSubmitting(false); setActive(false); setMarked([]);
    }, (err) => { setIsSubmitting(false); alert("GPS Error!"); }, { timeout: 10000 });
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <div style={styles.setupHeader}><Clock color="#6366f1"/><h3>Session Setup</h3></div>
      <label style={styles.label}>CLASS</label>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select...</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>SUBJECT</label>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select...</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      
      <label style={styles.label}>SESSION TYPE</label>
      <div style={styles.typeRow}>
        <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...styles.typeBtn, background:setup.ty==='Theory'?'#6366f1':'#0f172a'}}><BookOpen size={14}/> Theory</button>
        <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...styles.typeBtn, background:setup.ty==='Practical'?'#6366f1':'#0f172a'}}><Layers size={14}/> Practical</button>
      </div>

      <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
        <div style={{flex:1}}><label style={styles.label}>START</label><input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, start:e.target.value})}/></div>
        <div style={{flex:1}}><label style={styles.label}>END</label><input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
      </div>
      <button style={styles.btnMain} onClick={launch}>PROCEED TO ROLL CALL</button>
    </div>
  );

  return (
    <div style={{animation: 'fadeIn 0.3s ease'}}>
      <div style={styles.stickyHead}>
        <button onClick={()=>setActive(false)} style={styles.backB}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl} | {setup.ty}</b><br/><small>{marked.length}/{students.length} Selected</small></div>
      </div>
      <div style={styles.gridRoll}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.chip, background: marked.includes(s.id) ? '#6366f1' : 'rgba(30, 41, 59, 0.5)', border: marked.includes(s.id)?'2px solid #818cf8':'1px solid #334155'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.footBtn}>
        <button disabled={isSubmitting} onClick={submit} style={{...styles.subLrg, background: isSubmitting?'#475569':'#10b981'}}>
          {isSubmitting ? "VERIFYING SECURE GPS..." : `SUBMIT ${setup.ty.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}

// --- DESIGNER STYLES (GLASSMORPHIC) ---
const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f8fafc', fontFamily: "'Inter', sans-serif" },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px', background:'radial-gradient(circle at top right, #1e1b4b, #020617)' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(12px)', padding:'45px', borderRadius:'40px', width:'100%', maxWidth:'380px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
  logoBox: { width:'90px', height:'90px', background:'#020617', borderRadius:'24px', margin:'0 auto 25px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid #6366f1', boxShadow:'0 0 20px rgba(99, 102, 241, 0.2)' },
  mainLogo: { width:'65px', height:'65px', objectFit:'contain' },
  title: { fontSize:'28px', fontWeight:'900', letterSpacing:'-1px', margin:0 },
  badge: { color:'#818cf8', fontSize:'11px', fontWeight:'800', letterSpacing:'1px', marginBottom:'30px' },
  inputBox: { position:'relative', marginBottom:'15px' },
  inIcon: { position:'absolute', left:'15px', top:'14px', color:'#94a3b8' },
  inputF: { width:'100%', padding:'14px 15px 14px 45px', borderRadius:'15px', background:'#0f172a', border:'1px solid #334155', color:'#fff', outline:'none' },
  btnMain: { width:'100%', padding:'16px', borderRadius:'15px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', marginTop:'10px', boxShadow:'0 10px 15px -3px rgba(99, 102, 241, 0.4)' },
  navbar: { padding:'15px 25px', background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1e293b', sticky:'top' },
  navIn: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1000px', margin:'0 auto' },
  userSection: { display:'flex', gap:'12px', alignItems:'center' },
  avatar: { width:'38px', height:'38px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.2)', color:'#f43f5e', padding:'8px 15px', borderRadius:'10px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px' },
  container: { padding:'30px 20px', maxWidth:'1000px', margin:'0 auto' },
  tabGrid: { display:'flex', gap:'8px', background:'rgba(15, 23, 42, 0.9)', padding:'8px', borderRadius:'20px', marginBottom:'35px', border:'1px solid #1e293b' },
  tabBtn: { flex:1, padding:'12px 5px', border:'none', borderRadius:'14px', fontSize:'11px', fontWeight:'800', cursor:'pointer', transition:'0.3s' },
  listRow: { background:'rgba(30, 41, 59, 0.4)', padding:'20px', borderRadius:'24px', marginBottom:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.05)' },
  pillLec: { fontSize:'10px', background:'rgba(99, 102, 241, 0.15)', color:'#818cf8', padding:'4px 10px', borderRadius:'8px', fontWeight:'800' },
  pillPrac: { fontSize:'10px', background:'rgba(16, 185, 129, 0.15)', color:'#10b981', padding:'4px 10px', borderRadius:'8px', fontWeight:'800' },
  delBtn: { background:'none', border:'none', color:'#475569', cursor:'pointer' },
  logHeader: { display:'flex', gap:'15px', marginBottom:'25px' },
  searchBox: { flex:1, display:'flex', alignItems:'center', background:'#0f172a', padding:'0 15px', borderRadius:'15px', border:'1px solid #1e293b' },
  searchIn: { background:'none', border:'none', color:'#fff', padding:'14px', width:'100%', outline:'none' },
  masterBtn: { background:'linear-gradient(135deg, #10b981, #059669)', color:'#fff', padding:'0 20px', borderRadius:'15px', border:'none', fontWeight:'800', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
  manageGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'30px' },
  formCard: { background:'rgba(30, 41, 59, 0.5)', padding:'35px', borderRadius:'30px', border:'1px solid rgba(255,255,255,0.05)' },
  cardT: { margin:'0 0 20px 0', fontSize:'18px', color:'#fff' },
  uiIn: { width:'100%', padding:'15px', borderRadius:'14px', background:'#0f172a', border:'1px solid #334155', color:'#fff', marginBottom:'15px', boxSizing:'border-box' },
  uiBtn: { width:'100%', padding:'15px', borderRadius:'14px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  setupCard: { background:'rgba(30, 41, 59, 0.6)', padding:'40px', borderRadius:'35px', border:'1px solid rgba(255,255,255,0.1)', maxWidth:'450px', margin:'0 auto' },
  setupHeader: { display:'flex', alignItems:'center', gap:'12px', marginBottom:'25px' },
  label: { fontSize:'11px', color:'#94a3b8', fontWeight:'800', marginBottom:'8px', display:'block', letterSpacing:'1px' },
  typeRow: { display:'flex', gap:'12px', marginBottom:'15px' },
  typeBtn: { flex:1, padding:'14px', borderRadius:'15px', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer', border:'1px solid #334155', fontWeight:'bold' },
  stickyHead: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(30, 41, 59, 0.8)', backdropFilter:'blur(10px)', padding:'20px 25px', borderRadius:'24px', marginBottom:'30px', border:'1px solid #334155' },
  gridRoll: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(75px, 1fr))', gap:'15px', paddingBottom:'160px' },
  chip: { height:'75px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'22px', fontWeight:'900', fontSize:'18px', cursor:'pointer', transition:'0.2s' },
  footBtn: { position:'fixed', bottom:'35px', left:'25px', right:'25px', maxWidth:'950px', margin:'0 auto' },
  subLrg: { width:'100%', padding:'22px', borderRadius:'25px', border:'none', color:'#fff', fontWeight:'900', fontSize:'16px', boxShadow:'0 20px 40px -10px rgba(16, 185, 129, 0.4)' },
  statC: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'30px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)' },
  statsRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }
};
