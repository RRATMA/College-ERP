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
    .defaulter-card { grid-column: span 2; border: 1px solid rgba(244, 63, 94, 0.3) !important; background: linear-gradient(135deg, rgba(244, 63, 94, 0.1), rgba(30, 41, 59, 0.4)) !important; cursor: pointer; }
    .icon-box { width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; transition: 0.2s; }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
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
    }).catch(() => console.error("Excel source missing"));
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
        <input id="u" placeholder="User ID" style={ui.input} />
        <input id="p" type="password" placeholder="Passcode" style={ui.input} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>LOGIN</button>
      </div>
    </div>
  );

  return <div style={{minHeight: '100vh'}}>{view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}</div>;
}

function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ facs: [], logs: [], maps: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ name:'', id:'', pass:'', fId:'', cls:'', sub:'' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { loadData(); }, []);

  // --- DEFAULTER LOGIC (< 75%) ---
  const downloadDefaulters = async () => {
    const { data: abs } = await supabase.from('absentee_records').select('student_roll, class_name');
    if (!abs) return alert("No absence data found");

    const classTotalSessions = db.logs.reduce((acc, log) => {
      acc[log.class] = (acc[log.class] || 0) + 1;
      return acc;
    }, {});

    const studentAbsCount = abs.reduce((acc, rec) => {
      const key = `${rec.class_name}_${rec.student_roll}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const defaulterList = [];
    const uniqueKeys = [...new Set(abs.map(a => `${a.class_name}_${a.student_roll}`))];

    uniqueKeys.forEach(key => {
      const [cls, roll] = key.split('_');
      const totalLectures = classTotalSessions[cls] || 0;
      const totalAbsents = studentAbsCount[key] || 0;
      const totalPresents = totalLectures - totalAbsents;
      const perc = totalLectures > 0 ? ((totalPresents / totalLectures) * 100).toFixed(2) : 0;

      if (parseFloat(perc) < 75) {
        defaulterList.push({ Class: cls, RollNo: roll, Lectures: totalLectures, Present: totalPresents, Percentage: perc + "%" });
      }
    });

    const ws = XLSX.utils.json_to_sheet(defaulterList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters");
    XLSX.writeFile(wb, `Defaulters_Below_75_${new Date().toLocaleDateString()}.xlsx`);
  };

  const todayLogs = db.logs.filter(log => log.time_str === new Date().toLocaleDateString('en-GB'));
  const totalPresent = db.logs.reduce((a, c) => a + c.present, 0);
  const totalPossible = db.logs.reduce((a, c) => a + c.total, 0);

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <h3>HOD Dashboard</h3>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        {['dashboard', 'staff', 'mapping', 'logs'].map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{...ui.tabBtn, background: tab===t?'#0891b2':'#1e293b'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="dashboard-grid">
          <div className="glass-card stat-card-new"><div className="icon-box" style={{color:'#06b6d4'}}><Database/></div><div><h2>{db.logs.length}</h2><p style={ui.dashLabel}>TOTAL LOGS</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{color:'#a855f7'}}><UserCheck/></div><div><h2>{db.facs.length}</h2><p style={ui.dashLabel}>FACULTY</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{color:'#10b981'}}><BookOpenCheck/></div><div><h2>{excelSheets.length}</h2><p style={ui.dashLabel}>CLASSES</p></div></div>
          <div className="glass-card stat-card-new"><div className="icon-box" style={{color:'#f59e0b'}}><TrendingUp/></div><div><h2>{totalPossible > 0 ? ((totalPresent/totalPossible)*100).toFixed(1) : 0}%</h2><p style={ui.dashLabel}>AVG ATTENDANCE</p></div></div>
          
          {/* DEFAULTER ACTION CARD */}
          <div className="glass-card stat-card-new defaulter-card" onClick={downloadDefaulters}>
            <div className="icon-box" style={{background:'rgba(244,63,94,0.2)', color:'#f43f5e', marginBottom:0}}><FileWarning size={30}/></div>
            <div>
              <h3 style={{margin:0, color:'#f43f5e'}}>DOWNLOAD DEFAULTER LIST</h3>
              <p style={{margin:0, fontSize:'10px', color:'#64748b'}}>Students with attendance below 75%</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <input placeholder="Search logs..." style={ui.input} onChange={e=>setSearchTerm(e.target.value)}/>
          {db.logs.filter(l=>(l.class+l.sub).toLowerCase().includes(searchTerm.toLowerCase())).map(log=>(
            <div key={log.id} style={ui.feedRow} className="glass-card">
              <div><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </div>
      )}
      {/* Rest of the HOD tabs (Staff, Mapping) go here... */}
    </div>
  );
}

// --- FACULTY PANEL (Keep your existing Faculty logic) ---
function FacultyPanel({ user, setView }) {
    // ... Copy your original FacultyPanel code here ...
    return <div style={{padding: '20px', color: 'white'}}>Faculty View Loaded. (Apply your original logic here)</div>;
}

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '40px', width: '280px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', background: 'rgba(6,182,212,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #06b6d4' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tabRow: { display: 'flex', gap: '8px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { padding: '10px 18px', borderRadius: '14px', border: 'none', fontWeight: 'bold', fontSize: '11px', color: '#fff', cursor: 'pointer', flexShrink: 0 },
  input: { width: '100%', padding: '14px', marginBottom: '12px', borderRadius: '12px', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold' },
  exitBtn: { background: 'none', color: '#f43f5e', border: 'none' },
  dashLabel: { fontSize: '10px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1px', marginTop: '5px' },
  feedRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderRadius:'18px', marginBottom:'10px' }
};
