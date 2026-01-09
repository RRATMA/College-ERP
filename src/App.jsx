import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  ShieldAlert, Download, MapPin, BookOpen, Clock, CheckCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0020; // Exact 200m Range
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-v8')) return;
  const s = document.createElement("style");
  s.id = 'amrit-v8';
  s.innerHTML = `
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; }
    .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; object-fit: cover; background: #fff; }
    .stat-card { background: #0f172a; border: 1px solid #1e293b; padding: 15px; border-radius: 18px; text-align: center; }
    .stat-card h2 { font-size: 24px; margin: 5px 0; color: #06b6d4; }
    .stat-card p { font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; margin:0; }
    .grid-6 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 25px; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 10px; box-sizing: border-box; }
    .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; }
    .roll-btn { padding: 15px 0; border-radius: 12px; text-align: center; font-weight: 800; cursor: pointer; background: #1e293b; transition: 0.2s; }
    .roll-btn.active { background: #10b981; transform: scale(1.05); }
    .type-chip { flex: 1; padding: 10px; border-radius: 10px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; font-size: 12px; }
    .type-chip.active { background: #06b6d4; }
  `;
  document.head.appendChild(s);
};

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list(3).xlsx').then(res => res.arrayBuffer()).then(ab => {
      setSheets(XLSX.read(ab, { type: 'array' }).SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); }
    else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } else alert("Access Denied");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ width: '300px', textAlign: 'center' }}>
        <img src="/logo.png" className="logo-circle" style={{width:'80px', height:'80px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0, letterSpacing:'-1px'}}>AMRIT</h2>
        <p style={{fontSize: '9px', letterSpacing: '3px', marginBottom: '25px', color:'#64748b'}}>ADMINISTRATION</p>
        <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], a: [], m: [] });
  const [form, setForm] = useState({});

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('absentee_records').select('*');
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f||[], l: l||[], a: a||[], m: m||[] });
  };
  useEffect(() => { refresh(); }, []);

  const defs = Object.values(db.a.reduce((acc, c) => {
    const key = `${c.student_roll}-${c.class_name}`;
    acc[key] = acc[key] || { r: c.student_roll, c: c.class_name, n: 0 };
    acc[key].n++; return acc;
  }, {})).filter(x => x.n >= 5);

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <img src="/logo.png" className="logo-circle" style={{width:'50px', height:'50px'}} alt="logo" />
          <h2 style={{margin:0, fontSize:'20px'}}>HOD</h2>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      {tab === 'dash' && (
        <div className="grid-6">
          <div className="stat-card"><Users color="#06b6d4"/><h2>{db.f.length}</h2><p>Staff</p></div>
          <div className="stat-card"><BookOpen color="#a855f7"/><h2>{db.l.filter(x=>x.type==='Theory').length}</h2><p>Theory</p></div>
          <div className="stat-card"><Database color="#10b981"/><h2>{db.l.filter(x=>x.type==='Practical').length}</h2><p>Practical</p></div>
          <div className="stat-card"><ShieldAlert color="#f43f5e"/><h2>{defs.length}</h2><p>Defaulters</p></div>
          <div className="stat-card"><TrendingUp color="#eab308"/><h2>{db.m.length}</h2><p>Mapped</p></div>
          <div className="stat-card"><CheckCircle color="#6366f1"/><h2>{db.l.filter(x=>x.time_str===new Date().toLocaleDateString('en-GB')).length}</h2><p>Today</p></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', overflowX:'auto', borderBottom: '1px solid #1e293b' }}>
        {['dash', 'staff', 'map', 'defaulters', 'history'].map(t => (
          <p key={t} onClick={()=>setTab(t)} style={{cursor:'pointer', color:tab===t?'#06b6d4':'#64748b', fontWeight:800, fontSize:'11px', paddingBottom:'10px'}}>{t.toUpperCase()}</p>
        ))}
      </div>

      {tab === 'defaulters' && <div className="glass">
        {defs.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
          <span>Roll No: <b>{d.r}</b> | Class: {d.c}</span><b style={{ color: '#f43f5e' }}>{d.n} Absents</b>
        </div>)}
      </div>}

      {tab === 'staff' && <div>
        <div className="glass" style={{marginBottom:'15px'}}>
          <input placeholder="Faculty Name" onChange={e=>setForm({...form, n:e.target.value})}/>
          <input placeholder="Faculty ID" onChange={e=>setForm({...form, id:e.target.value})}/>
          <input placeholder="Security Key" onChange={e=>setForm({...form, p:e.target.value})}/>
          <button className="btn-cyan" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); refresh();}}>ADD FACULTY</button>
        </div>
        {db.f.map(f => <div key={f.id} className="glass" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span>{f.name} ({f.id})</span><Trash2 size={18} color="#f43f5e" onClick={async()=>{await supabase.from('faculties').delete().eq('id',f.id); refresh();}}/>
        </div>)}
      </div>}

      {tab === 'map' && <div className="glass">
        <select onChange={e=>setForm({...form, fid:e.target.value})}><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <input placeholder="Subject Name" onChange={e=>setForm({...form, s:e.target.value})}/>
        <button className="btn-cyan" onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fid, class_name:form.cl, subject_name:form.s}]); alert("Success"); refresh();}}>SAVE MAPPING</button>
      </div>}

      {tab === 'history' && <div>
        <button className="btn-cyan" style={{width:'auto', marginBottom:'15px'}} onClick={() => {
          const ws = XLSX.utils.json_to_sheet(db.l);
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
          XLSX.writeFile(wb, "Amrit_Master_Database.xlsx");
        }}><Download size={16}/> EXPORT MASTER DATA</button>
        {db.l.map(l => <div key={l.id} className="glass" style={{marginBottom:'10px'}}>
          <b>{l.class} - {l.sub}</b> <span style={{fontSize:'10px', background:'#1e293b', padding:'2px 8px', borderRadius:'5px'}}>{l.type}</span><br/>
          <small>{l.faculty} | {l.present}/{l.total} Present | {l.time_str}</small>
        </div>)}
      </div>}
    </div>
  );
}

