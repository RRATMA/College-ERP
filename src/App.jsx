import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Download, Zap, 
  Database, UserCheck, AlertCircle, ChevronRight, Beaker
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- CSS STYLING (Tumchi Original Styling) ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-final')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-final';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; border-radius: 12px; padding: 12px; width: 100%; margin-bottom: 10px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 10px; }
    .btn-primary { background: #0891b2; color: white; border: none; padding: 15px; border-radius: 14px; font-weight: bold; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .tester-badge { position: fixed; bottom: 85px; right: 20px; background: #7c3aed; color: white; padding: 12px; border-radius: 50%; cursor: pointer; z-index: 100; box-shadow: 0 0 15px rgba(124, 58, 237, 0.5); border: 2px solid white; }
  `;
  document.head.appendChild(styleTag);
};

// Config Constants (Tumche Original values)
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;
const COLLEGE_NAME = "AMRIT INSTITUTE OF TECHNOLOGY & ADMINISTRATION";

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(err => console.error("Excel Load Error", err));
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
      <div className="glass-card" style={{padding: '40px', width: '300px', textAlign: 'center'}}>
        <h1 style={{margin: 0, fontWeight: 800}}>AMRIT</h1>
        <p style={{fontSize: '10px', color: '#06b6d4', letterSpacing: '2px', marginBottom: '30px'}}>SYSTEM LOGIN</p>
        <input id="u" placeholder="User ID" />
        <input id="p" type="password" placeholder="Passcode" />
        <button className="btn-primary" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
      </div>
    </div>
  );

  return <div>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL (Attendance Monitoring + Defaulters) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], abs: [] });
  const [studentMaster, setStudentMaster] = useState({});
  const [limit, setLimit] = useState(75);

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending: false});
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], abs: a || [] });

    // HOD sathi student mapping logic (Name & Email sathi)
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const temp = {};
      wb.SheetNames.forEach(sheet => {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
        data.forEach(r => {
          const roll = String(r['ROLL NO'] || r['ID']).trim();
          temp[`${sheet}-${roll}`] = { name: r['NAME'] || 'N/A', email: r['EMAIL'] || 'N/A' };
        });
      });
      setStudentMaster(temp);
    });
  };

  useEffect(() => { loadData(); }, []);

  const getDefaulters = () => {
    const classTotal = db.logs.reduce((acc, c) => { acc[c.class] = (acc[c.class] || 0) + 1; return acc; }, {});
    const studentAbs = db.abs.reduce((acc, c) => {
      const id = `${c.class_name}-${c.student_roll}`;
      acc[id] = (acc[id] || 0) + 1; return acc;
    }, {});

    return Object.keys(studentAbs).map(key => {
      const [cls, roll] = key.split('-');
      const total = classTotal[cls] || 0;
      const attended = total - (studentAbs[key] || 0);
      const perc = total > 0 ? (attended / total) * 100 : 0;
      const info = studentMaster[key] || { name: 'Unknown', email: 'N/A' };
      return { roll, name: info.name, email: info.email, cls, perc: perc.toFixed(1) };
    }).filter(s => parseFloat(s.perc) < limit);
  };

  return (
    <div style={{maxWidth: '900px', margin: '0 auto', padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px'}}>
        <h3>HOD Dashboard</h3>
        <button onClick={()=>setView('login')} style={{background: 'none', color: '#f43f5e', border: 'none'}}><LogOut/></button>
      </div>
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px', overflowX:'auto'}} className="scroll-hide">
        {['dashboard', 'logs', 'defaulters'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding: '10px 20px', borderRadius: '10px', border: 'none', background: tab===t?'#0891b2':'#1e293b', color: '#fff'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'defaulters' && (
        <div>
          <p style={{fontSize:'12px', color:'#94a3b8'}}>ATTENDANCE THRESHOLD: {limit}%</p>
          <input type="range" min="0" max="100" value={limit} onChange={e=>setLimit(e.target.value)} />
          {getDefaulters().map((s, i) => (
            <div key={i} className="glass-card" style={{padding: '18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems:'center'}}>
              <div><b>{s.name}</b> <small>({s.roll})</small><br/><small style={{color:'#94a3b8'}}>{s.cls} | {s.email}</small></div>
              <b style={{color: '#f43f5e', fontSize:'18px'}}>{s.perc}%</b>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && db.logs.map(l => (
        <div key={l.id} className="glass-card" style={{padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
          <div><b>{l.class} | {l.sub}</b><br/><small>{l.faculty}</small></div>
          <div style={{textAlign: 'right'}}><b>{l.present}/{l.total}</b><br/><small>{l.time_str}</small></div>
        </div>
      ))}
    </div>
  );
}

// --- FACULTY PANEL (Attendance Taking + Auto-Download) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testerMode, setTesterMode] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  // Loading Roll Numbers from specific sheet (Tumchi Original Logic)
  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Fill Class & Subject!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheetName = wb.SheetNames.find(s => s.toLowerCase() === setup.cl.toLowerCase());
      const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const processSubmission = async () => {
    setLoading(true);
    const presentRolls = marked.sort((a,b)=>a-b).join(", ");
    const absentees = students.filter(s=>!marked.includes(s.id)).map(s=>s.id).sort((a,b)=>a-b);
    const absentRolls = absentees.join(", ");

    try {
      // 1. Attendance Summary Sync
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      // 2. Individual Absentee Records Sync
      const absRecords = absentees.map(roll => ({ attendance_id: att.id, student_roll: roll, class_name: setup.cl }));
      if(absRecords.length > 0) await supabase.from('absentee_records').insert(absRecords);

      // 3. Auto-Download Excel Report
      const excelData = [
        [COLLEGE_NAME],
        [testerMode ? "TEST REPORT - DEVELOPER" : `ATTENDANCE REPORT - ${setup.cl}`],
        [""],
        ["Date", new Date().toLocaleDateString('en-GB')],
        ["Subject", setup.sub],
        ["Faculty", user.name],
        ["Time", `${setup.start} to ${setup.end}`],
        ["Total Present", marked.length],
        ["Total Strength", students.length],
        [""],
        ["PRESENT ROLL NUMBERS"],
        [presentRolls],
        [""],
        ["ABSENT ROLL NUMBERS"],
        [absentRolls],
        [""],[""],
        ["", "Faculty Signature: ________________"]
      ];
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "AttendanceReport");
      XLSX.writeFile(wb, `${setup.cl}_${setup.sub}_Report.xlsx`);

      alert(testerMode ? "Tester Pass: Synced & Downloaded!" : "Sync Successful & Report Downloaded!");
      setView('login');
    } catch (e) { alert("Supabase Sync Error"); console.error(e); } finally { setLoading(false); }
  };

  const submit = () => {
    if (testerMode) { processSubmission(); return; }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) return alert("Error: You are out of college campus!");
      processSubmission();
    }, () => alert("GPS Permission Denied!"));
  };

  if (!active) return (
    <div style={{padding: '20px'}}>
      {/* TESTER MODE BUTTON */}
      <div className="tester-badge" onClick={() => {setTesterMode(!testerMode); alert("Tester Mode: " + (!testerMode ? "ENABLED (GPS Bypassed)" : "DISABLED"));}}>
        <Beaker size={20} />
      </div>

      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <div><small style={{color:'#94a3b8'}}>Welcome,</small><h4>{user.name}</h4></div>
        <button onClick={()=>setView('login')} style={{background: 'none', color: '#f43f5e', border: 'none'}}><LogOut/></button>
      </div>

      <p style={{fontSize:'10px', fontWeight:'bold', color:'#64748b', marginBottom:'10px'}}>SELECT SESSION DETAILS</p>
      <select onChange={e=>setSetup({...setup, cl: e.target.value})}>
        <option>Choose Class</option>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => <option key={c}>{c}</option>)}
      </select>
      <select onChange={e=>setSetup({...setup, sub: e.target.value})}>
        <option>Choose Subject</option>
        {myJobs.filter(j=>j.class_name===setup.cl).map(j => <option key={j.id}>{j.subject_name}</option>)}
      </select>
      <div style={{display: 'flex', gap: '10px'}}>
        <input type="time" onChange={e=>setSetup({...setup, start: e.target.value})} />
        <input type="time" onChange={e=>setSetup({...setup, end: e.target.value})} />
      </div>
      <button className="btn-primary" onClick={launch} style={{marginTop: '20px'}}><Zap size={18}/> INITIALIZE LIST</button>
    </div>
  );

  return (
    <div style={{padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
        <button onClick={()=>setActive(false)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding:'8px', borderRadius:'50%'}}><ArrowLeft size={20}/></button>
        <b>{setup.cl} | {marked.length}/{students.length}</b>
        <div style={{background:'#10b981', padding:'4px 10px', borderRadius:'8px', fontSize:'12px'}}>LIVE</div>
      </div>

      <div className="roll-grid">
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])} 
               style={{padding: '18px 5px', borderRadius: '15px', textAlign: 'center', fontWeight:'bold', background: marked.includes(s.id) ? '#10b981' : '#1e293b', transition:'0.2s'}}>
            {s.id}
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={submit} disabled={loading} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px', width:'calc(100% - 40px)', background:'#10b981', height:'60px', boxShadow:'0 10px 20px rgba(16,185,129,0.3)'}}>
        {loading ? "UPLOADING DATA..." : testerMode ? "RUN TEST & SYNC" : "SYNC & DOWNLOAD REPORT"}
      </button>
    </div>
  );
                 }
