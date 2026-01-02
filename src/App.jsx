import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, Download, Search, 
  User, Users, BarChart3, Plus, RefreshCw, BookOpen, Fingerprint,
  MapPin, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- कॉलेजचे अचूक GPS को-ऑर्डिनेट्स ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const ALLOWED_RADIUS_METERS = 300; // ३०० मीटरची मर्यादा

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [loading, setLoading] = useState(false);

  // १. एक्सेल फाईलमधून क्लासेस (Sheet Names) फेच करणे
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        const res = await fetch('/students_list.xlsx');
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelSheets(wb.SheetNames);
      } catch (e) {
        console.error("Excel File Not Found in Public Folder!");
      }
    };
    fetchSheets();
  }, []);

  const handleLogin = async (u, p) => {
    setLoading(true);
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data, error } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) {
        setUser({ ...data, role: 'faculty' });
        setView('faculty');
      } else {
        alert("ID किंवा पासवर्ड चुकला आहे!");
      }
    }
    setLoading(false);
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'55px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>SECURE ATTENDANCE</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="Admin/Faculty ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>
          {loading ? <Loader2 className="spin" /> : "LOG IN"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={styles.userCircle}>{user.name[0]}</div>
            <b className="hide-mobile">{user.name}</b>
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

// --- GPS अंतर मोजण्यासाठी 'Haversine' फंक्शन ---
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // पृथ्वीची त्रिज्या मीटर्समध्ये
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // अंतर मीटर्समध्ये मिळेल
}

// --- फॅकल्टी पॅनेल (With Verified Location & Data Fetching) ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // १. फॅकल्टीचे स्वतःचे विषय फेच करणे
  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase.from('assignments').select('*').eq('fac_id', user.id);
      setMyJobs(data || []);
    };
    fetchJobs();
  }, [user.id]);

  // २. क्लास निवडल्यावर एक्सेल मधून रोल नंबर फेच करणे
  const handleStart = async () => {
    if(!setup.cl || !setup.start) return alert("सर्व माहिती भरा!");
    
    setLoading(true);
    const res = await fetch('/students_list.xlsx');
    const ab = await res.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
    const list = sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id);
    
    setStudents(list);
    setActive(true);
    setLoading(false);
  };

  // ३. लोकेशन तपासून हजेरी सबमिट करणे
  const handleSubmit = () => {
    setIsSubmitting(true);
    if (!navigator.geolocation) return alert("GPS सपोर्ट करत नाही!");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = getDistance(pos.coords.latitude, pos.coords.longitude, CAMPUS_LAT, CAMPUS_LON);
      
      if (dist > ALLOWED_RADIUS_METERS) {
        alert(`तुम्ही कॉलेजपासून ${Math.round(dist)}m लांब आहात. हजेरी फक्त कॅम्पसमध्येच घेता येईल!`);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);

      if (!error) {
        alert("हजेरी यशस्वीरित्या नोंदवली गेली!");
        setActive(false); setMarked([]);
      }
      setIsSubmitting(false);
    }, (err) => {
      alert("लोकेशन एक्सेस नाकारला! कृपया GPS चालू करा.");
      setIsSubmitting(false);
    });
  };

  return (
    <div style={styles.fadeAnim}>
      {!active ? (
        <div style={styles.setupCard}>
          <h2 style={{textAlign:'center'}}><MapPin color="#6366f1"/> Session Start</h2>
          <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class निवडा</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
          <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject निवडा</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
          <select style={styles.inputSml} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
          <div style={{display:'flex', gap:'10px'}}><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} /><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} /></div>
          <button style={styles.btnPrimary} onClick={handleStart}>हजेरी सुरू करा</button>
        </div>
      ) : (
        <>
          <div style={styles.stickyHeader}>
            <button onClick={()=>setActive(false)} style={styles.backBtn}><ArrowLeft/></button>
            <div style={{textAlign:'right'}}><b>{setup.cl}</b><br/><small>{setup.ty} | {setup.start}-{setup.end}</small></div>
          </div>
          <div className="roll-grid" style={styles.rollGrid}>
            {students.map(s => (
              <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
                   style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
            ))}
          </div>
          <div style={styles.floatingAction}>
            <button onClick={handleSubmit} disabled={isSubmitting} style={styles.submitLarge}>
              {isSubmitting ? "लोकेशन तपासत आहे..." : `सबमिट करा (${marked.length})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('logs');
  const [db, setDb] = useState({ facs: [], logs: [] });
  const [search, setSearch] = useState('');

  const load = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setDb({ facs: f || [], logs: l || [] });
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <div style={styles.fadeAnim}>
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn} /><input style={styles.inputField} placeholder="Search teacher, class, sub..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} ({log.type}) • {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.duration}</small></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faculties' && db.facs.map(f => {
         const tCnt = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
         const pCnt = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
         return (
           <div key={f.id} style={styles.itemRow}>
             <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
             <div style={{display:'flex', gap:'8px'}}><div style={styles.countTag}>T: {tCnt}</div><div style={{...styles.countTag, color:'#a855f7'}}>P: {pCnt}</div></div>
           </div>
         );
      })}
    </div>
  );
}

// --- STYLES (UI Preserved & Responsive) ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(12px)', padding:'40px 30px', borderRadius:'28px', width:'100%', maxWidth:'380px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' },
  logoWrap: { background:'#fff', display:'inline-flex', padding:'15px', borderRadius:'20px', marginBottom:'20px' },
  title: { color:'#fff', margin:0, fontSize:'32px' },
  badge: { color:'#6366f1', fontSize:'11px', fontWeight:'900', letterSpacing:'2px', marginBottom:'30px' },
  inputGroup: { position:'relative', marginBottom:'15px', width:'100%' },
  iconIn: { position:'absolute', left:'15px', top:'15px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'14px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'16px', borderRadius:'14px', background:'linear-gradient(135deg, #6366f1, #a855f7)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', padding:'12px 5%', borderBottom:'1px solid #334155', position:'sticky', top:0, zIndex:100 },
  navContent: { maxWidth:'1000px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'15px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px 20px', borderRadius:'18px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.03)' },
  countTag: { background:'#1e293b', padding:'4px 10px', borderRadius:'8px', fontSize:'12px', color:'#10b981', fontWeight:'bold' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', maxWidth:'450px', margin:'40px auto' },
  inputSml: { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'12px', boxSizing:'border-box' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'120px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'20px', background:'rgba(15, 23, 42, 0.95)', borderTop:'1px solid #334155', display:'flex', justifyContent:'center', boxSizing:'border-box' },
  submitLarge: { width:'100%', maxWidth:'500px', height:'55px', background:'#10b981', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold' },
  stickyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'#1e293b', padding:'15px', borderRadius:'15px' },
  backBtn: { background:'none', border:'none', color:'#fff', cursor:'pointer' },
  fadeAnim: { animation: 'fadeIn 0.5s ease' }
};
