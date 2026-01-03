import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, BarChart3, Fingerprint, Mail, AlertTriangle, 
  Clock, BookOpen, Layers, FileSpreadsheet, Menu, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- CONFIG ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.log("Init..."));
    
    return () => window.removeEventListener('resize', handleResize);
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

  // --- LOGIN PAGE (HYPER MODERN) ---
  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={{...styles.glassCard, width: isMobile ? '90%' : '380px'}}>
        <div style={styles.logoBox}>
          <img src="/logo.png" style={styles.mainLogo} alt="Institution Logo" />
        </div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>NEXT-GEN ATTENDANCE SYSTEM</p>
        
        <div style={styles.inputBox}>
          <User size={18} style={styles.inIcon}/><input id="u" placeholder="Admin/Faculty ID" style={styles.inputF}/>
        </div>
        <div style={styles.inputBox}>
          <Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/>
        </div>
        
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>
          LOG IN SECURELY
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      {/* Responsive Navbar */}
      <nav style={styles.navbar}>
        <div style={styles.navIn}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>{user.name[0]}</div>
            {!isMobile && <div><b>{user.name}</b><br/><small style={{color:'#818cf8'}}>{user.role.toUpperCase()}</small></div>}
          </div>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            {isMobile && <b style={{fontSize:'12px'}}>{user.name}</b>}
            <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/></button>
          </div>
        </div>
      </nav>

      <main style={{...styles.container, padding: isMobile ? '15px' : '30px'}}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} isMobile={isMobile} /> : <FacultyPanel user={user} isMobile={isMobile} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (FLEXIBLE GRID) ---
