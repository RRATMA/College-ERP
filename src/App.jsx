import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Download, Search, 
  User, Users, BarChart3, Plus, RefreshCw, Fingerprint, Mail, AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.005; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel file missing. Place it in public folder."));
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
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'50px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>SECURE INSTITUTIONAL PORTAL</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="Faculty/Admin ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={styles.userCircle}>{user.name[0]}</div>
            <div className="hide-mobile">
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{user.name}</div>
              <div style={{fontSize:'10px', color:'#818cf8'}}>{user.role.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> LOGOUT</button>
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

// --- HOD PANEL ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [], critical: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  const downloadMasterSheet = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FullReport");
    XLSX.writeFile(wb, "Amrit_ERP_Master_Report.xlsx");
  };

  const sendEmailAlert = (roll, className) => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[className]);
      const student = sheet.find(s => String(s['ROLL NO'] || s['Roll No']) === roll);
      if (student && (student.Email || student.email)) {
        emailjs.send('service_7s8u8qc', 'template_z0f0l1v', { 
          to_email: student.Email || student.email,
          student_roll: roll,
          class_name: className 
        }, 'l-T3MhUjIqj9y0U8p').then(() => alert("Email Alert Sent!"));
      } else alert("Email not found in Excel!");
    });
  };

  return (
    <div>
      <div style={styles.tabContainer}>
        {['analytics', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'analytics' && (
        <div className="fade-in">
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px', marginBottom:'25px'}}>
            <div style={styles.statsCard}><BarChart3 color="#6366f1"/><h3>{db.logs.length}</h3><p>Total Sessions</p></div>
            <div style={styles.statsCard}><Users color="#10b981"/><h3>{db.facs.length}</h3><p>Faculties</p></div>
            <div style={{...styles.statsCard, border:'1px solid #f43f5e'}}><AlertTriangle color="#f43f5e"/><h3>{db.critical.length}</h3><p>Alerts (3+ Days)</p></div>
          </div>
          <h3 style={{marginBottom:'15px'}}>Critical Absentees</h3>
          {db.critical.map(c => (
            <div key={c.student_roll} style={{...styles.itemRow, borderLeft:'4px solid #f43f5e'}}>
              <div><b>Roll: {c.student_roll}</b><br/><small>{c.class_name}</small></div>
              <button onClick={() => sendEmailAlert(c.student_roll, c.class_name)} style={styles.emailBtn}><Mail size={14}/> NOTIFY</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div className="fade-in">
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn} /><input style={styles.inputField} placeholder="Search Teacher, Subject, Class..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          <button onClick={downloadMasterSheet} style={styles.downloadBtn}><Download size={18}/> DOWNLOAD MASTER SHEET</button>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} ({log.type}) | {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.duration}</small></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'faculties' && db.facs.map(f => (
        <div key={f.id} style={styles.itemRow}>
          <div><b>{f.name}</b><br/><small>UID: {f.id}</small></div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
             <div style={styles.countTag}>Theory: {db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length}</div>
             <div style={{...styles.countTag, color:'#a855f7'}}>Pract: {db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length}</div>
             <button onClick={async ()=>{if(window.confirm("Delete Faculty?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={18}/></button>
          </div>
        </div>
      ))}

      {tab === 'manage' && (
        <div className="grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3><Plus size={18}/> Register Faculty</h3>
            <input placeholder="Name" style={styles.inputSml} value={form.n} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} value={form.i} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} value={form.p} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("Faculty Added!");}}>CREATE</button>
          </div>
          <div style={styles.formCard}>
            <h3><RefreshCw size={18}/> Workload Map</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Mapped Successfully!");}}>LINK SUBJECT</button>
          </div>
        </div>
      )}
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const startAttendance = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    setLoading(true);
    const options = { enableHighAccuracy: true, timeout: 10000 };

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      
      if (dist > RADIUS_LIMIT) {
        setLoading(false);
        return alert("Geofence Alert: You must be on campus to submit attendance.");
      }

      const { data: att, error: attErr } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      if (!attErr) {
        const absents = students.filter(s => !marked.includes(s.id)).map(s => ({
          attendance_id: att.id, student_roll: s.id, class_name: setup.cl
        }));
        if (absents.length > 0) await supabase.from('absentee_records').insert(absents);
        alert("✅ Submitted Successfully!");
        setActive(false); setMarked([]);
      } else {
        alert("Error: " + attErr.message);
      }
      setLoading(false);
    }, (err) => {
      setLoading(false);
      alert("Location Error: " + err.message + ". Check GPS Permissions.");
    }, options);
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2 style={{textAlign:'center'}}><Clock color="#6366f1"/> Setup Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <select style={styles.inputSml} value={setup.ty} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
        <div style={{flex:1}}><small>Start Time</small><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} /></div>
        <div style={{flex:1}}><small>End Time</small><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} /></div>
      </div>
      <button style={styles.btnPrimary} onClick={startAttendance}>START ROLL CALL</button>
    </div>
  );

  return (
    <div className="fade-in">
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
        <button disabled={loading} onClick={submitAttendance} style={{...styles.submitLarge, background: loading ? '#94a3b8' : '#10b981'}}>
          {loading ? "VERIFYING..." : `SUBMIT (${marked.length}/${students.length})`}
        </button>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(12px)', padding:'30px', borderRadius:'20px', width:'100%', maxWidth:'360px', textAlign:'center', border:'1px solid #334155' },
  logoWrap: { background:'#fff', padding:'10px', borderRadius:'15px', display:'inline-block', marginBottom:'15px' },
  title: { color:'#fff', fontSize:'24px', margin:0, fontWeight:'bold' },
  badge: { color:'#6366f1', fontSize:'10px', letterSpacing:'2px', marginBottom:'20px' },
  inputGroup: { position:'relative', marginBottom:'15px' },
  iconIn: { position:'absolute', left:'12px', top:'12px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'12px 12px 12px 40px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'15px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.95)', padding:'12px 20px', borderBottom:'1px solid #334155', position:'sticky', top:0, zIndex:100 },
  navContent: { maxWidth:'1000px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', cursor:'pointer', fontSize:'12px', fontWeight:'bold' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'10px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'12px' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.03)' },
  statsCard: { background:'#1e293b', padding:'20px', borderRadius:'15px', textAlign:'center', border:'1px solid #334155' },
  emailBtn: { background:'#10b981', color:'white', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center', fontSize:'11px', fontWeight:'bold' },
  countTag: { background:'#0f172a', padding:'4px 8px', borderRadius:'6px', fontSize:'12px', color:'#10b981', fontWeight:'bold' },
  formCard: { background:'rgba(30, 41, 59, 0.4)', padding:'20px', borderRadius:'15px', border:'1px solid #334155' },
  inputSml: { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'10px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#6366f1', color:'#fff', fontWeight:'bold', cursor:'pointer' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', maxWidth:'400px', margin:'40px auto' },
  stickyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'#1e293b', padding:'15px', borderRadius:'15px' },
  backBtn: { background:'none', border:'none', color:'#fff', cursor:'pointer' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'100px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'20px', background:'rgba(15, 23, 42, 0.95)', borderTop:'1px solid #334155', display:'flex', justifyContent:'center' },
  submitLarge: { width:'100%', maxWidth:'500px', height:'55px', color:'white', border:'none', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  downloadBtn: { width:'100%', background:'#10b981', color:'white', padding:'15px', borderRadius:'12px', border:'none', marginBottom:'15px', cursor:'pointer', fontWeight:'bold' }
};
