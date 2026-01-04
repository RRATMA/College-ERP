import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  ShieldAlert, Download, MapPin, BookOpen, Clock, CheckCircle 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-ultimate')) return;
  const style = document.createElement("style");
  style.id = 'amrit-ultimate';
  style.innerHTML = `
    body { font-family: 'Inter', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; }
    .stat-card { background: #0f172a; border: 1px solid #1e293b; padding: 15px; border-radius: 15px; text-align: center; }
    .stat-card h2 { font-size: 26px; margin: 5px 0; color: #06b6d4; }
    .stat-card p { font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; }
    .grid-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 10px; box-sizing: border-box; }
    .action-btn { background: #0891b2; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; }
    .roll-btn { padding: 15px 0; border-radius: 10px; text-align: center; font-weight: 800; cursor: pointer; background: #1e293b; }
    .roll-btn.active { background: #10b981; }
    .chip { padding: 8px 15px; border-radius: 20px; font-size: 12px; cursor: pointer; background: #1e293b; font-weight: 700; }
    .chip.active { background: #06b6d4; }
  `;
  document.head.appendChild(style);
};

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      setExcelSheets(XLSX.read(ab, { type: 'array' }).SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ width: '300px', textAlign: 'center' }}>
        <img src="/logo.png" style={{width:'70px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0}}>AMRIT</h2>
        <p style={{fontSize: '9px', letterSpacing: '2px', marginBottom: '25px'}}>SYSTEM LOGIN</p>
        <input id="u" placeholder="ID" /><input id="p" type="password" placeholder="Key" />
        <button className="action-btn" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL (6 METRICS) ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], a: [], m: [] });
  const [form, setForm] = useState({});

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('absentee_records').select('*');
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f||[], l: l||[], a: a||[], m: m||[] });
  };
  useEffect(() => { loadData(); }, []);

  const defs = Object.values(db.a.reduce((acc, c) => {
    const key = `${c.student_roll}-${c.class_name}`;
    acc[key] = acc[key] || { r: c.student_roll, c: c.class_name, n: 0 };
    acc[key].n++; return acc;
  }, {})).filter(x => x.n >= 5);

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src="/logo.png" style={{width:'40px'}} alt="logo" />
          <h3>HOD Panel</h3>
        </div>
        <button onClick={() => setView('login')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      {tab === 'dash' && (
        <div className="grid-dashboard">
          <div className="stat-card"><Users color="#06b6d4"/><h2>{db.f.length}</h2><p>Total Staff</p></div>
          <div className="stat-card"><BookOpen color="#a855f7"/><h2>{db.l.filter(x=>x.type==='Theory').length}</h2><p>Lectures</p></div>
          <div className="stat-card"><Database color="#10b981"/><h2>{db.l.filter(x=>x.type==='Practical').length}</h2><p>Practicals</p></div>
          <div className="stat-card"><ShieldAlert color="#f43f5e"/><h2>{defs.length}</h2><p>Defaulters</p></div>
          <div className="stat-card"><TrendingUp color="#eab308"/><h2>{db.m.length}</h2><p>Mapped Sub</p></div>
          <div className="stat-card"><CheckCircle color="#6366f1"/><h2>{db.l.filter(x=>x.time_str===new Date().toLocaleDateString('en-GB')).length}</h2><p>Today Sessions</p></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #1e293b' }}>
        {['dash', 'staff', 'map', 'defaulters', 'history'].map(t => (
          <p key={t} onClick={()=>setTab(t)} style={{cursor:'pointer', color:tab===t?'#06b6d4':'#64748b', fontWeight:800, fontSize:'12px'}}>{t.toUpperCase()}</p>
        ))}
      </div>

      {tab === 'defaulters' && <div className="glass-card">
        {defs.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1e293b' }}>
          <span>Roll: {d.r} | {d.c}</span><b style={{ color: '#f43f5e' }}>{d.n} Absents</b>
        </div>)}
      </div>}

      {tab === 'staff' && <div>
        <div className="glass-card" style={{marginBottom:'15px'}}>
          <input placeholder="Name" onChange={e=>setForm({...form, n:e.target.value})}/>
          <input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/>
          <input placeholder="Pass" onChange={e=>setForm({...form, p:e.target.value})}/>
          <button className="action-btn" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); loadData();}}>ADD STAFF</button>
        </div>
        {db.f.map(f => <div key={f.id} className="glass-card" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between'}}>
          {f.name} ({f.id}) <Trash2 size={18} color="#f43f5e" onClick={async()=>{await supabase.from('faculties').delete().eq('id',f.id); loadData();}}/>
        </div>)}
      </div>}

      {tab === 'map' && <div className="glass-card">
        <select onChange={e=>setForm({...form, fid:e.target.value})}><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
        <input placeholder="Subject Name" onChange={e=>setForm({...form, s:e.target.value})}/>
        <button className="action-btn" onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fid, class_name:form.cl, subject_name:form.s}]); alert("Mapped");}}>SAVE</button>
      </div>}

      {tab === 'history' && <div>
        <button className="action-btn" style={{width:'auto', marginBottom:'15px'}} onClick={() => {
          const ws = XLSX.utils.json_to_sheet(db.l);
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
          XLSX.writeFile(wb, "Amrit_Master_Database.xlsx");
        }}><Download size={16}/> EXPORT</button>
        {db.l.map(l => <div key={l.id} className="glass-card" style={{marginBottom:'10px'}}><b>{l.class} - {l.sub}</b><br/><small>{l.faculty} | {l.type} | {l.present}/{l.total} Present</small></div>)}
      </div>}
    </div>
  );
}

