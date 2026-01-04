import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  ChevronRight, LayoutGrid, Users, Download, Zap, 
  FlaskConical, GraduationCap, PlusCircle, ClipboardList, 
  Settings, Database, Activity, BookOpenCheck, UserCheck, 
  Monitor, Clock, CheckCircle2, AlertCircle, BarChart3, TrendingUp, Beaker, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER MODE: PREMIUM UI STYLING ---
const injectStyles = () => {
  if (document.getElementById('amrit-ultimate-ui')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-ultimate-ui';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.5); transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .stat-card-new { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 14px; padding: 14px; width: 100%; transition: 0.3s; }
    input:focus { border-color: #06b6d4 !important; box-shadow: 0 0 15px rgba(6, 182, 212, 0.2); }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 12px; }
    .tester-badge { position: fixed; bottom: 90px; right: 25px; background: #7c3aed; color: white; padding: 14px; border-radius: 50%; cursor: pointer; z-index: 1000; box-shadow: 0 0 20px rgba(124, 58, 237, 0.6); border: 2px solid #fff; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  `;
  document.head.appendChild(styleTag);
};

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel mapping source missing"));
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

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div style={ui.logoCircle}>
          <img src="/logo.png" alt="Logo" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} />
        </div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800, letterSpacing: '-1px'}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '11px', fontWeight: '800', letterSpacing: '3px', marginBottom: '35px'}}>SYSTEM ARCHITECT</p>
        <input id="u" placeholder="User ID" style={{marginBottom: '12px'}} />
        <input id="p" type="password" placeholder="Passcode" style={{marginBottom: '25px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>
          ENTER SYSTEM <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL: DEVELOPER MODE (ANALYTICS) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [], abs: [] });
  const [limit, setLimit] = useState(75);

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    const { data: a } = await supabase.from('absentee_records').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [], abs: a || [] });
  };

  useEffect(() => { loadData(); }, []);

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'42px', height:'42px', borderRadius:'50%', border:'2px solid #06b6d4'}} />
          <h3 style={{margin:0, fontWeight: 800}}>Admin Central</h3>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={22}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b'}}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}>
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database size={24}/></div>
            <div><h2 style={{margin:0}}>{db.logs.length}</h2><p style={ui.dashLabel}>TOTAL SESSIONS</p></div>
          </div>
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><Users size={24}/></div>
            <div><h2 style={{margin:0}}>{db.facs.length}</h2><p style={ui.dashLabel}>ACTIVE STAFF</p></div>
          </div>
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><FileText size={24}/></div>
            <div><h2 style={{margin:0}}>{db.abs.length}</h2><p style={ui.dashLabel}>ABSENT ENTRIES</p></div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="scroll-hide" style={{maxHeight:'70vh', overflowY:'auto'}}>
          {db.logs.map(log=>(
            <div key={log.id} style={ui.feedRow} className="glass-card">
              <div><b>{log.class} | {log.sub}</b><br/><small style={{color:'#94a3b8'}}>{log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: TESTER MODE INTEGRATED ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testerMode, setTesterMode] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Select Session!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const targetSheet = wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase());
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[targetSheet]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const syncPhases = async () => {
    setLoading(true);
    try {
      // 1. Database Sync
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);

      // 2. Excel Report
      const rows = [
        ["AMRIT INSTITUTE - OFFICIAL REPORT"],
        ["Class: "+setup.cl, "Subject: "+setup.sub],
        ["Date: "+new Date().toLocaleDateString()],
        ["Present: "+marked.length, "Total: "+students.length],
        [""], ["PRESENT ROLLS"], [marked.join(", ")],
        [""], ["ABSENT ROLLS"], [students.filter(s=>!marked.includes(s.id)).map(s=>s.id).join(", ")]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${setup.cl}_Report.xlsx`);

      alert(testerMode ? "TESTER PASS: Data Synced & File Downloaded!" : "Attendance Successful!");
      setView('login');
    } catch (e) { alert("Phase Failure: Check DB Connection"); } finally { setLoading(false); }
  };

  const submit = () => {
    if (testerMode) return syncPhases();

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Out of Campus"); }
      syncPhases();
    }, () => { setLoading(false); alert("GPS Error"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div className="tester-badge" onClick={() => {setTesterMode(!testerMode); alert("Tester Mode " + (!testerMode ? "Active" : "Disabled"));}}>
        <Beaker size={24} />
      </div>
      <div style={ui.header}><div><small style={{color:'#06b6d4', fontWeight:'bold'}}>PROFESSOR</small><h4>{user.name}</h4></div><button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button></div>
      <div className="glass-card" style={{padding:'20px'}}>
        <p style={ui.label}>SELECT TARGET CLASS</p>
        <div style={ui.tileGrid}>{[...new Set(myJobs.map(j=>j.class_name))].map(c => (<div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, background: setup.cl===c?'#0891b2':'rgba(30, 41, 59, 0.6)', border: setup.cl===c?'1px solid #06b6d4':'1px solid transparent'}}>{c}</div>))}</div>
        
        {setup.cl && (
          <div style={{marginTop: '25px', animation: 'fadeIn 0.5s'}}>
            <p style={ui.label}>ASSIGNED SUBJECTS</p>
            <div style={ui.subList}>{myJobs.filter(j=>j.class_name===setup.cl).map(j => (<div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} style={{...ui.subRow, background: setup.sub===j.subject_name?'#0891b2':'rgba(15, 23, 42, 0.8)', border: setup.sub===j.subject_name?'1px solid #06b6d4':'1px solid #1e293b'}}>{j.subject_name}</div>))}</div>
            <p style={ui.label}>TIME FRAME</p>
            <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><input type="time" onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
            <button onClick={launch} style={ui.primaryBtn}><Zap size={18}/> INITIALIZE SESSION</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={ui.stickyHeader}><button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button><h3>{setup.cl}</h3><div style={ui.badge}>{marked.length}/{students.length}</div></div>
      <div className="roll-grid">{students.map(s => (<div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'rgba(30, 41, 59, 0.8)', border: marked.includes(s.id)?'1px solid #fff':'1px solid rgba(255,255,255,0.05)'}}>{s.id}</div>))}</div>
      <button disabled={loading} onClick={submit} style={{...ui.submitBtn, background: testerMode ? '#7c3aed' : '#10b981', boxShadow: testerMode ? '0 10px 30px rgba(124, 58, 237, 0.4)' : '0 10px 30px rgba(16, 185, 129, 0.3)'}}>
        {loading ? "COMMITTING DATA..." : testerMode ? "EXECUTE TEST PHASES" : "SYNC & DOWNLOAD REPORT"}
      </button>
    </div>
  );
}

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #0f172a, #020617)' },
  loginCard: { padding: '50px 40px', width: '300px', textAlign: 'center' },
  logoCircle: { width: '90px', height: '90px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justify-content: 'center', margin: '0 auto 25px', border: '1px solid #06b6d4', boxSizing:'border-box', padding:'5px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' },
  tabBtn: { padding: '12px 22px', borderRadius: '16px', border: 'none', fontWeight: 'bold', fontSize: '12px', color: '#fff', cursor: 'pointer', flexShrink: 0, transition:'0.3s' },
  primaryBtn: { width: '100%', padding: '18px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '15px' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px' },
  mobileWrap: { padding: '25px', maxWidth:'500px', margin:'0 auto' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  tile: { padding: '22px 10px', borderRadius: '20px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer', transition: '0.2s' },
  subList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' },
  subRow: { padding: '16px', borderRadius: '15px', textAlign: 'center', fontWeight: 'bold', color: '#fff', cursor: 'pointer', transition:'0.2s' },
  label: { fontSize: '11px', color: '#64748b', fontWeight: '800', marginBottom: '12px', letterSpacing:'1px' },
  dashLabel: { fontSize: '10px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1.5px', marginTop: '8px' },
  stickyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  rollChip: { padding: '18px 5px', borderRadius: '16px', textAlign: 'center', fontWeight: '800', fontSize: '15px', color: '#fff', cursor: 'pointer' },
  submitBtn: { position: 'fixed', bottom: '25px', left: '25px', right: '25px', padding: '20px', borderRadius: '22px', color: '#fff', border: 'none', fontWeight: '800', zIndex: 10, cursor: 'pointer', fontSize: '16px', letterSpacing:'0.5px' },
  badge: { background: '#10b981', padding: '6px 14px', borderRadius: '12px', fontWeight: '800', fontSize: '14px' },
  circleBtn: { width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius:'22px', marginBottom:'12px' }
};
