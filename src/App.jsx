import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, Download, Calendar, ShieldCheck, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

// --- Configuration & Constants ---
const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0020; 
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";
const ACADEMIC_YEAR = "2025-26";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-ultimate')) return;
  const s = document.createElement("style");
  s.id = 'amrit-ultimate';
  s.innerHTML = `
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 20px; }
    .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; object-fit: cover; background: #fff; }
    input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 12px; border-radius: 10px; width: 100%; margin-bottom: 10px; box-sizing: border-box; }
    .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.3s; }
    .btn-cyan:hover { background: #06b6d4; transform: translateY(-2px); }
    .roll-btn { padding: 15px 0; border-radius: 12px; text-align: center; font-weight: 800; cursor: pointer; background: #1e293b; transition: 0.2s; border: 1px solid transparent; }
    .roll-btn.active { background: #10b981; transform: scale(1.05); border-color: #34d399; }
    .type-chip { flex: 1; padding: 10px; border-radius: 10px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; font-size: 12px; transition: 0.3s; }
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
      else { alert("Invalid Credentials!"); }
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

// --- HOD PANEL (Complete with 6 Dashboards & Master/Defaulter Export) ---
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

  // Dashboard Logic
  const today = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.l.filter(l => l.time_str === today);
  const theory = todayLogs.filter(l => l.type === 'Theory').length;
  const practical = todayLogs.filter(l => l.type === 'Practical').length;
  const totalPresentToday = todayLogs.reduce((acc, c) => acc + c.present, 0);

  // Master & Defaulter Download Function
  const exportData = async (className, isDefaulter = false) => {
    setLoading(true);
    try {
      const { data: logs } = await supabase.from('attendance').select('id, time_str, sub').eq('class', className);
      const uniqueDates = [...new Set(logs.map(l => `${l.time_str} (${l.sub})`))];
      const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', className);

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(isDefaulter ? 'Defaulter' : 'Master');
      ws.addRow([INSTITUTE_NAME]);
      ws.addRow([`${isDefaulter ? 'DEFAULTER LIST (<75%)' : 'MASTER REGISTER'} - ${className}`]);
      
      const headers = ["ROLL NO", "NAME", ...uniqueDates, "TOTAL", "%"];
      const hRow = ws.addRow(headers);
      hRow.eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF06B6D4'}}; c.font={color:{argb:'FFFFFFFF'},bold:true}; });

      const res = await fetch('/students_list.xlsx');
      const students = XLSX.utils.sheet_to_json(XLSX.read(await res.arrayBuffer(), { type: 'array' }).Sheets[className]);

      students.forEach(s => {
        const roll = String(s['ROLL NO'] || s['ID']);
        let p = 0;
        uniqueDates.forEach(d => {
          const dateOnly = d.split(' (')[0];
          const isA = abs.find(a => String(a.student_roll) === roll && a.date === dateOnly);
          if(!isA) p++;
        });
        const pct = uniqueDates.length > 0 ? (p / uniqueDates.length) * 100 : 0;
        if (!isDefaulter || pct < 75) {
          const rowData = [roll, s['STUDENT NAME']];
          uniqueDates.forEach(d => {
            const dateOnly = d.split(' (')[0];
            const isA = abs.find(a => String(a.student_roll) === roll && a.date === dateOnly);
            rowData.push(!isA ? "P" : "A");
          });
          rowData.push(p, pct.toFixed(2) + "%");
          ws.addRow(rowData);
        }
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `${isDefaulter ? 'Defaulter' : 'Master'}_${className}.xlsx`;
      link.click();
    } catch(e) { alert("Download Failed"); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{color:'#06b6d4'}}>HOD DASHBOARD</h2>
        <LogOut onClick={() => setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>

      {/* 6 DASHBOARDS */}
      {tab === 'dash' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom:'30px' }}>
          <div className="glass"><BookOpen color="#06b6d4"/><h3>{db.l.length}</h3><p>1. Total Lectures</p></div>
          <div className="glass"><Calendar color="#10b981"/><h3>{theory}T | {practical}P</h3><p>2. Daywise Split (T/P)</p></div>
          <div className="glass"><Users color="#f59e0b"/><h3>{totalPresentToday}</h3><p>3. Total Present Today</p></div>
          <div className="glass"><BarChart3 color="#8b5cf6"/>
            <div style={{fontSize:'11px', marginTop:'5px'}}>
               {sheets.slice(0,3).map(s => <div key={s}>{s}: <b>{todayLogs.filter(l=>l.class===s).reduce((a,c)=>a+c.present,0)} Present</b></div>)}
            </div>
            <p>4. Classwise Presence</p>
          </div>
          <div className="glass"><TrendingUp color="#ec4899"/>
            <div style={{fontSize:'11px', marginTop:'5px'}}>
               {sheets.slice(0,3).map(s => <div key={s}>{s}: <b>{db.l.filter(l=>l.class===s).length} Lectures</b></div>)}
            </div>
            <p>5. Classwise Lectures</p>
          </div>
          <div className="glass" style={{border:'1px solid #f43f5e'}}>
            <ShieldCheck color="#f43f5e"/>
            <select id="defClass" style={{fontSize:'10px', marginTop:'5px'}}>
              {sheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn-cyan" style={{fontSize:'10px', padding:'5px', marginTop:'5px', background:'#f43f5e'}} onClick={()=>exportData(document.getElementById('defClass').value, true)}>6. DEFAULTER LIST</button>
          </div>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #1e293b' }}>
        {['dash', 'staff', 'mapping', 'records'].map(t => (
          <p key={t} onClick={()=>setTab(t)} style={{cursor:'pointer', color:tab===t?'#06b6d4':'#64748b', fontWeight:800, paddingBottom:'10px', borderBottom:tab===t?'2px solid #06b6d4':'none'}}>{t.toUpperCase()}</p>
        ))}
      </div>

      {/* RECORDS TAB */}
      {tab === 'records' && (
        <div className="glass">
          <h3>Attendance Logs</h3>
          <div style={{maxHeight:'500px', overflowY:'auto'}}>
            {db.l.map(l => (
              <div key={l.id} className="glass" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>{l.class} | {l.sub}</b><br/><small>{l.faculty} | {l.time_str}</small></div>
                <button onClick={() => exportData(l.class)} style={{background:'none', border:'1px solid #06b6d4', color:'#06b6d4', padding:'5px 10px', borderRadius:'8px', cursor:'pointer', fontSize:'11px'}}>MASTER SHEET</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAFF & MAPPING */}
      {tab === 'staff' && ( <div className="glass"><h3>Add Staff</h3><input id="fi" placeholder="ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Pass"/><button className="btn-cyan" onClick={async()=>{await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]); refresh(); alert("Saved");}}>SAVE</button></div> )}
      {tab === 'mapping' && ( <div className="glass"><h3>Map Subject</h3><select id="sf"><option>Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><select id="sc"><option>Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select><input id="ss" placeholder="Subject"/><button className="btn-cyan" onClick={async()=>{await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]); refresh(); alert("Mapped");}}>MAP</button></div> )}
    </div>
  );
}

// --- FACULTY PANEL (Simplified Start) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  const start = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) return alert("Outside Campus Boundary!");
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, start_time: '10:00', end_time: '11:00', present: marked.length, total: list.length, time_str: dt }]).select().single();
      const absData = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (absData.length > 0) await supabase.from('absentee_records').insert(absData);
      alert("Attendance Submitted!"); setView('login');
    }, () => alert("Enable GPS!"));
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <img src="/logo.png" className="logo-circle" />
        <div style={{textAlign:'right'}}><b>{user.name}</b><br/><small>Faculty</small></div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', cursor:'pointer' }}>{c}</div>)}
      </div>
      {setup.cl && (
        <div className="glass">
          {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'10px', cursor:'pointer', background: setup.sub === j.subject_name ? '#0891B2' : '' }}>{j.subject_name}</div>)}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
            {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
          </div>
          <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>MARK ATTENDANCE</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <ArrowLeft onClick={() => setActive(false)} style={{cursor:'pointer'}} />
        <span style={{background:'#10b981', padding:'5px 12px', borderRadius:'10px'}}>{marked.length}/{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '10px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <button onClick={submit} className="btn-cyan" style={{ position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', background: '#10b981' }}>SUBMIT TO DATABASE</button>
    </div>
  );
    }
