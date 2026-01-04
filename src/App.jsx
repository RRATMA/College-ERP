import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  ShieldAlert, Download, MapPin, BookOpen, Clock, CheckCircle, FileText 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const CAMPUS = { lat: 19.7042, lon: 72.7645, rad: 0.0008 };
const INST = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-v7')) return;
  const s = document.createElement("style");
  s.id = 'amrit-v7';
  s.innerHTML = `
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; }
    .btn-main { background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.2s; }
    .stat-card { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 18px; text-align: center; }
    .stat-card h2 { font-size: 24px; margin: 5px 0; color: #06b6d4; }
    .stat-card p { font-size: 10px; font-weight: 800; color: #64748b; margin: 0; text-transform: uppercase; }
    .grid-6 { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 25px; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 12px; box-sizing: border-box; }
    .roll-btn { padding: 18px 0; border-radius: 12px; text-align: center; font-weight: 800; cursor: pointer; background: #1e293b; border: 1px solid transparent; }
    .roll-btn.active { background: #10b981; border-color: #34d399; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
    .type-chip { padding: 8px 15px; border-radius: 20px; font-size: 12px; cursor: pointer; background: #1e293b; font-weight: 700; }
    .type-chip.active { background: #06b6d4; color: #fff; }
  `;
  document.head.appendChild(s);
};

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      setSheets(XLSX.read(ab, { type: 'array' }).SheetNames);
    }).catch(() => console.error("Database File Missing"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); }
    else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } else alert("Invalid Login");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' }}>
      <div className="glass" style={{ width: '320px', textAlign: 'center' }}>
        <img src="/logo.png" alt="College Logo" style={{ width: '80px', height: '80px', marginBottom: '15px', borderRadius: '50%', border: '2px solid #06b6d4' }} />
        <h1 style={{ color: '#06b6d4', margin: '0', letterSpacing: '-1px' }}>AMRIT</h1>
        <p style={{ fontSize: '10px', letterSpacing: '3px', color: '#64748b', marginBottom: '30px' }}>ATTENDANCE SYSTEM</p>
        <input id="uid" placeholder="Faculty ID" /><input id="psw" type="password" placeholder="Key" />
        <button className="btn-main" onClick={() => handleLogin(document.getElementById('uid').value, document.getElementById('psw').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], a: [], m: [] });
  const [form, setForm] = useState({});

  const load = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('absentee_records').select('*');
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f||[], l: l||[], a: a||[], m: m||[] });
  };
  useEffect(() => { load(); }, []);

  const defs = Object.values(db.a.reduce((acc, c) => {
    const k = `${c.student_roll}-${c.class_name}`;
    acc[k] = acc[k] || { r: c.student_roll, c: c.class_name, n: 0 };
    acc[k].n++; return acc;
  }, {})).filter(x => x.n >= 5);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <img src="/logo.png" style={{width:'40px'}} alt="logo" />
           <h3 style={{margin:0}}>HOD Dashboard</h3>
        </div>
        <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><LogOut /></button>
      </div>

      {tab === 'dash' && (
        <div className="grid-6">
          <div className="stat-card"><Users color="#06b6d4" /><h2>{db.f.length}</h2><p>Staff</p></div>
          <div className="stat-card"><FileText color="#a855f7" /><h2>{db.l.filter(x=>x.type==='Theory').length}</h2><p>Lectures</p></div>
          <div className="stat-card"><Database color="#10b981" /><h2>{db.l.filter(x=>x.type==='Practical').length}</h2><p>Practicals</p></div>
          <div className="stat-card"><ShieldAlert color="#f43f5e" /><h2>{defs.length}</h2><p>Defaulters</p></div>
          <div className="stat-card"><BookOpen color="#eab308" /><h2>{db.m.length}</h2><p>Mapped</p></div>
          <div className="stat-card"><Clock color="#6366f1" /><h2>{db.l.filter(x=>x.time_str===new Date().toLocaleDateString('en-GB')).length}</h2><p>Today</p></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', overflowX: 'auto', borderBottom:'1px solid #1e293b' }}>
        {['dash', 'staff', 'mapping', 'defaulters', 'history'].map(t => (
          <p key={t} onClick={() => setTab(t)} style={{ cursor: 'pointer', padding:'10px', fontSize:'12px', fontWeight:800, color: tab===t?'#06b6d4':'#64748b', borderBottom: tab===t?'2px solid #06b6d4':'' }}>{t.toUpperCase()}</p>
        ))}
      </div>

      {tab === 'defaulters' && <div className="glass">
        {defs.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
          <span>Roll No: <b>{d.r}</b> ({d.c})</span><b style={{ color: '#f43f5e' }}>{d.n} Absents</b>
        </div>)}
      </div>}

      {tab === 'staff' && <div>
        <div className="glass" style={{ marginBottom: '15px' }}>
          <input placeholder="Name" onChange={e => setForm({ ...form, n: e.target.value })} />
          <input placeholder="Faculty ID" onChange={e => setForm({ ...form, id: e.target.value })} />
          <input placeholder="Password" onChange={e => setForm({ ...form, p: e.target.value })} />
          <button className="btn-main" onClick={async () => { await supabase.from('faculties').insert([{ id: form.id, name: form.n, password: form.p }]); load(); }}>ADD STAFF</button>
        </div>
        {db.f.map(f => <div key={f.id} className="glass" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>{f.name} ({f.id})</span><Trash2 size={18} color="#f43f5e" onClick={async () => { await supabase.from('faculties').delete().eq('id', f.id); load(); }} />
        </div>)}
      </div>}

      {tab === 'mapping' && <div className="glass">
        <select onChange={e => setForm({ ...form, fid: e.target.value })}><option>Faculty</option>{db.f.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select onChange={e => setForm({ ...form, cl: e.target.value })}><option>Class</option>{sheets.map(s => <option key={s} value={s}>{s}</option>)}</select>
        <input placeholder="Subject" onChange={e => setForm({ ...form, s: e.target.value })} />
        <button className="btn-main" onClick={async () => { await supabase.from('assignments').insert([{ fac_id: form.fid, class_name: form.cl, subject_name: form.s }]); alert("Saved"); load(); }}>ASSIGN SUBJECT</button>
      </div>}

      {tab === 'history' && <div>
        <button className="btn-main" style={{ width: 'auto', marginBottom: '15px' }} onClick={() => {
          const ws = XLSX.utils.json_to_sheet(db.l);
          const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Logs");
          XLSX.writeFile(wb, "Amrit_Master_Data.xlsx");
        }}><Download size={16} /> EXPORT DATABASE</button>
        {db.l.map(l => <div key={l.id} className="glass" style={{ marginBottom: '10px' }}><b>{l.class} - {l.sub}</b> ({l.type})<br/><small>{l.faculty} | {l.present}/{l.total} Present</small></div>)}
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
    if (!setup.cl || !setup.sub || !setup.s) return alert("Missing info");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS.lat, 2) + Math.pow(pos.coords.longitude - CAMPUS.lon, 2));
      if (dist > CAMPUS.rad) { setLoading(false); return alert("Submission blocked: Must be inside Campus."); }
      
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, duration: `${setup.s}-${setup.e}`, present: marked.length, total: list.length, time_str: dt }]).select().single();
      const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      const report = [[INST], ["ATTENDANCE REPORT - " + dt], [], ["FACULTY:", user.name, "CLASS:", setup.cl], ["SUBJECT:", setup.sub, "TYPE:", setup.ty], ["TIME:", `${setup.s} to ${setup.e}`], [], ["ROLL NO", "NAME", "STATUS"]];
      list.forEach(s => report.push([s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]));
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(report), "Data");
      XLSX.writeFile(wb, `${setup.cl}_${setup.sub}_Report.xlsx`);
      alert("Attendance Finalized!"); setView('login');
    }, () => { setLoading(false); alert("GPS Required"); });
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <img src="/logo.png" style={{width:'40px'}} alt="logo" />
        <b>{user.name}</b>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" size={20}/>
      </div>
      <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>
      <p style={{fontSize:'11px', fontWeight:800, color:'#64748b'}}>SELECT CLASS</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891b2' : '' }}>{c}</div>)}
      </div>
      {setup.cl && <div>
        <p style={{fontSize:'11px', fontWeight:800, color:'#64748b'}}>SELECT SUBJECT</p>
        {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', background: setup.sub === j.subject_name ? '#0891b2' : '' }}>{j.subject_name}</div>)}
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}><input type="time" onChange={e => setSetup({ ...setup, s: e.target.value })} /><input type="time" onChange={e => setSetup({ ...setup, e: e.target.value })} /></div>
        <button className="btn-main" onClick={start}>OPEN ROLL LIST</button>
      </div>}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <ArrowLeft onClick={() => setActive(false)} /><b>{setup.cl} | {setup.ty}</b><span>{marked.length}/{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <div style={{ height: '100px' }}></div>
      <button disabled={loading} onClick={submit} className="btn-main" style={{ position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', background: '#10b981' }}>{loading ? "CHECKING GPS..." : "SYNC & REPORT"}</button>
    </div>
  );
          }
