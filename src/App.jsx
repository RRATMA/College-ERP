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

// --- GLOBAL STYLING ---
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
    .defaulter-alert { grid-column: span 2; border: 1px solid rgba(244, 63, 94, 0.4) !important; background: linear-gradient(to right, rgba(244, 63, 94, 0.1), transparent) !important; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; transition: 0.2s; }
    input:focus { border-color: #06b6d4 !important; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    @media (max-width: 600px) { .defaulter-alert { grid-column: span 1; } }
  `;
  document.head.appendChild(styleTag);
};

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
    }).catch(() => console.error("Excel mapping source missing"));
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
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" style={ui.input} />
        <input id="p" type="password" placeholder="Passcode" style={ui.input} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>
          ENTER SYSTEM <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

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

  // --- DEFAULTER ENGINE LOGIC ---
  const downloadDefaulterList = async () => {
    const { data: allAbsent } = await supabase.from('absentee_records').select('student_roll, class_name');
    if(!allAbsent) return alert("No records found");

    // Count sessions per class
    const sessionCount = db.logs.reduce((acc, log) => {
      acc[log.class] = (acc[log.class] || 0) + 1;
      return acc;
    }, {});

    // Count absents per student
    const studentAbsents = allAbsent.reduce((acc, rec) => {
      const key = `${rec.class_name}_${rec.student_roll}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const report = [];
    const uniqueKeys = [...new Set(allAbsent.map(a => `${a.class_name}_${a.student_roll}`))];

    uniqueKeys.forEach(key => {
      const [cls, roll] = key.split('_');
      const totalLectures = sessionCount[cls] || 0;
      const absents = studentAbsents[key] || 0;
      const present = totalLectures - absents;
      const percentage = totalLectures > 0 ? ((present / totalLectures) * 100).toFixed(2) : 0;

      if(parseFloat(percentage) < 75) {
        report.push({ 
          "Class": cls, 
          "Roll Number": roll, 
          "Total Lectures": totalLectures, 
          "Attended": present, 
          "Percentage": percentage + "%",
          "Status": "DEFAULTER"
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, "Defaulter_List_Below_75.xlsx");
  };

  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(log => log.time_str === todayStr);
  const totalPresent = db.logs.reduce((a, c) => a + (c.present || 0), 0);
  const totalPossible = db.logs.reduce((a, c) => a + (c.total || 0), 0);
  const avgAttendance = totalPossible > 0 ? ((totalPresent / totalPossible) * 100).toFixed(1) : 0;

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'38px', height:'38px', borderRadius:'50%', border:'2px solid #06b6d4'}} />
          <h3 style={{margin:0}}>HOD Panel</h3>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database size={22}/></div>
            <div><h2 style={{margin:0}}>{db.logs.length}</h2><p style={ui.dashLabel}>TOTAL LOGS</p></div>
          </div>
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck size={22}/></div>
            <div><h2 style={{margin:0}}>{db.facs.length}</h2><p style={ui.dashLabel}>STAFF</p></div>
          </div>
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck size={22}/></div>
            <div><h2 style={{margin:0}}>{excelSheets.length}</h2><p style={ui.dashLabel}>CLASSES</p></div>
          </div>
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}><TrendingUp size={22}/></div>
            <div><h2 style={{margin:0}}>{avgAttendance}%</h2><p style={ui.dashLabel}>AVG ATTENDANCE</p></div>
          </div>
          
          {/* DEFAULTER FEATURE CARD */}
          <div className="glass-card stat-card-new defaulter-alert" onClick={downloadDefaulterList} style={{cursor:'pointer'}}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
               <div className="icon-box" style={{background:'rgba(244,63,94,0.2)', color:'#f43f5e', marginBottom:0}}><FileWarning size={24}/></div>
               <div>
                  <h3 style={{margin:0, color:'#f43f5e'}}>Download Defaulter List</h3>
                  <p style={{margin:0, fontSize:'12px', opacity:0.7}}>Get list of students below 75% attendance</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <input placeholder="Search logs..." style={ui.input} onChange={e=>setSearchTerm(e.target.value)}/>
          <div style={{marginTop:'20px'}}>
            {db.logs.filter(l=>(l.class+l.sub).toLowerCase().includes(searchTerm.toLowerCase())).map(log=>(
              <div key={log.id} style={ui.feedRow} className="glass-card">
                <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
                <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={ui.label}>ADD NEW FACULTY</p>
            <input placeholder="Name" style={ui.input} onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
              <input placeholder="ID" style={ui.input} onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Password" type="password" style={ui.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={{...ui.primaryBtn, marginTop:'15px'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>REGISTER</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={ui.feedRow} className="glass-card">
              <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
              <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadData();}} style={ui.delBtn}><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <p style={ui.label}>ASSIGN LOAD</p>
          <select style={ui.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{...ui.input, marginTop:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject" style={{...ui.input, marginTop:'10px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, marginTop:'20px'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>ASSIGN</button>
        </div>
      )}
    </div>
  );
}

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
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill all details");
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
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Out of Campus Radius"); }
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Success"); setView('login');
    }, () => { setLoading(false); alert("GPS Required"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Welcome,</small><h4>{user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>SELECT CLASS</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      {setup.cl && (
        <div style={{marginTop: '20px'}}>
          <p style={ui.label}>SUBJECT</p>
          <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}</div>
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input type="time" style={ui.input} onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" style={ui.input} onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          <div style={{display:'flex', gap:'10px', marginTop: '15px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, background: setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>Theory</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, background: setup.ty==='Practical'?'#10b981':'#1e293b'}}>Practical</button>
          </div>
          <button onClick={launch} style={{...ui.primaryBtn, marginTop:'25px'}}><Zap size={18}/> START</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "WAIT..." : "SAVE ATTENDANCE"}</button>
    </div>
  );
}

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '40px', width: '280px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #06b6d4', overflow:'hidden' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { padding: '10px 18px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '11px', color: '#fff', cursor: 'pointer', flexShrink: 0 },
  input: { width: '100%', padding: '14px', borderRadius: '12px', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  mobileWrap: { padding: '20px' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { padding: '20px', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer' },
  subList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  subRow: { padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer' },
  typeBtn: { flex: 1, padding: '12px', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' },
  dashLabel: { fontSize: '10px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1px', marginTop: '5px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  rollChip: { padding: '15px 5px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#fff', cursor: 'pointer' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '18px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', zIndex: 10, cursor: 'pointer' },
  badge: { background: '#10b981', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff', cursor: 'pointer' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderRadius:'18px', marginBottom:'10px' }
};
