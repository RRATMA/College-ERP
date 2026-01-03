import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Users, Download, PlusCircle, TrendingUp, Zap, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- SYSTEM ARCHITECTURE: UI ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-dev-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-dev-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass-card { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; transition: 0.3s; }
    .neon-glow { border: 1px solid rgba(6, 182, 212, 0.5); box-shadow: 0 0 20px rgba(6, 182, 212, 0.15); }
    .active-tab { background: #0891b2 !important; color: white !important; box-shadow: 0 0 20px rgba(8, 145, 178, 0.4); transform: translateY(-2px); }
    .neon-logo-container { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 25px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input:focus, select:focus { border-color: #06b6d4 !important; outline: none; box-shadow: 0 0 10px rgba(6, 182, 212, 0.2); }
    @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  `;
  document.head.appendChild(styleTag);
};

// --- CORE CONFIGURATION ---
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
    }).catch(e => console.error("System Notice: Please place students_list.xlsx in public folder."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Authentication Failed.");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div className="neon-logo-container" style={ui.logoCircle}>
          <img src="/logo.png" alt="Logo" style={{width: '90%', height: '90%', objectFit: 'contain'}} />
        </div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800, letterSpacing: '1px'}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '35px', letterSpacing: '3px'}}>SECURE ACCESS</p>
        <div style={ui.inputGroup}><User size={18} style={ui.icon}/><input id="u" placeholder="Admin/Staff ID" style={ui.inputWithIcon} /></div>
        <div style={ui.inputGroup}><Fingerprint size={18} style={ui.icon}/><input id="p" type="password" placeholder="Passcode" style={ui.inputWithIcon} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>LAUNCH SYSTEM</button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL: COMPLETE FUNCTIONAL ARCHITECTURE ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });
  const [searchTerm, setSearchTerm] = useState('');

  const loadAllData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadAllData(); }, []);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Log");
    XLSX.writeFile(wb, `AMRIT_MASTER_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={ui.smallLogo}><Zap size={22} fill="white"/></div>
          <div><h2 style={{margin: 0, fontSize: '24px'}}>HOD Panel</h2><small style={{color: '#06b6d4'}}>Dept. Command & Control</small></div>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {[
          {id:'dashboard', icon:<LayoutGrid size={18}/>, label:'DASHBOARD'},
          {id:'staff', icon:<Users size={18}/>, label:'FACULTY'},
          {id:'mapping', icon:<PlusCircle size={18}/>, label:'MAPPING'},
          {id:'logs', icon:<FileSpreadsheet size={18}/>, label:'REPORTS'}
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={tab === t.id ? 'active-tab' : ''} style={ui.tabBtn}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{animation: 'slideIn 0.4s ease-out'}}>
          <div style={ui.statsGrid}>
            <div className="glass-card neon-glow" style={ui.statCard}><TrendingUp color="#10b981"/><h2>{db.logs.length}</h2><p>Total Sessions</p></div>
            <div className="glass-card" style={ui.statCard}><Users color="#06b6d4"/><h2>{db.facs.length}</h2><p>Active Staff</p></div>
            <div className="glass-card" style={ui.statCard}><Layers color="#8b5cf6"/><h2>{excelSheets.length}</h2><p>Classes</p></div>
          </div>
          <h4 style={ui.sectionTitle}>REAL-TIME ACTIVITY FEED</h4>
          <div className="glass-card" style={{overflow: 'hidden'}}>
            {db.logs.slice(0, 6).map((log, i) => (
              <div key={i} style={ui.feedRow}>
                <div style={{...ui.typeIcon, background: log.type === 'Theory' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: log.type === 'Theory' ? '#06b6d4' : '#10b981'}}>{log.type[0]}</div>
                <div style={{flex: 1}}><b>{log.class} - {log.sub}</b><br/><small style={{color: '#94a3b8'}}>{log.faculty} • {log.duration}</small></div>
                <div style={{textAlign: 'right'}}><b style={{color: '#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize: '10px', opacity: 0.6}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div style={{animation: 'slideIn 0.4s'}}>
          <div className="glass-card" style={{padding: '25px', marginBottom: '25px'}}>
            <h4 style={{marginTop: 0, color: '#06b6d4'}}>Register New Faculty</h4>
            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
              <input placeholder="Full Name" style={ui.input} value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
              <input placeholder="Faculty ID" style={ui.input} value={form.id} onChange={e=>setForm({...form, id:e.target.value})}/>
            </div>
            <input placeholder="Assign Password" type="password" style={ui.input} value={form.pass} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={ui.primaryBtn} onClick={async()=>{
              if(!form.name || !form.id || !form.pass) return alert("Fill all fields");
              await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]);
              setForm({name:'', id:'', pass:''}); loadAllData();
            }}>AUTHORIZE STAFF</button>
          </div>
          <h4 style={ui.sectionTitle}>AUTHORIZED PERSONNEL</h4>
          {db.facs.map(f => (
            <div key={f.id} className="glass-card" style={{...ui.feedRow, marginBottom: '10px', border: 'none'}}>
              <div style={ui.avatar}>{f.name[0]}</div>
              <div style={{flex:1}}><b>{f.name}</b><br/><small style={{opacity: 0.6}}>ID: {f.id}</small></div>
              <button onClick={async()=>{if(window.confirm(`Remove ${f.name}?`)){await supabase.from('faculties').delete().eq('id', f.id); loadAllData();}}} style={ui.delBtn}><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div style={{animation: 'slideIn 0.4s'}}>
          <div className="glass-card" style={{padding: '25px', marginBottom: '25px'}}>
            <h4 style={{marginTop: 0, color: '#06b6d4'}}>Load Allocation</h4>
            <select style={ui.input} value={form.fId} onChange={e=>setForm({...form, fId:e.target.value})}><option value="">Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={ui.input} value={form.cls} onChange={e=>setForm({...form, cls:e.target.value})}><option value="">Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={ui.input} value={form.sub} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={ui.primaryBtn} onClick={async()=>{
              if(!form.fId || !form.cls || !form.sub) return alert("Mapping incomplete");
              await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]);
              setForm({...form, sub:''}); loadAllData();
            }}>CREATE ASSIGNMENT</button>
          </div>
          <h4 style={ui.sectionTitle}>CURRENT MAPPINGS</h4>
          {db.maps.map(m => (
            <div key={m.id} className="glass-card" style={{...ui.feedRow, marginBottom: '10px', border: 'none'}}>
              <div style={{flex:1}}><b>{m.class_name}</b><br/><small style={{color: '#06b6d4'}}>{m.subject_name}</small></div>
              <button onClick={async()=>{await supabase.from('assignments').delete().eq('id', m.id); loadAllData();}} style={ui.delBtn}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div style={{animation: 'slideIn 0.4s'}}>
          <div style={ui.searchBar}><Search size={20} color="#94a3b8"/><input placeholder="Filter by class/subject..." onChange={e=>setSearchTerm(e.target.value)} style={{background: 'none', border: 'none', color: '#fff', width: '100%'}}/></div>
          <button style={{...ui.primaryBtn, marginBottom: '20px', background: '#10b981'}} onClick={handleExport}><Download size={18}/> DOWNLOAD MASTER DATA</button>
          <div className="glass-card">
            {db.logs.filter(l => l.class.toLowerCase().includes(searchTerm.toLowerCase())).map((log, i) => (
              <div key={i} style={ui.feedRow}>
                <div style={{flex: 1}}><b>{log.class} | {log.sub}</b><br/><small style={{opacity: 0.6}}>{log.faculty} • {log.time_str}</small></div>
                <div style={{textAlign: 'right'}}><b style={{color: '#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.type}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: GEOLOCATED ATTENDANCE ---
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

  const startSession = () => {
    if(!setup.cl || !setup.sub || !setup.start) return alert("Define Session Parameters");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())];
      if(!sheet) return alert("Class Data Not Found in Excel");
      const data = XLSX.utils.sheet_to_json(sheet);
      setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const finalizeAttendance = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("SECURITY: MUST SUBMIT FROM CAMPUS"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      const absentees = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl 
      }));
      if(absentees.length > 0) await supabase.from('absentee_records').insert(absentees);
      
      alert("Success! Cloud Sync Complete.");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS REQUIRED FOR AUTHENTICATION"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><h3 style={{margin:0}}>Prof. {user.name}</h3><small style={{color: '#06b6d4'}}>Ready for Session</small></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={18}/></button></div>
      <label style={ui.label}>SELECT CLASS</label>
      <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b', border: setup.cl===c?'2px solid #06b6d4':'1px solid transparent'}}>{c}</div>))}</div>
      
      {setup.cl && (
        <div style={{marginTop: '25px', animation: 'slideIn 0.3s'}}>
          <label style={ui.label}>SELECT SUBJECT</label>
          <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>))}</div>
          
          <label style={ui.label}>SESSION TYPE</label>
          <div style={{display:'flex', gap:'10px', marginBottom: '20px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, border: setup.ty==='Theory'?'2px solid #06b6d4':'1px solid #1e293b', background: setup.ty==='Theory'?'rgba(6,182,212,0.1)':'transparent'}}>Theory</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, border: setup.ty==='Practical'?'2px solid #06b6d4':'1px solid #1e293b', background: setup.ty==='Practical'?'rgba(6,182,212,0.1)':'transparent'}}>Practical</button>
          </div>

          <label style={ui.label}>TIME DURATION</label>
          <div style={{display:'flex', gap:'10px', marginBottom: '20px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={ui.input}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={ui.input}/></div>
          <button onClick={startSession} style={ui.primaryBtn}>LAUNCH ROLL CALL</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><div><h3 style={{margin:0}}>{setup.cl}</h3><small>{setup.ty}</small></div><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div style={ui.rollArea}>{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b', transform: marked.includes(s.id)?'scale(1.05)':'scale(1)'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={finalizeAttendance} style={ui.submitBtn}>{loading ? "GEOTAGGING DATA..." : "FINALIZE & SYNC"}</button>
    </div>
  );
}

// --- UI DEFINITION OBJECT ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #0f172a, #020617)' },
  loginCard: { padding: '50px 40px', width: '340px', textAlign: 'center' },
  logoCircle: { width: '100px', height: '100px', margin: '0 auto 25px' },
  inputGroup: { position: 'relative', marginBottom: '15px' },
  icon: { position: 'absolute', left: '15px', top: '15px', color: '#06b6d4' },
  inputWithIcon: { width: '100%', padding: '16px 15px 16px 48px', borderRadius: '16px', background: '#020617', border: '1px solid #1e293b', color: '#fff', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #0891b2, #0e7490)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  smallLogo: { width: '48px', height: '48px', background: '#0891b2', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(8,145,178,0.3)' },
  tabRow: { display: 'flex', gap: '12px', marginBottom: '35px', overflowX: 'auto', paddingBottom: '10px' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', padding: '14px 22px', borderRadius: '16px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', whiteSpace: 'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' },
  statCard: { padding: '25px', textAlign: 'center' },
  sectionTitle: { fontSize: '11px', color: '#64748b', letterSpacing: '2.5px', marginBottom: '20px', fontWeight: 800 },
  feedRow: { display: 'flex', alignItems: 'center', gap: '18px', padding: '18px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  typeIcon: { width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' },
  input: { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '14px', background: '#020617', border: '1px solid #1e293b', color:
