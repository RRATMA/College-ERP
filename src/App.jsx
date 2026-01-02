import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, 
  Download, ShieldCheck, User, Search,
  LayoutDashboard, BookOpen, Fingerprint, GraduationCap, Settings, 
  MapPin, CheckCircle, ChevronRight, Users, BarChart3, Plus, Mail, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.01; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelClasses(wb.SheetNames);
    }).catch(e => console.error("Excel mapping failed. File not found in public folder."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("ID किंवा पासवर्ड चुकीचा आहे!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'55px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>ERP SYSTEM</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn}/><input id="u" placeholder="ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn}/><input id="p" type="password" placeholder="Pass" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div style={styles.userCircle}>{user.name[0]}</div>
          <div className="hide-mobile"><b>{user.name}</b><br/><small>{user.role.toUpperCase()}</small></div>
        </div>
        <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> EXIT</button>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </main>
      <style>{`
        @media (max-width: 600px) { .hide-mobile { display: none !important; } .roll-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [data, setData] = useState({ facs: [], logs: [], critical: [] });
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setData({ facs: f || [], logs: l || [], critical: c || [] });
  };
  useEffect(() => { loadAll(); }, []);

  const notifyParent = (roll, className) => {
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', { student_roll: roll, class_name: className }, 'YOUR_KEY')
      .then(() => alert("Email Sent!"))
      .catch(() => alert("Email Error!"));
  };

  return (
    <div>
      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'absentees', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn}/><input style={styles.inputField} placeholder="Search..." onChange={e=>setSearch(e.target.value)}/></div>
          {data.logs.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase())).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} | {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.duration} | {log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'faculties' && data.facs.map(f => {
        const theory = data.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
        const practical = data.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
        return (
          <div key={f.id} style={styles.itemRow}>
            <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
            <div style={{display:'flex', gap:'8px'}}>
              <span style={styles.miniStat}>Lec: {theory}</span>
              <span style={styles.miniStat}>Prac: {practical}</span>
            </div>
          </div>
        );
      })}

      {tab === 'absentees' && data.critical.map(c => (
        <div key={c.student_roll} style={styles.itemRow}>
          <div><b>Roll No: {c.student_roll}</b><br/><small>3 Days Absent in {c.class_name}</small></div>
          <button onClick={() => notifyParent(c.student_roll, c.class_name)} style={styles.emailBtn}><Mail size={16}/> NOTIFY</button>
        </div>
      ))}
    </div>
  );
}

// --- FACULTY PANEL ---
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
    if(!setup.cl || !setup.start || !setup.end) return alert("सर्व माहिती भरा!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const saveFinal = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) return alert("बाहेर आहात!");
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl
      }));
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);

      alert("Saved!"); setActive(false); setMarked([]);
    }, () => alert("GPS Error!"));
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2 style={{textAlign:'center'}}><Clock size={24}/> Setup Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
        <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} />
        <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} />
      </div>
      <button style={styles.btnPrimary} onClick={startSession}>OPEN ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={styles.backBtn}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl}</b><br/><small>{setup.start}-{setup.end}</small></div>
      </div>
      <div className="roll-grid" style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.floatingAction}><button onClick={saveFinal} style={styles.submitLarge}>SUBMIT ({marked.length})</button></div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', padding:'40px 30px', borderRadius:'28px', width:'100%', maxWidth:'380px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' },
  logoWrap: { background:'#fff', display:'inline-flex', padding:'15px', borderRadius:'20px', marginBottom:'20px' },
  title: { color:'#fff', margin:0, fontSize:'32px' },
  badge: { color:'#6366f1', fontSize:'11px', fontWeight:'bold', letterSpacing:'2px', marginBottom:'35px' },
  inputGroup: { position:'relative', marginBottom:'15px', width:'100%' },
  iconIn: { position:'absolute', left:'15px', top:'15px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'14px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'16px', borderRadius:'14px', background:'linear-gradient(135deg, #6366f1, #a855f7)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', padding:'12px 5%', display:'flex', justifyContent:'space-between', borderBottom:'1px solid #334155' },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', cursor:'pointer' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'15px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'12px', cursor:'pointer', fontSize:'11px' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px 20px', borderRadius:'18px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  miniStat: { background:'#1e293b', padding:'5px 10px', borderRadius:'8px', fontSize:'11px', color:'#818cf8' },
  emailBtn: { background:'#10b981', color:'#fff', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', fontSize:'11px' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', maxWidth:'450px', margin:'40px auto' },
  inputSml: { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'12px', boxSizing:'border-box' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'120px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'20px', background:'rgba(15, 23, 42, 0.95)', borderTop:'1px solid #334155', display:'flex', justifyContent:'center', boxSizing:'border-box' },
  submitLarge: { width:'100%', maxWidth:'500px', height:'55px', background:'#10b981', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold' },
  backBtn: { background:'rgba(255,255,255,0.05)', border:'none', color:'#fff', padding:'10px', borderRadius:'50%' }
};
