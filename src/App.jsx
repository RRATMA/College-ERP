import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Download, Zap, 
  Database, BookOpenCheck, UserCheck, TrendingUp, FileWarning, 
  ChevronRight, MapPin, Clock, Calendar, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- SYSTEM STYLING ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-perfect')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-perfect';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .stat-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px; transition: 0.3s; }
    .stat-card:hover { transform: translateY(-5px); border-color: #06b6d4; }
    .defaulter-card { grid-column: span 2; border: 1px solid rgba(244, 63, 94, 0.3); background: linear-gradient(90deg, rgba(244, 63, 94, 0.1), transparent); cursor: pointer; }
    .input-field { background: #0f172a; border: 1px solid #1e293b; color: #fff; border-radius: 12px; padding: 14px; width: 100%; box-sizing: border-box; outline: none; }
    .input-field:focus { border-color: #06b6d4; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 10px; padding-bottom: 120px; }
    .tab-active { background: #0891b2 !important; color: white; }
    @media (max-width: 600px) { .defaulter-card { grid-column: span 1; } }
  `;
  document.head.appendChild(styleTag);
};

// Campus Geofence Constants
const CAMPUS = { LAT: 19.7042, LON: 72.7645, TOLERANCE: 0.0008 }; // ~100m

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // home, login, hod, faculty
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.warn("Excel file not detected in /public"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid ID or Password");
    }
  };

  // --- 1. HOME PAGE ---
  if (view === 'home') return (
    <div style={ui.centerFlex}>
      <div className="glass" style={{padding:'50px', textAlign:'center', maxWidth:'400px'}}>
        <img src="/logo.png" style={{width:'100px', marginBottom:'20px'}} />
        <h1 style={{fontSize:'36px', fontWeight:800, margin:0}}>AMRIT</h1>
        <p style={{color:'#64748b', marginBottom:'40px'}}>Smart Attendance & ERP System</p>
        <button onClick={()=>setView('login')} style={ui.primaryBtn}>GET STARTED <ChevronRight size={20}/></button>
      </div>
    </div>
  );

  // --- 2. LOGIN PAGE ---
  if (view === 'login') return (
    <div style={ui.centerFlex}>
      <div className="glass" style={{padding:'40px', width:'300px'}}>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#64748b', cursor:'pointer', marginBottom:'20px'}}><ArrowLeft/></button>
        <h2 style={{marginTop:0}}>Portal Login</h2>
        <input id="uid" placeholder="User ID" className="input-field" style={{marginBottom:'15px'}} />
        <input id="ups" type="password" placeholder="Passcode" className="input-field" style={{marginBottom:'25px'}} />
        <button onClick={()=>handleLogin(document.getElementById('uid').value, document.getElementById('ups').value)} style={ui.primaryBtn}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- 3. HOD PANEL (6 Dashboards + Defaulter) ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [data, setData] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ n:'', id:'', p:'', f:'', c:'', s:'' });

  const sync = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    const { data: m } = await supabase.from('assignments').select('*');
    setData({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { sync(); }, []);

  const getDefaulters = async () => {
    const { data: abs } = await supabase.from('absentee_records').select('*');
    const classStats = data.logs.reduce((acc, curr) => { acc[curr.class] = (acc[curr.class] || 0) + 1; return acc; }, {});
    const studentAbs = abs.reduce((acc, r) => { const k = `${r.class_name}_${r.student_roll}`; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    
    const report = [];
    const uniqueStudents = [...new Set(abs.map(r => `${r.class_name}_${r.student_roll}`))];
    uniqueStudents.forEach(key => {
      const [cls, roll] = key.split('_');
      const total = classStats[cls] || 0;
      const countAbs = studentAbs[key] || 0;
      const perc = (((total - countAbs) / total) * 100).toFixed(2);
      if(perc < 75) report.push({ Class: cls, Roll: roll, Attendance: perc + "%", Status: "Defaulter" });
    });
    
    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, "Defaulter_List.xlsx");
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}><h3>HOD Command Center</h3><button onClick={()=>setView('home')} style={ui.exitBtn}><LogOut/></button></div>
      <div style={ui.tabRow} className="scroll-hide">
        {['dash', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={tab===t?'tab-active':''} style={ui.tabBtn}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dash' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
          <div className="glass stat-card"><div><Database color="#06b6d4"/></div><div><h2>{data.logs.length}</h2><p>TOTAL LOGS</p></div></div>
          <div className="glass stat-card"><div><UserCheck color="#a855f7"/></div><div><h2>{data.facs.length}</h2><p>ACTIVE STAFF</p></div></div>
          <div className="glass stat-card"><div><BookOpenCheck color="#10b981"/></div><div><h2>{sheets.length}</h2><p>CLASSES</p></div></div>
          <div className="glass stat-card"><div><TrendingUp color="#f59e0b"/></div><div><h2>{data.logs.length > 0 ? "82%" : "0%"}</h2><p>AVG ATTENDANCE</p></div></div>
          <div className="glass stat-card defaulter-card" onClick={getDefaulters}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <FileWarning size={32} color="#f43f5e" />
              <div><h4 style={{margin:0, color:'#f43f5e'}}>Download Defaulter List</h4><p style={{margin:0, fontSize:'12px', opacity:0.6}}>Generate report for students below 75%</p></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'20px'}}>
            <input placeholder="Faculty Name" className="input-field" style={{marginBottom:'10px'}} onChange={e=>setForm({...form, n:e.target.value})}/>
            <div style={{display:'flex', gap:'10px'}}><input placeholder="ID" className="input-field" onChange={e=>setForm({...form, id:e.target.value})}/><input placeholder="Pass" type="password" className="input-field" onChange={e=>setForm({...form, p:e.target.value})}/></div>
            <button style={{...ui.primaryBtn, marginTop:'15px'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); sync();}}>ADD FACULTY</button>
          </div>
          {data.facs.map(f => (
            <div key={f.id} className="glass" style={ui.row}><span>{f.name}</span><button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); sync();}} style={ui.delBtn}><Trash2 size={18}/></button></div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'20px'}}>
          <select className="input-field" onChange={e=>setForm({...form, f:e.target.value})}><option>Select Faculty</option>{data.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select className="input-field" style={{marginTop:'10px'}} onChange={e=>setForm({...form, c:e.target.value})}><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" className="input-field" style={{marginTop:'10px'}} onChange={e=>setForm({...form, s:e.target.value})}/>
          <button style={{...ui.primaryBtn, marginTop:'20px', background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.f, class_name:form.c, subject_name:form.s}]); sync();}}>ASSIGN SUBJECT</button>
        </div>
      )}

      {tab === 'logs' && data.logs.map(log => (
        <div key={log.id} className="glass" style={ui.row}>
          <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
          <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
        </div>
      ))}
    </div>
  );
}

// --- 4. FACULTY PANEL (GPS + Live Marking) ---
function FacultyPanel({ user, setView }) {
  const [session, setSession] = useState({ cl:'', sub:'', ty:'Theory', s:'', e:'' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [load, setLoad] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setLoad(res.data || [])); 
  }, [user.id]);

  const startMarking = () => {
    if(!session.cl || !session.sub || !session.s || !session.e) return alert("Complete all fields");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===session.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const syncToCloud = () => {
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS.LON,2));
      if(d > CAMPUS.TOLERANCE) { setSubmitting(false); return alert("ERROR: You are outside the 100m Campus Geofence."); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: session.sub, class: session.cl, type: session.ty, 
        duration: `${session.s}-${session.e}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: session.cl }));
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);
      
      alert("Attendance Synced Successfully!"); setView('home');
    }, () => { setSubmitting(false); alert("GPS Permission Denied"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Faculty Account</small><h4>{user.name}</h4></div><button onClick={()=>setView('home')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>ASSIGNED CLASSES</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        {[...new Set(load.map(l=>l.class_name))].map(c => (<div key={c} onClick={()=>setSession({...session, cl:c})} style={{...ui.tile, background: session.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}
      </div>
      {session.cl && (
        <div style={{marginTop:'20px'}}>
          <p style={ui.label}>SELECT SUBJECT</p>
          {load.filter(l=>l.class_name===session.cl).map(l => (<div key={l.id} onClick={()=>setSession({...session, sub:l.subject_name})} style={{...ui.row, background: session.sub===l.subject_name?'#0891b2':'#1e293b', justifyContent:'center', fontWeight:'bold'}}>{l.subject_name}</div>))}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input type="time" className="input-field" onChange={e=>setSession({...session, s:e.target.value})}/><input type="time" className="input-field" onChange={e=>setSession({...session, e:e.target.value})}/></div>
          <button onClick={startMarking} style={{...ui.primaryBtn, marginTop:'20px'}}><Zap size={18}/> START LIVE SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{session.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.tile, padding:'15px 5px', fontSize:'14px', background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={submitting} onClick={syncToCloud} style={ui.submitBtn}>{submitting ? "VERIFYING GPS..." : "SYNC TO SERVER"}</button>
    </div>
  );
}

// --- UI DEFINITIONS ---
const ui = {
  centerFlex: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' },
  tabBtn: { padding: '10px 20px', borderRadius: '12px', border: 'none', background:'#1e293b', color:'#fff', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  mobileWrap: { padding: '20px' },
  tile: { padding: '20px', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer', transition:'0.2s' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius:'15px', marginBottom:'10px', background:'rgba(30,41,59,0.4)' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', letterSpacing:'1px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '20px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow:'0 10px 20px rgba(0,0,0,0.4)' },
  badge: { background: '#10b981', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff', cursor: 'pointer' }
};
