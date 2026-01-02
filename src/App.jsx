import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, Download, Search, 
  User, Users, BarChart3, Plus, RefreshCw, BookOpen, Fingerprint, MapPin, CheckCircle2, PieChart, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.01; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel mapping missing."));
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
        <p style={styles.badge}>ADVANCED ADMIN PORTAL</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>LOGIN</button>
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
              <b style={{fontSize:'14px'}}>{user.name}</b><br/><small style={{color:'#818cf8'}}>{user.role.toUpperCase()}</small>
            </div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={14}/> LOGOUT</button>
        </div>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- HOD PANEL WITH NEW DASHBOARDS ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [] });
  };
  useEffect(() => { loadData(); }, []);

  const downloadMasterSheet = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MasterLogs");
    XLSX.writeFile(wb, "Full_Attendance_Report.xlsx");
  };

  return (
    <div>
      <div style={styles.tabContainer}>
        {['dashboard', 'logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="fade-in">
          <div style={styles.dashboardGrid}>
            <div style={styles.statCard}><Users size={24} color="#6366f1"/> <div><h3>{db.facs.length}</h3><p>Total Faculty</p></div></div>
            <div style={styles.statCard}><Activity size={24} color="#10b981"/> <div><h3>{db.logs.length}</h3><p>Sessions Logged</p></div></div>
            <div style={styles.statCard}><BookOpen size={24} color="#f59e0b"/> <div><h3>{db.assigns.length}</h3><p>Active Subjects</p></div></div>
          </div>

          <h3 style={{marginTop:'30px', marginBottom:'15px'}}>Workload Analytics</h3>
          <div style={styles.chartWrapper}>
             {db.facs.map(f => {
               const tCnt = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
               const pCnt = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
               const total = tCnt + pCnt;
               return (
                 <div key={f.id} style={styles.barGroup}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'5px'}}>
                      <span>{f.name}</span>
                      <span>{total} Total</span>
                    </div>
                    <div style={styles.barTrack}>
                      <div style={{...styles.barFill, width: `${(tCnt/20)*100}%`, background: '#6366f1'}} title="Theory"></div>
                      <div style={{...styles.barFill, width: `${(pCnt/20)*100}%`, background: '#a855f7'}} title="Practical"></div>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <>
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn} /><input style={styles.inputField} placeholder="Search Logs..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          <button onClick={downloadMasterSheet} style={styles.downloadBtn}><Download size={18}/> EXCEL DOWNLOAD</button>
          {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} ({log.type}) | {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.duration}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'faculties' && db.facs.map(f => (
        <div key={f.id} style={styles.itemRow}>
          <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
          <button onClick={async ()=>{if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={{...styles.iconBtn, color:'#f43f5e'}}><Trash2 size={18}/></button>
        </div>
      ))}

      {tab === 'manage' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3>Add Teacher</h3>
            <input placeholder="Name" style={styles.inputSml} value={form.n} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} value={form.i} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Pass" style={styles.inputSml} value={form.p} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("Success");}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h3>Link Work</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Mapped");}}>MAP WORK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (UNTOUCHED FEATURES) ---
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
    if(!setup.cl || !setup.start) return alert("Fill all details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(d > RADIUS_LIMIT) return alert("Outside Campus!");

      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Saved!"); setActive(false); setMarked([]);
    });
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2 style={{textAlign:'center'}}><Clock color="#6366f1"/> Setup Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <select style={styles.inputSml} value={setup.ty} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
        <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} />
        <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} />
      </div>
      <button style={styles.btnPrimary} onClick={startSession}>START ROLL CALL</button>
    </div>
  );

  return (
    <div>
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
      <div style={styles.floatingAction}><button onClick={submitAttendance} style={styles.submitLarge}>SUBMIT ({marked.length})</button></div>
    </div>
  );
}

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
  navbar: { background:'rgba(15, 23, 42, 0.95)', padding:'10px 20px', borderBottom:'1px solid #334155', position:'sticky', top:0, zIndex:100 },
  navContent: { maxWidth:'1000px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', cursor:'pointer', fontWeight:'bold' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  dashboardGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' },
  statCard: { background:'rgba(30, 41, 59, 0.5)', padding:'20px', borderRadius:'20px', display:'flex', alignItems:'center', gap:'15px', border:'1px solid rgba(255,255,255,0.05)' },
  chartWrapper: { background:'rgba(30, 41, 59, 0.3)', padding:'20px', borderRadius:'20px' },
  barGroup: { marginBottom:'15px' },
  barTrack: { height:'10px', background:'#0f172a', borderRadius:'5px', overflow:'hidden', display:'flex' },
  barFill: { height:'100%' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'10px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'11px' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  formCard: { background:'rgba(30, 41, 59, 0.4)', padding:'20px', borderRadius:'15px', border:'1px solid #334155' },
  inputSml: { width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'10px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#6366f1', color:'#fff', fontWeight:'bold' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', maxWidth:'400px', margin:'40px auto' },
  stickyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'#1e293b', padding:'15px', borderRadius:'15px' },
  backBtn: { background:'none', border:'none', color:'#fff' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'100px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', fontWeight:'bold', cursor:'pointer' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'20px', background:'rgba(15, 23, 42, 0.95)', borderTop:'1px solid #334155', display:'flex', justifyContent:'center' },
  submitLarge: { width:'100%', maxWidth:'500px', height:'55px', background:'#10b981', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold' },
  downloadBtn: { width:'100%', background:'#10b981', color:'white', padding:'12px', borderRadius:'10px', border:'none', marginBottom:'15px', cursor:'pointer', fontWeight:'bold' }
};
