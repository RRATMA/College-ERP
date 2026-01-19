import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, Download, Calendar, ShieldCheck, BarChart3, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0018; // 200 meters accuracy
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-ultimate-vfinal')) return;
  const s = document.createElement("style");
  s.id = 'amrit-ultimate-vfinal';
  s.innerHTML = `
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; transition: 0.3s; }
    .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; object-fit: cover; background: #fff; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 10px; box-sizing: border-box; outline: none; }
    .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.3s; }
    .btn-cyan:hover { background: #06b6d4; transform: translateY(-2px); }
    .roll-btn { padding: 15px 0; border-radius: 12px; text-align: center; font-weight: 800; cursor: pointer; background: #1e293b; transition: 0.2s; border: 1px solid rgba(255,255,255,0.05); }
    .roll-btn.active { background: #10b981; transform: scale(1.05); border-color: #34d399; color: white; }
    .type-chip { flex: 1; padding: 12px; border-radius: 10px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; font-size: 13px; transition: 0.3s; }
    .type-chip.active { background: #06b6d4; color: #fff; }
    .stat-card h3 { margin: 5px 0; font-size: 22px; color: #fff; }
    .stat-card p { margin: 0; font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
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
        <img src="/logo.png" className="logo-circle" style={{width:'80px', height:'80px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0}}>AMRIT ERP</h2>
        <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL (Restored All Features: Staff Add, Mapping, Master Reports) ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], m: [] });
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f||[], l: l||[], m: m||[] });
  };
  useEffect(() => { refresh(); }, []);

  const today = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.l.filter(l => l.time_str === today);
  const theory = todayLogs.filter(l => l.type === 'Theory').length;
  const practical = todayLogs.filter(l => l.type === 'Practical').length;

  const exportHODReport = async (className, isDefaulter = false) => {
    setLoading(true);
    try {
      const { data: logs } = await supabase.from('attendance').select('id, time_str, sub').eq('class', className);
      const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', className);
      const students = XLSX.utils.sheet_to_json(XLSX.read(await (await fetch('/students_list.xlsx')).arrayBuffer(), { type: 'array' }).Sheets[className]);
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Report');
      ws.addRow([INSTITUTE_NAME]);
      ws.addRow([`${isDefaulter ? 'DEFAULTER LIST' : 'MASTER REGISTER'} - ${className}`]);
      const headers = ["ROLL NO", "NAME", ...logs.map(l => `${l.time_str}\n(${l.sub})`), "TOTAL", "%"];
      const hRow = ws.addRow(headers);
      hRow.eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0891B2'}}; c.font={color:{argb:'FFFFFFFF'},bold:true}; });

      students.forEach(s => {
        const roll = String(s['ROLL NO'] || s['ID']);
        let p = 0;
        const rowData = [roll, s['STUDENT NAME']];
        logs.forEach(l => {
          const isA = abs.find(a => a.attendance_id === l.id && String(a.student_roll) === roll);
          if(!isA) { rowData.push("P"); p++; } else rowData.push("A");
        });
        const pct = (p / (logs.length || 1)) * 100;
        if (!isDefaulter || pct < 75) {
          rowData.push(p, pct.toFixed(2) + "%");
          ws.addRow(rowData);
        }
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `${isDefaulter ? 'Defaulter' : 'Master'}_${className}.xlsx`;
      link.click();
    } catch(e) { alert("Error!"); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <img src="/logo.png" className="logo-circle" style={{width:'50px', height:'50px'}} alt="Logo" />
          <h2 style={{color:'#06b6d4', margin:0}}>HOD ADMIN</h2>
        </div>
        <LogOut onClick={() => setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>

      {tab === 'dash' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom:'30px' }}>
          <div className="glass stat-card"><BookOpen color="#06b6d4"/><h3>{db.l.length}</h3><p>Total Lectures</p></div>
          <div className="glass stat-card"><Calendar color="#10b981"/><h3>{theory}T | {practical}P</h3><p>Today's Split</p></div>
          <div className="glass stat-card"><Users color="#f59e0b"/><h3>{todayLogs.reduce((a,c)=>a+c.present,0)}</h3><p>Today's Presence</p></div>
          <div className="glass stat-card" style={{border:'1px solid #f43f5e'}}>
            <select id="selCls" style={{fontSize:'12px', marginTop:'5px'}}>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <button onClick={()=>exportHODReport(document.getElementById('selCls').value, true)} className="btn-cyan" style={{background:'#f43f5e', padding:'8px', fontSize:'11px'}}>GET DEFAULTER LIST</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #1e293b' }}>
        {['dash', 'staff', 'mapping', 'records'].map(t => (
          <p key={t} onClick={()=>setTab(t)} style={{cursor:'pointer', color:tab===t?'#06b6d4':'#64748b', fontWeight:800, paddingBottom:'10px', borderBottom:tab===t?'2px solid #06b6d4':'none'}}>{t.toUpperCase()}</p>
        ))}
      </div>

      {tab === 'staff' && (
        <div className="glass">
          <h3>Add New Faculty</h3>
          <input id="fi" placeholder="Employee ID"/><input id="fn" placeholder="Full Name"/><input id="fp" placeholder="Password"/>
          <button className="btn-cyan" onClick={async()=>{
            await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
            refresh(); alert("Faculty Added!");
          }}>SAVE FACULTY</button>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass">
          <h3>Subject Mapping</h3>
          <select id="sf"><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select id="sc"><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input id="ss" placeholder="Subject Name"/>
          <button className="btn-cyan" onClick={async()=>{
            await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
            refresh(); alert("Mapping Saved!");
          }}>SAVE MAPPING</button>
        </div>
      )}

      {tab === 'records' && (
        <div className="glass">
          <h3>Classwise Master Sheets</h3>
          {sheets.map(s => (
            <div key={s} className="glass" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <b>{s} Master Register</b>
              <button onClick={()=>exportHODReport(s, false)} className="btn-cyan" style={{width:'150px', fontSize:'12px', padding:'8px'}}>DOWNLOAD</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (Restored Exact Original Logic with Logo) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  const exportMasterFormat = async () => {
    if (!setup.cl || !setup.sub) return alert("Select Class and Subject!");
    setLoading(true);
    try {
      const { data: logs } = await supabase.from('attendance').select('id, time_str').eq('class', setup.cl).eq('sub', setup.sub).order('time_str', { ascending: true });
      const uniqueDates = logs.map(l => l.time_str);
      const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', setup.cl);
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Master');
      ws.addRow([INSTITUTE_NAME]);
      ws.addRow(["ROLL NO", "STUDENT NAME", ...uniqueDates, "TOTAL", "%"]);
      const res = await fetch('/students_list.xlsx');
      const students = XLSX.utils.sheet_to_json(XLSX.read(await res.arrayBuffer(), { type: 'array' }).Sheets[setup.cl]);
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
      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `Master_${setup.cl}_${setup.sub}.xlsx`;
      link.click();
    } catch(e) { alert("Error!"); } finally { setLoading(false); }
  };

  const start = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setMarked(data.map(s => String(s['ROLL NO'] || s['ID'])));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) { setLoading(false); return alert("Out of Campus Boundary!"); }
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
      }]).select().single();
      const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Attendance Saved!"); setView('login');
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass" style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src="/logo.png" className="logo-circle" style={{width:'40px', height:'40px'}} alt="Logo" />
          <div><b>{user.name}</b><br/><small>Faculty</small></div>
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
          <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>START SESSION</button>
          <button className="btn-cyan" onClick={exportMasterFormat} style={{marginTop:'10px', background:'#1e293b', border:'1px solid #06b6d4'}}>DOWNLOAD MASTER</button>
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