function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); }, []);

  const start = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Please fill all details");
    fetch('/students_list(3).xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    const gpsOptions = { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 };

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) { setLoading(false); return alert("Location Error: College baher ahat."); }
      
      try {
        const dt = new Date().toLocaleDateString('en-GB');
        
        // FIX: Mapping setup.s and setup.e to database columns start_time and end_time
        const { data: at, error: atError } = await supabase.from('attendance').insert([{ 
          faculty: user.name, 
          sub: setup.sub, 
          class: setup.cl, 
          type: setup.ty, 
          start_time: setup.s, 
          end_time: setup.e, 
          present: marked.length, 
          total: list.length, 
          time_str: dt 
        }]).select().single();

        if (atError) throw atError;

        const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ 
          attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt 
        }));

        if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
        
        const report = [[INSTITUTE_NAME], ["SESSION REPORT: " + dt], [], ["FACULTY:", user.name], ["CLASS:", setup.cl, "TYPE:", setup.ty], ["SUBJECT:", setup.sub], ["TIME:", `${setup.s} to ${setup.e}`], [], ["ROLL", "STUDENT NAME", "STATUS"]];
        list.forEach(s => report.push([s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]));
        XLSX.writeFile({ SheetNames: ["R"], Sheets: { "R": XLSX.utils.aoa_to_sheet(report) } }, `${setup.cl}_${setup.ty}_Report.xlsx`);
        
        alert("Attendance Submitted Successfully!"); setView('login');
      } catch (err) {
        alert("Sync Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }, () => { setLoading(false); alert("GPS Required/Timeout."); }, gpsOptions);
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px'}}>
        <img src="/logo.png" className="logo-circle" alt="Logo" />
        <div style={{textAlign:'right'}}><b>{user.name}</b><br/><small style={{color:'#64748b'}}>Faculty Dashboard</small></div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" size={20}/>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891b2' : '' }}>{c}</div>)}
      </div>
      {setup.cl && <div>
        {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', background: setup.sub === j.subject_name ? '#0891b2' : '' }}>{j.subject_name}</div>)}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <div style={{flex:1}}><small>Start Time</small><input type="time" onChange={e => setSetup({ ...setup, s: e.target.value })} /></div>
          <div style={{flex:1}}><small>End Time</small><input type="time" onChange={e => setSetup({ ...setup, e: e.target.value })} /></div>
        </div>
        <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>CONTINUE TO ROLL LIST</button>
      </div>}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center', marginBottom: '20px' }}>
        <ArrowLeft onClick={() => setActive(false)} />
        <div style={{textAlign:'center'}}><b>{setup.cl}</b><br/><small>{setup.ty} | {setup.sub}</small></div>
        <span style={{background:'#10b981', padding:'5px 10px', borderRadius:'8px', fontWeight:800}}>{marked.length}/{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <div style={{height:'100px'}}></div>
      <button disabled={loading} onClick={submit} className="btn-cyan" style={{ position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', background: '#10b981' }}>{loading ? "VERIFYING..." : "SUBMIT ATTENDANCE"}</button>
    </div>
  );
        }
