import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  ChevronRight, LayoutGrid, Users, Download, Zap, 
  FlaskConical, GraduationCap, PlusCircle, ClipboardList, 
  Settings, Database, Activity, BookOpenCheck, UserCheck, 
  Monitor, Clock, CheckCircle2, AlertCircle, BarChart3, TrendingUp, FileWarning
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLING ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-final-pro')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v-final-pro';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-5px); }
    .stat-card-new { padding: 22px; display: flex; flex-direction: column; justify-content: space-between; min-height: 140px; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; width:100%; box-sizing:border-box; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .defaulter-card { grid-column: span 2; border: 1px solid rgba(244, 63, 94, 0.3) !important; background: linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(30, 41, 59, 0.4)) !important; }
    @media (max-width: 600px) { .defaulter-card { grid-column: span 1; } }
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
    }).catch(() => console.error("Excel not found"));
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
        <div style={ui.logoCircle}><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} /></div>
        <h1 style={{fontSize: '28px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px'}}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" style={{marginBottom:'10px'}} />
        <input id="p" type="password" placeholder="Passcode" style={{marginBottom:'20px'}} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>ENTER SYSTEM</button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

// --- HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setDb(prev => ({ ...prev, facs: f || [], logs: l || [] }));
  };

  useEffect(() => { loadData(); }, []);

  // --- STATS ---
  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.logs.filter(log => log.time_str === todayStr);
  const totalPresent = db.logs.reduce((acc, curr) => acc + (curr.present || 0), 0);
  const totalPossible = db.logs.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const attendancePercentage = totalPossible > 0 ? ((totalPresent / totalPossible) * 100).toFixed(1) : 0;

  // --- NEW FEATURE: DEFAULTER LOGIC (< 75%) ---
  const downloadDefaulters = async () => {
    const { data: abs } = await supabase.from('absentee_records').select('student_roll, class_name');
    if(!abs) return alert("No absence data");

    const classSessions = db.logs.reduce((acc, l) => { acc[l.class] = (acc[l.class] || 0) + 1; return acc; }, {});
    const studentAbsCount = abs.reduce((acc, r) => {
      const k = `${r.class_name}_${r.student_roll}`;
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const report = [];
    const uniqueKeys = [...new Set(abs.map(a => `${a.class_name}_${a.student_roll}`))];

    uniqueKeys.forEach(k => {
      const [cls, roll] = k.split('_');
      const total = classSessions[cls] || 0;
      const abCount = studentAbsCount[k] || 0;
      const prCount = total - abCount;
      const perc = total > 0 ? ((prCount / total) * 100).toFixed(2) : 0;

      if(parseFloat(perc) < 75) {
        report.push({ "Class": cls, "Roll No": roll, "Sessions": total, "Present": prCount, "Absent": abCount, "Attendance %": perc + "%" });
      }
    });

    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, "Defaulter_Report_75.xlsx");
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width:'40px', height:'40px', borderRadius:'50%', border:'2px solid #06b6d4'}} />
          <h3 style={{margin:0}}>HOD Dashboard</h3>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          {/* Card 1 */}
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(6,182,212,0.1)', color:'#06b6d4'}}><Database/></div>
            <div><h2 style={{margin:0}}>{db.logs.length}</h2><p style={ui.dashLabel}>TOTAL LOGS</p></div>
          </div>
          {/* Card 2 */}
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(168,85,247,0.1)', color:'#a855f7'}}><UserCheck/></div>
            <div><h2 style={{margin:0}}>{db.facs.length}</h2><p style={ui.dashLabel}>STAFF COUNT</p></div>
          </div>
          {/* Card 3 */}
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(16,185,129,0.1)', color:'#10b981'}}><BookOpenCheck/></div>
            <div><h2 style={{margin:0}}>{excelSheets.length}</h2><p style={ui.dashLabel}>CLASSES</p></div>
          </div>
          {/* Card 4 */}
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b'}}><TrendingUp/></div>
            <div><h2 style={{margin:0}}>{attendancePercentage}%</h2><p style={ui.dashLabel}>AVG ATTENDANCE</p></div>
          </div>
          {/* Card 5 */}
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(236,72,153,0.1)', color:'#ec4899'}}><Zap/></div>
            <div><h2 style={{margin:0}}>{todayLogs.length}</h2><p style={ui.dashLabel}>LOGS TODAY</p></div>
          </div>
          {/* Card 6 */}
          <div className="glass-card stat-card-new">
            <div className="icon-box" style={{background:'rgba(99,102,241,0.1)', color:'#6366f1'}}><BarChart3/></div>
            <div><h2 style={{margin:0}}>{todayLogs.filter(l=>l.type==='Theory').length}T | {todayLogs.filter(l=>l.type==='Practical').length}P</h2><p style={ui.dashLabel}>LOAD TYPE</p></div>
          </div>

          {/* Card 7: FEATURE DEFAULTER DOWNLOAD */}
          <div className="glass-card stat-card-new defaulter-card" style={{justifyContent:'center', alignItems:'center', gap:'15px', cursor:'pointer'}} onClick={downloadDefaulters}>
             <div className="icon-box" style={{background:'rgba(244,63,94,0.2)', color:'#f43f5e', marginBottom:0}}><FileWarning size={30}/></div>
             <div style={{textAlign:'center'}}>
               <h3 style={{margin:0, color:'#f43f5e'}}>DOWNLOAD DEFAULTER LIST</h3>
               <p style={{margin:0, fontSize:'10px', color:'#64748b'}}>Students with attendance below 75% (Database Filter)</p>
             </div>
          </div>
        </div>
      )}

      {/* STAFF TAB WITH T/P COUNT */}
      {tab === 'staff' && (
        <div>
          <div className="glass-card" style={{padding:'20px', marginBottom:'20px'}}>
             <p style={ui.label}>ADD NEW STAFF</p>
             <input placeholder="Name" style={{marginBottom:'10px'}} onChange={e=>setForm({...form, name:e.target.value})}/>
             <div style={{display:'flex', gap:'10px'}}><input placeholder="ID" onChange={e=>setForm({...form, id:e.target.value})}/><input placeholder="Pass" type="password" onChange={e=>setForm({...form, pass:e.target.value})}/></div>
             <button style={{...ui.primaryBtn, marginTop:'15px'}} onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); loadData();}}>SAVE</button>
          </div>
          {db.facs.map(f => {
            const sLogs = db.logs.filter(l => l.faculty === f.name);
            return (
              <div key={f.id} style={ui.feedRow} className="glass-card">
                <div><b>{f.name}</b><br/><small>ID: {f.id} | T: {sLogs.filter(x=>x.type==='Theory').length} | P: {sLogs.filter(x=>x.type==='Practical').length}</small></div>
                <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); loadData();}} style={ui.delBtn}><Trash2 size={18}/></button>
              </div>
            );
          })}
        </div>
      )}
      {/* (Mapping ani Logs tabs same rahtil) */}
    </div>
  );
}

// --- FACULTY PANEL (ORIGINAL) ---
function FacultyPanel({ user, setView }) {
    // ... Faculty logic stays exactly same ...
    return <div style={{color:'white', padding:'40px'}}>Faculty Panel Loaded.</div>;
}

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '40px', width: '280px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #06b6d4' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { padding: '10px 18px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '11px', color: '#fff', cursor: 'pointer', flexShrink: 0 },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none', cursor: 'pointer' },
  dashLabel: { fontSize: '10px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1px', marginTop: '5px' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderRadius:'18px', marginBottom:'10px' },
  delBtn: { background: 'none', border: 'none', color: '#f43f5e' },
  label: { fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px' }
};
