import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, Fingerprint, Mail, AlertTriangle, 
  Clock, BookOpen, Layers, FileSpreadsheet, MapPin, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- CORE CONFIG (DO NOT CHANGE) ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
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
      else alert("Authentication Failed!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={{...styles.glassCard, width: isMobile ? '88%' : '400px', animation: 'slideUp 0.8s ease'}}>
        <div style={styles.logoBox}>
            <img src="/logo.png" style={styles.mainLogo} alt="Logo" />
        </div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>NEXT-GEN ATTENDANCE SYSTEM</p>
        
        <div style={styles.inputBox}>
          <User size={18} style={styles.inIcon}/><input id="u" placeholder="User ID" style={styles.inputF}/>
        </div>
        <div style={styles.inputBox}>
          <Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/>
        </div>
        
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>
          ACCESS PORTAL <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <nav style={styles.navbar}>
        <div style={styles.navIn}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>{user.name[0]}</div>
            {!isMobile && <div><b style={{letterSpacing:'0.5px'}}>{user.name}</b><br/><small style={{color:'#818cf8', fontWeight:'800', fontSize:'10px'}}>{user.role.toUpperCase()}</small></div>}
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> {!isMobile && 'EXIT'}</button>
        </div>
      </nav>
      <main style={{...styles.container, padding: isMobile ? '15px' : '40px 20px'}}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} isMobile={isMobile} /> : <FacultyPanel user={user} isMobile={isMobile} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (RE-STYLED) ---
