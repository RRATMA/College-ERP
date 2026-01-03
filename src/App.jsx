import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, Users, Calendar, Download, UserPlus, PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// Campus Geofencing (Fixed)
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
      else alert("Access Denied!");
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
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (FULL FEATURES) ---
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
      <div style={hStyles.tabs}>{['dashboard','master','faculty','mapping'].map(t => (<button key={t} onClick={()=>setTab(t)} style={{...hStyles.tabBtn, background: tab===t?'#6366f1':'#1e293b'}}>{t.toUpperCase()}</button>))}</div>

      {tab === 'dashboard' && (
        <div style={hStyles.content}>
          <div style={hStyles.statsGrid}>
            <div style={hStyles.statCard}><Users/><h3>{studentsToday}</h3><p>Students Today</p></div>
            <div style={hStyles.statCard}><Layers/><h3>{classCount}</h3><p>Active Classes</p></div>
            <div style={hStyles.statCard}><User/><h3>{db.facs.length}</h3><p>Faculties</p></div>
            <div style={hStyles.statCard}><Calendar/><h3>{db.logs.filter(l=>l.time_str===today).length}</h3><p>Today Lectures</p></div>
          </div>
          <h4 style={hStyles.label}>RECENT ACTIVITY (DAY-WISE)</h4>
          {[...new Set(db.logs.map(l => l.time_str))].slice(0, 5).map(date => (
            <div key={date} style={hStyles.row}><span>{date}</span><b>{db.logs.filter(l => l.time_str === date).length} Sessions</b></div>
          ))}
        </div>
      )}

      {tab === 'master' && (
        <div>
          <div style={hStyles.searchBox}><Search size={18}/><input placeholder="Search records..." style={hStyles.searchIn} onChange={e=>setSearchTerm(e.target.value)}/></div>
          <button onClick={() => { const ws = XLSX.utils.json_to_sheet(filteredLogs); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance"); XLSX.writeFile(wb, "Master_Report.xlsx"); }} style={hStyles.actionBtn}><Download size={18}/> DOWNLOAD EXCEL</button>
          {filteredLogs.map(log => (<div key={log.id} style={hStyles.recordCard}><div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div><div style={{color:'#10b981'}}><b>{log.present}/{log.total}</b></div></div>))}
        </div>
      )}

      {tab === 'faculty' && (
        <div>
          <div style={hStyles.formCard}>
            <h4>Add Faculty</h4>
            <input placeholder="Name" style={hStyles.input} onChange={e=>setForm({...form, name:e.target.value})}/><input placeholder="ID" style={hStyles.input} onChange={e=>setForm({...form, id:e.target.value})}/><input placeholder="Pass" type="password" style={hStyles.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>SAVE STAFF</button>
          </div>
          {db.facs.map(f => {
            const lCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
            const pCount = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
            return ( <div key={f.id} style={hStyles.recordCard}><div><b>{f.name}</b><br/><small>ID: {f.id}</small></div><div style={{textAlign:'right'}}><span style={{fontSize:'12px'}}>L:{lCount} P:{pCount}</span><br/><button onClick={async()=>{if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={{color:'#f43f5e', border:'none', background:'none'}}><Trash2 size={16}/></button></div></div> );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div>
          <div style={hStyles.formCard}>
            <h4>New Mapping</h4>
            <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option value={f.id}>{f.name}</option>)}</select>
            <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>ASSIGN</button>
          </div>
          {db.maps.map(m => (<div key={m.id} style={hStyles.row}><span><b>{m.class_name}</b> - {m.subject_name}</span><button onClick={async()=>{await supabase.from('assignments').delete().eq('id',m.id); loadData();}} style={{color:'#f43f5e', border:'none', background:'none'}}><Trash2 size={16}/></button></div>))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (UNTOUCHED) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all details!");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ OUTSIDE CAMPUS"); }
      const { data: att } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, duration: `${setup.start} - ${setup.end}`, present: marked.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Done!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}><div style={fStyles.userPlate}><div style={fStyles.miniAv}>{user.name[0]}</div><div><h4>Prof. {user.name}</h4><small>Faculty Portal</small></div></div><button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button></div>
      <div style={fStyles.section}><label style={fStyles.label}>CLASS</label><div style={fStyles.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...fStyles.tile, borderColor: setup.cl===c?'#6366f1':'#1e293b', background: setup.cl===c?'rgba(99,102,241,0.1)':'#0f172a'}}><LayoutGrid size={20}/><span style={{fontWeight:'700'}}>{c}</span></div>))}</div></div>
      {setup.cl && (<div><label style={fStyles.label}>SUBJECT</label><div style={fStyles.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}><BookOpen size={16}/> {j.subject_name}</div>))}</div>
      <label style={fStyles.label}>LECTURE TIME</label><div style={fStyles.timeRow}><div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={fStyles.timeInput}/></div><span>to</span><div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={fStyles.timeInput}/></div></div>
      <label style={fStyles.label}>MODE</label><div style={fStyles.toggleWrap}><button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.toggleBtn, background: setup.ty==='Theory'?'#fff':'transparent', color: setup.ty==='Theory'?'#000':'#fff'}}>Theory</button><button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.toggleBtn, background: setup.ty==='Practical'?'#fff':'transparent', color: setup.ty==='Practical'?'#000':'#fff'}}>Practical</button></div></div>)}
      <div style={fStyles.bottomAction}><button onClick={launch} style={fStyles.launchBtn}>START SESSION</button></div>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}><button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button><div><h3>{setup.cl}</h3><small>{setup.sub}</small></div><div style={fStyles.statsBadge}>{marked.length}/{students.length}</div></div>
      <div style={fStyles.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...fStyles.rollChip, background: marked.includes(s.id)?'linear-gradient(135deg, #6366f1, #4f46e5)':'#1e293b'}}><span style={{fontSize:'10px', opacity:0.5}}>ROLL</span><span style={{fontSize:'24px', fontWeight:'900'}}>{s.id}</span>{marked.includes(s.id) && <CheckCircle2 size={16} style={fStyles.checkIcon}/>}</div>))}</div>
      <div style={fStyles.bottomAction}><button disabled={loading} onClick={submit} style={fStyles.submitBtn}>{loading ? "SYNCING..." : `SUBMIT`}</button></div>
    </div>
  );
}

