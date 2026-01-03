import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, Users, Calendar, Download, UserPlus, PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// 📍 CAMPUS SETTINGS
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, login_hod, login_faculty, hod, faculty
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
      else alert("ID किंवा Password चुकीचा आहे!");
    }
  };

  // --- 🎨 DESIGNER: PREMIUM HOME & LOGIN UI ---
  if (view === 'login') return (
    <div style={landingStyles.heroWrapper}>
      <div style={landingStyles.glowOrb}></div>
      <div style={landingStyles.logoContainer}><img src="/logo.png" style={landingStyles.mainLogo} alt="Logo" /></div>
      <div style={landingStyles.heroText}>
        <p style={landingStyles.heroSubtitle}>Next-Gen Academic Management</p>
        <h1 style={landingStyles.heroTitle}>AMRIT ERP</h1>
        <p style={{color: '#64748b', marginBottom: '50px', fontSize: '16px'}}>Precision tracking, Real-time analytics, and seamless faculty integration.</p>
      </div>
      <div style={landingStyles.cardGrid}>
        <div style={landingStyles.actionCard} onClick={() => setView('login_hod')}>
          <div style={landingStyles.cardIcon}><Layers size={28}/></div>
          <div><h3>Administrative Portal</h3><p style={{fontSize:'13px', color:'#94a3b8'}}>For HODs and academic coordinators.</p></div>
          <ChevronRight style={{alignSelf: 'flex-end', color: '#475569'}}/>
        </div>
        <div style={landingStyles.actionCard} onClick={() => setView('login_faculty')}>
          <div style={landingStyles.cardIcon}><User size={28}/></div>
          <div><h3>Faculty Terminal</h3><p style={{fontSize:'13px', color:'#94a3b8'}}>Secure access for faculty members.</p></div>
          <ChevronRight style={{alignSelf: 'flex-end', color: '#475569'}}/>
        </div>
      </div>
      <div style={landingStyles.footerInfo}>© 2026 AMRIT INSTITUTIONAL TECHNOLOGY</div>
    </div>
  );

  if (view === 'login_hod' || view === 'login_faculty') return (
    <div style={loginFormStyles.formOverlay}>
      <button style={loginFormStyles.backBtn} onClick={() => setView('login')}><ArrowLeft size={18}/> BACK</button>
      <div style={loginFormStyles.glassBox}>
        <div style={{...landingStyles.cardIcon, margin: '0 auto 20px'}}>{view === 'login_hod' ? <Layers size={24}/> : <User size={24}/>}</div>
        <h2 style={{fontSize: '24px', marginBottom: '30px'}}>{view === 'login_hod' ? 'Admin Access' : 'Faculty Access'}</h2>
        <div style={loginFormStyles.inputGroup}>
          <label style={loginFormStyles.inputLabel}>Identification</label>
          <User size={18} style={{position:'absolute', left:'15px', top:'41px', color:'#475569'}}/><input id="u" placeholder="Enter ID" style={loginFormStyles.premiumInput} />
        </div>
        <div style={loginFormStyles.inputGroup}>
          <label style={loginFormStyles.inputLabel}>Passcode</label>
          <Fingerprint size={18} style={{position:'absolute', left:'15px', top:'41px', color:'#475569'}}/><input id="p" type="password" placeholder="••••••••" style={loginFormStyles.premiumInput} />
        </div>
        <button style={{...landingStyles.actionBtn, marginTop: '10px'}} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>VERIFY & ENTER</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <main style={styles.container}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
      </main>
    </div>
  );
}

