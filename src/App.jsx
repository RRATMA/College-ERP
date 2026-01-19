import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, Download, Calendar, ShieldCheck, BarChart3, FileSpreadsheet, PlusCircle, Link as LinkIcon, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0018; 
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-ultimate-vfinal')) return;
  const s = document.createElement("style");
  s.id = 'amrit-ultimate-vfinal';
  s.innerHTML = `
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; transition: 0.3s; }
    .logo-circle { width: 55px; height: 55px; border-radius: 50%; border: 2px solid #06b6d4; object-fit: cover; background: #fff; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { position: relative; overflow: hidden; border-left: 4px solid #06b6d4; }
    .stat-card h3 { font-size: 28px; margin: 10px 0 5px 0; font-weight: 800; color: #fff; }
    .stat-card p { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 0; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 12px; width: 100%; outline: none; margin-bottom: 10px; }
    .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.3s; }
    .btn-cyan:hover { background: #06b6d4; transform: translateY(-2px); }
    .tab-nav { display: flex; gap: 25px; margin-bottom: 25px; border-bottom: 1px solid #1e293b; overflow-x: auto; }
    .tab-link { cursor: pointer; padding: 12px 5px; color: #64748b; font-weight: 700; font-size: 13px; white-space: nowrap; }
    .tab-link.active { color: #06b6d4; border-bottom: 2px solid #06b6d4; }
    .roll-btn { padding: 18px 0; border-radius: 12px; text-align: center; font-weight: 800; background: #1e293b; cursor: pointer; transition: 0.2s; border: 1px solid rgba(255,255,255,0.05); color: #94a3b8; }
    .roll-btn.active { background: #10b981 !important; color: white !important; border-color: #34d399; transform: scale(1.05); }
    .type-chip { flex: 1; padding: 12px; border-radius: 10px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; }
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
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      setSheets(XLSX.read(ab, { type: 'array' }).SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { 
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); 
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } 
      else { alert("Login Failed!"); }
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ width: '340px', textAlign: 'center' }}>
        <img src="/logo.png" className="logo-circle" style={{width:'90px', height:'90px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0}}>AMRIT ERP</h2>
        <input id="u" placeholder="Employee ID" style={{marginTop:'15px'}} /><input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], m: [] });

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f || [], l: l || [], m: m || [] });
  };
  useEffect(() => { refresh(); }, []);

  const today = new Date().toLocaleDateString('en-GB');
  const tLogs = db.l.filter(l => l.time_str === today);
  const theory = tLogs.filter(l => l.type === 'Theory').length;
  const practical = tLogs.filter(l => l.type === 'Practical').length;

  const exportReport = async (cls, isDef) => {
    try {
      const { data: logs } = await supabase.from('attendance').select('id, time_str, sub').eq('class', cls);
      const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', cls);
      const students = XLSX.utils.sheet_to_json(XLSX.read(await (await fetch('/students_list.xlsx')).arrayBuffer(), { type: 'array' }).Sheets[cls]);
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      ws.addRow([INSTITUTE_NAME]);
      ws.addRow([`${isDef ? 'DEFAULTER' : 'MASTER'} - ${cls}`]);
      const headers = ["ROLL NO", "NAME", ...logs.map(l => `${l.time_str}\n(${l.sub})`), "TOTAL", "%"];
      const hRow = ws.addRow(headers);
      hRow.eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0891B2'}}; c.font={color:{argb:'FFFFFFFF'},bold:true}; });

      students.forEach(s => {
        const roll = String(s['ROLL NO'] || s['ID']);
        let p = 0;
        const row = [roll, s['STUDENT NAME']];
        logs.forEach(l => {
          const isA = abs.find(a => a.attendance_id === l.id && String(a.student_roll) === roll);
          if(!isA) { row.push("P"); p++; } else row.push("A");
        });
        const pct = (p / (logs.length || 1)) * 100;
        if (!isDef || pct < 75) { row.push(p, pct.toFixed(2) + "%"); ws.addRow(row); }
      });
      const buffer = await wb.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `${isDef ? 'Defaulter' : 'Master'}_${cls}.xlsx`;
      link.click();
    } catch(e) { alert("Download error!"); }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <img src="/logo.png" className="logo-circle" alt="Logo" />
          <h2 style={{color:'#06b6d4', margin:0}}>HOD ADMIN</h2>
        </div>
        <LogOut onClick={() => setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>
      {tab === 'dash' && (
        <div className="stat-grid">
          <div className="glass stat-card"><h3>{db.l.length}</h3><p>Total Lectures</p></div>
          <div className="glass stat-card"><h3>{theory}T | {practical}P</h3><p>Today's Lectures</p></div>
          <div className="glass stat-card"><h3>{tLogs.reduce((a,c)=>a+c.present,0)}</h3><p>Today's Present</p></div>
          <div className="glass stat-card"><h3>{sheets.length}</h3><p>Total Classes</p></div>
          <div className="glass stat-card"><h3>{db.f.length}</h3><p>Staff Count</p></div>
          <div className="glass stat-card" style={{borderLeftColor:'#f43f5e'}}>
             <select id="dc" style={{fontSize:'12px'}}>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
             <button onClick={()=>exportReport(document.getElementById('dc').value, true)} className="btn-cyan" style={{padding:'8px', fontSize:'11px', background:'#f43f5e', marginTop:'5px'}}>DEFAULTER LIST</button>
          </div>
        </div>
      )}
      <div className="tab-nav">
        {['dash', 'staff', 'mapping', 'records'].map(t => (
          <div key={t} onClick={()=>setTab(t)} className={`tab-link ${tab===t?'active':''}`}>{t.toUpperCase()}</div>
        ))}
      </div>
      {tab === 'staff' && (
        <div className="glass" style={{maxWidth:'500px'}}>
          <h3>Faculty Registration</h3>
          <input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/>
          <button className="btn-cyan" onClick={async()=>{
            await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
            refresh(); alert("Staff Added!");
          }}>SAVE FACULTY</button>
        </div>
      )}
      {tab === 'mapping' && (
        <div className="glass" style={{maxWidth:'500px'}}>
          <h3>Subject Assignment</h3>
          <select id="sf"><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select id="sc"><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input id="ss" placeholder="Subject Name"/>
          <button className="btn-cyan" onClick={async()=>{
            await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
            refresh(); alert("Mapping Done!");
          }}>CONFIRM MAPPING</button>
        </div>
      )}
      {tab === 'records' && (
        <div className="glass">
          {sheets.map(s => (
            <div key={s} className="glass" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.03)'}}>
              <b>{s} Master Register</b>
              <button onClick={()=>exportReport(s, false)} className="btn-cyan" style={{width:'110px', padding:'8px', fontSize:'11px'}}>DOWNLOAD</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (Corrected Logic + Master Sheet) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  const exportFacultyMaster = async () => {
    if (!setup.cl || !setup.sub) return alert("Select Class and Subject!");
    try {
      const { data: logs } = await supabase.from('attendance').select('id, time_str').eq('class', setup.cl).eq('sub', setup.sub).order('time_str', { ascending: true });
      const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', setup.cl);
      const res = await fetch('/students_list.xlsx');
      const students = XLSX.utils.sheet_to_json(XLSX.read(await res.arrayBuffer(), { type: 'array' }).Sheets[setup.cl]);
      
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('My Master');
      ws.addRow([INSTITUTE_NAME]);
      ws.addRow([`SUBJECT: ${setup.sub} | CLASS: ${setup.cl}`]);
      ws.addRow(["ROLL NO", "NAME", ...logs.map(l => l.time_str), "TOTAL", "%"]);
      
      students.forEach(s => {
        const roll = String(s['ROLL NO'] || s['ID']);
        let p = 0;
        const row = [roll, s['STUDENT NAME']];
        logs.forEach(l => {
          const isA = abs.find(a => a.attendance_id === l.id && String(a.student_roll) === roll);
          if(!isA) { row.push("P"); p++; } else row.push("A");
        });
        row.push(p, ((p/(logs.length || 1))*100).toFixed(2) + "%");
        ws.addRow(row);
      });
      const buffer = await wb.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `Faculty_Master_${setup.cl}_${setup.sub}.xlsx`;
      link.click();
    } catch(e) { alert("Download Error!"); }
  };

  const start = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setMarked([]); // Empty initially (All Absent)
      setActive(true);
    });
  };

  const submit = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) return alert("Outside campus boundary!");
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
      }]).select().single();
      const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Attendance Saved!"); setView('login');
    }, () => alert("GPS Error!"));
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src="/logo.png" className="logo-circle" style={{width:'45px', height:'45px'}} alt="Logo" />
          <b>{user.name}</b>
        </div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', cursor:'pointer', fontWeight:800 }}>{c}</div>)}
      </div>
      {setup.cl && (
        <div className="glass">
          {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'12px', cursor:'pointer', background: setup.sub === j.subject_name ? '#0891B2' : '' }}>{j.subject_name}</div>)}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
          <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>START MARKING</button>
          {/* Faculty Master Sheet Feature */}
          <button className="btn-cyan" onClick={exportFacultyMaster} style={{marginTop:'10px', background:'#1e293b', border:'1px solid #06b6d4'}}>DOWNLOAD MY MASTER</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
        <ArrowLeft onClick={() => setActive(false)} style={{cursor:'pointer'}} />
        <div style={{textAlign:'center'}}><b>{setup.cl}</b><br/><small>{setup.sub}</small></div>
        <div style={{background:'#10b981', padding:'5px 15px', borderRadius:'10px', fontWeight:800}}>{marked.length}/{list.length}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px', marginBottom:'100px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'rgba(2,6,23,0.9)', backdropFilter:'blur(10px)' }}>
        <button onClick={submit} className="btn-cyan" style={{ background: '#10b981' }}>SUBMIT ATTENDANCE</button>
      </div>
    </div>
  );
  }