function HODPanel({ excelSheets, isMobile }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], critical: [] });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  return (
    <div style={{animation: 'fadeIn 0.5s ease'}}>
      {/* Flexible Tabs */}
      <div style={{...styles.tabGrid, overflowX: isMobile ? 'auto' : 'unset'}}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab===t?'#6366f1':'rgba(15,23,42,0.5)', minWidth: isMobile ? '100px' : 'auto'}}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'faculties' && (
        <div style={styles.gridSystem}>
          {db.facs.map(f => (
            <div key={f.id} style={styles.facultyCard}>
               <div style={{display:'flex', justifyContent:'space-between'}}>
                 <b>{f.name}</b>
                 <Trash2 size={16} color="#f43f5e" style={{cursor:'pointer'}}/>
               </div>
               <div style={{marginTop:'10px', display:'flex', gap:'8px'}}>
                 <span style={styles.pills}>Lec: {db.logs.filter(l=>l.faculty===f.name && l.type==='Theory').length}</span>
                 <span style={{...styles.pills, background:'#10b98122', color:'#10b981'}}>Prac: {db.logs.filter(l=>l.faculty===f.name && l.type==='Practical').length}</span>
               </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
          <div style={{display:'flex', gap:'10px', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
             <div style={styles.searchBox}><Search size={18}/><input placeholder="Search..." style={styles.searchIn} onChange={e=>setSearch(e.target.value.toLowerCase())}/></div>
             <button onClick={() => {}} style={{...styles.btnMain, width: isMobile ? '100%' : '200px', margin:0}}><FileSpreadsheet size={18}/> MASTER SHEET</button>
          </div>
          {db.logs.filter(l=>(l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.listRow}>
               <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
               <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (MOBILE OPTIMIZED) ---
function FacultyPanel({ user, isMobile }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [marked, setMarked] = useState([]);

  if (!active) return (
    <div style={{...styles.setupCard, width: isMobile ? '100%' : '450px'}}>
      <h3 style={{marginBottom:'20px', textAlign:'center'}}>New Session</h3>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class</option><option value="TY-CO">TY-CO</option></select>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option><option value="ST">ST</option></select>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...styles.typeBtn, background:setup.ty==='Theory'?'#6366f1':'#0f172a'}}>Theory</button>
        <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...styles.typeBtn, background:setup.ty==='Practical'?'#6366f1':'#0f172a'}}>Practical</button>
      </div>
      <button style={styles.btnMain} onClick={() => setActive(true)}>START ATTENDANCE</button>
    </div>
  );

  return (
    <div>
      <div style={styles.stickyHead}>
        <ArrowLeft onClick={()=>setActive(false)}/>
        <b>{setup.cl} | {setup.ty}</b>
        <span>{marked.length} Selected</span>
      </div>
      <div style={{...styles.gridRoll, gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(80px, 1fr))'}}>
        {[...Array(60)].map((_, i) => (
          <div key={i} onClick={() => setMarked(p=>p.includes(i)?p.filter(x=>x!==i):[...p, i])}
               style={{...styles.chip, background: marked.includes(i) ? '#6366f1' : 'rgba(30,41,59,0.5)'}}>{i+1}</div>
        ))}
      </div>
      <div style={styles.footBtn}>
        <button style={styles.subLrg}>SUBMIT ATTENDANCE</button>
      </div>
    </div>
  );
}

// --- FLEXIBLE STYLES (PURE CSS-IN-JS) ---
const styles = {
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#020617', backgroundImage:'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #020617 100%)' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(15px)', padding:'40px', borderRadius:'30px', border:'1px solid rgba(255,255,255,0.1)', textAlign:'center', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
  logoBox: { width:'80px', height:'80px', background:'#000', borderRadius:'20px', margin:'0 auto 20px', border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center' },
  mainLogo: { width:'60px', height:'60px', objectFit:'contain' },
  title: { fontSize:'26px', fontWeight:'900', color:'#fff', margin:0, letterSpacing:'-1px' },
  badge: { fontSize:'10px', color:'#818cf8', fontWeight:'800', marginBottom:'30px', letterSpacing:'1px' },
  inputBox: { position:'relative', marginBottom:'15px' },
  inIcon: { position:'absolute', left:'15px', top:'14px', color:'#94a3b8' },
  inputF: { width:'100%', padding:'14px 15px 14px 45px', borderRadius:'12px', background:'#0f172a', border:'1px solid #334155', color:'#fff', boxSizing:'border-box', outline:'none' },
  btnMain: { width:'100%', padding:'16px', borderRadius:'12px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  appWrap: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { padding:'15px 20px', background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1e293b', sticky:'top', zIndex:100 },
  navIn: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1200px', margin:'0 auto' },
  avatar: { width:'35px', height:'35px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'10px', borderRadius:'10px', cursor:'pointer' },
  container: { maxWidth:'1200px', margin:'0 auto' },
  tabGrid: { display:'flex', gap:'10px', marginBottom:'25px', paddingBottom:'5px' },
  tabBtn: { padding:'12px 20px', border:'none', borderRadius:'12px', color:'#fff', fontWeight:'700', fontSize:'12px', cursor:'pointer', transition:'0.3s' },
  gridSystem: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' },
  facultyCard: { background:'rgba(30, 41, 59, 0.5)', padding:'20px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.05)' },
  pills: { fontSize:'10px', background:'rgba(99, 102, 241, 0.15)', color:'#818cf8', padding:'5px 10px', borderRadius:'8px', fontWeight:'800' },
  searchBox: { flex:1, display:'flex', alignItems:'center', background:'#0f172a', padding:'0 15px', borderRadius:'12px', border:'1px solid #1e293b' },
  searchIn: { background:'none', border:'none', color:'#fff', padding:'14px', width:'100%', outline:'none' },
  listRow: { background:'rgba(30, 41, 59, 0.3)', padding:'15px 20px', borderRadius:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', border:'1px solid rgba(255,255,255,0.1)', margin:'0 auto' },
  uiIn: { width:'100%', padding:'15px', borderRadius:'12px', background:'#0f172a', border:'1px solid #334155', color:'#fff', marginBottom:'15px', boxSizing:'border-box' },
  typeBtn: { flex:1, padding:'14px', borderRadius:'12px', border:'1px solid #334155', color:'#fff', fontWeight:'bold', cursor:'pointer' },
  stickyHead: { position:'sticky', top:'10px', background:'rgba(30, 41, 59, 0.9)', padding:'15px 20px', borderRadius:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', backdropFilter:'blur(10px)' },
  gridRoll: { display:'grid', gap:'10px', paddingBottom:'120px' },
  chip: { height:'60px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', fontWeight:'800', fontSize:'16px', border:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' },
  footBtn: { position:'fixed', bottom:'20px', left:'20px', right:'20px', maxWidth:'1200px', margin:'0 auto' },
  subLrg: { width:'100%', padding:'20px', borderRadius:'18px', background:'#10b981', color:'#fff', border:'none', fontWeight:'900', boxShadow:'0 10px 30px rgba(16, 185, 129, 0.3)' }
};
