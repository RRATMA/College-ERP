import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, Users, Calendar, Download, UserPlus, PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// Campus Configuration
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
    
    // Load Excel Sheet Names for Mapping
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.log("Excel file not found yet."));

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { 
        setUser({ ...data, role: 'faculty' }); 
        setView('faculty'); 
      } else {
        alert("Invalid Credentials!");
      }
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={{...styles.glassCard, width: isMobile ? '90%' : '400px'}}>
        <div style={styles.logoBox}><img src="/logo.png" style={styles.mainLogo} alt="Logo" /></div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>INSTITUTIONAL GATEWAY</p>
        <div style={styles.inputBox}><User size={18} style={styles.inIcon}/><input id="u" placeholder="User ID" style={styles.inputF}/></div>
        <div style={styles.inputBox}><Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>ACCESS SYSTEM <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <main style={styles.container}>
        {view === 'hod' ? (
          <HODPanel excelSheets={excelSheets} setView={setView} />
        ) : (
          <FacultyPanel user={user} setView={setView} />
        )}
      </main>
    </div>
  );
}

// --- HOD PANEL: ALL 4 KEY FEATURES ---
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

  // Point 1: Dashboard Logic
  const today = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(log => log.time_str === today);
  const studentsToday = todayLogs.reduce((acc, curr) => acc + (curr.present || 0), 0);
  const classCount = [...new Set(db.maps.map(m => m.class_name))].length;

  // Point 2: Master Search & Download
  const filteredLogs = db.logs.filter(l => 
    l.faculty.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(filteredLogs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Records");
    XLSX.writeFile(wb, `ERP_Master_Report_${today}.xlsx`);
  };

  return (
    <div style={hStyles.wrapper}>
      <div style={hStyles.header}>
        <div><h2 style={{margin:0}}>HOD Console</h2><small style={{color:'#818cf8'}}>Admin Control Panel</small></div>
        <button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button>
      </div>

      <div style={hStyles.navScroll}>
        <button onClick={()=>setTab('dashboard')} style={{...hStyles.navBtn, background: tab==='dashboard'?'#6366f1':'#1e293b'}}>DASHBOARD</button>
        <button onClick={()=>setTab('master')} style={{...hStyles.navBtn, background: tab==='master'?'#6366f1':'#1e293b'}}>MASTER SHEET</button>
        <button onClick={()=>setTab('faculty')} style={{...hStyles.navBtn, background: tab==='faculty'?'#6366f1':'#1e293b'}}>FACULTY CRUD</button>
        <button onClick={()=>setTab('mapping')} style={{...hStyles.navBtn, background: tab==='mapping'?'#6366f1':'#1e293b'}}>MAPPING</button>
      </div>

      {tab === 'dashboard' && (
        <div style={hStyles.fadeAnim}>
          <div style={hStyles.statsGrid}>
            <div style={hStyles.statCard}><Users color="#6366f1"/><h3>{studentsToday}</h3><p>Students Today</p></div>
            <div style={hStyles.statCard}><Layers color="#818cf8"/><h3>{classCount}</h3><p>Active Classes</p></div>
            <div style={hStyles.statCard}><User color="#10b981"/><h3>{db.facs.length}</h3><p>Total Faculty</p></div>
            <div style={hStyles.statCard}><Calendar color="#f43f5e"/><h3>{todayLogs.length}</h3><p>Today's Lectures</p></div>
          </div>
          <h4 style={hStyles.secLabel}>DAY-WISE LECTURE TREND</h4>
          {[...new Set(db.logs.map(l => l.time_str))].slice(0, 5).map(date => (
            <div key={date} style={hStyles.dataRow}><span>{date}</span><b>{db.logs.filter(l => l.time_str === date).length} Sessions</b></div>
          ))}
        </div>
      )}

      {tab === 'master' && (
        <div style={hStyles.fadeAnim}>
          <div style={hStyles.searchBox}><Search size={18}/><input placeholder="Search records..." style={hStyles.searchIn} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <button onClick={downloadMaster} style={hStyles.downloadBtn}><Download size={18}/> DOWNLOAD EXCEL</button>
          <div style={{marginTop:'15px'}}>
            {filteredLogs.map(log => (
              <div key={log.id} style={hStyles.recordCard}>
                <div style={{flex:1}}><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div>
                <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.duration}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'faculty' && (
        <div style={hStyles.fadeAnim}>
          <div style={hStyles.formCard}>
            <h4><UserPlus size={18}/> Add Faculty</h4>
            <input placeholder="Full Name" style={hStyles.input} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Employee ID" style={hStyles.input} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Login Password" type="password" style={hStyles.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={hStyles.saveBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Faculty Added!");}}>REGISTER STAFF</button>
          </div>
          <h4 style={hStyles.secLabel}>STAFF PERFORMANCE</h4>
          {db.facs.map(f => {
            const fLogs = db.logs.filter(l => l.faculty === f.name);
            const theory = fLogs.filter(l => l.type === 'Theory').length;
            const prac = fLogs.filter(l => l.type === 'Practical').length;
            return (
              <div key={f.id} style={hStyles.recordCard}>
                <div style={{flex:1}}><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
                <div style={{textAlign:'right'}}>
                  <span style={{color:'#818cf8', fontSize:'12px'}}>L: {theory}</span> | <span style={{color:'#10b981', fontSize:'12px'}}>P: {prac}</span><br/>
                  <button onClick={async()=>{if(window.confirm("Delete Faculty?")) {await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={hStyles.delBtn}><Trash2 size={16}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div style={hStyles.fadeAnim}>
          <div style={hStyles.formCard}>
            <h4><PlusCircle size={18}/> Assign Subject</h4>
            <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...hStyles.saveBtn, background:'#10b981'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData(); alert("Mapping Saved!");}}>CONFIRM MAPPING</button>
          </div>
          <h4 style={hStyles.secLabel}>ACTIVE ASSIGNMENTS</h4>
          {db.maps.map(m => (
            <div key={m.id} style={hStyles.dataRow}>
              <span><b>{m.class_name}</b> - {m.subject_name}</span>
              <button onClick={async()=>{await supabase.from('assignments').delete().eq('id', m.id); loadData();}} style={hStyles.delBtn}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: UNTOUCHED & COMPLETE ---
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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Please set time and class!");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ ACCESS DENIED: OUTSIDE CAMPUS"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start} - ${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("✅ Attendance Captured!"); 
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}><div style={fStyles.userPlate}><div style={fStyles.miniAv}>{user.name[0]}</div><div><h4 style={{margin:0}}>Prof. {user.name}</h4><small style={{color:'#818cf8'}}>Faculty Portal</small></div></div><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      
      <div style={fStyles.section}><label style={fStyles.label}>SELECT CLASS</label><div style={fStyles.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...fStyles.tile, borderColor: setup.cl===c?'#6366f1':'#1e293b', background: setup.cl===c?'rgba(99,102,241,0.1)':'#0f172a'}}><LayoutGrid size={20}/><span style={{fontWeight:'700'}}>{c}</span></div>))}</div></div>
      
      {setup.cl && (
        <div style={{animation:'fadeIn 0.3s ease'}}>
          <label style={fStyles.label}>SELECT SUBJECT</label>
          <div style={fStyles.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}><BookOpen size={16}/> {j.subject_name}</div>))}</div>
          
          <label style={fStyles.label}>LECTURE TIME</label>
          <div style={fStyles.timeRow}>
            <div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={fStyles.timeInput}/></div>
            <span style={{color:'#475569'}}>to</span>
            <div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={fStyles.timeInput}/></div>
          </div>
          
          <label style={fStyles.label}>SESSION TYPE</label>
          <div style={fStyles.toggleWrap}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.toggleBtn, background: setup.ty==='Theory'?'#fff':'transparent', color: setup.ty==='Theory'?'#000':'#fff'}}>Theory</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.toggleBtn, background: setup.ty==='Practical'?'#fff':'transparent', color: setup.ty==='Practical'?'#000':'#fff'}}>Practical</button>
          </div>
        </div>
      )}
      <div style={fStyles.bottomAction}><button onClick={launch} style={fStyles.launchBtn}>START SESSION <ChevronRight/></button></div>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}><button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button><div><h3 style={{margin:0}}>{setup.cl}</h3><small style={{color:'#818cf8'}}>{setup.sub}</small></div><div style={fStyles.statsBadge}><b>{marked.length}</b>/{students.length}</div></div>
      <div style={fStyles.rollArea}>{students.map(s => (<div key={s.id} onClick={() => { if(window.navigator.vibrate) window.navigator.vibrate(10); setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}} style={{...fStyles.rollChip, background: marked.includes(s.id)?'linear-gradient(135deg, #6366f1, #4f46e5)':'#1e293b', border: marked.includes(s.id)?'none':'1px solid #334155'}}><span style={{fontSize:'10px', opacity:0.5}}>ROLL</span><span style={{fontSize:'24px', fontWeight:'900'}}>{s.id}</span>{marked.includes(s.id) && <CheckCircle2 size={16} style={fStyles.checkIcon}/>}</div>))}</div>
      <div style={fStyles.bottomAction}><button disabled={loading} onClick={submit} style={{...fStyles.submitBtn, background: loading?'#334155':'#10b981'}}>{loading ? "VERIFYING GPS..." : `SUBMIT ATTENDANCE`}</button></div>
    </div>
  );
}

// --- ALL STYLES (NO MISSING CONTENT) ---
const hStyles = {
  wrapper: { padding: '20px 15px 100px 15px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  navScroll: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' },
  navBtn: { padding: '10px 15px', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  statCard: { background: '#0f172a', padding: '15px', borderRadius: '15px', border: '1px solid #1e293b', textAlign: 'center' },
  secLabel: { fontSize: '11px', color: '#475569', letterSpacing: '1px', margin: '25px 0 10px 0' },
  dataRow: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#0f172a', borderRadius: '12px', marginBottom: '8px', border: '1px solid #1e293b' },
  recordCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #1e293b' },
  searchBox: { display: 'flex', alignItems: 'center', background: '#0f172a', padding: '12px', borderRadius: '12px', gap: '10px', marginBottom: '10px' },
  searchIn: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' },
  downloadBtn: { width: '100%', padding: '14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  formCard: { background: '#0f172a', padding: '18px', borderRadius: '15px', border: '1px solid #1e293b', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: '#fff', marginBottom: '10px', boxSizing: 'border-box' },
  saveBtn: { width: '100%', padding: '14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', padding: '5px' },
  fadeAnim: { animation: 'fadeIn 0.3s ease' }
};

const fStyles = {
  mobileWrapper: { padding:'20px 15px 120px 15px', minHeight:'100vh', display:'flex', flexDirection:'column' },
  topBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' },
  userPlate: { display:'flex', alignItems:'center', gap:'12px' },
  miniAv: { width:'42px', height:'42px', background:'#6366f1', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900' },
  exitBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'10px', borderRadius:'12px' },
  section: { marginBottom:'25px' },
  label: { fontSize:'10px', fontWeight:'900', color:'#475569', letterSpacing:'1.5px', marginBottom:'12px', display:'block' },
  tileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  tile: { height:'75px', borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px', border:'2px solid transparent' },
  subList: { display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' },
  subRow: { padding:'16px', borderRadius:'15px', fontWeight:'700', fontSize:'13px', display:'flex', alignItems:'center', gap:'10px' },
  timeRow: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' },
  timeInputWrap: { flex:1, display:'flex', alignItems:'center', gap:'8px', background:'#1e293b', padding:'12px', borderRadius:'12px', color:'#94a3b8' },
  timeInput: { background:'none', bord
