import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, BarChart3, Plus, Fingerprint, Mail, AlertTriangle, MapPin, 
  CheckCircle2, Monitor, Calendar, Clock, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- CONFIGURATION ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008; // ~80 Meters

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Logo or Excel missing in public folder."));
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
      <div style={styles.glassCard}>
        {/* युजरचा स्वतःचा लोगो इथे दिसेल */}
        <div style={styles.logoContainer}>
            <img src="/logo.png" style={styles.mainLogo} alt="Institution Logo" />
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
            <div><b>{user.name}</b><br/><small style={{color:'#6366f1'}}>{user.role.toUpperCase()}</small></div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={18}/> LOGOUT</button>
        </div>
      </nav>
      <main style={styles.container}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- HOD PANEL: ALL FEATURES RESTORED ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [], critical: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', id: '', pass: '', fId: '', cls: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  const triggerEmail = (roll, cls) => {
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===cls.toLowerCase())]);
      const st = sheet.find(s => String(s['ROLL NO'] || s['Roll No']) === roll);
      if (st?.Email) {
        emailjs.send('service_7s8u8qc', 'template_z0f0l1v', { to_email: st.Email, student_roll: roll, class_name: cls }, 'l-T3MhUjIqj9_U8p')
        .then(() => alert("Email Alert Sent to Parent!"));
      }
    });
  };

  return (
    <div>
      <div style={styles.tabGrid}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab===t?'#6366f1':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'analytics' && (
        <div style={styles.fade}>
          <div style={styles.statsRow}>
            <div style={styles.statC}><Users color="#10b981"/><h3>{db.facs.length}</h3><p>Faculties</p></div>
            <div style={styles.statC}><AlertTriangle color="#f43f5e"/><h3>{db.critical.length}</h3><p>Critical</p></div>
          </div>
          <h4 style={{margin:'20px 0'}}>⚠️ Attendance Alert (3+ Days Absent)</h4>
          {db.critical.map(c => (
            <div key={c.student_roll} style={styles.listRow}>
              <span><b>{c.student_roll}</b> - {c.class_name}</span>
              <button onClick={() => triggerEmail(c.student_roll, c.class_name)} style={styles.mailBtn}><Mail size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div style={styles.fade}>
          <div style={styles.searchWrap}><Search size={18}/><input style={styles.searchIn} placeholder="Search Logs..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          <button onClick={() => {
             const ws = XLSX.utils.json_to_sheet(db.logs);
             const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
             XLSX.writeFile(wb, "Master_Attendance.xlsx");
          }} style={styles.excelBtn}><Download size={18}/> DOWNLOAD MASTER EXCEL</button>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.listRow}>
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div>
              <div style={{color:'#10b981', fontWeight:'900'}}>{log.present}/{log.total}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faculties' && db.facs.map(f => (
        <div key={f.id} style={styles.listRow}>
          <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
          <Trash2 color="#f43f5e" size={18} onClick={async() => { if(window.confirm("Delete Faculty?")){await supabase.from('faculties').delete().eq('id', f.id); loadData(); }}}/>
        </div>
      ))}

      {tab === 'manage' && (
        <div style={styles.manageGrid}>
          <div style={styles.formCard}>
            <h5>Add New Faculty</h5>
            <input placeholder="Name" style={styles.uiIn} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="ID" style={styles.uiIn} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" style={styles.uiIn} type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={styles.uiBtn} onClick={async() => { await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Success!"); }}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h5>Map Subject</h5>
            <select style={styles.uiIn} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.uiIn} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.uiIn} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...styles.uiBtn, background:'#10b981'}} onClick={async() => { await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapped!"); }}>ASSIGN</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: ALL FEATURES RESTORED ---
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

  const launchRollCall = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class and Subject!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    setIsSubmitting(true);
    const options = { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) {
        setIsSubmitting(false);
        return alert("❌ GEOLOCATION DENIED: You must be inside the college campus to submit attendance.");
      }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl
      }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);

      alert("✅ Attendance Recorded Successfully!"); 
      setIsSubmitting(false); setActive(false); setMarked([]);
    }, (err) => {
      setIsSubmitting(false);
      if(err.code === 1) alert("❌ GPS Permission required.");
      else if(err.code === 3) alert("❌ GPS Offline/Timeout. Please turn on GPS.");
      else alert("Location Error: " + err.message);
    }, options);
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h3 style={{marginBottom:'20px'}}><Clock size={20}/> Lecture Setup</h3>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px'}}>
        <input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, start:e.target.value})}/>
        <input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, end:e.target.value})}/>
      </div>
      <button style={styles.btnMain} onClick={launchRollCall}>PROCEED TO ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={styles.stickyHead}>
        <button onClick={()=>setActive(false)} style={styles.backB}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl} | {setup.sub}</b><br/><small>{marked.length}/{students.length} Present</small></div>
      </div>
      <div style={styles.gridRoll}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.chip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b', border: marked.includes(s.id)?'2px solid #818cf8':'1px solid #334155'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.footBtn}>
        <button disabled={isSubmitting} onClick={submitAttendance} style={{...styles.subLrg, background: isSubmitting?'#475569':'#10b981'}}>
          {isSubmitting ? "VERIFYING LOCATION..." : `SUBMIT ATTENDANCE (${marked.length})`}
        </button>
      </div>
    </div>
  );
}

