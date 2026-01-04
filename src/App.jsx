import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, BookOpen, Users, Zap, 
  Database, BookOpenCheck, UserCheck, TrendingUp, ShieldAlert, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-final-style')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-final-style';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass { background: rgba(30, 41, 59, 0.45); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .stat-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; transition: 0.3s; }
    .icon-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .tab-btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; background: transparent; }
    .tab-btn.active { background: #0891b2; color: #fff; }
    .tile { padding: 25px 10px; border-radius: 20px; text-align: center; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .type-btn { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #1e293b; background: #0f172a; color: #64748b; font-weight: 700; cursor: pointer; }
    .type-btn.active { border-color: #0891b2; color: #0891b2; background: rgba(8, 145, 178, 0.1); }
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
    }).catch(e => console.error("Excel Load Error", e));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Administrator", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' }}>
      <div className="glass" style={{ padding: '40px', width: '300px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', margin: '0 auto 20px' }}><img src="/logo.png" style={{width:'100%', height:'100%'}} alt="Logo" /></div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '3px', marginBottom: '30px'}}>ERP SYSTEM</p>
        <input id="u" placeholder="User ID" />
        <input id="p" type="password" placeholder="Passcode" style={{marginTop:'10px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{ width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>LOGIN <ChevronRight size={18} style={{verticalAlign:'middle'}}/></button>
      </div>
    </div>
  );

  return <div>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadAll(); }, []);

  const today = new Date().toLocaleDateString('en-GB');
  const tLogs = db.logs.filter(l => l.time_str === today);
  const defMap = db.abs.reduce((acc, curr) => {
    acc[curr.student_roll] = (acc[curr.student_roll] || 0) + 1;
    return acc;
  }, {});
  const defs = Object.entries(defMap).filter(([_, count]) => count >= 5).map(([r, c]) => ({ r, c }));

  // Calculation for Avg Attendance
  const avgAtt = db.logs.length > 0 
    ? ((db.logs.reduce((s, a) => s + a.present, 0) / db.logs.reduce((s, a) => s + a.total, 0)) * 100).toFixed(1) 
    : 0;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'40px', height:'40px'}} alt="Logo" />
          <h3 style={{margin:0}}>HOD Dashboard</h3>
        </div>
        <button onClick={()=>setView('login')} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', color: '#f43f5e', padding: '10px', borderRadius: '10px', cursor:'pointer' }}><LogOut size={20}/></button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        {['dashboard', 'staff', 'mapping', 'defaulters', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`tab-btn ${tab===t?'active':''}`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div><div><h2>{db.logs.length}</h2><p style={{fontSize:'10px', color:'#64748b'}}>TOTAL LOGS</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><Users/></div><div><h2>{db.facs.length}</h2><p style={{fontSize:'10px', color:'#64748b'}}>ACTIVE STAFF</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div><div><h2>{excelSheets.length}</h2><p style={{fontSize:'10px', color:'#64748b'}}>TOTAL CLASSES</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><UserCheck/></div><div><h2>{avgAtt}%</h2><p style={{fontSize:'10px', color:'#64748b'}}>AVG ATTENDANCE</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><Zap/></div><div><h2>{tLogs.length}</h2><p style={{fontSize:'10px', color:'#64748b'}}>LOGS TODAY</p></div></div>
          <div className="glass stat-card"><div className="icon-box" style={{background:'rgba(99,102,241,0.1)', color:'#6366f1'}}><ShieldAlert/></div><div><h2>{defs.length}</h2><p style={{fontSize:'10px', color:'#64748b'}}>DEFAULTERS</p></div></div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={{fontSize:'10px', color:'#64748b', fontWeight:'800'}}>REGISTER FACULTY</p>
            <input placeholder="Faculty Name" onChange={e=>setForm({...form, name:e.target.value})}/>
            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
              <input placeholder="Faculty ID" onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Password" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/>
            </div>
            <button style={{ width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '15px' }} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadAll(); alert("Staff Registered");}}>REGISTER STAFF</button>
          </div>
          {db.facs.map(f => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '10px' }} className="glass">
              <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
              <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadAll();}} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><Trash2/></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'20px'}}>
          <p style={{fontSize:'10px', color:'#64748b', fontWeight:'800'}}>SUBJECT MAPPING</p>
          <select onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select style={{marginTop:'10px'}} onChange={e=>setForm({...form, cls:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject Name" style={{marginTop:'10px'}} onChange={e=>setForm({...form, sub:e.target.value})}/>
          <button style={{ width: '100%', padding: '15px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '15px' }} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cls, subject_name:form.sub}]); loadAll(); alert("Mapping Saved");}}>SAVE MAPPING</button>
        </div>
      )}

      {tab === 'defaulters' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
             <p style={{fontSize:'10px', color:'#64748b', fontWeight:'800', margin:0}}>DEFAULTER LIST (&ge; 5 ABSENTS)</p>
             <button onClick={() => {
               const ws = XLSX.utils.json_to_sheet(defs);
               const wb = XLSX.utils.book_new();
               XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
               XLSX.writeFile(wb, "Defaulter_List.xlsx");
             }} style={{background:'#0891b2', border:'none', color:'#fff', padding:'5px 15px', borderRadius:'8px', fontSize:'12px'}}>DOWNLOAD</button>
          </div>
          {defs.map(d => (
            <div key={d.r} className="glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '10px' }}>
              <span>Roll No: <b>{d.r}</b></span>
              <span style={{color:'#f43f5e', fontWeight:'bold'}}>{d.c} Absents</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet(db.logs);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "MasterLogs");
            XLSX.writeFile(wb, "Master_Attendance_Logs.xlsx");
          }} style={{width:'100%', background:'#1e293b', border:'1px solid #334155', color:'#fff', padding:'10px', borderRadius:'12px', marginBottom:'15px'}}>DOWNLOAD MASTER EXCEL</button>
          {db.logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', marginBottom: '10px' }} className="glass">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b>{log.present}/{log.total}</b><br/><small>{log.duration}</small></div>
            </div>
          ))}
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

  const startAtt = () => {
    if(!setup.cl || !setup.sub || !setup.start || !setup.end) return alert("Fill Class, Sub, and Times");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim(), name: s['NAME'] || 'N/A' })));
      setActive(true);
    });
  };

  const downloadExcelAfterSubmit = () => {
    const today = new Date().toLocaleDateString('en-GB');
    const worksheetData = [
      ["ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH"],
      ["Attendance Report"],
      ["Class:", setup.cl, "Subject:", setup.sub],
      ["Faculty:", user.name, "Date:", today],
      ["Time:", `${setup.start} - ${setup.end}`, "Type:", setup.ty],
      [""],
      ["Sr.No", "Roll No", "Student Name", "Status"]
    ];
    students.forEach((s, index) => {
      worksheetData.push([index + 1, s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]);
    });
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${setup.cl}_${today}.xlsx`);
  };

  const submitAtt = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Out of Campus Radius!"); }
      
      const tStr = new Date().toLocaleDateString('en-GB');
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: tStr 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl, subject: setup.sub, date: tStr 
      }));
      
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      downloadExcelAfterSubmit();
      alert("Attendance Saved & Sheet Downloaded"); 
      setView('login');
    }, () => { setLoading(false); alert("GPS Denied/Error"); });
  };

  if (!active) return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <div><h3 style={{margin:0}}>Hi, {user.name}</h3><small style={{color:'#64748b'}}>Select session details</small></div>
        <button onClick={()=>setView('login')} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', color: '#f43f5e', padding: '10px', borderRadius: '10px' }}><LogOut size={20}/></button>
      </div>
      
      <p style={{fontSize:'10px', color:'#64748b', fontWeight:'800'}}>CLASS TILES</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
          <div key={c} onClick={()=>setSetup({...setup, cl:c})} className="tile" style={{ background: setup.cl===c?'#0891b2':'#1e293b' }}>{c}</div>
        ))}
      </div>

      {setup.cl && (
        <div style={{marginTop:'20px'}}>
          <p style={{fontSize:'10px', color:'#64748b', fontWeight:'800'}}>CHOOSE SUBJECT</p>
          {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
            <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{ padding: '12px', borderRadius: '10px', textAlign: 'center', color: '#fff', marginBottom: '8px', cursor:'pointer', background: setup.sub===j.subject_name?'#0891b2':'#1e293b', border: setup.sub===j.subject_name?'1px solid #06b6d4':'1px solid transparent' }}>{j.subject_name}</div>
          ))}
          
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} className={`type-btn ${setup.ty==='Theory'?'active':''}`}>THEORY</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} className={`type-btn ${setup.ty==='Practical'?'active':''}`}>PRACTICAL</button>
          </div>

          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
            <div style={{flex:1}}><small style={{color:'#64748b'}}>START</small><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/></div>
            <div style={{flex:1}}><small style={{color:'#64748b'}}>END</small><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
          </div>
          <button onClick={startAtt} style={{ width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '20px' }}>PROCEED TO MARK</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:'20px', paddingBottom:'100px'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'#fff'}}><ArrowLeft/></button>
        <div style={{textAlign:'center'}}><b>{setup.cl}</b><br/><small>{setup.sub} ({setup.ty})</small></div>
        <span style={{background:'#10b981', padding:'5px 10px', borderRadius:'8px', fontSize:'14px', fontWeight:'bold'}}>{marked.length}/{students.length}</span>
      </div>
      <div className="roll-grid">{students.map(s => (
        <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{ padding: '15px 5px', borderRadius: '10px', textAlign: 'center', color: '#fff', cursor:'pointer', background: marked.includes(s.id)?'#10b981':'#1e293b', border: marked.includes(s.id)?'1px solid #34d399':'1px solid transparent' }}>{s.id}</div>
      ))}</div>
      <button disabled={loading} onClick={submitAtt} style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '18px', borderRadius: '15px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(16,