// --- FACULTY PANEL (TYPE & TIME) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); }, []);

  const init = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) { setLoading(false); return alert("Out of Campus"); }
      
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, duration: `${setup.s}-${setup.e}`, present: marked.length, total: list.length, time_str: dt }]).select().single();
      const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      const report = [[INSTITUTE_NAME], ["ATTENDANCE: " + dt], [], ["FACULTY:", user.name], ["CLASS:", setup.cl, "TYPE:", setup.ty], ["SUBJECT:", setup.sub], ["TIME:", `${setup.s} to ${setup.e}`], [], ["ROLL", "NAME", "STATUS"]];
      list.forEach(s => report.push([s.id, s.name, marked.includes(s.id) ? "P" : "A"]));
      XLSX.writeFile({ SheetNames: ["R"], Sheets: { "R": XLSX.utils.aoa_to_sheet(report) } }, `${setup.cl}_Report.xlsx`);
      alert("Synced"); setView('login');
    }, () => { setLoading(false); alert("GPS Error"); });
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <img src="/logo.png" style={{width:'40px'}} alt="Logo" />
        <b>{user.name}</b>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" size={20}/>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass-card" style={{ textAlign: 'center', background: setup.cl === c ? '#0891b2' : '' }}>{c}</div>)}
      </div>
      {setup.cl && <div>
        {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass-card" style={{ marginBottom: '10px', background: setup.sub === j.subject_name ? '#0891b2' : '' }}>{j.subject_name}</div>)}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <input type="time" onChange={e => setSetup({ ...setup, s: e.target.value })} />
          <input type="time" onChange={e => setSetup({ ...setup, e: e.target.value })} />
        </div>
        <button className="action-btn" onClick={init} style={{marginTop:'15px'}}>START</button>
      </div>}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <ArrowLeft onClick={() => setActive(false)} /><b>{setup.cl}</b><span>{marked.length}/{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <button disabled={loading} onClick={submit} className="action-btn" style={{ position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', background: '#10b981' }}>{loading ? "SAVING..." : "SYNC & DOWNLOAD"}</button>
    </div>
  );
    }
