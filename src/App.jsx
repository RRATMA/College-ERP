import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, Download, Calendar, ShieldCheck, BarChart3, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0020; 
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";
const ACADEMIC_YEAR = "2025-26";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-ultimate-v2')) return;
  const s = document.createElement("style");
  s.id = 'amrit-ultimate-v2';
  s.innerHTML = `
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; transition: 0.3s ease; }
    .glass:hover { border-color: #06b6d4; background: rgba(30, 41, 59, 0.6); }
    .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; object-fit: cover; background: #fff; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 10px; box-sizing: border-box; outline: none; }
    input:focus, select:focus { border-color: #06b6d4; }
    .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.3s; }
    .btn-cyan:hover { background: #06b6d4; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3); }
    .roll-btn { padding: 15px 0; border-radius: 12px; text-align: center; font-weight: 800; cursor: pointer; background: #1e293b; transition: 0.2s; border: 1px solid transparent; }
    .roll-btn.active { background: #10b981; transform: scale(1.05); border-color: #34d399; }
    .stat-val { font-size: 24px; font-weight: 800; color: #fff; margin: 5px 0; }
    .stat-label { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
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
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' }}>
      <div className="glass" style={{ width: '340px', textAlign: 'center' }}>
        <img src="/logo.png" className="logo-circle" style={{width:'80px', height:'80px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0, letterSpacing: '2px'}}>AMRIT ERP</h2>
        <p style={{fontSize:'11px', color:'#64748b', marginBottom:'20px'}}>SECURE FACULTY PORTAL</p>
        <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- INTERACTIVE HOD PANEL ---
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
  const totalPresentToday = todayLogs.reduce((acc, c) => acc + c.present, 0);

  // --- RECTIFIED DEFAULTER & MASTER LOGIC ---
  const exportClassReport = async (className, mode) => {
    setLoading(true);
    try {
      // 1. Get all logs for this class
      const { data: classLogs } = await supabase.from('attendance').select('id, time_str, sub').eq('class', className);
      if(!classLogs.length) return alert("No records found for this class!");

      // 2. Get all absentee records for this class
      const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', className);

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(mode === 'def' ? 'Defaulters' : 'Master Register');
      
      // Header
      ws.addRow([INSTITUTE_NAME]);
      ws.addRow([`${mode === 'def' ? 'OVERALL DEFAULTER LIST (<75%)' : 'COMPLETE MASTER REGISTER'} - ${className}`]);
      ws.addRow([`Academic Year: ${ACADEMIC_YEAR}`]);
      ws.addRow([]);

      const uniqueSessions = classLogs.map(l => `${l.time_str} | ${l.sub}`);
      const headers = ["ROLL NO", "STUDENT NAME", ...uniqueSessions, "TOTAL", "%"];
      const hRow = ws.addRow(headers);
      hRow.eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0891B2'}}; c.font={color:{argb:'FFFFFFFF'},bold:true}; });

      // Fetch Student List
      const res = await fetch('/students_list.xlsx');
      const students = XLSX.utils.sheet_to_json(XLSX.read(await res.arrayBuffer(), { type: 'array' }).Sheets[className]);

      students.forEach(s => {
        const roll = String(s['ROLL NO'] || s['ID']);
        let presentCount = 0;
        const attendanceRow = [];

        classLogs.forEach(log => {
          const isAbsent = abs.find(a => a.attendance_id === log.id && String(a.student_roll) === roll);
          if(!isAbsent) {
            attendanceRow.push("P");
            presentCount++;
          } else {
            attendanceRow.push("A");
          }
        });

        const percentage = (presentCount / classLogs.length) * 100;

        // Mode Logic: If defaulter, only add if < 75%
        if (mode === 'master' || (mode === 'def' && percentage < 75)) {
          const row = [roll, s['STUDENT NAME'], ...attendanceRow, presentCount, percentage.toFixed(2) + "%"];
          const addedRow = ws.addRow(row);
          if (percentage < 75) addedRow.getCell(addedRow.cellCount).font = { color: { argb: 'FFFF0000' }, bold: true };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `${mode === 'def' ? 'Defaulter' : 'Master'}_${className}.xlsx`;
      link.click();
    } catch(e) { alert("Report Generation Failed!"); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{margin:0, color:'#06b6d4'}}>HOD COMMAND CENTER</h2>
          <small style={{color:'#64748b'}}>{ACADEMIC_YEAR} | ATMA MALIK IT&R</small>
        </div>
        <button onClick={() => setView('login')} className="glass" style={{color:'#f43f5e', border:'1px solid #f43f5e', cursor:'pointer', padding:'10px 15px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'8px'}}>
          <LogOut size={16}/> EXIT
        </button>
      </div>

      {/* 6 INTERACTIVE DASHBOARDS */}
      {tab === 'dash' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom:'30px' }}>
          <div className="glass">
            <div style={{display:'flex', justifyContent:'space-between'}}><BookOpen color="#06b6d4"/><span className="stat-label">Total Lectures</span></div>
            <div className="stat-val">{db.l.length}</div>
            <p style={{fontSize:'11px', color:'#64748b'}}>Total sessions conducted till date</p>
          </div>
          
          <div className="glass">
            <div style={{display:'flex', justifyContent:'space-between'}}><Calendar color="#10b981"/><span className="stat-label">Daywise Split</span></div>
            <div className="stat-val">{theory}T | {practical}P</div>
            <p style={{fontSize:'11px', color:'#64748b'}}>Sessions conducted today ({today})</p>
          </div>

          <div className="glass">
            <div style={{display:'flex', justifyContent:'space-between'}}><Users color="#f59e0b"/><span className="stat-label">Live Presence</span></div>
            <div className="stat-val">{totalPresentToday}</div>
            <p style={{fontSize:'11px', color:'#64748b'}}>Students marked present today</p>
          </div>

          <div className="glass">
            <div style={{display:'flex', justifyContent:'space-between'}}><BarChart3 color="#8b5cf6"/><span className="stat-label">Class Presence</span></div>
            <div style={{marginTop:'10px'}}>
               {sheets.map(s => {
                 const p = todayLogs.filter(l=>l.class===s).reduce((a,c)=>a+c.present,0);
                 return <div key={s} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', margin:'4px 0'}}>
                   <span>{s}</span><b style={{color:'#10b981'}}>{p} Students</b>
                 </div>
               })}
            </div>
          </div>

          <div className="glass">
            <div style={{display:'flex', justifyContent:'space-between'}}><TrendingUp color="#ec4899"/><span className="stat-label">Workload</span></div>
            <div style={{marginTop:'10px'}}>
               {sheets.map(s => {
                 const c = db.l.filter(l=>l.class===s).length;
                 return <div key={s} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', margin:'4px 0'}}>
                   <span>{s}</span><b style={{color:'#ec4899'}}>{c} Lectures</b>
                 </div>
               })}
            </div>
          </div>

          <div className="glass" style={{border:'1px solid rgba(244, 63, 94, 0.3)'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}><ShieldCheck color="#f43f5e"/><span className="stat-label">Smart Reports</span></div>
            <select id="repClass" style={{marginTop:'10px', fontSize:'12px'}}>
              {sheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{display:'flex', gap:'8px'}}>
              <button className="btn-cyan" style={{fontSize:'10px', padding:'8px', background:'#f43f5e'}} onClick={()=>exportClassReport(document.getElementById('repClass').value, 'def')}>DEFAULTER</button>
              <button className="btn-cyan" style={{fontSize:'10px', padding:'8px'}} onClick={()=>exportClassReport(document.getElementById('repClass').value, 'master')}>MASTER</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ display: 'flex', gap: '25px', marginBottom: '25px', borderBottom: '1px solid #1e293b' }}>
        {['dash', 'staff', 'mapping', 'records'].map(t => (
          <p key={t} onClick={()=>setTab(t)} style={{cursor:'pointer', color:tab===t?'#06b6d4':'#64748b', fontWeight:800, paddingBottom:'12px', borderBottom:tab===t?'2px solid #06b6d4':'none', transition:'0.3s'}}>
            {t.toUpperCase()}
          </p>
        ))}
      </div>

      {/* LOGS / RECORDS */}
      {tab === 'records' && (
        <div className="glass">
          <h3 style={{marginTop:0}}>Recent Attendance Logs</h3>
          <div style={{maxHeight:'500px', overflowY:'auto'}}>
            {db.l.map(l => (
              <div key={l.id} className="glass" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px'}}>
                <div>
                  <b style={{color:'#06b6d4'}}>{l.class} | {l.sub}</b><br/>
                  <small style={{color:'#64748b'}}>{l.faculty} • {l.time_str} • {l.type}</small>
                </div>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                  <span style={{color:'#10b981', fontWeight:800}}>{l.present}/{l.total}</span>
                  <Trash2 size={18} color="#f43f5e" style={{cursor:'pointer'}} onClick={async()=>{if(confirm("Delete this record?")){await supabase.from('attendance').delete().eq('id', l.id); refresh();}}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* (STAFF & MAPPING SECTIONS REMAIN SAME) */}
      {tab === 'staff' && ( <div className="glass"><h3>Faculty Directory</h3><div style={{display:'flex', gap:'10px'}}><input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/></div><button className="btn-cyan" onClick={async()=>{await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]); refresh(); alert("Saved");}}>ADD FACULTY</button></div> )}
      {tab === 'mapping' && ( <div className="glass"><h3>Subject Mapping</h3><select id="sf"><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><select id="sc"><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select><input id="ss" placeholder="Subject Name"/><button className="btn-cyan" onClick={async()=>{await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]); refresh(); alert("Mapped");}}>SAVE MAPPING</button></div> )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  const start = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) return alert("Error: Outside Campus Boundary!");
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at, error } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, present: marked.length, total: list.length, time_str: dt }]).select().single();
      if(error) return alert("Database Error!");
      const absData = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (absData.length > 0) await supabase.from('absentee_records').insert(absData);
      alert("Attendance Submitted!"); setView('login');
    }, () => alert("Please enable GPS!"));
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <img src="/logo.png" className="logo-circle" />
        <div style={{textAlign:'right'}}><b>{user.name}</b><br/><small>Faculty Access</small></div>
      </div>
      <p style={{fontSize:'12px', color:'#64748b', fontWeight:700}}>SELECT CLASS</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', cursor:'pointer', padding:'15px' }}>{c}</div>)}
      </div>
      {setup.cl && (
        <div className="glass">
          <p style={{fontSize:'12px', color:'#64748b', fontWeight:700}}>SELECT SUBJECT</p>
          {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'12px', cursor:'pointer', background: setup.sub === j.subject_name ? '#0891B2' : '' }}>{j.subject_name}</div>)}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
            {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
          </div>
          <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
        <ArrowLeft onClick={() => setActive(false)} style={{cursor:'pointer'}} />
        <div style={{textAlign:'center'}}><b>{setup.cl}</b><br/><small>{setup.sub}</small></div>
        <span style={{background:'#10b981', padding:'5px 12px', borderRadius:'10px', fontWeight:800}}>{marked.length}/{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '10px', marginBottom:'80px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <button onClick={submit} className="btn-cyan" style={{ position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', background: '#10b981' }}>SUBMIT ATTENDANCE</button>
    </div>
  );
}
