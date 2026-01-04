import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  ChevronRight, LayoutGrid, Users, Download, Zap, 
  Database, BookOpenCheck, UserCheck, BarChart3, TrendingUp, Beaker, PlusCircle, ClipboardList, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- ORIGINAL UI STYLING (Purnpane toch look) ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-style')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-style';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; width: 100%; margin-bottom: 10px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tester-badge { position: fixed; bottom: 85px; right: 20px; background: #7c3aed; color: white; padding: 12px; border-radius: 50%; cursor: pointer; z-index: 1000; border: 2px solid #fff; }
    .tab-btn { padding: 10px 20px; border-radius: 12px; border: none; color: #fff; cursor: pointer; font-weight: 600; transition: 0.3s; }
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
    });
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
    <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div className="glass-card" style={{padding: '40px', width: '280px', textAlign: 'center'}}>
        <div style={{width: '80px', height: '80px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #06b6d4', overflow: 'hidden'}}>
          <img src="/logo.png" style={{width: '100%'}} />
        </div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" />
        <input id="p" type="password" placeholder="Passcode" />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer'}}>LOGIN</button>
      </div>
    </div>
  );

  return <div>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- FULL HOD PANEL WITH DEFAULTER LOGIC ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [form, setForm] = useState({ name: '', id: '', pass: '', fId: '', cls: '', sub: '' });

  const loadAllData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadAllData(); }, []);

  // --- DEFAULTER CALCULATION ENGINE ---
  const getDefaulters = () => {
    const counts = {};
    db.abs.forEach(rec => {
      const key = `${rec.student_roll} (${rec.class_name})`;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto', padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px'}}>
        <h3>HOD Dashboard</h3>
        <button onClick={() => setView('login')} style={{background: 'none', border: 'none', color: '#f43f5e'}}><LogOut/></button>
      </div>

      <div style={{display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto'}}>
        {['dashboard', 'staff', 'mapping', 'logs', 'defaulters'].map(t => (
          <button key={t} onClick={() => setTab(t)} className="tab-btn" style={{background: tab === t ? '#0891b2' : '#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
          <div className="glass-card" style={{padding:'20px'}}><b>{db.logs.length}</b><br/><small>Total Lectures</small></div>
          <div className="glass-card" style={{padding:'20px'}}><b>{db.facs.length}</b><br/><small>Active Staff</small></div>
          <div className="glass-card" style={{padding:'20px'}}><b>{db.abs.length}</b><br/><small>Absent Entries</small></div>
          <div className="glass-card" style={{padding:'20px', borderLeft:'4px solid #f59e0b'}}><b>{getDefaulters().length}</b><br/><small>Potential Defaulters</small></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={{fontSize:'12px', fontWeight:'bold', color:'#06b6d4'}}>REGISTER NEW STAFF</p>
            <input placeholder="Name" onChange={e => setForm({...form, name:e.target.value})} />
            <input placeholder="ID" onChange={e => setForm({...form, id:e.target.value})} />
            <input placeholder="Password" type="password" onChange={e => setForm({...form, pass:e.target.value})} />
            <button onClick={async() => {await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadAllData();}} style={{width:'100%', padding:'12px', background:'#06b6d4', border:'none', borderRadius:'10px', color:'#fff'}}>SAVE</button>
          </div>
          {db.facs.map(f => <div key={f.id} className="glass-card" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>{f.name} <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadAllData();}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={16}/></button></div>)}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <p style={{fontSize:'12px', fontWeight:'bold', color:'#06b6d4'}}>CLASS ASSIGNMENT</p>
          <select onChange={e => setForm({...form, fId: e.target.value})}><option>Select Faculty</option>{db.facs.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select onChange={e => setForm({...form, cls: e.target.value})}><option>Select Class</option>{excelSheets.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" onChange={e => setForm({...form, sub: e.target.value})} />
          <button onClick={async() => {await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadAllData();}} style={{width:'100%', padding:'12px', background:'#a855f7', border:'none', borderRadius:'10px', color:'#fff'}}>MAP SUBJECT</button>
          <div style={{marginTop:'20px'}}>
            {db.maps.map(m => <div key={m.id} style={{fontSize:'12px', padding:'10px', borderBottom:'1px solid #1e293b'}}>{m.fac_id} → {m.class_name} ({m.subject_name})</div>)}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button onClick={() => {const ws=XLSX.utils.json_to_sheet(db.logs); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Logs"); XLSX.writeFile(wb,"Master_Report.xlsx");}} style={{width:'100%', padding:'15px', background:'#10b981', border:'none', borderRadius:'15px', color:'#fff', marginBottom:'20px'}}>DOWNLOAD MASTER REPORT</button>
          {db.logs.map(log => <div key={log.id} className="glass-card" style={{padding:'15px', marginBottom:'10px', display:'flex', justifyContent:'space-between'}}><div><b>{log.class} - {log.sub}</b><br/><small>{log.faculty}</small></div><div>{log.present}/{log.total}</div></div>)}
        </div>
      )}

      {tab === 'defaulters' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <p style={{fontSize:'12px', fontWeight:'bold', color:'#f43f5e'}}>TOP ABSENTEES</p>
          {getDefaulters().map(([name, count]) => (
            <div key={name} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #1e293b'}}>
              <span>{name}</span>
              <b style={{color:'#f43f5e'}}>{count} Lectures Missed</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FULL FACULTY PANEL WITH SYNC LOGIC ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [testerMode, setTesterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const startSession = () => {
    if(!setup.cl || !setup.sub) return alert("Select all fields!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s => s.toLowerCase() === setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const processAttendance = async () => {
    setLoading(true);
    try {
      // 1. Save Summary
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      // 2. Save Absent Records (For HOD Analytics)
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);

      // 3. Auto-Download Excel
      const report = [
        ["AMRIT ATTENDANCE REPORT"], ["Class", setup.cl], ["Subject", setup.sub], ["Faculty", user.name],
        ["Present", marked.sort().join(", ")],
        ["Absent", students.filter(s=>!marked.includes(s.id)).map(s=>s.id).sort().join(", ")]
      ];
      const ws = XLSX.utils.aoa_to_sheet(report);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `${setup.cl}_${setup.sub}.xlsx`);

      alert("Success! Attendance Synced & Report Downloaded.");
      setView('login');
    } catch (e) { alert("Sync Failed!"); } finally { setLoading(false); }
  };

  const submit = () => {
    if (testerMode) return processAttendance();
    navigator.geolocation.getCurrentPosition((pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) return alert("Out of Campus!");
      processAttendance();
    }, () => alert("GPS Error!"));
  };

  if (!active) return (
    <div style={{padding: '20px'}}>
      <div className="tester-badge" onClick={() => setTesterMode(!testerMode)}><Beaker size={20} style={{margin:'10px'}}/></div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <h4>Welcome, {user.name}</h4>
        <button onClick={()=>setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>
      <select onChange={e => setSetup({...setup, cl: e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j => j.class_name))].map(c => <option key={c}>{c}</option>)}</select>
      <select onChange={e => setSetup({...setup, sub: e.target.value})}><option>Select Subject</option>{myJobs.filter(j => j.class_name === setup.cl).map(j => <option key={j.id}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px'}}>
        <input type="time" onChange={e => setSetup({...setup, start: e.target.value})} />
        <input type="time" onChange={e => setSetup({...setup, end: e.target.value})} />
      </div>
      <button onClick={startSession} style={{width:'100%', padding:'18px', background:'#0891b2', border:'none', borderRadius:'15px', color:'#fff', fontWeight:'bold'}}><Zap size={18}/> START SESSION</button>
    </div>
  );

  return (
    <div style={{padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <button onClick={() => setActive(false)} style={{background:'#1e293b', color:'#fff', border:'none', borderRadius:'50%', width:'40px', height:'40px'}}><ArrowLeft/></button>
        <h3>{setup.cl}</h3>
        <div style={{background: '#10b981', padding: '5px 10px', borderRadius: '10px'}}>{marked.length}/{students.length}</div>
      </div>
      <div className="roll-grid">
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{padding:'15px 5px', textAlign:'center', borderRadius:'12px', background: marked.includes(s.id)?'#10b981':'#1e293b', fontWeight:'bold'}}>
            {s.id}
          </div>
        ))}
      </div>
      <button onClick={submit} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px', padding:'20px', borderRadius:'20px', background: testerMode?'#7c3aed':'#10b981', color:'#fff', border:'none', fontWeight:'bold'}}>
        {loading ? "SYNCING..." : "FINALIZE ATTENDANCE"}
      </button>
    </div>
  );
  }
