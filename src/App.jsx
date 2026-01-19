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
    * { box-sizing: border-box; }
    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      background: #020617; 
      color: #f1f5f9; 
      margin: 0; 
      padding: 0;
      overflow-x: hidden;
    }
    .container { padding: 15px; max-width: 1200px; margin: 0 auto; }
    .glass { 
      background: rgba(30, 41, 59, 0.4); 
      backdrop-filter: blur(12px); 
      border: 1px solid rgba(255, 255, 255, 0.1); 
      border-radius: 16px; 
      padding: 15px; 
      transition: 0.3s;
      width: 100%;
      margin-bottom: 15px;
    }
    .logo-circle { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #06b6d4; background: #fff; object-fit: contain; }
    
    .stat-grid { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 10px; 
      margin-bottom: 20px; 
    }
    @media (min-width: 768px) {
      .stat-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .stat-card { border-left: 3px solid #06b6d4; padding: 12px; position: relative; overflow: hidden; }
    .stat-card h3 { font-size: 22px; margin: 5px 0; font-weight: 800; color: #fff; }
    .stat-card p { font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 0; }

    input, select { 
      background: #0f172a; 
      border: 1px solid #1e293b; 
      color: #fff; 
      padding: 12px; 
      border-radius: 10px; 
      width: 100%; 
      margin-bottom: 10px; 
      font-size: 14px;
      outline: none;
    }

    .btn-cyan { 
      background: #0891b2; 
      color: #fff; 
      border: none; 
      padding: 14px; 
      border-radius: 12px; 
      font-weight: 700; 
      width: 100%; 
      cursor: pointer;
      transition: 0.2s;
    }
    .btn-cyan:active { transform: scale(0.98); }
    
    .tab-nav { 
      display: flex; 
      gap: 15px; 
      margin-bottom: 20px; 
      border-bottom: 1px solid #1e293b; 
      overflow-x: auto; 
      padding-bottom: 5px;
    }
    .tab-link { cursor: pointer; padding: 8px 5px; color: #64748b; font-weight: 700; font-size: 12px; white-space: nowrap; }
    .tab-link.active { color: #06b6d4; border-bottom: 2px solid #06b6d4; }
    
    .roll-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
      gap: 10px;
      margin-bottom: 100px;
    }

    .roll-btn { 
      padding: 15px 0; 
      border-radius: 10px; 
      text-align: center; 
      font-weight: 800; 
      background: #1e293b; 
      color: #94a3b8; 
      font-size: 15px;
      border: 1px solid rgba(255,255,255,0.05);
      cursor: pointer;
    }
    .roll-btn.active { 
      background: #10b981 !important; 
      color: white !important; 
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .type-chip { flex: 1; padding: 12px; border-radius: 10px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; font-size: 14px; }
    .type-chip.active { background: #06b6d4; color: white; }
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
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="glass" style={{ maxWidth: '340px', textAlign: 'center' }}>
        <img src="/logo.png" className="logo-circle" style={{width:'80px', height:'80px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0, fontWeight: 900}}>AMRIT ERP</h2>
        <p style={{fontSize: '11px', color: '#64748b', marginBottom: '20px'}}>Computer Engineering Dept.</p>
        <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div className="container">
      {view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
    </div>
  );
}

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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src="/logo.png" className="logo-circle" alt="Logo" />
          <h3 style={{color:'#06b6d4', margin:0, fontWeight: 800}}>HOD ADMIN</h3>
        </div>
        <LogOut onClick={() => setView('login')} color="#f43f5e" size={20} />
      </div>

      {tab === 'dash' && (
        <div className="stat-grid">
          <div className="glass stat-card"><h3>{db.l.length}</h3><p>Total Lec</p></div>
          <div className="glass stat-card"><h3>{tLogs.length}</h3><p>Today Lec</p></div>
          <div className="glass stat-card"><h3>{tLogs.reduce((a,c)=>a+c.present,0)}</h3><p>Present Today</p></div>
          <div className="glass stat-card"><h3>{sheets.length}</h3><p>Classes</p></div>
          <div className="glass stat-card"><h3>{db.f.length}</h3><p>Staff</p></div>
          <div className="glass stat-card" style={{borderLeftColor:'#f43f5e'}}>
             <select id="dc" style={{fontSize:'10px', padding:'5px', marginBottom:'5px'}}>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
             <button onClick={()=>exportReport(document.getElementById('dc').value, true)} style={{padding:'5px', fontSize:'9px', background:'#f43f5e', color:'#fff', border:'none', borderRadius:'5px', width:'100%'}}>DEFAULTER</button>
          </div>
        </div>
      )}

      <div className="tab-nav">
        {['dash', 'staff', 'mapping', 'records'].map(t => (
          <div key={t} onClick={()=>setTab(t)} className={`tab-link ${tab===t?'active':''}`}>{t.toUpperCase()}</div>
        ))}
      </div>

      {tab === 'staff' && (
        <div className="glass">
          <h4 style={{marginTop:0}}>Add Faculty</h4>
          <input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/>
          <button className="btn-cyan" onClick={async()=>{
            await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
            refresh(); alert("Staff Added!");
          }}>SAVE</button>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass">
          <h4 style={{marginTop:0}}>Mapping</h4>
          <select id="sf"><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select id="sc"><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input id="ss" placeholder="Subject"/>
          <button className="btn-cyan" onClick={async()=>{
            await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
            refresh(); alert("Mapped!");
          }}>CONFIRM</button>
        </div>
      )}

      {tab === 'records' && (
        <div>
          {sheets.map(s => (
            <div key={s} className="glass" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 15px'}}>
              <span style={{fontSize:'13px', fontWeight:700}}>{s} Master</span>
              <button onClick={()=>exportReport(s, false)} className="btn-cyan" style={{width:'80px', padding:'6px', fontSize:'10px'}}>GET XLSX</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  const generateCurrentSheet = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Attendance');
    ws.addRow([INSTITUTE_NAME]);
    ws.addRow([`CLASS: ${setup.cl}`, `SUBJECT: ${setup.sub}`]);
    ws.addRow([`DATE: ${new Date().toLocaleDateString('en-GB')}`, `FACULTY: ${user.name}`]);
    ws.addRow([]);
    ws.addRow(["ROLL NO", "STUDENT NAME", "STATUS"]);
    list.forEach(s => ws.addRow([s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]));
    const buffer = await wb.xlsx.writeBuffer();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(new Blob([buffer]));
    link.download = `Attendance_${setup.cl}_${setup.sub}.xlsx`;
    link.click();
  };

  const start = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setMarked([]); setActive(true);
    });
  };

  const submit = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) return alert("Outside campus!");
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
      }]).select().single();
      const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
      await generateCurrentSheet();
      alert("Saved & Downloaded!"); setView('login');
    }, () => alert("GPS Error!"));
  };

  if (!active) return (
    <>
      <div className="glass" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src="/logo.png" className="logo-circle" alt="Logo" />
          <span style={{fontWeight:800}}>{user.name}</span>
        </div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" size={20} />
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', fontWeight:800, margin:0 }}>{c}</div>)}
      </div>
      {setup.cl && (
        <div className="glass">
          {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'12px', background: setup.sub === j.subject_name ? '#0891B2' : '', fontSize:'13px' }}>{j.subject_name}</div>)}
          <div style={{display:'flex', gap:'10px'}}><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
          <button className="btn-cyan" onClick={start} style={{marginTop:'10px'}}>START</button>
        </div>
      )}
    </>
  );

  return (
    <div style={{position:'relative'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
        <ArrowLeft onClick={() => setActive(false)} />
        <div style={{textAlign:'center'}}><b style={{color:'#06b6d4'}}>{setup.cl}</b><br/><small>{setup.sub}</small></div>
        <div style={{background:'#10b981', padding:'5px 12px', borderRadius:'8px', fontWeight:800}}>{marked.length}/{list.length}</div>
      </div>
      <div className="roll-grid">
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px', background: '#020617', borderTop:'1px solid #1e293b' }}>
        <button onClick={submit} className="btn-cyan" style={{ background: '#10b981' }}>SUBMIT & DOWNLOAD</button>
      </div>
    </div>
  );
      }