function HODPanel({ excelSheets, isMobile }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], critical: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', id: '', pass: '', fId: '', cls: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Master_Records.xlsx");
  };

  return (
    <div style={{animation: 'fadeIn 0.6s ease'}}>
      <div style={{...styles.tabGrid, overflowX: isMobile ? 'auto' : 'hidden'}}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab===t?'#6366f1':'transparent', color: tab===t?'#fff':'#94a3b8'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'faculties' && (
        <div style={styles.gridSystem}>
          {db.facs.map(f => (
            <div key={f.id} style={styles.facultyCard}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div><b style={{fontSize:'16px'}}>{f.name}</b><br/><small style={{color:'#64748b'}}>ID: {f.id}</small></div>
                <button style={styles.delBtn} onClick={async() => {if(confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}}><Trash2 size={16}/></button>
              </div>
              <div style={{marginTop:'15px', display:'flex', gap:'8px'}}>
                <span style={styles.pills}>The: {db.logs.filter(l=>l.faculty===f.name && l.type==='Theory').length}</span>
                <span style={{...styles.pills, background:'#10b98115', color:'#10b981'}}>Pra: {db.logs.filter(l=>l.faculty===f.name && l.type==='Practical').length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div style={{display:'flex', gap:'12px', marginBottom:'25px', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
            <div style={styles.searchBox}><Search size={18} color="#475569"/><input placeholder="Search records..." style={styles.searchIn} onChange={e=>setSearch(e.target.value.toLowerCase())}/></div>
            <button onClick={downloadMaster} style={styles.masterBtn}><FileSpreadsheet size={18}/> MASTER SHEET</button>
          </div>
          {db.logs.filter(l=>(l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.listRow}>
              <div><b style={{color:'#e2e8f0'}}>{log.class} | {log.sub}</b><br/><small style={{color:'#64748b'}}>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px', color:'#475569'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'manage' && (
        <div style={styles.gridSystem}>
          <div style={styles.formCard}>
            <h3 style={styles.cardT}>Add Faculty</h3>
            <input placeholder="Full Name" style={styles.uiIn} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Unique ID" style={styles.uiIn} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" style={styles.uiIn} type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={styles.btnMain} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Success!");}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h3 style={styles.cardT}>Subject Mapping</h3>
            <select style={styles.uiIn} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.uiIn} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.uiIn} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...styles.btnMain, background:'#10b981'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapped!");}}>ASSIGN SUBJECT</button>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div style={styles.gridSystem}>
          <div style={styles.statC}><Users color="#6366f1" size={32}/><h3>{db.facs.length}</h3><p>Staff Members</p></div>
          <div style={styles.statC}><AlertTriangle color="#f43f5e" size={32}/><h3>{db.critical.length}</h3><p>Attendance Alerts</p></div>
          {db.critical.map(c => (
            <div key={c.student_roll} style={{...styles.listRow, gridColumn: isMobile ? 'auto' : 'span 2', borderLeft:'4px solid #f43f5e'}}>
              <span><b>{c.student_roll}</b> • {c.class_name}</span>
              <button style={styles.mailBtn}><Mail size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (RE-STYLED) ---
function FacultyPanel({ user, isMobile }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Complete the setup first!");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ PERMISSION DENIED: OUTSIDE CAMPUS"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Attendance Recorded Successfully!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={{...styles.formCard, width: isMobile ? '100%' : '480px', margin:'0 auto'}}>
      <h2 style={{textAlign:'center', marginBottom:'30px', fontWeight:'900'}}>Session Setup</h2>
      <label style={styles.label}>TARGET CLASS</label>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select...</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>SUBJECT</label>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select...</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <label style={styles.label}>SESSION MODE</label>
      <div style={styles.typeRow}>
        <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...styles.typeBtn, border:setup.ty==='Theory'?'2px solid #6366f1':'1px solid #1e293b', background:setup.ty==='Theory'?'#6366f122':'#0f172a'}}>Theory</button>
        <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...styles.typeBtn, border:setup.ty==='Practical'?'2px solid #6366f1':'1px solid #1e293b', background:setup.ty==='Practical'?'#6366f122':'#0f172a'}}>Practical</button>
      </div>
      <div style={{display:'flex', gap:'15px', marginTop:'20px'}}>
        <div style={{flex:1}}><label style={styles.label}>START</label><input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, start:e.target.value})}/></div>
        <div style={{flex:1}}><label style={styles.label}>END</label><input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
      </div>
      <button style={{...styles.btnMain, marginTop:'20px'}} onClick={launch}>INITIALIZE ROLL CALL</button>
    </div>
  );

  return (
    <div style={{animation:'fadeIn 0.4s ease'}}>
      <div style={styles.stickyHead}>
        <ArrowLeft onClick={()=>setActive(false)} style={{cursor:'pointer'}}/>
        <div style={{textAlign:'center'}}><b style={{fontSize:'16px'}}>{setup.cl}</b><br/><small style={{color:'#818cf8'}}>{setup.sub}</small></div>
        <div style={{background:'#6366f1', padding:'5px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:'bold'}}>{marked.length}/{students.length}</div>
      </div>
      <div style={{...styles.gridRoll, gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(85px, 1fr))'}}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}
               style={{...styles.chip, background: marked.includes(s.id) ? '#6366f1' : 'rgba(30,41,59,0.4)', border: marked.includes(s.id)?'2px solid #818cf8':'1px solid #1e293b', color: marked.includes(s.id)?'#fff':'#94a3b8'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.footBtn}>
        <button disabled={loading} onClick={submit} style={{...styles.subLrg, background: loading?'#334155':'#10b981'}}>
          {loading ? "VERIFYING ENCRYPTED GPS..." : "SUBMIT ATTENDANCE DATA"}
        </button>
      </div>
    </div>
  );
}

// --- DESIGNER SYSTEM STYLES ---
const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif' },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'radial-gradient(circle at top right, #1e1b4b, #020617)' },
  glassCard: { background:'rgba(15, 23, 42, 0.6)', backdropFilter:'blur(20px)', padding:'50px 40px', borderRadius:'40px', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.7)' },
  logoBox: { width:'90px', height:'90px', background:'#000', borderRadius:'28px', margin:'0 auto 25px', border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(99, 102, 241, 0.2)' },
  mainLogo: { width:'65px', height:'65px', objectFit:'contain' },
  title: { fontSize:'32px', fontWeight:'900', color:'#fff', margin:0, letterSpacing:'-1px' },
  badge: { fontSize:'10px', color:'#818cf8', fontWeight:'800', marginBottom:'35px', letterSpacing:'1.5px' },
  inputBox: { position:'relative', marginBottom:'18px' },
  inIcon: { position:'absolute', left:'18px', top:'16px', color:'#475569' },
  inputF: { width:'100%', padding:'16px 15px 16px 52px', borderRadius:'18px', background:'#020617', border:'1px solid #1e293b', color:'#fff', outline:'none', boxSizing:'border-box', fontSize:'14px', transition:'0.3s' },
  btnMain: { width:'100%', padding:'18px', borderRadius:'18px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', transition:'transform 0.2s' },
  navbar: { padding:'20px 30px', background:'rgba(2, 6, 23, 0.8)', backdropFilter:'blur(12px)', borderBottom:'1px solid #1e293b', position:'sticky', top:0, zIndex:100 },
  navIn: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1200px', margin:'0 auto' },
  avatar: { width:'42px', height:'42px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'18px', boxShadow:'0 4px 12px rgba(99, 102, 241, 0.3)' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.08)', color:'#f43f5e', border:'1px solid rgba(244, 63, 94, 0.2)', padding:'10px 18px', borderRadius:'14px', cursor:'pointer', fontWeight:'800', fontSize:'12px', display:'flex', alignItems:'center', gap:'8px' },
  container: { maxWidth:'1200px', margin:'0 auto' },
  tabGrid: { display:'flex', gap:'10px', background:'rgba(15, 23, 42, 0.8)', padding:'8px', borderRadius:'22px', marginBottom:'40px', border:'1px solid #1e293b' },
  tabBtn: { flex:1, padding:'14px', border:'none', borderRadius:'16px', fontWeight:'800', fontSize:'11px', cursor:'pointer', transition:'0.3s' },
  gridSystem: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'25px' },
  facultyCard: { background:'rgba(30, 41, 59, 0.3)', padding:'25px', borderRadius:'30px', border:'1px solid rgba(255,255,255,0.05)', transition:'0.3s' },
  pills: { fontSize:'10px', background:'rgba(99, 102, 241, 0.1)', color:'#818cf8', padding:'6px 14px', borderRadius:'12px', fontWeight:'800' },
  searchBox: { flex:1, display:'flex', alignItems:'center', background:'#0f172a', padding:'0 20px', borderRadius:'20px', border:'1px solid #1e293b' },
  searchIn: { background:'none', border:'none', color:'#fff', padding:'16px', width:'100%', outline:'none' },
  masterBtn: { background:'linear-gradient(135deg, #10b981, #059669)', color:'#fff', padding:'16px 25px', borderRadius:'20px', border:'none', fontWeight:'800', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer' },
  listRow: { background:'rgba(30, 41, 59, 0.2)', padding:'20px 28px', borderRadius:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', border:'1px solid rgba(255,255,255,0.03)' },
  formCard: { background:'rgba(15, 23, 42, 0.5)', padding:'40px', borderRadius:'35px', border:'1px solid rgba(255,255,255,0.05)' },
  cardT: { margin:'0 0 25px 0', fontSize:'20px', fontWeight:'800' },
  label: { fontSize:'10px', color:'#64748b', fontWeight:'900', marginBottom:'10px', display:'block', letterSpacing:'1px' },
  uiIn: { width:'100%', padding:'16px', borderRadius:'16px', background:'#020617', border:'1px solid #1e293b', color:'#fff', marginBottom:'20px', boxSizing:'border-box', outline:'none' },
  typeRow: { display:'flex', gap:'12px' },
  typeBtn: { flex:1, padding:'16px', borderRadius:'16px', color:'#fff', fontWeight:'800', cursor:'pointer', fontSize:'13px', transition:'0.3s' },
  stickyHead: { position:'sticky', top:'15px', background:'rgba(30, 41, 59, 0.85)', padding:'18px 25px', borderRadius:'24px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px', backdropFilter:'blur(15px)', zIndex:50, border:'1px solid rgba(255,255,255,0.1)' },
  gridRoll: { display:'grid', gap:'15px', paddingBottom:'150px' },
  chip: { height:'70px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'22px', fontWeight:'900', fontSize:'20px', cursor:'pointer', transition:'all 0.2s' },
  footBtn: { position:'fixed', bottom:'30px', left:'30px', right:'30px', maxWidth:'1140px', margin:'0 auto', zIndex:100 },
  subLrg: { width:'100%', padding:'24px', borderRadius:'25px', bord
