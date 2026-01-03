import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  FileSpreadsheet, LayoutGrid, Users, Download, Zap, 
  FlaskConical, GraduationCap, CheckCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-db-styles')) return;
  const style = document.createElement("style");
  style.id = 'amrit-db-styles';
  style.innerHTML = `
    :root { --cyan: #06b6d4; --emerald: #10b981; --bg: #020617; --card: rgba(30, 41, 59, 0.5); }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: white; margin: 0; }
    .glass { background: var(--card); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; }
    .input-box { background: #0f172a; border: 1px solid #334155; color: white; padding: 12px; border-radius: 12px; width: 100%; margin-bottom: 15px; box-sizing: border-box; }
    .btn-primary { background: var(--cyan); border: none; padding: 15px; color: white; font-weight: 800; border-radius: 12px; width: 100%; cursor: pointer; transition: 0.3s; }
    .btn-primary:hover { filter: brightness(1.2); box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); }
  `;
  document.head.appendChild(style);
};

export default function AmritFinal() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel Missing"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Access Denied: Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div className="glass" style={{padding: '50px', width: '320px', textAlign: 'center'}}>
        {/* CUSTOM LOGO */}
        <div style={{width: '100px', height: '100px', margin: '0 auto 20px', borderRadius: '50%', background: '#000', border: '2px solid var(--cyan)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <img src="/logo.png" alt="Logo" style={{width: '80%', height: '80%', objectFit: 'contain'}} />
        </div>
        <h1 style={{margin: 0, letterSpacing: '-1px'}}>AMRIT</h1>
        <p style={{color: 'var(--cyan)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '30px'}}>SECURE ACCESS</p>
        <input id="u" className="input-box" placeholder="User ID" />
        <input id="p" className="input-box" type="password" placeholder="Passcode" />
        <button className="btn-primary" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={excelSheets} logout={()=>setView('login')} /> : <FacultyPanel user={user} logout={()=>setView('login')} />;
}

// --- FACULTY PANEL: TYPE FEATURE + DB SYNC ---
function FacultyPanel({ user, logout }) {
  const [session, setSession] = useState({ cl: '', sub: '', type: 'Theory' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [presentRolls, setPresentRolls] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setAssignedJobs(r.data || []));
  }, []);

  const startRollCall = () => {
    if(!session.cl || !session.sub) return alert("Please select Class and Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[session.cl]);
      setStudents(data.map(s => String(s['ROLL NO'] || s['Roll No'])));
      setActive(true);
    });
  };

  const syncAttendance = async () => {
    const { data: record, error } = await supabase.from('attendance').insert([{
      faculty: user.name, sub: session.sub, class: session.cl,
      type: session.type, present_count: presentRolls.length, total_students: students.length
    }]).select().single();

    if (record) {
      const absentees = students.filter(r => !presentRolls.includes(r)).map(r => ({
        attendance_id: record.id, student_roll: r
      }));
      if (absentees.length > 0) await supabase.from('absentee_records').insert(absentees);
      alert("✅ Data Synced to Cloud!");
      setActive(false); setPresentRolls([]);
    }
  };

  if (!active) return (
    <div style={{padding: '30px', maxWidth: '500px', margin: '0 auto'}}>
      <h3>Welcome, Prof. {user.name}</h3>
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
        <button onClick={()=>setSession({...session, type:'Theory'})} style={{flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: session.type==='Theory'?'var(--cyan)':'#1e293b', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><GraduationCap size={18}/> Theory</button>
        <button onClick={()=>setSession({...session, type:'Practical'})} style={{flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: session.type==='Practical'?'var(--emerald)':'#1e293b', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><FlaskConical size={18}/> Practical</button>
      </div>
      <select className="input-box" onChange={e=>setSession({...session, cl: e.target.value})}><option value="">Select Class</option>{[...new Set(assignedJobs.map(j=>j.class_name))].map(c=><option key={c}>{c}</option>)}</select>
      <select className="input-box" onChange={e=>setSession({...session, sub: e.target.value})}><option value="">Select Subject</option>{assignedJobs.filter(j=>j.class_name===session.cl).map(j=><option key={j.id}>{j.subject_name}</option>)}</select>
      <button className="btn-primary" style={{background: session.type==='Theory'?'var(--cyan)':'var(--emerald)'}} onClick={startRollCall}>START {session.type.toUpperCase()}</button>
      <button onClick={logout} style={{background: 'none', border: 'none', color: '#f43f5e', marginTop: '30px', cursor: 'pointer', fontWeight: 'bold'}}>Sign Out</button>
    </div>
  );

  return (
    <div style={{padding: '20px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <button onClick={()=>setActive(false)} style={{background: '#1e293b', border: 'none', color: 'white', padding: '10px', borderRadius: '50%'}}><ArrowLeft/></button>
        <div style={{textAlign: 'center'}}><b>{session.cl}</b><br/><small style={{color: session.type==='Theory'?'var(--cyan)':'var(--emerald)'}}>{session.type}</small></div>
        <div style={{background: 'var(--cyan)', padding: '5px 15px', borderRadius: '10px', fontWeight: 'bold'}}>{presentRolls.length}/{students.length}</div>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingBottom: '100px'}}>
        {students.map(roll => (
          <div key={roll} onClick={()=>setPresentRolls(p => p.includes(roll) ? p.filter(r=>r!==roll) : [...p, roll])}
               style={{padding: '20px 5px', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', background: presentRolls.includes(roll)?'var(--emerald)':'#1e293b', transition: '0.2s'}}>
            {roll}
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={syncAttendance} style={{position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '460px', margin: '0 auto', background: 'var(--emerald)'}}>SYNC DATA TO DB</button>
    </div>
  );
}

// --- HOD DASHBOARD: MASTER DATA ---
function HODPanel({ sheets, logout }) {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    supabase.from('attendance').select('*').order('time_stamp', { ascending: false }).then(r => setLogs(r.data || []));
  }, []);

  return (
    <div style={{padding: '30px', maxWidth: '900px', margin: '0 auto'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px'}}>
        <h2>HOD Control Center</h2>
        <button onClick={logout} style={{background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold'}}>LOGOUT</button>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px'}}>
        <div className="glass" style={{padding: '20px', textAlign: 'center'}}><h3>{logs.length}</h3><p>Total Sessions</p></div>
        <div className="glass" style={{padding: '20px', textAlign: 'center'}}><h3>{sheets.length}</h3><p>Active Classes</p></div>
        <div className="glass" style={{padding: '20px', textAlign: 'center'}}><h3>ONLINE</h3><p>DB Status</p></div>
      </div>
      <h4 style={{opacity: 0.6}}>LIVE ATTENDANCE LOGS</h4>
      {logs.map(log => (
        <div key={log.id} className="glass" style={{display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '10px', alignItems: 'center'}}>
          <div><b>{log.class} - {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
          <div style={{textAlign: 'right'}}><b style={{color: 'var(--cyan)'}}>{log.present_count}/{log.total_students}</b><br/><small style={{fontSize: '10px'}}>{new Date(log.time_stamp).toLocaleDateString()}</small></div>
        </div>
      ))}
    </div>
  );
      }
