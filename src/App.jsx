import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Search, 
  User, Users, Fingerprint, Mail, AlertTriangle, 
  Clock, BookOpen, Layers, FileSpreadsheet, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- CONFIGURATION ---
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
    }).catch(() => console.error("Resource load error."));
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
      <div style={{...styles.glassCard, width: isMobile ? '85%' : '380px'}}>
        <div style={styles.logoBox}><img src="/logo.png" style={styles.mainLogo} alt="Logo" /></div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>SECURE INSTITUTIONAL PORTAL</p>
        <div style={styles.inputBox}><User size={18} style={styles.inIcon}/><input id="u" placeholder="User ID" style={styles.inputF}/></div>
        <div style={styles.inputBox}><Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <nav style={styles.navbar}>
        <div style={styles.navIn}>
          <div style={styles.userSection}>
            <div style={styles.avatar}>{user.name[0]}</div>
            {!isMobile && <div><b>{user.name}</b><br/><small style={{color:'#818cf8', fontWeight:'700'}}>{user.role.toUpperCase()}</small></div>}
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={18}/> LOGOUT</button>
        </div>
      </nav>
      <main style={{...styles.container, padding: isMobile ? '15px' : '30px'}}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} isMobile={isMobile} /> : <FacultyPanel user={user} isMobile={isMobile} />}
      </main>
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, isMobile }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [], critical: [] });
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
    const dataToExport = db.logs.map(log => ({
        'Date': log.time_str, 'Class': log.class, 'Subject': log.sub, 'Type': log.type,
        'Faculty': log.faculty, 'Present': log.present, 'Total': log.total
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "MasterReport");
    XLSX.writeFile(wb, `Master_Report_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div style={{animation: 'fadeIn 0.5s ease'}}>
      <div style={{...styles.tabGrid, overflowX: isMobile ? 'auto' : 'unset'}}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab===t?'#6366f1':'#1e293b', minWidth: isMobile ? '100px' : 'auto'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'faculties' && (
        <div style={styles.gridSystem}>
          {db.facs.map(f => (
            <div key={f.id} style={styles.facultyCard}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div><b>{f.name}</b><br/><small style={{color:'#94a3b8'}}>ID: {f.id}</small></div>
                <Trash2 size={18} color="#f43f5e" style={{cursor:'pointer'}} onClick={async() => {if(window.confirm("Delete Faculty?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}}/>
              </div>
              <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
                <span style={styles.pills}>Lec: {db.logs.filter(l=>l.faculty===f.name && l.type==='Theory').length}</span>
                <span style={{...styles.pills, background:'#10b98122', color:'#10b981'}}>Prac: {db.logs.filter(l=>l.faculty===f.name && l.type==='Practical').length}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px', flexWrap: isMobile ? 'wrap' : 'nowrap'}}>
            <div style={styles.searchBox}><Search size={18}/><input placeholder="Search records..." style={styles.searchIn} onChange={e=>setSearch(e.target.value.toLowerCase())}/></div>
            <button onClick={downloadMaster} style={{...styles.btnMain, width: isMobile ? '100%' : '200px', margin:0}}><FileSpreadsheet size={18}/> MASTER SHEET</button>
          </div>
          {db.logs.filter(l=>(l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.listRow}>
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'manage' && (
        <div style={styles.gridSystem}>
          <div style={styles.formCard}>
            <h4 style={{marginBottom:'15px'}}>Add Faculty</h4>
            <input placeholder="Name" style={styles.uiIn} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="ID" style={styles.uiIn} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" style={styles.uiIn} type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={styles.btnMain} onClick={async() => {await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h4 style={{marginBottom:'15px'}}>Mapping</h4>
            <select style={styles.uiIn} onChange={e=>setForm({...form, fId:e.target.value})}><option>Teacher</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.uiIn} onChange={e=>setForm({...form, cls:e.target.value})}><option>Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={styles.uiIn} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...styles.btnMain, background:'#10b981'}} onClick={async() => {await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapped!");}}>ASSIGN</button>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div style={styles.gridSystem}>
          <div style={styles.statC}><Users color="#6366f1" size={30}/><h3>{db.facs.length}</h3><p>Total Staff</p></div>
          <div style={styles.statC}><AlertTriangle color="#f43f5e" size={30}/><h3>{db.critical.length}</h3><p>Critical Alerts</p></div>
          {db.critical.map(c => (
            <div key={c.student_roll} style={{...styles.listRow, gridColumn: isMobile ? 'auto' : 'span 2'}}>
              <span><b>{c.student_roll}</b> - {c.class_name}</span>
              <button style={styles.mailBtn} onClick={()=>alert("Email Sent!")}><Mail size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user, isMobile }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Select Details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setIsSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setIsSubmitting(false); return alert("❌ OUTSIDE CAMPUS!"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Submitted!"); setIsSubmitting(false); setActive(false); setMarked([]);
    }, () => { setIsSubmitting(false); alert("GPS Access Denied!"); });
  };

  if (!active) return (
    <div style={{...styles.formCard, width: isMobile ? '100%' : '450px', margin:'0 auto'}}>
      <h3 style={{marginBottom:'20px', textAlign:'center'}}><Clock size={20}/> Session Setup</h3>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.uiIn} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...styles.typeBtn, background:setup.ty==='Theory'?'#6366f1':'#0f172a'}}>Theory</button>
        <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...styles.typeBtn, background:setup.ty==='Practical'?'#6366f1':'#0f172a'}}>Practical</button>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, start:e.target.value})}/>
        <input type="time" style={styles.uiIn} onChange={e=>setSetup({...setup, end:e.target.value})}/>
      </div>
      <button style={styles.btnMain} onClick={launch}>START ATTENDANCE</button>
    </div>
  );

  return (
    <div>
      <div style={styles.stickyHead}>
        <ArrowLeft onClick={()=>setActive(false)} style={{cursor:'pointer'}}/>
        <b>{setup.cl} | {setup.ty}</b>
        <span>{marked.length}/{students.length}</span>
      </div>
      <div style={{...styles.gridRoll, gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(80px, 1fr))'}}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}
               style={{...styles.chip, background: marked.includes(s.id) ? '#6366f1' : 'rgba(30,41,59,0.5)', border: marked.includes(s.id)?'2px solid #818cf8':'1px solid #334155'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.footBtn}>
        <button disabled={isSubmitting} onClick={submit} style={{...styles.subLrg, background: isSubmitting?'#475569':'#10b981'}}>
          {isSubmitting ? "VERIFYING LOCATION..." : "SUBMIT SESSION"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f8fafc', fontFamily: 'Inter, sans-serif' },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'radial-gradient(circle at center, #1e1b4b, #020617)' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(15px)', padding:'40px', borderRadius:'35px', border:'1px solid rgba(255,255,255,0.1)', textAlign:'center' },
  logoBox: { width:'80px', height:'80px', background:'#000', borderRadius:'22px', margin:'0 auto 20px', border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center' },
  mainLogo: { width:'60px', height:'60px', objectFit:'contain' },
  title: { fontSize:'26px', fontWeight:'900', color:'#fff', margin:0 },
  badge: { fontSize:'10px', color:'#818cf8', fontWeight:'800', marginBottom:'30px', letterSpacing:'1px' },
  inputBox: { position:'relative', marginBottom:'15px' },
  inIcon: { position:'absolute', left:'15px', top:'14px', color:'#94a3b8' },
  inputF: { width:'100%', padding:'14px 15px 14px 45px', borderRadius:'14px', background:'#0f172a', border:'1px solid #334155', color:'#fff', outline:'none', boxSizing:'border-box' },
  btnMain: { width:'100%', padding:'16px', borderRadius:'14px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer' },
  navbar: { padding:'15px 20px', background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1e293b' },
  navIn: { display:'flex', justifyContent:'space-between', alignItems:'center', maxWidth:'1200px', margin:'0 auto' },
  avatar: { width:'35px', height:'35px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', cursor:'pointer', fontWeight:'bold' },
  container: { maxWidth:'1200px', margin:'0 auto' },
  tabGrid: { display:'flex', gap:'10px', marginBottom:'30px' },
  tabBtn: { padding:'12px 20px', border:'none', borderRadius:'12px', color:'#fff', fontWeight:'700', fontSize:'11px', cursor:'pointer' },
  gridSystem: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px' },
  facultyCard: { background:'rgba(30, 41, 59, 0.5)', padding:'22px', borderRadius:'25px', border:'1px solid rgba(255,255,255,0.05)' },
  pills: { fontSize:'10px', background:'rgba(99, 102, 241, 0.15)', color:'#818cf8', padding:'5px 12px', borderRadius:'10px', fontWeight:'800' },
  searchBox: { flex:1, display:'flex', alignItems:'center', background:'#0f172a', padding:'0 15px', borderRadius:'15px', border:'1px solid #1e293b' },
  searchIn: { background:'none', border:'none', color:'#fff', padding:'14px', width:'100%', outline:'none' },
  listRow: { background:'rgba(30, 41, 59, 0.3)', padding:'18px 25px', borderRadius:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
  formCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'30px', border:'1px solid rgba(255,255,255,0.05)' },
  uiIn: { width:'100%', padding:'15px', borderRadius:'15px', background:'#0f172a', border:'1px solid #334155', color:'#fff', marginBottom:'15px', boxSizing:'border-box' },
  typeBtn: { flex:1, padding:'15px', borderRadius:'15px', border:'1px solid #334155', color:'#fff', fontWeight:'bold', cursor:'pointer' },
  stickyHead: { position:'sticky', top:'10px', background:'rgba(30, 41, 59, 0.95)', padding:'15px 25px', borderRadius:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px', backdropFilter:'blur(10px)', zIndex:10 },
  gridRoll: { display:'grid', gap:'12px', paddingBottom:'140px' },
  chip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'20px', fontWeight:'800', fontSize:'18px', cursor:'pointer' },
  footBtn: { position:'fixed', bottom:'20px', left:'20px', right:'20px', maxWidth:'1200px', margin:'0 auto' },
  subLrg: { width:'100%', padding:'22px', borderRadius:'22px', border:'none', color:'#fff', fontWeight:'900', fontSize:'16px', boxShadow:'0 15px 30px rgba(16, 185, 129, 0.3)' },
  statC: { background:'rgba(30, 41, 59, 0.5)', padding:'35px', borderRadius:'35px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)' },
  mailBtn: { background:'#10b981', border:'none', color:'#fff', padding:'8px', borderRadius:'10px', cursor:'pointer' }
};
