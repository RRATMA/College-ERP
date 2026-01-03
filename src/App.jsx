import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, Users, Calendar, Download, UserPlus, PlusCircle, TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER: NEON & GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-dev-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-dev-styles';
  styleTag.innerHTML = `
    @keyframes neon-pulse {
      0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); border-color: #6366f1; }
      50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.8); border-color: #a5b4fc; }
      100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); border-color: #6366f1; }
    }
    .neon-circle-logo { animation: neon-pulse 3s infinite ease-in-out; border: 3px solid #6366f1; border-radius: 50%; }
    input:focus { border-color: #6366f1 !important; outline: none; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    * { transition: all 0.2s ease; -webkit-tap-highlight-color: transparent; }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    injectStyles();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.log("Excel file missing in public folder"));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={{...styles.glassCard, width: isMobile ? '90%' : '400px'}}>
        <div className="neon-circle-logo" style={styles.logoBox}>
          <img src="/logo.png" style={styles.mainLogo} alt="Logo" />
        </div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>ATTENDANCE SYSTEM</p>
        <div style={styles.inputBox}><User size={18} style={styles.inIcon}/><input id="u" placeholder="User ID" style={styles.inputF}/></div>
        <div style={styles.inputBox}><Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>LOGIN <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
    </div>
  );
}

// --- COMPLETE HOD PANEL WITH FULL DASHBOARDS ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  const todayStr = new Date().toLocaleDateString('en-GB');
  const filteredLogs = db.logs.filter(l => 
    l.faculty.toLowerCase().includes(search.toLowerCase()) || 
    l.class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={hStyles.wrapper}>
      <div style={hStyles.header}>
        <div><h2 style={{margin:0}}>HOD Console</h2><small style={{color:'#818cf8'}}>Department Overview</small></div>
        <button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button>
      </div>

      <div className="scroll-hide" style={hStyles.tabs}>
        {[
          {id:'dashboard', icon:<LayoutGrid size={14}/>},
          {id:'faculty', icon:<Users size={14}/>},
          {id:'mapping', icon:<BookOpen size={14}/>},
          {id:'logs', icon:<FileSpreadsheet size={14}/>}
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{...hStyles.tabBtn, background: tab===t.id?'#6366f1':'#1e293b'}}>
            {t.icon} {t.id.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{animation: 'fadeIn 0.5s'}}>
          <div style={hStyles.statsGrid}>
            <div style={hStyles.statCard}><TrendingUp color="#10b981"/><h3>{db.logs.filter(l=>l.time_str === todayStr).length}</h3><p>Today Sessions</p></div>
            <div style={hStyles.statCard}><Users color="#6366f1"/><h3>{db.facs.length}</h3><p>Active Staff</p></div>
            <div style={hStyles.statCard}><CheckCircle2 color="#818cf8"/><h3>{db.logs.reduce((a,b)=>a+b.present,0)}</h3><p>Total Presence</p></div>
            <div style={hStyles.statCard}><Layers color="#f43f5e"/><h3>{excelSheets.length}</h3><p>Total Classes</p></div>
          </div>
          
          <h4 style={hStyles.sectionTitle}>REAL-TIME ACTIVITY</h4>
          <div style={hStyles.logList}>
            {db.logs.slice(0, 6).map(log => (
              <div key={log.id} style={hStyles.activityRow}>
                <div style={hStyles.activityIcon}>{log.type[0]}</div>
                <div style={{flex:1}}><b>{log.class}</b><br/><small>{log.faculty} • {log.sub}</small></div>
                <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'faculty' && (
        <div style={{animation: 'fadeIn 0.5s'}}>
          <div style={hStyles.formCard}>
            <h4>Quick Add Staff</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
              <input placeholder="Name" style={hStyles.input} value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
              <input placeholder="Staff ID" style={hStyles.input} value={form.id} onChange={e=>setForm({...form, id:e.target.value})}/>
            </div>
            <input placeholder="Password" type="password" style={hStyles.input} value={form.pass} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{
              if(!form.name || !form.id) return alert("Fields Required");
              await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]);
              setForm({name:'', id:'', pass:''}); loadData();
            }}><PlusCircle size={18}/> SAVE FACULTY</button>
          </div>
          
          {db.facs.map(f => {
            const theory = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
            const practical = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
            return (
              <div key={f.id} style={hStyles.recordCard}>
                <div style={hStyles.avatar}>{f.name[0]}</div>
                <div style={{flex:1}}><b>{f.name}</b><br/><small>Theory: {theory} | Practical: {practical}</small></div>
                <button onClick={async()=>{if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={hStyles.delBtn}><Trash2 size={18}/></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div style={{animation: 'fadeIn 0.5s'}}>
          <div style={hStyles.formCard}>
            <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{
              await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();
            }}>ASSIGN MAPPING</button>
          </div>
          {db.maps.map(m => (
            <div key={m.id} style={hStyles.recordCard}>
              <div style={{flex:1}}><b>{m.class_name}</b><br/><small>{m.subject_name}</small></div>
              <button onClick={async()=>{await supabase.from('assignments').delete().eq('id',m.id); loadData();}} style={hStyles.delBtn}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div style={{animation: 'fadeIn 0.5s'}}>
          <div style={hStyles.searchBox}><Search size={18}/><input placeholder="Filter by Class or Teacher..." style={{background:'none', border:'none', color:'#fff', width:'100%'}} onChange={e=>setSearch(e.target.value)}/></div>
          <button style={hStyles.actionBtn} onClick={() => {
            const ws = XLSX.utils.json_to_sheet(filteredLogs);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Attendance");
            XLSX.writeFile(wb, "Amrit_Master_Report.xlsx");
          }}><Download size={18}/> EXPORT TO EXCEL</button>
          {filteredLogs.map(log => (
            <div key={log.id} style={hStyles.recordCard}>
              <div style={{flex:1}}><b>{log.class} - {log.sub}</b><br/><small>{log.faculty} | {log.time_str} | {log.type}</small></div>
              <b style={{color:'#10b981'}}>{log.present}/{log.total}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (GPS + ROLL CALL + ABSENTEE) ---
function FacultyPanel({ user, setView }) {
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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Select all session options");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ ACCESS DENIED: PLEASE SUBMIT INSIDE CAMPUS"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl 
      }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("✅ Attendance Uploaded Successfully!");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error - Check Permissions!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}><div><h4>Prof. {user.name}</h4><small>Faculty Portal</small></div><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      <label style={fStyles.label}>CHOOSE CLASS</label>
      <div style={fStyles.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...fStyles.tile, background: setup.cl===c?'#6366f1':'#0f172a', border: setup.cl===c?'2px solid #a5b4fc':'2px solid #1e293b'}}>{c}</div>))}</div>
      
      {setup.cl && (
        <div style={{marginTop:'20px'}}>
          <label style={fStyles.label}>SUBJECT</label>
          <div style={fStyles.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}>{j.subject_name}</div>))}</div>
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={hStyles.input}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={hStyles.input}/></div>
          <div style={fStyles.toggleWrap}><button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.toggleBtn, background: setup.ty==='Theory'?'#fff':'transparent', color: setup.ty==='Theory'?'#000':'#fff'}}>Theory</button><button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.toggleBtn, background: setup.ty==='Practical'?'#fff':'transparent', color: setup.ty==='Practical'?'#000':'#fff'}}>Practical</button></div>
        </div>
      )}
      <button onClick={launch} style={fStyles.launchBtn}>START ATTENDANCE</button>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}><button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button><div><h3>{setup.cl}</h3><small>{setup.sub}</small></div><div style={fStyles.statsBadge}>{marked.length}/{students.length}</div></div>
      <div style={fStyles.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...fStyles.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}><span style={{fontSize:'10px', opacity:0.5}}>ROLL</span><br/>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={fStyles.submitBtn}>{loading ? "VERIFYING GPS..." : "FINALIZE & SUBMIT"}</button>
    </div>
  );
}

// --- CONSOLIDATED STYLES ---
const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily:'-apple-system, sans-serif' },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'radial-gradient(circle, #0f172a, #020617)' },
  glassCard: { background:'rgba(15, 23, 42, 0.8)', padding:'40px', borderRadius:'40px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(12px)' },
  logoBox: { width:'100px', height:'100px', background:'#000', borderRadius:'50%', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  mainLogo: { width:'100%', height:'100%', objectFit: 'cover' },
  title: { fontSize:'36px', fontWeight:'900', color:'#ffffff' },
  badge: { fontSize:'11px', color:'#818cf8', marginBottom:'30px', fontWeight:'bold' },
  inputBox: { position:'relative', marginBottom:'12px' },
  inIcon: { position:'absolute', left:'15px', top:'15px', color:'#6366f1' },
  inputF: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'15px', background:'#020617', border:'1px solid #1e293b', color:'#fff', boxSizing:'border-box' },
  btnMain: { width:'100%', padding:'18px', borderRadius:'15px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer' }
};

const hStyles = {
  wrapper: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tabs: { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom:'5px' },
  tabBtn: { padding: '10px 15px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
  statCard: { background: '#0f172a', padding: '15px', borderRadius: '20px', border: '1px solid #1e293b', textAlign: 'center' },
  sectionTitle: { fontSize: '12px', color: '#64748b', letterSpacing: '1px', marginBottom: '10px' },
  logList: { background: '#0f172a', borderRadius: '20px', overflow: 'hidden', border: '1px solid #1e293b' },
  activityRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderBottom: '1px solid #1e293b' },
  activityIcon: { width: '35px', height: '35px', borderRadius: '10px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#818cf8' },
  recordCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #1e293b' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '10px' },
  formCard: { background: '#0f172a', padding: '18px', borderRadius: '15px', border: '1px solid #1e293b', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: '#fff', marginBottom: '10px', boxSizing:'border-box' },
  searchBox: { background: '#0f172a', padding: '12px', borderRadius: '12px', display: 'flex', gap: '10px', marginBottom: '10px', border: '1px solid #1e293b' },
  actionBtn: { width: '100%', padding: '15px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  delBtn: { color: '#f43f5e', border: 'none', background: 'rgba(244,63,94,0.1)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }
};

const fStyles = {
  mobileWrapper: { padding:'20px 15px 120px' },
  topBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  exitBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'8px', borderRadius:'10px' },
  label: { f
