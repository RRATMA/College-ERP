import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Clock, AlertTriangle, Users,
  BarChart3, PlusCircle, ShieldCheck, UserPlus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

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
      else alert("Login Failed!");
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
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} isMobile={isMobile} setView={setView} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (NEW DESIGNER UI) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('analytics');
  const [db, setDb] = useState({ facs: [], logs: [], critical: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    setLoading(true);
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], critical: c || [] });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const downloadReport = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "HOD_Master_Report.xlsx");
  };

  return (
    <div style={hStyles.wrapper}>
      <div style={hStyles.header}>
        <div><h2 style={{margin:0, fontSize:'24px'}}>HOD Console</h2><small style={{color:'#818cf8'}}>Department Management</small></div>
        <button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button>
      </div>

      <div style={hStyles.tabBar}>
        <button onClick={()=>setTab('analytics')} style={{...hStyles.tabItem, color: tab==='analytics'?'#6366f1':'#475569'}}><BarChart3 size={20}/><span>Stats</span></button>
        <button onClick={()=>setTab('logs')} style={{...hStyles.tabItem, color: tab==='logs'?'#6366f1':'#475569'}}><FileSpreadsheet size={20}/><span>Logs</span></button>
        <button onClick={()=>setTab('manage')} style={{...hStyles.tabItem, color: tab==='manage'?'#6366f1':'#475569'}}><PlusCircle size={20}/><span>Manage</span></button>
      </div>

      <div style={{animation: 'fadeIn 0.4s ease'}}>
        {tab === 'analytics' && (
          <div style={hStyles.section}>
             <div style={hStyles.statsGrid}>
                <div style={hStyles.statCard}><Users color="#6366f1"/><h2 style={{margin:'10px 0 5px 0'}}>{db.facs.length}</h2><p style={{margin:0, fontSize:'12px', opacity:0.6}}>Active Faculty</p></div>
                <div style={hStyles.statCard}><ShieldCheck color="#10b981"/><h2 style={{margin:'10px 0 5px 0'}}>{db.logs.length}</h2><p style={{margin:0, fontSize:'12px', opacity:0.6}}>Sessions</p></div>
             </div>
             <h4 style={hStyles.sectionTitle}>CRITICAL ATTENDANCE</h4>
             {db.critical.length === 0 ? <p style={{textAlign:'center', opacity:0.5}}>No alerts found.</p> : 
               db.critical.map((c, i) => (
                 <div key={i} style={hStyles.critCard}>
                    <AlertTriangle color="#f43f5e" size={18}/>
                    <div style={{flex:1}}><b>Roll No: {c.student_roll}</b><br/><small>{c.class_name} • Absent: {c.absent_count} times</small></div>
                 </div>
               ))
             }
          </div>
        )}

        {tab === 'logs' && (
          <div style={hStyles.section}>
            <button onClick={downloadReport} style={hStyles.downloadBtn}><Download size={16}/> Download Excel Report</button>
            {db.logs.map(log => (
              <div key={log.id} style={hStyles.logCard}>
                <div style={{flex:1}}><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.duration}</small></div>
                <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        )}

        {tab === 'manage' && (
          <div style={hStyles.section}>
            <div style={hStyles.formCard}>
              <h4 style={{marginTop:0}}><UserPlus size={18}/> Add New Faculty</h4>
              <input placeholder="Full Name" style={hStyles.input} onChange={e=>setForm({...form, name:e.target.value})}/>
              <input placeholder="Employee ID" style={hStyles.input} onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Passcode" type="password" style={hStyles.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
              <button style={hStyles.actionBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData(); alert("Faculty Added!");}}>REGISTER FACULTY</button>
            </div>

            <div style={{...hStyles.formCard, marginTop:'15px'}}>
              <h4 style={{marginTop:0}}><Layers size={18}/> Faculty Mapping</h4>
              <select style={hStyles.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
              <select style={hStyles.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
              <input placeholder="Subject Name" style={hStyles.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
              <button style={{...hStyles.actionBtn, background:'#10b981'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); alert("Mapping Successful!");}}>ASSIGN SUBJECT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (UNCHANGED UI AS PER REQUEST) ---
function FacultyPanel({ user, isMobile, setView }) {
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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Please fill all details including Time!");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ OUTSIDE CAMPUS RANGE"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start} - ${setup.end}`,
        present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Attendance Submitted!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}>
        <div style={fStyles.userPlate}>
          <div style={fStyles.miniAv}>{user.name[0]}</div>
          <div><h4 style={{margin:0}}>Prof. {user.name}</h4><small style={{color:'#818cf8'}}>Faculty Portal</small></div>
        </div>
        <button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button>
      </div>

      <div style={fStyles.section}>
        <label style={fStyles.label}>SELECT CLASS</label>
        <div style={fStyles.tileGrid}>
          {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
            <div key={c} onClick={()=>setSetup({...setup, cl:c})} 
                 style={{...fStyles.tile, borderColor: setup.cl===c?'#6366f1':'#1e293b', background: setup.cl===c?'rgba(99,102,241,0.1)':'#0f172a'}}>
              <LayoutGrid size={20} color={setup.cl===c?'#6366f1':'#475569'}/>
              <span style={{fontWeight:'700', color:setup.cl===c?'#fff':'#94a3b8'}}>{c}</span>
              {setup.cl===c && <div style={fStyles.activeDot}/>}
            </div>
          ))}
        </div>
      </div>

      {setup.cl && (
        <div style={{animation:'fadeIn 0.3s ease'}}>
          <label style={fStyles.label}>SELECT SUBJECT</label>
          <div style={fStyles.subList}>
            {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
              <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} 
                   style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}>
                <BookOpen size={16}/> {j.subject_name}
              </div>
            ))}
          </div>

          <label style={fStyles.label}>LECTURE TIME</label>
          <div style={fStyles.timeRow}>
            <div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={fStyles.timeInput}/></div>
            <span style={{color:'#475569'}}>to</span>
            <div style={fStyles.timeInputWrap}><Clock size={14}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={fStyles.timeInput}/></div>
          </div>

          <label style={fStyles.label}>MODE</label>
          <div style={fStyles.toggleWrap}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.toggleBtn, background: setup.ty==='Theory'?'#fff':'transparent', color: setup.ty==='Theory'?'#000':'#fff'}}>Theory</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.toggleBtn, background: setup.ty==='Practical'?'#fff':'transparent', color: setup.ty==='Practical'?'#000':'#fff'}}>Practical</button>
          </div>
        </div>
      )}

      <div style={fStyles.bottomAction}>
        <button onClick={launch} style={fStyles.launchBtn}>START SESSION <ChevronRight/></button>
      </div>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button>
          <div><h3 style={{margin:0}}>{setup.cl}</h3><small style={{color:'#818cf8'}}>{setup.sub}</small></div>
        </div>
        <div style={fStyles.statsBadge}><b>{marked.length}</b>/{students.length}</div>
      </div>

      <div style={fStyles.rollArea}>
        {students.map(s => (
          <div key={s.id} onClick={() => { if(window.navigator.vibrate) window.navigator.vibrate(10); setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}}
               style={{...fStyles.rollChip, background: marked.includes(s.id)?'linear-gradient(135deg, #6366f1, #4f46e5)':'#1e293b', border: marked.includes(s.id)?'none':'1px solid #334155'}}>
            <span style={{fontSize:'10px', opacity:0.5, fontWeight:'800'}}>ROLL</span>
            <span style={{fontSize:'24px', fontWeight:'900'}}>{s.id}</span>
            {marked.includes(s.id) && <CheckCircle2 size={16} style={fStyles.checkIcon}/>}
          </div>
        ))}
      </div>

      <div style={fStyles.bottomAction}>
        <button disabled={loading} onClick={submit} style={{...fStyles.submitBtn, background: loading?'#334155':'#10b981'}}>
          {loading ? "SYNCING GPS..." : `SUBMIT ${marked.length} ATTENDANCE`}
        </button>
      </div>
    </div>
  );
}

// --- STYLING (HOD & FACULTY FIXED) ---
const hStyles = {
  wrapper: { padding:'20px 15px 100px 15px', minHeight:'100vh' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' },
  tabBar: { display:'flex', background:'#0f172a', borderRadius:'20px', padding:'8px', gap:'5px', marginBottom:'25px', border:'1px solid #1e293b' },
  tabItem: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', background:'none', border:'none', padding:'10px', fontSize:'11px', fontWeight:'800' },
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'25px' },
  statCard: { background:'#0f172a', padding:'20px', borderRadius:'22px', border:'1px solid #1e293b', textAlign:'center' },
  sectionTitle: { fontSize:'10px', fontWeight:'900', color:'#475569', letterSpacing:'1.5px', marginBottom:'15px' },
  critCard: { display:'flex', alignItems:'center', gap:'12px', background:'rgba(244,63,94,0.1)', padding:'15px', borderRadius:'18px', marginBottom:'10px', border:'1px solid rgba(244,63,94,0.2)' },
  logCard: { display:'flex', alignItems:'center', background:'#0f172a', padding:'18px', borderRadius:'20px', border:'1px solid #1e293b', marginBottom:'10px' },
  downloadBtn: { width:'100%', padding:'15px', borderRadius:'15px', background:'#1e293b', color:'#fff', border:'1px solid #334155', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'15px' },
  formCard: { background:'#0f172a', padding:'20px', borderRadius:'22px', border:'1px solid #1e293b' },
  input: { width:'100%', padding:'14px', borderRadius:'12px', background:'#020617', border:'1px solid #334155', color:'#fff', marginBottom:'12px', outline:'none', boxSizing:'border-box' },
  actionBtn: { width:'100%', padding:'16px', borderRadius:'15px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'900' }
};

const fStyles = {
  mobileWrapper: { padding:'20px 15px 120px 15px', minHeight:'100vh', display:'flex', flexDirection:'column' },
  topBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px' },
  userPlate: { display:'flex', alignItems:'center', gap:'12px' },
  miniAv: { width:'42px', height:'42px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900' },
  exitBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'10px', borderRadius:'12px' },
  section: { marginBottom:'25px' },
  label: { fontSize:'10px', fontWeight:'900', color:'#475569', letterSpacing:'1.5px', marginBottom:'12px', display:'block' },
  tileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  tile: { height:'75px', borderRadius:'18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'5px', border:'2px solid transparent', position:'relative' },
  activeDot: { position:'absolute', top:'8px', right:'8px', width:'6px', height:'6px', background:'#6366f1', borderRadius:'50%' },
  subList: { display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' },
  subRow: { padding:'16px', borderRadius:'15px', fontWeight:'700', fontSize:'13px', display:'flex', alignItems:'center', gap:'10px' },
  timeRow: { display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' },
  timeInputWrap: { flex:1, display:'flex', alignItems:'center', gap:'8px', background:'#1e293b', padding:'12px', borderRadius:'12px', color:'#94a3b8' },
  timeInput: { background:'none', border:'none', color:'#fff', outline:'none', fontSize:'14px', width:'100%' },
  toggleWrap: { background:'#1e293b', padding:'4px', borderRadius:'12px', display:'flex' },
  toggleBtn: { flex:1, padding:'10px', border:'none', borderRadius:'9px', fontWeight:'800', fontSize:'11px' },
  bottomAction: { position:'fixed', bottom:'20px', left:'20px', right:'20px', zIndex:100 },
  launchBtn: { width:'100%', padding:'18px', borderRadius:'18px', border:'none', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', fontWeight:'900', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  stickyHeader: { position:'sticky', top:'0', background:'rgba(2, 6, 23, 0.9)', backdropFilter:'blur(10px)', padding:'10px 0', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:100, marginBottom:'15px' },
  circleBtn: { background:'#1e293b', border:'none', color:'#fff', width:'40px', height:'40px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' },
  statsBadge: { background:'#10b981', padding:'6px 12px', borderRadius:'10px', fontWeight:'900' },
  rollArea: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' },
  rollChip: { height:'105px', borderRadius:'22px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' },
  checkIcon: { position:'absolute', top:'8px', right:'8px', color:'#fff' },
  submitBtn: { width:'100%'
