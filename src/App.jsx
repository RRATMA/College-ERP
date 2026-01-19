import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, UserCheck, Calendar, Info, Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0020; 
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";
const ACADEMIC_YEAR = "2025-26";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-vfinal')) return;
  const s = document.createElement("style");
  s.id = 'amrit-vfinal';
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
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { color: #06b6d4; text-align: left; padding: 12px; border-bottom: 2px solid #1e293b; }
    td { padding: 12px; border-bottom: 1px solid #1e293b; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
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
    }).catch(() => console.log("Student list file missing"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { 
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); 
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } 
      else { alert("Access Denied: Invalid Credentials!"); }
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass" style={{ width: '340px', textAlign: 'center' }}>
        <img src="/logo.png" className="logo-circle" style={{width:'80px', height:'80px', marginBottom:'15px'}} alt="Logo" />
        <h2 style={{color: '#06b6d4', margin: 0}}>AMRIT ERP</h2>
        <p style={{fontSize:'12px', color:'#64748b', marginBottom:'20px'}}>Institute Management Portal {ACADEMIC_YEAR}</p>
        <input id="u" placeholder="Employee ID" />
        <input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- FULLY COMPLETED HOD PANEL ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], m: [] });
  const [form, setForm] = useState({});

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f||[], l: l||[], m: m||[] });
  };
  useEffect(() => { refresh(); }, []);

  const deleteAssignment = async (id) => {
    if(confirm("Remove this mapping?")) { await supabase.from('assignments').delete().eq('id', id); refresh(); }
  };

  const deleteFaculty = async (id) => {
    if(confirm("Permanently remove this faculty member?")) { await supabase.from('faculties').delete().eq('id', id); refresh(); }
  };

  const deleteLog = async (id) => {
    if(confirm("Delete this attendance record? This cannot be undone.")) {
      await supabase.from('attendance').delete().eq('id', id);
      await supabase.from('absentee_records').delete().eq('attendance_id', id);
      refresh();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{margin:0, color:'#06b6d4'}}>ADMINISTRATOR CONTROL</h2>
          <small style={{color:'#64748b'}}>Academic Year {ACADEMIC_YEAR} | ATMA MALIK IT&R</small>
        </div>
        <button className="glass" onClick={() => setView('login')} style={{ color: '#f43f5e', border: '1px solid #f43f5e', padding: '10px 20px', cursor: 'pointer', borderRadius: '12px' }}>
          <LogOut size={18} style={{verticalAlign:'middle', marginRight:'8px'}}/> LOGOUT
        </button>
      </div>

      <div style={{ display: 'flex', gap: '25px', marginBottom: '25px', borderBottom: '1px solid #1e293b' }}>
        {['dash', 'staff', 'mapping', 'records'].map(t => (
          <p key={t} onClick={()=>setTab(t)} style={{cursor:'pointer', color:tab===t?'#06b6d4':'#64748b', fontWeight:800, fontSize:'13px', paddingBottom:'15px', borderBottom: tab===t?'2px solid #06b6d4':'none'}}>
            {t.toUpperCase()}
          </p>
        ))}
      </div>

      {tab === 'dash' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass" style={{textAlign:'center'}}><Users color="#06b6d4" size={32}/><h1>{db.f.length}</h1><p>Active Staff</p></div>
          <div className="glass" style={{textAlign:'center'}}><BookOpen color="#10b981" size={32}/><h1>{db.l.length}</h1><p>Classes Conducted</p></div>
          <div className="glass" style={{textAlign:'center'}}><TrendingUp color="#f59e0b" size={32}/><h1>{db.m.length}</h1><p>Active Mappings</p></div>
        </div>
      )}

      {tab === 'staff' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'20px'}}>
          <div className="glass">
            <h3>Register Faculty</h3>
            <input placeholder="Name" onChange={e=>setForm({...form, n:e.target.value})}/>
            <input placeholder="Employee ID" onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" type="password" onChange={e=>setForm({...form, p:e.target.value})}/>
            <button className="btn-cyan" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); refresh(); alert("Faculty Registered!");}}>ADD STAFF</button>
          </div>
          <div className="glass">
            <h3>Directory</h3>
            {db.f.map(f => (
              <div key={f.id} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #1e293b'}}>
                <span><b>{f.name}</b> ({f.id})</span>
                <Trash2 size={18} color="#f43f5e" style={{cursor:'pointer'}} onClick={()=>deleteFaculty(f.id)}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'mapping' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'20px'}}>
          <div className="glass">
            <h3>Assign Subject</h3>
            <select onChange={e=>setForm({...form, fid:e.target.value})}><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" onChange={e=>setForm({...form, s:e.target.value})}/>
            <button className="btn-cyan" onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.fid, class_name:form.cl, subject_name:form.s}]); refresh(); alert("Subject Assigned!");}}>SAVE MAPPING</button>
          </div>
          <div className="glass">
            <h3>Live Assignments</h3>
            <table>
              <thead><tr><th>Faculty</th><th>Class</th><th>Subject</th><th>Action</th></tr></thead>
              <tbody>
                {db.m.map(m => (
                  <tr key={m.id}>
                    <td>{db.f.find(x=>x.id===m.fac_id)?.name || m.fac_id}</td>
                    <td>{m.class_name}</td>
                    <td>{m.subject_name}</td>
                    <td><Trash2 size={16} color="#f43f5e" style={{cursor:'pointer'}} onClick={()=>deleteAssignment(m.id)}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="glass">
          <h3>Attendance Logs</h3>
          <div style={{maxHeight:'500px', overflowY:'auto'}}>
            {db.l.map(l => (
              <div key={l.id} className="glass" style={{marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>{l.class} | {l.sub}</b><br/><small>{l.faculty} | {l.time_str}</small></div>
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                  <span style={{color:'#10b981', fontWeight:800}}>{l.present}/{l.total}</span>
                  <Trash2 size={18} color="#f43f5e" style={{cursor:'pointer'}} onClick={()=>deleteLog(l.id)}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- FULLY COMPLETED FACULTY PANEL ---
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
    if (!setup.cl || !setup.sub) return alert("Please select Class and Subject first!");
    setLoading(true);
    try {
      const { data: logs } = await supabase.from('attendance').select('id, time_str').eq('class', setup.cl).eq('sub', setup.sub).order('time_str', { ascending: true });
      const uniqueDates = logs && logs.length > 0 ? [...new Set(logs.map(a => a.time_str))] : [];
      const { data: abs } = logs && logs.length > 0 ? await supabase.from('absentee_records').select('student_roll, date').eq('class_name', setup.cl).in('date', uniqueDates) : { data: [] };

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(`${setup.cl}_Register`);

      try {
        const logoRes = await fetch('/logo.png');
        const logoBuf = await (await logoRes.blob()).arrayBuffer();
        const logoId = workbook.addImage({ buffer: logoBuf, extension: 'png' });
        ws.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 50, height: 50 } });
      } catch (e) {}

      ws.mergeCells('C1:K1');
      ws.getCell('C1').value = INSTITUTE_NAME;
      ws.getCell('C1').font = { bold: true, size: 14 };
      ws.getCell('C1').alignment = { horizontal: 'center' };

      ws.getRow(3).values = ["", "", "FACULTY:", user.name.toUpperCase(), "CLASS:", setup.cl, "YEAR:", ACADEMIC_YEAR];
      ws.getRow(4).values = ["", "", "SUBJECT:", setup.sub, "SESSION:", ACADEMIC_YEAR];
      [3, 4].forEach(r => ws.getRow(r).font = { bold: true, size: 10 });

      ws.addRow([]); 
      const headers = ["ROLL NO", "STUDENT NAME", ...uniqueDates, "TOTAL PRESENT", "PERCENT (%)"];
      const headerRow = ws.addRow(headers);
      headerRow.eachCell(c => {
        c.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FF06B6D4'} };
        c.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        c.border = { style: 'thin' };
      });

      const res = await fetch('/students_list.xlsx');
      const abFile = await res.arrayBuffer();
      const studentsFromExcel = XLSX.utils.sheet_to_json(XLSX.read(abFile, { type: 'array' }).Sheets[setup.cl]);

      studentsFromExcel.forEach(s => {
        const roll = String(s['ROLL NO'] || s['ID']);
        const name = s['STUDENT NAME'] || "N/A";
        let pCount = 0;
        const rowData = [roll, name];
        uniqueDates.forEach(date => {
          const isA = abs.find(a => String(a.student_roll) === roll && a.date === date);
          if (!isA) { rowData.push("P"); pCount++; } else { rowData.push("A"); }
        });
        const pct = uniqueDates.length > 0 ? ((pCount / uniqueDates.length) * 100).toFixed(2) + "%" : "0%";
        rowData.push(pCount, pct);
        const sr = ws.addRow(rowData);
        sr.eachCell(c => {
          if (c.value === "A") c.font = { color: { argb: 'FFFF0000' }, bold: true };
          if (c.value === "P") c.font = { color: { argb: 'FF008000' } };
          c.border = { style: 'thin' };
        });
      });

      ws.getColumn(1).width = 12; ws.getColumn(2).width = 35;
      const buffer = await workbook.xlsx.writeBuffer();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([buffer]));
      link.download = `Register_${setup.cl}_${setup.sub}_${ACADEMIC_YEAR}.xlsx`;
      link.click();
      alert("Master Register Exported Successfully!");
    } catch (err) { alert("Export Failed: " + err.message); } finally { setLoading(false); }
  };

  const start = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Please complete all selections first!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) { setLoading(false); return alert("Location Error: You are outside the campus boundary!"); }
      try {
        const dt = new Date().toLocaleDateString('en-GB');
        const { data: at } = await supabase.from('attendance').insert([{ faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt }]).select().single();
        const absData = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
        if (absData.length > 0) await supabase.from('absentee_records').insert(absData);
        alert("Attendance Recorded Successfully!"); setView('login');
      } catch (err) { alert("Submission Error: " + err.message); } finally { setLoading(false); }
    }, () => { setLoading(false); alert("GPS Required: Please enable location services."); });
  };

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
        <img src="/logo.png" className="logo-circle" />
        <div style={{textAlign:'right'}}><b>{user.name}</b><br/><small>Faculty Control</small></div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'20px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', cursor:'pointer' }}>{c}</div>)}
      </div>
      {setup.cl && (
        <div className="glass">
          {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'10px', cursor:'pointer', background: setup.sub === j.subject_name ? '#0891B2' : '' }}>{j.subject_name}</div>)}
          <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
          <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>TAKE ATTENDANCE</button>
          <button className="btn-cyan" onClick={exportMasterFormat} style={{marginTop:'10px', background:'#1e293b', border:'1px solid #06b6d4'}} disabled={loading}>{loading ? "GENERATING..." : "DOWNLOAD MASTER REGISTER"}</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <ArrowLeft onClick={() => setActive(false)} style={{cursor:'pointer'}} />
        <div style={{textAlign:'center'}}><b>{setup.cl}</b><br/><small>{setup.sub}</small></div>
        <span style={{background:'#10b981', padding:'5px 12px', borderRadius:'10px', fontWeight:800}}>{marked.length}/{list.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '10px' }}>
        {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
      </div>
      <button onClick={submit} className="btn-cyan" style={{ position: 'fixed', bottom: '20px', left: '20px', width: 'calc(100% - 40px)', background: '#10b981' }}>{loading ? "VERIFYING..." : "CONFIRM SUBMISSION"}</button>
    </div>
  );
                }
