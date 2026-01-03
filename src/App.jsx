import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, BarChart3, Fingerprint, Mail, AlertTriangle
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
    }).catch(e => console.error("Excel file loading error."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid ID or Password!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>SECURE INSTITUTIONAL PORTAL</p>
        <input id="u" placeholder="Faculty ID" style={styles.inputField} />
        <input id="p" type="password" placeholder="Password" style={styles.inputField} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <span><b>{user.name}</b> ({user.role.toUpperCase()})</span>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> LOGOUT</button>
        </div>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- FACULTY PANEL (WITH GPS PROTECTION) ---
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

  const startAttendance = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const targetSheet = wb.SheetNames.find(s => s.toLowerCase() === setup.cl.toLowerCase());
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[targetSheet]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    if (!navigator.geolocation) return alert("Your browser does not support GPS.");
    
    setIsSubmitting(true);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      
      if(dist > RADIUS_LIMIT) {
        setIsSubmitting(false);
        return alert("❌ ACCESS DENIED: You are outside the campus boundary. Attendance cannot be submitted.");
      }

      const { data: att, error: attErr } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      if(attErr) { setIsSubmitting(false); return alert("Database Error: " + attErr.message); }

      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl
      }));
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);

      alert("✅ Attendance Submitted Successfully!"); 
      setIsSubmitting(false); setActive(false); setMarked([]);
    }, (err) => {
      setIsSubmitting(false);
      // GPS Status Popups
      if (err.code === 1) alert("❌ GPS Permission Denied! Please allow location access in browser settings.");
      else if (err.code === 3) alert("❌ GPS Timeout! Please ensure your GPS is ON and you have a good signal.");
      else alert("❌ Location Error: " + err.message);
    }, geoOptions);
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2>Setup Lecture</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px'}}><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} /><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} /></div>
      <button style={styles.btnPrimary} onClick={startAttendance}>START ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={styles.stickyHeader}>
        <button onClick={()=>setActive(false)}><ArrowLeft/></button>
        <b>{setup.cl} | {setup.sub}</b>
      </div>
      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.floatingAction}>
        <button disabled={isSubmitting} onClick={submitAttendance} style={{...styles.submitLarge, background: isSubmitting?'#475569':'#10b981'}}>
          {isSubmitting ? "VERIFYING..." : `SUBMIT (${marked.length}/${students.length})`}
        </button>
      </div>
    </div>
  );
}

// --- HOD PANEL (RE-TESTED) ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], critical: [] });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending: false});
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f||[], logs: l||[], critical: c||[] });
  };
  useEffect(() => { loadData(); }, []);

  return (
    <div>
      <div style={styles.tabContainer}>
        <button onClick={()=>setTab('analytics')} style={{...styles.tabLink, background:tab==='analytics'?'#6366f1':''}}>ANALYTICS</button>
        <button onClick={()=>setTab('logs')} style={{...styles.tabLink, background:tab==='logs'?'#6366f1':''}}>LOGS</button>
      </div>
      {tab === 'analytics' ? (
        db.critical.map(c => (
          <div key={c.student_roll} style={styles.itemRow}>
            <span>Roll: {c.student_roll} ({c.class_name})</span>
            <span style={{color:'#f43f5e'}}>{c.absent_days} Days Absent</span>
          </div>
        ))
      ) : (
        db.logs.map(log => (
          <div key={log.id} style={styles.itemRow}>
            <span>{log.class} - {log.sub}</span>
            <span>{log.present}/{log.total}</span>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  loginPage: { height:'100vh', background:'#020617', display:'flex', justifyContent:'center', alignItems:'center' },
  glassCard: { background:'#1e293b', padding:'30px', borderRadius:'20px', width:'320px', textAlign:'center' },
  title: { color:'#fff', marginBottom:'5px' },
  badge: { color:'#6366f1', fontSize:'10px', fontWeight:'bold', marginBottom:'20px' },
  inputField: { width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'12px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'bold' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { padding:'15px', background:'#0f172a', display:'flex', justifyContent:'space-between', borderBottom:'1px solid #334155' },
  logoutBtn: { background:'none', border:'none', color:'#f43f5e', cursor:'pointer' },
  mainArea: { padding:'20px' },
  setupCard: { background:'#1e293b', padding:'20px', borderRadius:'15px', maxWidth:'400px', margin:'0 auto' },
  inputSml: { width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'8px', background:'#0f172a', color:'#fff', border:'1px solid #334155' },
  stickyHeader: { display:'flex', justifyContent:'space-between', background:'#1e293b', padding:'15px', borderRadius:'10px', marginBottom:'15px' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px', paddingBottom:'100px' },
  rollChip: { height:'60px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
  floatingAction: { position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', width:'90%' },
  submitLarge: { width:'100%', padding:'15px', borderRadius:'12px', color:'#fff', border:'none', fontWeight:'bold' },
  tabContainer: { display:'flex', gap:'10px', marginBottom:'20px' },
  tabLink: { flex:1, padding:'10px', borderRadius:'8px', border:'none', color:'#fff', background:'#1e293b' },
  itemRow: { background:'#1e293b', padding:'15px', borderRadius:'10px', marginBottom:'10px', display:'flex', justifyContent:'space-between' }
};
