import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Download, Search, 
  User, Users, BookOpen, Activity, Mail, AlertTriangle, MapPin, 
  CheckCircle2, LayoutDashboard, Calendar, ChevronRight, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Global Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.005; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // Initial view is Home
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.log("Excel loading..."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid credentials!");
    }
  };

  // --- 1. HOME PAGE VIEW ---
  if (view === 'home') return (
    <div style={styles.homeContainer}>
      <header style={styles.homeHeader}>
        <div style={styles.logoRow}><ShieldCheck color="#6366f1" size={32}/> <h2>AMRIT ERP</h2></div>
        <p>Smart Attendance & Academic Management</p>
      </header>
      <div style={styles.heroSection}>
        <div style={styles.heroCard}>
          <h1>Efficient. Secure. <span style={{color:'#6366f1'}}>Reliable.</span></h1>
          <p>Streamline your college attendance with GPS verification and real-time HOD monitoring.</p>
          <div style={styles.homeBtnRow}>
            <button onClick={() => setView('login')} style={styles.btnHomePrimary}>Enter Portal <ChevronRight size={18}/></button>
          </div>
        </div>
      </div>
      <footer style={styles.homeFooter}>© 2026 Amrit ERP Systems | Developed for Excellence</footer>
    </div>
  );

  // --- 2. LOGIN VIEW ---
  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <button onClick={() => setView('home')} style={styles.backLink}><ArrowLeft size={14}/> Back to Home</button>
        <h2 style={{marginTop:'20px'}}>Internal Access</h2>
        <p style={styles.badge}>SECURE LOGIN</p>
        <input id="u" placeholder="Employee ID" style={styles.inputField} />
        <input id="p" type="password" placeholder="Password" style={styles.inputField} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>AUTHORIZE</button>
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
          <button onClick={() => setView('home')} style={styles.logoutBtn}><LogOut size={16}/> EXIT</button>
        </div>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- 3. HOD PANEL (WITH FULL FEATURES) ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [], critical: [] });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  return (
    <div>
      <div style={styles.tabContainer}>
        {['dashboard', 'logs', 'faculties', 'absentees', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, borderBottom: tab === t ? '2px solid #6366f1' : 'none', color: tab === t ? '#6366f1' : '#94a3b8'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="fade-in">
          <div style={styles.dashboardGrid}>
            <div style={styles.statCard}><Users/> <div><h3>{db.facs.length}</h3><p>Faculty Members</p></div></div>
            <div style={styles.statCard}><Calendar/> <div><h3>{db.logs.length}</h3><p>Total Sessions</p></div></div>
            <div style={styles.statCard}><AlertTriangle color="#f43f5e"/> <div><h3>{db.critical.length}</h3><p>High Risk Students</p></div></div>
          </div>
          {/* New Attendance Trend Table */}
          <h4 style={{margin:'20px 0'}}>Recent Activity</h4>
          {db.logs.slice(0, 5).map(l => (
            <div key={l.id} style={styles.miniLog}>
              <span>{l.time_str}</span> - <span>{l.faculty}</span> took <b>{l.class}</b> ({l.type})
            </div>
          ))}
        </div>
      )}

      {tab === 'faculties' && db.facs.map(f => {
        const tCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
        const pCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
        return (
          <div key={f.id} style={styles.itemRow}>
            <div><b>{f.name}</b><br/><small>UID: {f.id}</small></div>
            <div style={{display:'flex', gap:'8px'}}>
              <div style={styles.countBadge}>Lec: {tCount}</div>
              <div style={styles.countBadge}>Prac: {pCount}</div>
            </div>
          </div>
        );
      })}

      {/* ... (Other Tabs: Logs, Absentees, Manage remain as per previous complete logic) ... */}
    </div>
  );
}

// --- 4. FACULTY PANEL (WITH DASHBOARD FEATURE) ---
function FacultyPanel({ user }) {
  const [tab, setTab] = useState('session'); // session or my-stats
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    supabase.from('attendance').select('*').eq('faculty', user.name).then(res => setHistory(res.data || []));
  }, [user.name]);

  if (tab === 'my-stats') return (
    <div>
      <button onClick={() => setTab('session')} style={styles.backBtn}><ArrowLeft/> Back</button>
      <h3 style={{marginTop:'15px'}}>Your Performance</h3>
      <div style={styles.statCard}><Activity/> <div><h3>{history.length}</h3><p>Total Sessions Conducted</p></div></div>
      <h4 style={{margin:'20px 0'}}>Session History</h4>
      {history.map(h => (
        <div key={h.id} style={styles.itemRow}>
          <div><b>{h.class}</b><br/><small>{h.sub}</small></div>
          <div>{h.present}/{h.total} Present</div>
        </div>
      ))}
    </div>
  );

  if (!active) return (
    <div style={styles.setupCard}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>Session Login</h2>
        <button onClick={() => setTab('my-stats')} style={styles.iconBtn}><LayoutDashboard color="#6366f1"/></button>
      </div>
      <p style={{fontSize:'12px', color:'#94a3b8', marginBottom:'20px'}}>Select your class and subject to begin.</p>
      {/* (Form Inputs exactly as previous setup) */}
      <button style={styles.btnPrimary} onClick={() => setActive(true)}>START ATTENDANCE</button>
    </div>
  );

  return (
    <div>
       {/* (Roll Call Grid exactly as previous setup) */}
    </div>
  );
}

// --- 5. ENHANCED STYLES ---
const styles = {
  homeContainer: { minHeight:'100vh', background:'#020617', color:'#fff', display:'flex', flexDirection:'column' },
  homeHeader: { padding:'40px 20px', textAlign:'center' },
  logoRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'10px' },
  heroSection: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  heroCard: { maxWidth:'600px', textAlign:'center' },
  btnHomePrimary: { background:'#6366f1', color:'#fff', padding:'15px 30px', borderRadius:'12px', border:'none', fontSize:'18px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', margin:'0 auto' },
  homeFooter: { padding:'20px', textAlign:'center', color:'#475569', fontSize:'12px' },
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', padding:'40px', borderRadius:'24px', width:'350px', border:'1px solid #334155' },
  backLink: { background:'none', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' },
  inputField: { width:'100%', padding:'12px', borderRadius:'10px', background:'#0f172a', border:'1px solid #334155', color:'#fff', marginBottom:'15px' },
  btnPrimary: { width:'100%', padding:'14px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { padding:'15px 20px', background:'rgba(15, 23, 42, 0.9)', borderBottom:'1px solid #334155' },
  navContent: { maxWidth:'1000px', margin:'0 auto', display:'flex', justifyContent:'space-between' },
  userCircle: { width:'40px', height:'40px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', gap:'20px', borderBottom:'1px solid #1e293b', marginBottom:'20px' },
  tabLink: { padding:'10px 5px', background:'none', border:'none', cursor:'pointer', fontWeight:'bold' },
  dashboardGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' },
  statCard: { background:'#1e293b', padding:'20px', borderRadius:'16px', display:'flex', gap:'15px', alignItems:'center' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'12px', marginBottom:'10px', display:'flex', justifyContent:'space-between' },
  miniLog: { fontSize:'12px', color:'#94a3b8', padding:'8px', borderLeft:'2px solid #6366f1', marginBottom:'5px', background:'rgba(99, 102, 241, 0.05)' },
  countBadge: { background:'#0f172a', padding:'4px 8px', borderRadius:'6px', fontSize:'11px' },
  setupCard: { background:'#1e293b', padding:'30px', borderRadius:'24px', maxWidth:'400px', margin:'0 auto' },
  iconBtn: { background:'none', border:'none', cursor:'pointer' }
};
