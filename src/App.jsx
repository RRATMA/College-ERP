import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  ChevronRight, LayoutGrid, Users, Download, Zap, 
  FlaskConical, GraduationCap, PlusCircle, ClipboardList, 
  Settings, Database, Activity, BookOpenCheck, UserCheck, 
  Monitor, Clock, CheckCircle2, AlertCircle, BarChart3, TrendingUp, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLING (Tu dilya pramane exact style) ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-final-pro')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v-final-pro';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-5px); }
    .stat-card-new { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; transition: 0.2s; width: 100%; box-sizing: border-box; }
    input:focus { border-color: #06b6d4 !important; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
  `;
  document.head.appendChild(styleTag);
};

// --- CONFIGURATION ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel file not found in public folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed: Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div style={ui.logoCircle}><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /></div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" />
        <input id="p" type="password" placeholder="Passcode" style={{marginTop:'10px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{...ui.primaryBtn, marginTop:'20px'}}>ENTER SYSTEM <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} excelSheets={excelSheets} />}</div>;
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadData(); }, []);

  // --- DOWNLOAD REPORTS ---
  const downloadAttendance = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Attendance");
    XLSX.writeFile(wb, "Amrit_Full_Attendance.xlsx");
  };

  const downloadDefaulters = () => {
    const defCounts = db.abs.reduce((acc, curr) => {
      acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1;
      return acc;
    }, {});
    const defData = Object.entries(defCounts).map(([roll, count]) => ({
      "Roll No": roll, "Total Absences": count, "Defaulter Status": count > 4 ? "CRITICAL" : "NORMAL"
    })).sort((a,b) => b["Total Absences"] - a["Total Absences"]);
    const ws = XLSX.utils.json_to_sheet(defData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulter_List");
    XLSX.writeFile(wb, "Amrit_Defaulters.xlsx");
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}><h3>HOD Dashboard</h3><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      
      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h2>{db.logs.length}</h2><p style={ui.label}>TOTAL LECTURES</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck/></div><div><h2>{db.facs.length}</h2><p style={ui.label}>STAFF COUNT</p></div></div>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <input placeholder="Filter logs..." style={{flex:1}} onChange={e=>setSearchTerm(e.target.value)}/>
            <button style={{background:'#10b981', color:'#fff', padding:'12px', borderRadius:'12px', border:'none'}} onClick={downloadAttendance}><Download size={20}/></button>
            <button style={{background:'#f59e0b', color:'#fff', padding:'12px', borderRadius:'12px', border:'none'}} onClick={downloadDefaulters}><FileDown size={20}/></button>
          </div>
          <div style={{maxHeight:'60vh', overflowY:'auto'}} className="scroll-hide">
            {db.logs.filter(l=>(l.class+l.sub+l.faculty).toLowerCase().includes(searchTerm.toLowerCase())).map(log=>(
              <div key={log.id} style={ui.feedRow} className="glass-card">
                <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
                <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={ui.label}>NEW FACULTY</p>
            <input placeholder="Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="ID" style={{marginTop:'10px'}} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Pass" type="password" style={{marginTop:'10px'}} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={{...ui.primaryBtn, marginTop:'15px'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>REGISTER</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={ui.feedRow} className="glass-card">
              <span>{f.name} (ID: {f.id})</span>
              <button onClick={async()=>{if(window.confirm('Remove Faculty?')){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={ui.delBtn}><Trash2/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <p style={ui.label}>ASSIGN CLASS & SUBJECT</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Teacher</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject" style={{marginTop:'10px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, marginTop:'15px', background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData(); alert("Mapped!");}}>MAP SUBJECT</button>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user, setView, excelSheets }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const startSession = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[excelSheets.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const finalSync = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Error: Out of College Campus!"); }
      
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: tStr 
      }]).select().single();
      
      // ABSENTEE LOGIC (Tu dilya pramane exact logic)
      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, 
        student_roll: s.id, 
        class_name: setup.cl,
        subject: setup.sub, 
        date: tStr 
      }));
      
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);
      alert("Attendance Synced Successfully!"); setView('login');
    }, () => { setLoading(false); alert("GPS Required for Sync"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Teacher</small><h4>{user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>MY CLASSES</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      {setup.cl && (
        <div style={{marginTop:'20px'}}>
          <p style={ui.label}>MY SUBJECTS</p>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.tabBtn, flex:1, background:setup.ty==='Theory'?'#0891b2':'#1e293b'}}>Theory</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.tabBtn, flex:1, background:setup.ty==='Practical'?'#10b981':'#1e293b'}}>Practical</button>
          </div>
          <button onClick={startSession} style={{...ui.primaryBtn, marginTop:'20px', padding:'20px'}}><Zap size={18}/> TAKE ATTENDANCE</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={finalSync} style={ui.submitBtn}>{loading ? "VERIFYING GPS..." : "SYNC TO SERVER"}</button>
    </div>
  );
}

// --- UI OBJECTS ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginCard: { padding: '40px', width: '300px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', margin: '0 auto 20px', border: '1px solid #06b6d4' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { padding: '12px 20px', borderRadius: '14px', border: 'none', fontWeight: 'bold', color: '#fff', cursor: 'pointer', whiteSpace:'nowrap' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  mobileWrap: { padding: '20px' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { padding: '25px', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', color: '#fff' },
  subRow: { padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', color: '#fff', marginBottom: '8px' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  rollChip: { padding: '18px 5px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', color: '#fff' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '20px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', zIndex: 10 },
  badge: { background: '#10b981', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderRadius:'18px', marginBottom:'10px' }
};