// --- FULL UI STYLES ---
const styles = {
  loginPage: { height:'100vh', background:'#020617', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' },
  glassCard: { background:'#1e293b', padding:'40px', borderRadius:'32px', width:'100%', maxWidth:'360px', textAlign:'center', border:'1px solid #334155', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
  logoContainer: { width:'90px', height:'90px', background:'#0f172a', borderRadius:'22px', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #334155' },
  mainLogo: { width:'70px', height:'70px', objectFit:'contain' },
  title: { color:'#fff', fontSize:'26px', fontWeight:'900', letterSpacing:'-1px', margin:0 },
  badge: { color:'#6366f1', fontSize:'10px', fontWeight:'800', letterSpacing:'1px', marginBottom:'30px' },
  inputBox: { position:'relative', marginBottom:'15px' },
  inIcon: { position:'absolute', left:'15px', top:'14px', color:'#94a3b8' },
  inputF: { width:'100%', padding:'14px 15px 14px 45px', borderRadius:'14px', background:'#0f172a', border:'1px solid #334155', color:'#fff', boxSizing:'border-box', outline:'none' },
  btnMain: { width:'100%', padding:'16px', borderRadius:'14px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', marginTop:'10px' },
  appWrap: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { padding:'15px 25px', background:'#0f172a', borderBottom:'1px solid #334155' },
  navIn: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1000px', margin:'0 auto' },
  userSection: { display:'flex', gap:'12px', alignItems:'center' },
  avatar: { width:'36px', height:'36px', background:'#6366f1', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'#1e293b', border:'none', color:'#f43f5e', padding:'8px 12px', borderRadius:'10px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px' },
  container: { padding:'25px', maxWidth:'1000px', margin:'0 auto' },
  tabGrid: { display:'flex', gap:'5px', background:'#0f172a', padding:'6px', borderRadius:'14px', marginBottom:'25px' },
  tabBtn: { flex:1, padding:'12px 2px', border:'none', borderRadius:'10px', color:'#fff', fontSize:'10px', fontWeight:'900', cursor:'pointer' },
  statsRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' },
  statC: { background:'#1e293b', padding:'25px', borderRadius:'24px', textAlign:'center', border:'1px solid #334155' },
  listRow: { background:'#0f172a', padding:'18px', borderRadius:'18px', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #1e293b' },
  mailBtn: { background:'#10b981', border:'none', color:'#fff', padding:'10px', borderRadius:'10px' },
  excelBtn: { width:'100%', padding:'14px', background:'#10b981', color:'#fff', borderRadius:'12px', border:'none', fontWeight:'800', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  searchWrap: { background:'#1e293b', display:'flex', alignItems:'center', padding:'0 18px', borderRadius:'14px', marginBottom:'18px', border:'1px solid #334155' },
  searchIn: { background:'none', border:'none', color:'#fff', padding:'14px', width:'100%', outline:'none' },
  manageGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'25px' },
  formCard: { background:'#1e293b', padding:'30px', borderRadius:'26px', border:'1px solid #334155' },
  uiIn: { width:'100%', padding:'14px', borderRadius:'12px', background:'#0f172a', border:'1px solid #334155', color:'#fff', marginBottom:'12px', boxSizing:'border-box' },
  uiBtn: { width:'100%', padding:'14px', borderRadius:'12px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold' },
  setupCard: { background:'#1e293b', padding:'35px', borderRadius:'28px', border:'1px solid #334155', maxWidth:'420px', margin:'0 auto' },
  stickyHead: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#1e293b', padding:'18px 22px', borderRadius:'20px', marginBottom:'25px', border:'1px solid #334155' },
  backB: { background:'none', border:'none', color:'#fff' },
  gridRoll: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'12px', paddingBottom:'140px' },
  chip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'20px', fontWeight:'900', fontSize:'17px', cursor:'pointer' },
  footBtn: { position:'fixed', bottom:'30px', left:'25px', right:'25px', maxWidth:'950px', margin:'0 auto' },
  subLrg: { width:'100%', padding:'22px', borderRadius:'24px', border:'none', color:'#fff', fontWeight:'900', fontSize:'16px', boxShadow:'0 15px 30px -5px rgba(0,0,0,0.5)' }
};
