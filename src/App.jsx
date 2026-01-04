import React, { useEffect, useState, useMemo } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Database, UserCheck, 
  ChevronRight, Users, Download, Zap, BookOpenCheck, 
  TrendingUp, BarChart3, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- CORE SYSTEM STYLING ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-99-stable')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v-99-stable';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; transition: 0.2s; width: 100%; box-sizing: border-box; }
    input:focus { border-color: #06b6d4 !important; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tab-btn-active { background: #0891b2 !important; }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS = { LAT: 19.7042, LON: 72.7645, RAD: 0.0008 };

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel mapping source missing"));
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
        <div style={ui.logoCircle}><img src="/logo.png" alt="Logo" style={{width:'100%', borderRadius:'50%'}} /></div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" style={{marginBottom:'10px'}} />
        <input id="p" type="password" placeholder="Passcode" style={{marginBottom:'20px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>
          LOGIN <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL (DASHBOARD + STAFF + MAPPING + LOGS) ---
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

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('en-GB');
    const todayLogs = db.logs.filter(log => log.time_str === today);
    const present = db.logs.reduce((acc, curr) => acc + (curr.present || 0), 0);
    const total = db.logs.reduce((acc, curr) => acc + (curr.total || 0), 0);
    return {
      percent: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      tToday: todayLogs.filter(l => l.type === 'Theory').length,
      pToday: todayLogs.filter(l => l.type === 'Practical').length,
      todayTotal: todayLogs.length
    };
  }, [db.logs]);

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'38px', borderRadius:'50%'}} />
          <h3 style={{margin:0}}>HOD Oversight</h3>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn}} className={tab===t?'tab-btn-active':''}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={ui.dashGrid}>
          <StatCard title={db.logs.length} sub="TOTAL LOGS" icon={<Database color="#06b6d4"/>}/>
          <StatCard title={db.facs.length} sub="FACULTY" icon={<Users color="#a855f7"/>}/>
          <StatCard title={`${stats.percent}%`} sub="AVG ATTENDANCE" icon={<TrendingUp color="#10b981"/>}/>
          <StatCard title={`${stats.tToday}T | ${stats.pToday}P`} sub="TODAY'S SPLIT" icon={<Zap color="#ec4899"/>}/>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={ui.label}>REGISTER NEW STAFF</p>
            <input placeholder="Name" style={{marginBottom:'10px'}} onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
              <input placeholder="Emp ID" onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Passcode" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={ui.primaryBtn} onClick={async()=>{
                await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]);
                loadData();
            }}>SAVE TO DATABASE</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={ui.feedRow} className="glass-card">
              <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
              <button onClick={async()=>{if(window.confirm('Delete?')){await supabase.from('faculties').delete().eq('id', f.id); loadData();}}} style={ui.delBtn}><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <p style={ui.label}>ASSIGN ACADEMIC LOAD</p>
          <select style={{marginBottom:'10px'}} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginBottom:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" style={{marginBottom:'20px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{...ui.primaryBtn, background:'#a855f7'}} onClick={async()=>{
              await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]);
              alert("Mapping Confirmed"); loadData();
          }}>CONFIRM MAPPING</button>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <input placeholder="Search records..." style={{flex:1}} onChange={e=>setSearchTerm(e.target.value)}/>
            <button style={ui.downloadBtn} onClick={()=>{
                const ws = XLSX.utils.json_to_sheet(db.logs);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Attendance");
                XLSX.writeFile(wb, "Amrit_ERP_Report.xlsx");
            }}><Download size={20}/></button>
          </div>
          {db.logs.filter(l=>(l.class+l.sub+l.faculty).toLowerCase().includes(searchTerm.toLowerCase())).map(log=>(
            <div key={log.id} style={ui.feedRow} className="glass-card">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (GEOFENCED SYNC) ---
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
    if(!setup.cl || !setup.sub || !setup.start) return alert("Fill all details");
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
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS.LON,2));
      if(dist > CAMPUS.RAD) { setLoading(false); return alert("Out of Campus Range"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("Synced Successfully"); setView('login');
    }, () => { setLoading(false); alert("Enable GPS"); });
  };

  if (!active) return (
    <div style={{padding:'20px'}}>
      <div style={ui.header}><div><small>Welcome,</small><h4>Prof. {user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>ASSIGNED CLASSES</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
          <div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'#1e293b'}}>{c}</div>
        ))}
      </div>
      {setup.cl && (
        <div>
          <p style={ui.label}>SUBJECTS</p>
          <div style={{display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px'}}>
            {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
              <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'#1e293b'}}>{j.subject_name}</div>
            ))}
          </div>
          <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          <div style={{display:'flex', gap:'10px', marginBottom:'25px'}}>
             <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...ui.typeBtn, background: setup.ty==='Theory'?'#06b6d4':'#1e293b'}}>Theory</button>
             <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...ui.typeBtn, background: setup.ty==='Practical'?'#10b981':'#1e293b'}}>Practical</button>
          </div>
          <button onClick={launch} style={ui.primaryBtn}><Zap size={18}/> START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={ui.submitBtn}>{loading ? "VERIFYING..." : "SYNC TO SERVER"}</button>
    </div>
  );
}

// --- UI HELPERS ---
const StatCard = ({title, sub, icon}) => (
  <div className="glass-card" style={{padding:'20px', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:'120px'}}>
    <div style={{width:'40px', height:'40px', background:'rgba(255,255,255,0.05)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center'}}>{icon}</div>
    <div><h2 style={{margin:0}}>{title}</h2><p style={{fontSize:'10px', fontWeight:800, color:'#64748b', margin:0}}>{sub}</p></div>
  </div>
);

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginCard: { padding: '40px', width: '280px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #06b6d4', overflow:'hidden' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { padding: '10px 18px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '11px', color: '#fff', cursor: 'pointer', flexShrink: 0, background:'#1e293b' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  tile: { padding: '20px', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer' },
  subRow: { padding: '15px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer' },
  typeBtn: { flex: 1, padding: '12px', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' },
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  rollChip: { padding: '15px 5px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#fff', cursor: 'pointer' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '18px', borderRadius: '18px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', zIndex: 10, cursor: 'pointer' },
  badge: { background: '#10b981', padding: '5px 12px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderRadius:'18px', marginBottom:'10px' },
  downloadBtn: { padding: '0 15px', background: '#10b981', border: 'none', borderRadius: '12px', color: '#fff' }
};
