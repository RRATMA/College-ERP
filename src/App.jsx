import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  FileSpreadsheet, ChevronRight, LayoutGrid, Users, 
  Download, Zap, FlaskConical, GraduationCap, PlusCircle, 
  ClipboardList, Settings, Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- STYLING ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-v2-final')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v2-final';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .neon-logo-container { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; overflow: hidden; }
    @keyframes pulse { 0% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 20px #06b6d4; } 100% { box-shadow: 0 0 5px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input:focus, select:focus { outline: none; border-color: #06b6d4 !important; }
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

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Critical: students_list.xlsx not found in /public"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Unauthorized Access");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div className="neon-logo-container" style={ui.logoCircle}>
          <img src="/logo.png" alt="Logo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '30px', letterSpacing: '2px'}}>ATTENDANCE SYSTEM</p>
        <input id="u" placeholder="User ID" style={ui.input} />
        <input id="p" type="password" placeholder="Passcode" style={ui.input} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>LOGIN <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} excelSheets={excelSheets} />}</div>;
}

// --- HOD DASHBOARD COMPONENT ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  const getTabIcon = (t) => {
    if (t === 'dashboard') return <LayoutGrid size={16} />;
    if (t === 'staff') return <Users size={16} />;
    if (t === 'mapping') return <Layers size={16} />;
    if (t === 'logs') return <ClipboardList size={16} />;
    return null;
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <div style={{padding:'8px', background:'#0891b2', borderRadius:'10px'}}><Settings size={20} color="white"/></div>
           <h3 style={{margin:0}}>HOD Management</h3>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>
      
      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b', color:'#fff', display:'flex', alignItems:'center', gap:'6px'}}>
            {getTabIcon(t)} {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={ui.statsGrid}>
          <div className="glass-card" style={ui.statCard}><div style={{color:'#06b6d4', marginBottom:'10px'}}><Database size={24}/></div><h2>{db.logs.length}</h2><p>Sessions</p></div>
          <div className="glass-card" style={ui.statCard}><div style={{color:'#a855f7', marginBottom:'10px'}}><Users size={24}/></div><h2>{db.facs.length}</h2><p>Faculties</p></div>
          <div className="glass-card" style={ui.statCard}><div style={{color:'#10b981', marginBottom:'10px'}}><BookOpen size={24}/></div><h2>{excelSheets.length}</h2><p>Classes</p></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'15px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'15px', color:'#06b6d4'}}><PlusCircle size={18}/> <b>Add New Faculty</b></div>
            <input placeholder="Faculty Name" style={ui.input} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="New ID" style={ui.input} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" style={ui.input} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={ui.primaryBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>ADD FACULTY</button>
          </div>
          {db.facs.map(f => (<div key={f.id} style={ui.feedRow} className="glass-card"><div><Users size={16} style={{marginRight:'10px', verticalAlign:'middle', color:'#64748b'}}/>{f.name} ({f.id})</div> <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadData();}} style={ui.delBtn}><Trash2 size={16}/></button></div>))}
        </div>
      )}

      {tab === 'mapping' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'15px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'15px', color:'#06b6d4'}}><Layers size={18}/> <b>Class Assignment</b></div>
            <select style={ui.input} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={ui.input} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class Sheet</option>{excelSheets.map(s=><option key={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={ui.input} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={ui.primaryBtn} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadData();}}>ASSIGN CLASS</button>
          </div>
          {db.maps.map(m => (<div key={m.id} style={ui.feedRow} className="glass-card"><div><BookOpen size={16} style={{marginRight:'10px', verticalAlign:'middle', color:'#64748b'}}/>{m.class_name} - {m.subject_name}</div> <button onClick={async()=>{await supabase.from('assignments').delete().eq('id', m.id); loadData();}} style={ui.delBtn}><Trash2 size={16}/></button></div>))}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button style={{...ui.primaryBtn, marginBottom:'15px', background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px'}} onClick={()=>{
            const ws = XLSX.utils.json_to_sheet(db.logs);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Attendance");
            XLSX.writeFile(wb, "Master_Report.xlsx");
          }}><Download size={18}/> DOWNLOAD MASTER REPORT</button>
          {db.logs.map(log => (
            <div key={log.id} style={ui.feedRow} className="glass-card">
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <div style={{padding:'10px', background:'rgba(6, 182, 212, 0.1)', borderRadius:'10px'}}><FileSpreadsheet size={18} color="#06b6d4"/></div>
                <div><b>{log.class} | {log.sub}</b><br/><small style={{color:'#64748b'}}>{log.faculty}</small></div>
              </div>
              <div style={{textAlign:'right'}}>
                 <div style={{color:'#10b981', fontWeight:'bold'}}>{log.present}/{log.total}</div>
                 <small style={{fontSize:'10px', color:'#64748b'}}>{log.time_str}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL COMPONENT ---
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

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheetName = wb.SheetNames.find(s => s.toLowerCase() === setup.cl.toLowerCase());
      if(!sheetName) return alert("Class sheet not found in Excel");
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      const list = sh.map(s => {
        const id = s['ROLL NO'] || s['Roll No'] || s['roll no'] || s['ID'];
        return id ? { id: String(id).trim() } : null;
      }).filter(s => s !== null);
      setStudents(list); setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ ACCESS DENIED: Outside Campus"); }
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Data Synced Successfully");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Access Required"); }, { enableHighAccuracy: true });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><h3>Prof. {user.name}</h3><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}><LayoutGrid size={12}/> SELECT CLASS</p>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}</div>
      {setup.cl && (
        <div style={{marginTop: '20px'}}>
          <p style={ui.label}><BookOpen size={12}/> SELECT SUBJECT</p>
          <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}</div>
          <p style={ui.label}><Zap size={12}/> SESSION TYPE</p>
          <div style={{display:'flex', gap:'10px', marginBottom: '15px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, background: setup.ty==='Theory'?'#06b6d4':'#1e293b'}}><GraduationCap size={16}/> Theory</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, background: setup.ty==='Practical'?'#10b981':'#1e293b'}}><FlaskConical size={16}/> Practical</button>
          </div>
          <div style={{display:'flex', gap:'10px', marginBottom: '20px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={ui.input}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={ui.input}/></div>
          <button onClick={launch} style={ui.primaryBtn}>START ROLL CALL</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div style={ui.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "VERIFYING GPS..." : "SYNC TO SERVER"}</button>
    </div>
  );
}

// --- UI STYLE ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '50px 40px', width: '320px', textAlign: 'center' },
  logoCircle: { width: '100px', height: '100px', margin: '0 auto 20px' },
  container: { maxWidth: '800px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto' },
  tabBtn: { padding: '12px 18px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '11px', flexShrink: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  statCard: { padding: '20px', textAlign: 'center' },
  input: { width: '100%', padding: '14px', marginBottom: '12px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#fff', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  mobileWrap: { padding: '20px' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { padding: '25px 10px', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' },
  subList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' },
  subRow: { padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', cursor: 'pointer' },
  typeBtn: { flex: 1, padding: '12px', color: '#fff', borderRadius: '12px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' },
  label: { fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  rollArea: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingBottom: '100px' },
  rollChip: { padding: '20px 10px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '20px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', zIndex: 100 },
  badge: { background: '#10b981', padding: '6px 12px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', marginBottom: '8px' }
};