// --- STYLES ---
const hStyles = {
  wrapper: { padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tabs: { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px' },
  tabBtn: { padding: '10px 15px', borderRadius: '10px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statCard: { background: '#0f172a', padding: '15px', borderRadius: '15px', border: '1px solid #1e293b', textAlign: 'center' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#0f172a', borderRadius: '12px', marginBottom: '8px' },
  recordCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #1e293b' },
  searchBox: { display: 'flex', alignItems: 'center', background: '#0f172a', padding: '12px', borderRadius: '12px', gap: '10px', marginBottom: '10px' },
  searchIn: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' },
  actionBtn: { width: '100%', padding: '15px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px' },
  formCard: { background: '#0f172a', padding: '18px', borderRadius: '15px', border: '1px solid #1e293b', marginBottom: '20px' },
  input: { width: '100%', padding: '12px', background: '#020617', border: '1px solid #334155', borderRadius: '10px', color: '#fff', marginBottom: '10px' }
};

const fStyles = { mobileWrapper: { padding:'20px 15px 120px', minHeight:'100vh', display:'flex', flexDirection:'column' }, topBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }, userPlate: { display:'flex', alignItems:'center', gap:'12px' }, miniAv: { width:'40px', height:'40px', background:'#6366f1', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }, exitBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'8px', borderRadius:'10px' }, section: { marginBottom:'20px' }, label: { fontSize:'10px', fontWeight:'900', color:'#475569', marginBottom:'10px', display:'block' }, tileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }, tile: { height:'70px', borderRadius:'15px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'2px solid transparent' }, subList: { display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }, subRow: { padding:'14px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px' }, timeRow: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }, timeInputWrap: { flex:1, display:'flex', alignItems:'center', gap:'8px', background:'#1e293b', padding:'10px', borderRadius:'10px' }, timeInput: { background:'none', border:'none', color:'#fff', width:'100%', outline:'none' }, toggleWrap: { background:'#1e293b', padding:'4px', borderRadius:'10px', display:'flex' }, toggleBtn: { flex:1, padding:'8px', border:'none', borderRadius:'8px', fontWeight:'bold' }, bottomAction: { position:'fixed', bottom:'20px', left:'20px', right:'20px' }, launchBtn: { width:'100%', padding:'16px', borderRadius:'15px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold' }, stickyHeader: { position:'sticky', top:0, background:'rgba(2,6,23,0.9)', padding:'10px 0', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:10 }, circleBtn: { background:'#1e293b', border:'none', color:'#fff', width:'35px', height:'35px', borderRadius:'50%' }, statsBadge: { background:'#10b981', padding:'5px 10px', borderRadius:'8px', fontWeight:'bold' }, rollArea: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }, rollChip: { height:'100px', borderRadius:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' }, checkIcon: { position:'absolute', top:'5px', right:'5px' }, submitBtn: { width:'100%', padding:'18px', borderRadius:'15px', background:'#10b981', color:'#fff', border:'none', fontWeight:'bold' } };
const styles = { appWrap: { minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily:'sans-serif' }, loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center' }, glassCard: { background:'rgba(15, 23, 42, 0.8)', padding:'40px', borderRadius:'40px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' }, logoBox: { width:'70px', height:'70px', background:'#000', borderRadius:'20px', margin:'0 auto 20px', border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center' }, mainLogo: { width:'50px' }, title: { fontSize:'26px', fontWeight:'900' }, badge: { fontSize:'10px', color:'#818cf8', marginBottom:'30px' }, inputBox: { position:'relative', marginBottom:'12px' }, inIcon: { position:'absolute', left:'15px', top:'15px', color:'#475569' }, inputF: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'15px', background:'#020617', border:'1px solid #1e293b', color:'#fff', boxSizing:'border-box' }, btnMain: { width:'100%', padding:'18px', borderRadius:'15px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }, container: { maxWidth:'1200px', margin:'0 auto' } };
