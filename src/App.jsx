import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Search, User, Fingerprint, BookOpen, 
  Layers, FileSpreadsheet, ChevronRight, LayoutGrid, 
  Users, Download, PlusCircle, TrendingUp, Zap 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const injectStyles = () => {
  if (document.getElementById('amrit-dev-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-dev-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .active-tab { background: #0891b2 !important; color: white !important; box-shadow: 0 0 15px rgba(8, 145, 178, 0.4); }
    .neon-logo { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; overflow: hidden; background: #000; }
    @keyframes pulse { 0% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 20px #06b6d4; } 100% { box-shadow: 0 0 5px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input:focus, select:focus { border-color: #06b6d4 !important; outline: none; }
  `;
  document.head.appendChild(styleTag);
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div className="neon-logo" style={ui.logoCircle}><img src="/logo.png" alt="Logo" style={{width: '90%', height: '90%'}} /></div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '30px', letterSpacing: '2px'}}>MANAGEMENT SYSTEM</p>
        <input id="u" placeholder="Admin ID" style={ui.input} />
        <input id="p" type="password" placeholder="Password" style={ui.input} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>LOG IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <div style={{padding: '40px'}}>Faculty Panel Content Here</div>;
}

// --- FULL HOD PANEL WITH ALL 4 FEATURES ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ staff: [], logs: [], maps: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', id: '', pass: '', mapFac: '', mapClass: '', mapSub: '' });

  const refreshData = async () => {
    const { data: staff } = await supabase.from('faculties').select('*').order('name');
    const { data: logs } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: maps } = await supabase.from('assignments').select('*');
    setData({ staff: staff || [], logs: logs || [], maps: maps || [] });
  };

  useEffect(() => { refreshData(); }, [tab]);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Master");
    XLSX.writeFile(wb, `Amrit_Logs_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div style={ui.container}>
      {/* 1. Header */}
      <div style={ui.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={ui.smallLogo}><Zap fill="white" size={20}/></div>
          <div><h2 style={{margin: 0}}>HOD Console</h2><small style={{color: '#06b6d4'}}>Master Control</small></div>
        </div>
        <button onClick={() => setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>

      {/* Navigation Tabs */}
      <div className="scroll-hide" style={ui.tabRow}>
        {[
          {id:'dashboard', label: 'DASHBOARD', icon: <LayoutGrid size={16}/>},
          {id:'faculty', label: 'FACULTY', icon: <Users size={16}/>},
          {id:'mapping', label: 'MAPPING', icon: <PlusCircle size={16}/>},
          {id:'logs', label: 'LOGS', icon: <FileSpreadsheet size={16}/>}
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={tab === t.id ? 'active-tab' : ''} style={ui.tabBtn}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* --- DASHBOARD VIEW --- */}
      {tab === 'dashboard' && (
        <div style={{animation: 'fadeIn 0.5s'}}>
          <div style={ui.statsGrid}>
            <div className="glass-card" style={ui.statCard}><TrendingUp color="#10b981"/><h2>{data.logs.length}</h2><p>Sessions</p></div>
            <div className="glass-card" style={ui.statCard}><Users color="#06b6d4"/><h2>{data.staff.length}</h2><p>Staff</p></div>
            <div className="glass-card" style={ui.statCard}><Layers color="#8b5cf6"/><h2>{excelSheets.length}</h2><p>Classes</p></div>
          </div>
          <h4 style={ui.sectionTitle}>RECENT ACTIVITY</h4>
          <div className="glass-card">
            {data.logs.slice(0, 5).map((log, i) => (
              <div key={i} style={ui.feedRow}>
                <div style={{flex: 1}}><b>{log.class} - {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
                <div style={{textAlign: 'right'}}><b style={{color: '#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize: '10px'}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- FACULTY MANAGEMENT --- */}
      {tab === 'faculty' && (
        <div>
          <div className="glass-card" style={{padding: '20px', marginBottom: '20px'}}>
            <h4 style={{marginTop: 0}}>Register New Faculty</h4>
            <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
              <input placeholder="Name" style={ui.input} value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/>
              <input placeholder="Staff ID" style={ui.input} value={form.id} onChange={e=>setForm({...form, id: e.target.value})}/>
            </div>
            <input placeholder="Set Password" type="password" style={ui.input} value={form.pass} onChange={e=>setForm({...form, pass: e.target.value})}/>
            <button style={ui.primaryBtn} onClick={async()=>{
              await supabase.from('faculties').insert([{id: form.id, name: form.name, password: form.pass}]);
              setForm({name:'', id:'', pass:''}); refreshData();
            }}>ADD FACULTY</button>
          </div>
          {data.staff.map(f => (
            <div key={f.id} className="glass-card" style={{...ui.feedRow, marginBottom: '10px'}}>
              <div style={ui.avatar}>{f.name[0]}</div>
              <div style={{flex: 1}}><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
              <button onClick={async()=>{ if(window.confirm("Delete?")){ await supabase.from('faculties').delete().eq('id', f.id); refreshData(); }}} style={ui.delBtn}><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {/* --- MAPPING MANAGEMENT --- */}
      {tab === 'mapping' && (
        <div>
          <div className="glass-card" style={{padding: '20px', marginBottom: '20px'}}>
            <h4 style={{marginTop: 0}}>Class-Subject Assignment</h4>
            <select style={ui.input} onChange={e=>setForm({...form, mapFac: e.target.value})}>
              <option value="">Select Teacher</option>
              {data.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select style={ui.input} onChange={e=>setForm({...form, mapClass: e.target.value})}>
              <option value="">Select Class</option>
              {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Subject Name" style={ui.input} value={form.mapSub} onChange={e=>setForm({...form, mapSub: e.target.value})}/>
            <button style={ui.primaryBtn} onClick={async()=>{
              await supabase.from('assignments').insert([{fac_id: form.mapFac, class_name: form.mapClass, subject_name: form.mapSub}]);
              setForm({...form, mapSub:''}); refreshData();
            }}>SAVE MAPPING</button>
          </div>
          {data.maps.map(m => (
            <div key={m.id} className="glass-card" style={{...ui.feedRow, marginBottom: '10px'}}>
              <div style={{flex: 1}}><b>{m.class_name}</b><br/><small>{m.subject_name}</small></div>
              <button onClick={async()=>{ await supabase.from('assignments').delete().eq('id', m.id); refreshData(); }} style={ui.delBtn}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {/* --- LOGS & EXCEL DOWNLOAD --- */}
      {tab === 'logs' && (
        <div>
          <div style={ui.searchRow}>
            <div style={ui.searchBar}><Search size={18}/><input placeholder="Search logs..." onChange={e=>setSearch(e.target.value)} style={ui.invisibleInput}/></div>
            <button onClick={exportExcel} style={ui.downloadBtn}><Download size={18}/> MASTER SHEET</button>
          </div>
          <div className="glass-card">
            {data.logs.filter(l => l.class.toLowerCase().includes(search.toLowerCase()) || l.faculty.toLowerCase().includes(search.toLowerCase())).map((log, i) => (
              <div key={i} style={ui.feedRow}>
                <div style={{flex: 1}}><b>{log.class} | {log.sub}</b><br/><small>{log.faculty} • {log.time_str}</small></div>
                <div style={{textAlign: 'right'}}><b style={{color: '#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.type}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- CONSOLIDATED STYLES ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '40px', width: '320px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  smallLogo: { width: '40px', height: '40px', background: '#0891b2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' },
  statCard: { padding: '20px', textAlign: 'center' },
  sectionTitle: { fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginBottom: '15px' },
  feedRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  input: { width: '100%', padding: '14px', marginBottom: '12px', borderRadius: '12px', background: '#020617', border: '1px solid #1e293b', color: '#fff', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  delBtn: { color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' },
  searchRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  searchBar: { flex: 1, background: '#1e293b', padding: '0 15px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px' },
  invisibleInput: { background: 'none', border: 'none', color: '#fff', width: '100%', padding: '14px 0', outline: 'none' },
  downloadBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
};
