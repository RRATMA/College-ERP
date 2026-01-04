import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Download, Zap, 
  Database, BookOpenCheck, UserCheck, TrendingUp, FileWarning, 
  ChevronRight, MapPin, Clock, Calendar, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- SYSTEM STYLING ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-final-ultra')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v-final-ultra';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .stat-card { padding: 20px; display: flex; flex-direction: column; justify-content: space-between; min-height: 120px; transition: 0.3s; }
    .defaulter-card { grid-column: span 2; border: 1px solid rgba(244, 63, 94, 0.3) !important; background: linear-gradient(90deg, rgba(244, 63, 94, 0.1), transparent) !important; cursor: pointer; }
    .input-field { background: #0f172a; border: 1px solid #1e293b; color: #fff; border-radius: 12px; padding: 14px; width: 100%; box-sizing: border-box; outline: none; margin-bottom: 12px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap: 10px; padding-bottom: 120px; }
    .tab-active { background: #0891b2 !important; color: white; }
    .workload-badge { background: rgba(6, 182, 212, 0.2); color: #06b6d4; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; }
    @media (max-width: 600px) { .defaulter-card { grid-column: span 1; } }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS = { LAT: 19.7042, LON: 72.7645, TOLERANCE: 0.0008 }; 

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.warn("Upload students_list.xlsx to public folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  if (view === 'home') return (
    <div style={ui.centerFlex}>
      <div className="glass" style={{padding:'50px', textAlign:'center', maxWidth:'400px', width:'90%'}}>
        <img src="/logo.png" style={{width:'100px', borderRadius:'50%', marginBottom:'20px', border:'2px solid #06b6d4'}} />
        <h1 style={{fontSize:'36px', fontWeight:800, margin:0}}>AMRIT</h1>
        <p style={{color:'#64748b', marginBottom:'40px'}}>Engineering Management Portal</p>
        <button onClick={()=>setView('login')} style={ui.primaryBtn}>LOGIN TO SYSTEM <ChevronRight size={20}/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={ui.centerFlex}>
      <div className="glass" style={{padding:'40px', width:'320px'}}>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#64748b', cursor:'pointer', marginBottom:'20px'}}><ArrowLeft/></button>
        <h2 style={{marginTop:0}}>Portal Access</h2>
        <input id="uid" placeholder="User ID" className="input-field" />
        <input id="ups" type="password" placeholder="Passcode" className="input-field" />
        <button onClick={()=>handleLogin(document.getElementById('uid').value, document.getElementById('ups').value)} style={ui.primaryBtn}>VERIFY</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [data, setData] = useState({ facs: [], logs: [], maps: [] });
  const [form, setForm] = useState({ n:'', id:'', p:'', f:'', c:'', s:'' });

  const sync = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    const { data: m } = await supabase.from('assignments').select('*');
    setData({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { sync(); }, []);

  // NEW FEATURE: DOWNLOAD MASTER LOGS
  const downloadMasterSheet = () => {
    const ws = XLSX.utils.json_to_sheet(data.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Attendance_Logs");
    XLSX.writeFile(wb, "Amrit_Master_Logs.xlsx");
  };

  // FEATURE: DEFAULTER LOGIC
  const downloadDefaulters = async () => {
    const { data: abs } = await supabase.from('absentee_records').select('*');
    const classStats = data.logs.reduce((acc, curr) => { acc[curr.class] = (acc[curr.class] || 0) + 1; return acc; }, {});
    const studentAbs = abs.reduce((acc, r) => { const k = `${r.class_name}_${r.student_roll}`; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
    const report = [];
    const uniqueKeys = [...new Set(abs.map(r => `${r.class_name}_${r.student_roll}`))];
    uniqueKeys.forEach(key => {
      const [cls, roll] = key.split('_');
      const total = classStats[cls] || 0;
      const att = total - (studentAbs[key] || 0);
      const perc = total > 0 ? ((att / total) * 100).toFixed(2) : 0;
      if(parseFloat(perc) < 75) report.push({ Class: cls, Roll: roll, Total: total, Attended: att, Percentage: perc + "%" });
    });
    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, "Defaulter_List.xlsx");
  };

  // HELPER: CALCULATE WORKLOAD
  const getWorkload = (name) => {
    const facultyLogs = data.logs.filter(l => l.faculty === name);
    const theory = facultyLogs.filter(l => l.type === 'Theory').length;
    const practical = facultyLogs.filter(l => l.type === 'Practical').length;
    return { theory, practical };
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}><h3>HOD Command</h3><button onClick={()=>setView('home')} style={ui.exitBtn}><LogOut/></button></div>
      <div style={ui.tabRow} className="scroll-hide">
        {['dash', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={tab===t?'tab-active':''} style={ui.tabBtn}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dash' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
          <div className="glass stat-card"><div><Database color="#06b6d4"/></div><div><h2>{data.logs.length}</h2><p style={ui.label}>TOTAL LOGS</p></div></div>
          <div className="glass stat-card"><div><UserCheck color="#a855f7"/></div><div><h2>{data.facs.length}</h2><p style={ui.label}>STAFF</p></div></div>
          <div className="glass stat-card defaulter-card" onClick={downloadDefaulters}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <FileWarning size={32} color="#f43f5e" />
              <div><h4 style={{margin:0, color:'#f43f5e'}}>Generate Defaulter List</h4><p style={{margin:0, fontSize:'11px', opacity:0.6}}>Students below 75% attendance</p></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div>
          <div className="glass" style={{padding:'20px', marginBottom:'20px'}}>
            <p style={ui.label}>ADD STAFF</p>
            <input placeholder="Full Name" className="input-field" onChange={e=>setForm({...form, n:e.target.value})}/>
            <div style={{display:'flex', gap:'10px'}}><input placeholder="ID" className="input-field" onChange={e=>setForm({...form, id:e.target.value})}/><input placeholder="Pass" type="password" className="input-field" onChange={e=>setForm({...form, p:e.target.value})}/></div>
            <button style={ui.primaryBtn} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:form.p}]); sync();}}>REGISTER STAFF</button>
          </div>
          {data.facs.map(f => {
            const load = getWorkload(f.name);
            return (
              <div key={f.id} className="glass" style={ui.row}>
                <div><b>{f.name}</b><br/>
                  <span className="workload-badge">Lec: {load.theory}</span> <span className="workload-badge" style={{color:'#10b981', background:'rgba(16,185,129,0.1)'}}>Prac: {load.practical}</span>
                </div>
                <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); sync();}} style={ui.delBtn}><Trash2/></button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{padding:'20px'}}>
          <select className="input-field" onChange={e=>setForm({...form, f:e.target.value})}><option>Faculty</option>{data.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
          <select className="input-field" onChange={e=>setForm({...form, c:e.target.value})}><option>Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <input placeholder="Subject" className="input-field" onChange={e=>setForm({...form, s:e.target.value})}/>
          <button style={{...ui.primaryBtn, background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:form.f, class_name:form.c, subject_name:form.s}]); sync();}}>ASSIGN LOAD</button>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button onClick={downloadMasterSheet} style={{...ui.primaryBtn, marginBottom:'20px', background:'#1e293b', border:'1px solid #334155'}}><FileSpreadsheet size={18}/> DOWNLOAD MASTER SHEET</button>
          {data.logs.map(log => (
            <div key={log.id} className="glass" style={ui.row}>
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user, setView }) {
  const [session, setSession] = useState({ cl:'', sub:'', ty:'Theory', s:'', e:'' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [load, setLoad] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setLoad(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!session.cl || !session.sub || !session.s || !session.e) return alert("Fill all details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===session.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const sync = () => {
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS.LON,2));
      if(dist > CAMPUS.TOLERANCE) { setSubmitting(false); return alert("Out of Campus boundary!"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: session.sub, class: session.cl, type: session.ty, 
        duration: `${session.s}-${session.e}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: session.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert("Attendance Saved!"); setView('home');
    }, () => { setSubmitting(false); alert("GPS Required!"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}><div><small>Faculty</small><h4>{user.name}</h4></div><button onClick={()=>setView('home')} style={ui.exitBtn}><LogOut/></button></div>
      <p style={ui.label}>CLASSES</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
        {[...new Set(load.map(l=>l.class_name))].map(c => (<div key={c} onClick={()=>setSession({...session, cl:c})} style={{...ui.tile, background: session.cl===c?'#0891b2':'#1e293b'}}>{c}</div>))}
      </div>
      {session.cl && (
        <div style={{marginTop:'20px'}}>
          <p style={ui.label}>SUBJECT & TYPE</p>
          {load.filter(l=>l.class_name===session.cl).map(l => (<div key={l.id} onClick={()=>setSession({...session, sub:l.subject_name})} style={{...ui.row, background: session.sub===l.subject_name?'#0891b2':'#1e293b', justifyContent:'center'}}>{l.subject_name}</div>))}
          <select className="input-field" style={{marginTop:'10px'}} onChange={e=>setSession({...session, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
          <div style={{display:'flex', gap:'10px'}}><input type="time" className="input-field" onChange={e=>setSession({...session, s:e.target.value})}/><input type="time" className="input-field" onChange={e=>setSession({...session, e:e.target.value})}/></div>
          <button onClick={launch} style={ui.primaryBtn}>START SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{session.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.tile, padding:'15px 5px', background: marked.includes(s.id)?'#10b981':'#1e293b'}}>{s.id}</div>))}</div>
      <button disabled={submitting} onClick={sync} style={ui.submitBtn}>{submitting ? "UPLOADING..." : "FINALIZE SESSION"}</button>
    </div>
  );
}

const ui = {
  centerFlex: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' },
  tabBtn: { padding: '10px 20px', borderRadius: '12px', border: 'none', background:'#1e293b', color:'#fff', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', flexShrink:0 },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  mobileWrap: { padding: '20px' },
  tile: { padding: '20px', borderRadius: '18px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius:'18px', marginBottom:'10px', background:'rgba(30,41,59,0.4)' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', letterSpacing:'1px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background:'#020617', paddingBottom:'10px', position:'sticky', top:0, zIndex:10 },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', padding: '20px', borderRadius: '20px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  badge: { background: '#10b981', padding: '6px 14px', borderRadius: '10px', fontWeight: 'bold' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff', cursor: 'pointer' }
};