// --- 🏛️ HOD PANEL (INTEGRATED DESIGN) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  const today = new Date().toLocaleDateString('en-GB');
  const studentsToday = db.logs.filter(l => l.time_str === today).reduce((a, b) => a + (b.present || 0), 0);
  const classCount = [...new Set(db.maps.map(m => m.class_name))].length;
  const filteredLogs = db.logs.filter(l => l.faculty.toLowerCase().includes(searchTerm.toLowerCase()) || l.class.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={hStyles.wrapper}>
      <div style={hStyles.header}><h2>HOD Console</h2><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      <div style={hStyles.tabs}>
        {['dashboard','master','faculty','mapping'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...hStyles.tabBtn, background: tab===t?'#6366f1':'rgba(255,255,255,0.05)'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={hStyles.fade}>
          <div style={hStyles.statsGrid}>
            <div style={hStyles.statCard}><Users color="#6366f1"/><h3>{studentsToday}</h3><p>Present Today</p></div>
            <div style={hStyles.statCard}><Layers color="#818cf8"/><h3>{classCount}</h3><p>Active Classes</p></div>
            <div style={hStyles.statCard}><User color="#10b981"/><h3>{db.facs.length}</h3><p>Faculties</p></div>
            <div style={hStyles.statCard}><Calendar color="#f43f5e"/><h3>{db.logs.filter(l=>l.time_str===today).length}</h3><p>Today Sessions</p></div>
          </div>
          <h4 style={hStyles.label}>RECENT ACTIVITY</h4>
          {[...new Set(db.logs.map(l => l.time_str))].slice(0, 5).map(date => (
            <div key={date} style={hStyles.row}><span>{date}</span><b>{db.logs.filter(l => l.time_str === date).length} Sessions</b></div>
          ))}
        </div>
      )}

      {tab === 'master' && (
        <div style={hStyles.fade}>
          <div style={hStyles.searchBox}><Search size={18}/><input placeholder="Search..." style={hStyles.searchIn} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <button onClick={() => { const ws = XLSX.utils.json_to_sheet(filteredLogs); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Master"); XLSX.writeFile(wb, "Amrit_Master_Report.xlsx"); }} style={hStyles.actionBtn}><Download size={18}/> EXPORT MASTER SHEET</button>
          {filteredLogs.map(log => (<div key={log.id} style={hStyles.recordCard}><div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div><div style={{color:'#10b981'}}><b>{log.present}/{log.total}</b></div></div>))}
        </div>
      )}

      {tab === 'faculty' && (
        <div style={hStyles.fade}>
          <div style={hStyles.formCard}>
            <h4>Add New Staff</h4>
            <input placeholder="Full Name" style={hStyles.input} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Employee ID" style={hStyles.input} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="System Password" type="password" style={hStyles.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>REGISTER FACULTY</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={hStyles.recordCard}><div><b>{f.name}</b><br/><small>ID: {f.id}</small></div><button onClick={async()=>{if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={{color:'#f43f5e', border:'none', background:'none'}}><Trash2 size={18}/></button></div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div style={hStyles.fade}>
          <div style={hStyles.formCard}>
            <h4>Subject Mapping</h4>
            <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option value={f.id}>{f.name}</option>)}</select>
            <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...hStyles.actionBtn, background:'#10b981'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>CONFIRM ASSIGNMENT</button>
          </div>
          {db.maps.map(m => (<div key={m.id} style={hStyles.row}><span><b>{m.class_name}</b> - {m.subject_name}</span><button onClick={async()=>{await supabase.from('assignments').delete().eq('id',m.id); loadData();}} style={{color:'#f43f5e', border:'none', background:'none'}}><Trash2 size={16}/></button></div>))}
        </div>
      )}
    </div>
  );
}

