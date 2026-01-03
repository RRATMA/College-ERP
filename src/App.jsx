import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  ChevronRight, LayoutGrid, Users, Download, Zap, 
  FlaskConical, GraduationCap, PlusCircle, ClipboardList, 
  Settings, Database, Activity, BookOpenCheck, UserCheck, 
  Monitor, Clock, CheckCircle2, AlertCircle, BarChart3, TrendingUp, FileWarning
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLING & ANIMATIONS ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-final-pro')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v-final-pro';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-5px); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); }
    .stat-card-new { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; transition: 0.2s; }
    input:focus { border-color: #06b6d4 !important; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 25px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; padding-bottom: 100px; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    .live-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
  `;
  document.head.appendChild(styleTag);
};

// Config: Change these to your College coordinates
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008; // Approx 80-100 meters

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Critical Error: students_list.xlsx missing in public folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div style={ui.logoCircle}><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /></div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800, letterSpacing:'-1px'}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="Faculty ID" style={{marginBottom:'12px'}} />
        <input id="p" type="password" placeholder="Passcode" style={{marginBottom:'20px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>
          SIGN IN <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL COMPONENT ---
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

  // --- STATS CALCULATION ---
  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(log => log.time_str === todayStr);
  const totalPresent = db.logs.reduce((acc, curr) => acc + (curr.present || 0), 0);
  const totalPossible = db.logs.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalAbsent = totalPossible - totalPresent;
  const attendancePercentage = totalPossible > 0 ? ((totalPresent / totalPossible) * 100).toFixed(1) : 0;
  const tToday = todayLogs.filter(l => l.type === 'Theory').length;
  const pToday = todayLogs.filter(l => l.type === 'Practical').length;

  // --- DEFAULTER LOGIC (< 75%) ---
  const downloadDefaulters = async () => {
    const { data: absRecords } = await supabase.from('absentee_records').select('student_roll, class_name');
    if (!absRecords) return alert("No absence data found");

    const classTotal = db.logs.reduce((acc, log) => { acc[log.class] = (acc[log.class] || 0) + 1; return acc; }, {});
    const studentAbsents = absRecords.reduce((acc, rec) => {
      const key = `${rec.class_name}_${rec.student_roll}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const defaulters = [];
    const uniqueStudentKeys = [...new Set(absRecords.map(a => `${a.class_name}_${a.student_roll}`))];

    uniqueStudentKeys.forEach(key => {
      const [cls, roll] = key.split('_');
      const totalLec = classTotal[cls] || 0;
      const absCount = studentAbsents[key] || 0;
      const preCount = totalLec - absCount;
      const perc = totalLec > 0 ? ((preCount / totalLec) * 100).toFixed(2) : 0;

      if (parseFloat(perc) < 75) {
        defaulters.push({ Class: cls, RollNo: roll, Total: totalLec, Present: preCount, Absent: absCount, Percentage: perc + "%" });
      }
    });

    const ws = XLSX.utils.json_to_sheet(defaulters);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, `Defaulters_Below_75_${todayStr}.xlsx`);
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #06b6d4'}} />
          <div><h3 style={{margin:0}}>HOD Dashboard</h3><div style={{display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', color:'#10b981'}}><div className="live-dot"></div> SYSTEM ONLINE</div></div>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={22}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b', border: tab===t?'1px solid #06b6d4':'1px solid transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="dashboard-grid">
            <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database size={22}/></div><div><h2 style={{margin:0}}>{db.logs.length}</h2><p style={ui.dashLabel}>TOTAL SESSIONS</p></div></div>
            <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck size={22}/></div><div><h2 style={{margin:0}}>{db.facs.length}</h2><p style={ui.dashLabel}>FACULTY COUNT</p></div></div>
            <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck size={22}/></div><div><h2 style={{margin:0}}>{excelSheets.length}</h2><p style={ui.dashLabel}>ACTIVE CLASSES</p></div></div>
            <div className="glass-card stat-card-new"><div style={{display:'flex', justifyContent:'space-between'}}><div className="icon-box" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}><TrendingUp size={22}/></div><span style={{fontSize:'12px', fontWeight:'800', color:'#f59e0b'}}>{attendancePercentage}%</span></div><div><h2 style={{margin:0}}>{totalPresent}P / {totalAbsent}A</h2><p style={ui.dashLabel}>STUDENT ATTENDANCE</p></div></div>
            <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><Zap size={22}/></div><div><h2 style={{margin:0}}>{todayLogs.length}</h2><p style={ui.dashLabel}>LOGS TODAY</p></div></div>
            <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(99,102,241,0.1)', color:'#6366f1'}}><BarChart3 size={22}/></div><div><h2 style={{margin:0}}>{tToday}T | {pToday}P</h2><p style={ui.dashLabel}>THEORY vs PRACTICAL</p></div></div>
          </div>
          <div className="glass-card" style={{padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:'6px solid #f43f5e'}}>
            <div><h4 style={{margin:0, color:'#f43f5e'}}>Defaulter Analysis</h4><p style={{margin:0, fontSize:'12px', color:'#64748b'}}>Download list of students with attendance below 75%</p></div>
            <button onClick={downloadDefaulters} style={{background:'#f43f5e', color:'#fff', border:'none', padding:'12px 20px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', display:'flex', gap:'8px'}}><FileWarning size={18}/> EXPORT DEFAULTERS</button>
          </div>
        </>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={ui.label}>REGISTER NEW FACULTY</p>
            <input placeholder="Name" style={{marginBottom:'10px'}} onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}><input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/><input placeholder="Pass" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/></div>
            <button style={ui.primaryBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>CREATE ACCOUNT</button>
          </div>
          {db.facs.map(f => {
            const sLogs = db.logs.filter(l => l.faculty === f.name);
            const sT = sLogs.filter(l => l.type === 'Theory').length;
            const sP = sLogs.filter(l => l.type === 'Practical').length;
            return (
              <div key={f.id} style={ui.feedRow} className="glass-card">
                <div><b>{f.name}</b><br/><small style={{color:'#64748b'}}>ID: {f.id} | Theory: <span style={{color:'#06b6d4'}}>{sT}</span> | Lab: <span style={{color:'#10b981'}}>{sP}</span></small></div>
                <button onClick={async()=>{if(window.confirm('Delete?')){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={ui.delBtn}><Trash2 size={18}/></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <p style={ui.label}>ACADEMIC ASSIGNMENT</p>
          <select style={{marginBottom:'10px'}} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginBottom:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" style={{marginBottom:'15px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>CONFIRM LOAD</button>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <input placeholder="Search logs..." style={{flex:1}} onChange={e=>setSearchTerm(e.target.value)}/>
            <button style={{background:'#10b981', padding:'0 15px', color:'#fff', borderRadius:'12px', border:'none'}} onClick={()=>{
                const ws = XLSX.utils.json_to_sheet(db.logs);
                const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Logs");
                XLSX.writeFile(wb, "Master_Attendance.xlsx");
            }}><Download size={20}/></button>
          </div>
          {db.logs.filter(l=>(l.class+l.sub+l.faculty).toLowerCase().includes(searchTerm.toLowerCase())).map(log=>(
            <div key={log.id} style={ui.feedRow} className="glass-card">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL COMPONENT ---
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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all session details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Access Denied: You must be on Campus to sync attendance."); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("Attendance Synced Successfully!"); setView('login');
    }, () => { setLoading(false); alert("GPS Error: Enable location permissions."); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Faculty Portal</small><h4>Prof. {user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>SELECT CLASS</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      {setup.cl && (
        <div style={{marginTop: '20px'}}>
          <p style={ui.label}>SELECT SUBJECT</p>
          <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}</div>
          <p style={ui.label}>TIME & TYPE</p>
          <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          <div style={{display:'flex', gap:'10px', marginBottom: '25px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, background: setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>Theory</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, background: setup.ty==='Practical'?'#10b981':'#1e293b'}}>Practical</button>
          </div>
          <button onClick={launch} style={ui.primaryBtn}><Zap size={18}/> START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "VERIFYING GPS..." : "SYNC TO SERVER"}</button>
    </div>
  );
}

// --- STYLING OBJECT ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '40px', width: '300px', textAlign: 'center' },
  logoCircle: { width: '85px', height: '85px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #06b6d4', overflow:'hidden' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { padding: '12px 20px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '11px', color: '#fff', cursor: 'pointer', flexShrink: 0 },
  primaryBtn: { width: '100%', padding: '16px', backgrou
