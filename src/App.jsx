import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Download, Search, 
  User, Users, BookOpen, Plus, RefreshCw, Activity, Mail, AlertTriangle, MapPin, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Global Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.005; // ~500 meters

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    // Load class names from the Excel file in public folder
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel file missing in public folder."));
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
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'50px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>ADVANCED CAMPUS MANAGEMENT</p>
        <input id="u" placeholder="Employee/Admin ID" style={styles.inputField} />
        <input id="p" type="password" placeholder="Secure Password" style={styles.inputField} />
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
            <div className="hide-mobile"><b>{user.name}</b><br/><small>{user.role.toUpperCase()}</small></div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> EXIT</button>
        </div>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .roll-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
        }
      `}</style>
    </div>
  );
}

// --- HOD PANEL: COMPLETE ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [] });
  };
  useEffect(() => { loadData(); }, []);

  const downloadMasterSheet = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceData");
    XLSX.writeFile(wb, "Amrit_ERP_Master_Report.xlsx");
  };

  const sendAbsentEmail = (id, email) => {
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', { student_id: id, to_email: email }, 'YOUR_PUBLIC_KEY')
      .then(() => alert("Email Sent!"))
      .catch(() => alert("Email Configuration Error"));
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
          <div style={styles.statCard}><Users color="#6366f1"/> <div><h3>{db.facs.length}</h3><p>Faculties</p></div></div>
          <div style={styles.statCard}><Activity color="#10b981"/> <div><h3>{db.logs.length}</h3><p>Total Sessions</p></div></div>
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn} /><input style={styles.inputField} placeholder="Search Logs..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          <button onClick={downloadMasterSheet} style={styles.downloadBtn}><Download size={16}/> DOWNLOAD MASTER EXCEL</button>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} | {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'faculties' && db.facs.map(f => {
        const tCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
        const pCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
        return (
          <div key={f.id} style={styles.itemRow}>
            <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
            <div style={{display:'flex', gap:'8px'}}>
              <div style={styles.countBadge}>Lec: {tCount}</div>
              <div style={styles.countBadge}>Prac: {pCount}</div>
              <button onClick={async ()=>{if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={18}/></button>
            </div>
          </div>
        );
      })}

      {tab === 'absentees' && (
        <div>
          <h3><AlertTriangle color="#f59e0b"/> Critical Absentee Alerts</h3>
          <div style={styles.itemRow}>
            <div><b>Roll No: 102 (Demo)</b><br/><small>Status: 3 Days Consecutive Absent</small></div>
            <button onClick={() => sendAbsentEmail('102', 'parent@example.com')} style={styles.emailBtn}><Mail size={16}/> NOTIFY</button>
          </div>
        </div>
      )}

      {tab === 'manage' && (
        <div className="grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3>Add Teacher</h3>
            <input placeholder="Name" style={styles.inputSml} value={form.n} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} value={form.i} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Pass" style={styles.inputSml} value={form.p} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("Faculty Added!");}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h3>Link Workload</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Mapped!");}}>LINK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: COMPLETE ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const startAttendance = () => {
    if(!setup.cl || !setup.start) return alert("Fill all details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(d > RADIUS_LIMIT) return alert("Outside Geofence!");

      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Attendance Saved Successfully!"); setActive(false); setMarked([]);
    }, () => alert("GPS Required"));
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2 style={{textAlign:'center'}}><MapPin color="#6366f1"/> Start Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
        <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} />
        <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} />
      </div>
      <button style={styles.btnPrimary} onClick={startAttendance}>START ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={styles.stickyHeader}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'#fff'}}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl}</b><br/><small>{setup.start}-{setup.end}</small></div>
      </div>
      <div className="roll-grid" style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.floatingAction}><button onClick={submitAttendance} style={styles.submitLarge}>SUBMIT ({marked.length})</button></div>
    </div>
  );
}

const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', padding:'30px', borderRadius:'20px', width:'100%', maxWidth:'360px', textAlign:'center', border:'1px solid #334155' },
  title: { color:'#fff', fontSize:'24px', fontWeight:'bold', margin:0 },
  badge: { color:'#6366f1', fontSize:'10px', marginBottom:'20px', letterSpacing:'1px' },
  inputField: { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'10px', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'15px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'#0f172a', padding:'10px 20px', borderBottom:'1px solid #334155' },
  navContent: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1000px', margin:'0 auto' },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'10px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'10px' },
  dashboardGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' },
  statCard: { background:'rgba(30, 41, 59, 0.5)', padding:'20px', borderRadius:'15px', display:'flex', alignItems:'center', gap:'15px' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  countBadge: { background:'#0f172a', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', color:'#10b981' },
  formCard: { background:'rgba(30, 41, 59, 0.4)', padding:'20px', borderRadius:'15px', border:'1px solid #334155' },
  inputSml: { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'10px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#6366f1', color:'#fff', fontWeight:'bold' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', maxWidth:'400px', margin:'0 auto' },
  stickyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'#1e293b', padding:'15px', borderRadius:'15px' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', cursor:'pointer', fontWeight:'bold' },
  floatingAction: { position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', width:'90%', maxWidth:'400px' },
  submitLarge: { width:'100%', height:'55px', background:'#10b981', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', boxShadow:'0 10px 20px rgba(0,0,0,0.3)' },
  downloadBtn: { width:'100%', background:'#10b981', color:'white', padding:'12px', borderRadius:'10px', border:'none', marginBottom:'15px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
  emailBtn: { background:'#10b981', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer' }
};