// --- 👨‍🏫 FACULTY PANEL (STABLE LOGIC + 3D DESIGN) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("सर्व माहिती भरा!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ कॅम्पसच्या बाहेरून हजेरी घेता येणार नाही!"); }
      const { data: att } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, duration: `${setup.start} - ${setup.end}`, present: marked.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ यशस्वीरित्या सबमिट!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS परमिशन हवी!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}><div style={fStyles.userPlate}><div style={fStyles.miniAv}>{user.name[0]}</div><div><h4 style={{margin:0}}>Prof. {user.name}</h4><small>Faculty Portal</small></div></div><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      <div style={fStyles.section}><label style={fStyles.label}>SELECT CLASS</label><div style={fStyles.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...fStyles.tile, borderColor: setup.cl===c?'#6366f1':'#1e293b', background: setup.cl===c?'rgba(99,102,241,0.1)':'#0f172a'}}><LayoutGrid size={20}/><span style={{fontWeight:'700'}}>{c}</span></div>))}</div></div>
      {setup.cl && (<div><label style={fStyles.label}>SELECT SUBJECT</label><div style={fStyles.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}><BookOpen size={16}/> {j.subject_name}</div>))}</div>
      <label style={fStyles.label}>LECTURE TIME</label><div style={fStyles.timeRow}><div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={fStyles.timeInput}/></div><span>to</span><div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={fStyles.timeInput}/></div></div>
      <label style={fStyles.label}>MODE</label><div style={fStyles.toggleWrap}><button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.toggleBtn, background: setup.ty==='Theory'?'#fff':'transparent', color: setup.ty==='Theory'?'#000':'#fff'}}>Theory</button><button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.toggleBtn, background: setup.ty==='Practical'?'#fff':'transparent', color: setup.ty==='Practical'?'#000':'#fff'}}>Practical</button></div></div>)}
      <div style={fStyles.bottomAction}><button onClick={launch} style={fStyles.launchBtn}>START SESSION</button></div>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}><button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button><div><h3 style={{margin:0}}>{setup.cl}</h3><small>{setup.sub}</small></div><div style={fStyles.statsBadge}>{marked.length}/{students.length}</div></div>
      <div style={fStyles.rollArea}>{students.map(s => (<div key={s.id} onClick={() => { if(window.navigator.vibrate) window.navigator.vibrate(15); setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}} style={{...fStyles.rollChip, background: marked.includes(s.id)?'linear-gradient(135deg, #6366f1, #4f46e5)':'#1e293b'}}><span style={{fontSize:'10px', opacity:0.5}}>ROLL</span><span style={{fontSize:'24px', fontWeight:'900'}}>{s.id}</span>{marked.includes(s.id) && <CheckCircle2 size={16} style={fStyles.checkIcon}/>}</div>))}</div>
      <div style={fStyles.bottomAction}><button disabled={loading} onClick={submit} style={fStyles.submitBtn}>{loading ? "Verifying GPS..." : `SUBMIT ATTENDANCE`}</button></div>
    </div>
  );
}

// --- 💎 STYLES (DEVELOPER + DESIGNER COLLAB) ---
const landingStyles = {
  heroWrapper: { minHeight: '100vh', background: 'radial-gradient(circle at 10% 20%, #0a0f1d 0%, #020617 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#fff', position: 'relative' },
  glowOrb: { position: 'absolute', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(100px)', borderRadius: '50%', top: '-100px', right: '-100px' },
  logoContainer: { marginBottom: '30px' },
  mainLogo: { width: '100px', height: '100px', filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))' },
  heroText: { textAlign: 'center' },
  heroTitle: { fontSize: '48px', fontWeight: '900', margin: '0 0 10px 0', background: 'linear-gradient(to bottom, #fff 40%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroSubtitle: { fontSize: '14px', color: '#818cf8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '40px' },
  cardGrid: { display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px', width: '100%', maxWidth: '800px' },
  actionCard: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '25px', borderRadius: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '15px', transition: '0.3s' },
  cardIcon: { width: '50px', height: '50px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' },
  actionBtn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  footerInfo: { position: 'absolute', bottom: '20px', fontSize: '10px', color: '#475569' }
};

const loginFormStyles = {
  formOverlay: { minHeight: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  glassBox: { width: '100%', maxWidth: '400px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' },
  backBtn: { position: 'absolute', top: '30px', left: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px', borderRadius: '12px', cursor: 'pointer' },
  inputGroup: { position: 'relative', marginBottom: '20px', textAlign: 'left' },
  inputLabel: { fontSize: '11px', color: '#475569', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
  premiumInput: { width: '100%', padding: '15px 15px 15px 45px', background: 'rgba(2, 6, 23, 0.5)', border: '1px solid #1e293b', borderRadius: '14px', color: '#fff', boxSizing: 'border-box' }
};

const hStyles = {
  wrapper: { padding: '25px 20px', background: 'radial-gradient(circle at top right, #1e1b4b, #020617)', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
  tabs: { display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '25px', scrollbarWidth: 'none' },
  tabBtn: { padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px', fontWeight: '700' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' },
  statCard: { background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', backdropFilter: 'blur(16px)' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '18px', background: 'rgba(15, 23, 42, 0.6)', bor
