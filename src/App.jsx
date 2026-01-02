import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Download, Search, 
  User, Users, BookOpen, Activity, Mail, AlertTriangle, MapPin, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.005; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel not found in public folder."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>INSTITUTIONAL MANAGEMENT SYSTEM</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn}/><input id="u" placeholder="User ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Clock size={18} style={styles.iconIn}/><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div style={styles.userCircle}>{user.name[0]}</div>
            <div><b>{user.name}</b><br/><small style={{color:'#818cf8'}}>{user.role.toUpperCase()}</small></div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> EXIT</button>
        </div>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (DASHBOARD + LOGS + COUNTS + EMAIL) ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [], critical: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    // Fetching critical absentees from the SQL View we created
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [], critical: c || [] });
  };
  
  useEffect(() => { loadData(); }, []);

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceLogs");
    XLSX.writeFile(wb, "Amrit_ERP_Report.xlsx");
  };

  const notifyParent = (roll, className) => {
    const params = { to_name: "Parent", student_roll: roll, class_name: className, message: "Your ward is absent for 3 consecutive days." };
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', params, 'YOUR_PUBLIC_KEY')
      .then(() => alert(`Email sent for Roll No: ${roll}`))
      .catch(() => alert("Email Error! Check EmailJS Keys."));
  };

  return (
    <div>
      <div style={styles.tabContainer}>
        {['dashboard', 'logs', 'faculties', 'absentees', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={styles.dashboardGrid}>
          <div style={styles.statCard}><Users color="#6366f1"/> <div><h3>{db.facs.length}</h3><p>Total Faculty</p></div></div>
          <div style={styles.statCard}><Activity color="#10b981"/> <div><h3>{db.logs.length}</h3><p>Total Sessions</p></div></div>
          <div style={styles.statCard}><AlertTriangle color="#f43f5e"/> <div><h3>{db.critical.length}</h3><p>Critical Absentees</p></div></div>
        </div>
      )}

      {tab === 'faculties' && db.facs.map(f => {
        const theory = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
        const practical = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
        return (
          <div key={f.id} style={styles.itemRow}>
            <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
            <div style={{display:'flex', gap:'10px'}}>
              <span style={styles.countBadge}>Lec: {theory}</span>
              <span style={styles.countBadge}>Prac: {practical}</span>
              <span style={{...styles.countBadge, color:'#10b981'}}>Total: {theory+practical}</span>
            </div>
          </div>
        );
      })}

      {tab === 'absentees' && (
        <div>
          <h3 style={{marginBottom:'15px'}}>3-Day Consecutive Absent Alert</h3>
          {db.critical.length === 0 ? <p>No critical cases found.</p> : db.critical.map(c => (
            <div key={c.student_roll} style={styles.itemRow}>
              <div><b>Roll No: {c.student_roll}</b><br/><small>Class: {c.class_name} | Days: {c.consecutive_days}</small></div>
              <button onClick={() => notifyParent(c.student_roll, c.class_name)} style={styles.emailBtn}><Mail size={16}/> NOTIFY PARENT</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn}/><input style={styles.inputField} placeholder="Search anything..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          <button onClick={downloadExcel} style={styles.downloadBtn}><Download size={16}/> EXPORT MASTER SHEET</button>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} ({log.type}) | {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'manage' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3>Register Faculty</h3>
            <input placeholder="Name" style={styles.inputSml} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("Faculty Added!");}}>ADD</button>
          </div>
          <div style={styles.formCard}>
            <h3>Workload Mapping</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Mapped!");}}>LINK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (GPS + EXCEL ROLL CALL) ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const startSession = () => {
    if(!setup.cl) return alert("Select Class");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(x => x.id));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(d > RADIUS_LIMIT) return alert("You are outside the campus!");

      const { data: attendanceData } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      // --- AUTOMATIC ABSENTEE RECORDING ---
      const absentStudents = students.filter(s => !marked.includes(s.id));
      const absenteeEntries = absentStudents.map(s => ({
        attendance_id: attendanceData.id,
        student_roll: s.id,
        class_name: setup.cl
      }));
      
      if(absenteeEntries.length > 0) {
        await supabase.from('absentee_records').insert(absenteeEntries);
      }

      alert("Attendance Submitted & Absentees Tracked!");
      setActive(false); setMarked([]);
    }, () => alert("Enable GPS to submit."));
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2><MapPin color="#6366f1"/> Setup Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <select style={styles.inputSml} value={setup.ty} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
      <button style={styles.btnPrimary} onClick={startSession}>OPEN ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={styles.stickyHeader}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'#fff'}}><ArrowLeft/></button>
        <div><b>{setup.cl}</b> | {setup.sub}</div>
      </div>
      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
        ))}
      </div>
      <button onClick={submitAttendance} style={styles.submitLarge}>SUBMIT ATTENDANCE ({marked.length})</button>
    </div>
  );
}

// --- STYLES ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', padding:'30px', borderRadius:'20px', width:'100%', maxWidth:'360px', textAlign:'center', border:'1px solid #334155' },
  title: { color:'#fff', fontSize:'26px', fontWeight:'bold', margin:0 },
  badge: { color:'#6366f1', fontSize:'10px', marginBottom:'20px' },
  inputGroup: { position:'relative', marginBottom:'15px' },
  iconIn: { position:'absolute', left:'12px', top:'12px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'12px 12px 12px 40px', borderRadius:'10px', background:'#0f172a', color:'#fff', border:'1px solid #334155', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'15px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', padding:'10px 20px', borderBottom:'1px solid #334155', sticky:'top' },
  navContent: { maxWidth:'1000px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'12px', marginBottom:'20px', overflowX:'auto' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'11px', minWidth:'80px' },
  dashboardGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' },
  statCard: { background:'rgba(30, 41, 59, 0.5)', padding:'20px', borderRadius:'15px', display:'flex', alignItems:'center', gap:'15px', border:'1px solid rgba(255,255,255,0.05)' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  countBadge: { background:'#0f172a', padding:'5px 10px', borderRadius:'8px', fontSize:'12px', fontWeight:'bold', color:'#818cf8', border:'1px solid #334155' },
  emailBtn: { background:'#10b981', color:'#fff', border:'none', padding:'8px 12px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', fontSize:'12px' },
  formCard: { background:'rgba(30, 41, 59, 0.4)', padding:'20px', borderRadius:'15px', border:'1px solid #334155' },
  inputSml: { width:'100%', padding:'10px', borderRadius:'8px', background:'#0f172a', color:'#fff', border:'1px solid #334155', marginBottom:'10px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'8px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'20px', maxWidth:'400px', margin:'0 auto' },
  stickyHeader: { display:'flex', gap:'15px', alignItems:'center', background:'#1e293b', padding:'15px', borderRadius:'15px', marginBottom:'20px' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', marginBottom:'100px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', cursor:'pointer', fontWeight:'bold' },
  submitLarge: { position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'400px', height:'55px', background:'#10b981', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold', boxShadow:'0 10px 25px rgba(0,0,0,0.4)' },
  downloadBtn: { width:'100%', background:'#10b981', color:'#fff', padding:'12px', borderRadius:'10px', border:'none', marginBottom:'15px', fontWeight:'bold', cursor:'pointer' }
};
