import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, Users, Calendar, Download, UserPlus, PlusCircle, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// 📍 CAMPUS SETTINGS
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
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

  // --- 🎨 PREMIUM LOGIN DESIGN (DESKTOP OPTIMIZED) ---
  if (view === 'login') return (
    <div style={dStyles.heroWrapper}>
      <div style={dStyles.bgGlow}></div>
      <div style={dStyles.mainContainer}>
        {/* Left Section: Branding */}
        {!isMobile && (
          <div style={dStyles.leftSection}>
            <div style={dStyles.logoShield}><img src="/logo.png" style={dStyles.mainLogo} alt="Logo" /></div>
            <p style={dStyles.heroSubtitle}>Next-Gen Academic ERP</p>
            <h1 style={dStyles.heroTitle}>AMRIT <br/>ERP SYSTEM</h1>
            <p style={dStyles.heroDesc}>Secure, centralized attendance and faculty management portal for Amrit Institutions.</p>
          </div>
        )}

        {/* Right Section: Login Card */}
        <div style={dStyles.rightSection}>
          <div style={dStyles.glassCard}>
            {isMobile && <div style={{...dStyles.logoShield, margin:'0 auto 20px'}}><img src="/logo.png" style={{width:'40px'}} alt="Logo" /></div>}
            <h2 style={{fontSize:'24px', fontWeight:'900', marginBottom:'5px'}}>Welcome Back</h2>
            <p style={{fontSize:'12px', color:'#64748b', marginBottom:'30px'}}>Please enter your credentials to access portal</p>
            
            <div style={dStyles.inputBox}><User size={18} style={dStyles.inIcon}/><input id="u" placeholder="User ID" style={dStyles.inputF}/></div>
            <div style={dStyles.inputBox}><Fingerprint size={18} style={dStyles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={dStyles.inputF}/></div>
            
            <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={dStyles.btnMain}>
              SIGN IN <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      </div>
      <div style={dStyles.footer}>© 2026 AMRIT ERP • VERSION 2.0</div>
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

// --- 🏛️ HOD PANEL (ORIGINAL LOGIC + NEW UI) ---
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
  const filteredLogs = db.logs.filter(l => l.faculty.toLowerCase().includes(searchTerm.toLowerCase()) || l.class.toLowerCase().includes(searchTerm.toLowerCase()) || l.sub.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={hStyles.wrapper}>
      <div style={hStyles.header}>
        <div><h2 style={{margin:0}}>HOD Console</h2><small style={{color:'#6366f1'}}>Amrit IT Department</small></div>
        <button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button>
      </div>
      
      <div style={hStyles.tabs}>
        {['dashboard','master','faculty','mapping'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...hStyles.tabBtn, background: tab===t?'#6366f1':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={hStyles.fade}>
          <div style={hStyles.statsGrid}>
            <div style={hStyles.statCard}><Users color="#6366f1"/><h3>{studentsToday}</h3><p>Present Today</p></div>
            <div style={hStyles.statCard}><Layers color="#818cf8"/><h3>{classCount}</h3><p>Classes</p></div>
            <div style={hStyles.statCard}><User color="#10b981"/><h3>{db.facs.length}</h3><p>Faculties</p></div>
            <div style={hStyles.statCard}><Calendar color="#f43f5e"/><h3>{db.logs.filter(l=>l.time_str===today).length}</h3><p>Today Lectures</p></div>
          </div>
          <h4 style={hStyles.label}>DAY-WISE LECTURE COUNT</h4>
          {[...new Set(db.logs.map(l => l.time_str))].slice(0, 5).map(date => (
            <div key={date} style={hStyles.row}><span>{date}</span><b>{db.logs.filter(l => l.time_str === date).length} Lectures</b></div>
          ))}
        </div>
      )}

      {tab === 'master' && (
        <div style={hStyles.fade}>
          <div style={hStyles.searchBox}><Search size={18} color="#475569"/><input placeholder="Search faculty, class, sub..." style={hStyles.searchIn} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <button onClick={() => { const ws = XLSX.utils.json_to_sheet(filteredLogs); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Master"); XLSX.writeFile(wb, "Master_Report.xlsx"); }} style={hStyles.actionBtn}><Download size={18}/> DOWNLOAD EXCEL</button>
          {filteredLogs.map(log => (<div key={log.id} style={hStyles.recordCard}><div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div><div style={{color:'#10b981'}}><b>{log.present}/{log.total}</b></div></div>))}
        </div>
      )}

      {tab === 'faculty' && (
        <div style={hStyles.fade}>
          <div style={hStyles.formCard}>
            <h4 style={{marginTop:0}}><UserPlus size={18}/> New Faculty</h4>
            <input placeholder="Name" style={hStyles.input} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Employee ID" style={hStyles.input} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" type="password" style={hStyles.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Faculty Added!");}}>REGISTER</button>
          </div>
          {db.facs.map(f => {
            const lCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
            const pCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
            return ( <div key={f.id} style={hStyles.recordCard}><div><b>{f.name}</b><br/><small>ID: {f.id}</small></div><div style={{textAlign:'right'}}><span style={{fontSize:'12px', color:'#94a3b8'}}>Lec:{lCount} Prac:{pCount}</span><br/><button onClick={async()=>{if(window.confirm("Delete Faculty?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={{color:'#f43f5e', border:'none', background:'none', marginTop:'5px'}}><Trash2 size={16}/></button></div></div> );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div style={hStyles.fade}>
          <div style={hStyles.formCard}>
            <h4 style={{marginTop:0}}><PlusCircle size={18}/> Mapping Sub/Class</h4>
            <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option value={f.id}>{f.name}</option>)}</select>
            <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...hStyles.actionBtn, background:'#10b981'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData(); alert("Mapped!");}}>CONFIRM ASSIGNMENT</button>
          </div>
          {db.maps.map(m => (<div key={m.id} style={hStyles.row}><span><b>{m.class_name}</b> - {m.subject_name}</span><button onClick={async()=>{await supabase.from('assignments').delete().eq('id',m.id); loadData();}} style={{color:'#f43f5e', border:'none', background:'none'}}><Trash2 size={16}/></button></div>))}
        </div>
      )}
    </div>
  );
}

// --- 👨‍🏫 FACULTY PANEL (ALL FEATURES PRESERVED) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("सर्व माहिती भरा (Time/Class)!");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ कॅम्पस बाहेरून अटेंडन्स घेता येणार नाही!"); }
      const { data: att } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, duration: `${setup.start} - ${setup.end}`, present: marked.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ अटेंडन्स यशस्वीरित्या सबमिट झाली!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error! लोकेशन ऑन करा."); });
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

// --- 💎 STYLES (MATCHING YOUR FEATURES) ---
const dStyles = {
  heroWrapper: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', fontFamily:'sans-serif' },
  bgGlow: { position:'absolute', width:'100%', height:'100%', background:'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%)', zIndex:0 },
  mainContainer: { width:'100%', maxWidth:'1100px', display:'flex', alignItems:'center', gap:'80px', zIndex:1, padding:'20px' },
  leftSection: { flex:1.2, color:'#fff' },
  rightSection: { flex:1, width:'100%', maxWidth:'400px' },
  logoShield: { width:'80px', height:'80px', background:'rgba(255,255,255,0.03)', borderRadius:'22px', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'30px' },
  mainLogo: { width:'50px' },
  heroTitle: { fontSize:'64px', fontWeight:'900', margin:'0 0 20px 0', lineHeight:'1', letterSpacing:'-2px' },
  heroSubtitle: { color:'#6366f1', letterSpacing:'3px', fontWeight:'800', fontSize:'12px', textTransform:'uppercase', marginBottom:'10px' },
  heroDesc: { color:'#64748b', fontSize:'18px', lineHeight:'1.6' },
  glassCard: { background:'rgba(15, 23, 42, 0.7)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.08)', padding:'45px 40px', borderRadius:'35px', textAlign:'center', color:'#fff', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
  inputBox: { position:'relative', marginBottom:'15px' },
  inputF: { width:'100%', padding:'16px 16px 16px 50px', borderRadius:'16px', background:'rgba(2, 6, 23, 0.5)', border:'1px solid #1e293b', color:'#fff', boxSizing:'border-box', outline:'none', transition:'0.3s' },
  inIcon: { position:'absolute', left:'18px', top:'16px', color:'#475569' },
  btnMain: { width:'100%', padding:'18px', borderRadius:'16px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', cursor:'pointer', boxShadow:'0 10px 20px rgba(99,102,241,0.3)' },
  footer: { position:'absolute', bottom:'30px', color:'#1e293b', fontSize:'11px', fontWeight:'bold', letterSpacing:'1px' }
};

const hStyles = {
  wrapper: { padding: '30px 20px 100px', maxWidth:'1200px', margin:'0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom:'1px solid #1e293b', paddingBottom:'20px' },
  tabs: { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '30px', scrollbarWidth:'none' },
  tabBtn: { padding: '12px 20px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor:'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom:'30px' },
  statCard: { background: '#0f172a', padding: '25px 15px', borderRadius: '24px', border: '1px solid #1e293b', textAlign: 'center' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '18px', background: '#0f172a', borderRadius: '18px', marginBottom: '10px', border: '1px solid #1e293b' },
  recordCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '20px', borderRadius: '20px', marginBottom: '12px', border: '1px solid #1e293b' },
  searchBox: { display: 'flex', alignItems: 'center', background: '#0f172a', padding: '15px', borderRadius: '18px', gap: '12px', marginBottom: '15px', border:'1px solid #1e293b' },
  searchIn: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize:'14px' },
  actionBtn: { width: '100%', padding: '18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', cursor:'pointer' },
  formCard: { background: '#0f172a', padding: '25px', borderRadius: '24px', border: '1px solid #1e293b', marginBottom: '30px' },
  input: { width: '100%', padding: '14px', background: '#020617', border: '1px solid #334155', borderRadius: '12px', color: '#fff', marginBottom: '12px', boxSizing: 'border-box', outline:'none' },
  label: { fontSize: '11px', c
