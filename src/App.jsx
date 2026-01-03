import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Search, User, Fingerprint, BookOpen, 
  Layers, FileSpreadsheet, ChevronRight, LayoutGrid, 
  Users, Download, PlusCircle, TrendingUp, Zap, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-dev-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-dev-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .active-tab { background: #0891b2 !important; color: white !important; box-shadow: 0 0 15px rgba(8, 145, 178, 0.4); transform: translateY(-2px); }
    .neon-logo { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 25px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { transition: 0.3s; }
    input:focus, select:focus { border-color: #06b6d4 !important; outline: none; box-shadow: 0 0 10px rgba(6, 182, 212, 0.2); }
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
    }).catch(() => console.error("Missing students_list.xlsx in public folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed: Access Denied");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div className="neon-logo" style={ui.logoCircle}>
          <img src="/logo.png" alt="Logo" style={{width: '85%', height: '85%', objectFit: 'contain'}} />
        </div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '35px', letterSpacing: '2px'}}>SYSTEM ADMINISTRATOR</p>
        <input id="u" placeholder="Admin ID" style={ui.input} />
        <input id="p" type="password" placeholder="Passphrase" style={ui.input} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <div style={{padding:'20px'}}>Faculty Panel is Active.</div>;
}

// --- FULLY TESTED HOD PANEL ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ staff: [], logs: [], maps: [] });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', id: '', pass: '', mFac: '', mClass: '', mSub: '' });

  const syncDatabase = async () => {
    setLoading(true);
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ staff: f || [], logs: l || [], maps: m || [] });
    setLoading(false);
  };

  useEffect(() => { syncDatabase(); }, [tab]);

  const addStaff = async () => {
    if (!form.name || !form.id || !form.pass) return alert("Fill all Faculty fields");
    await supabase.from('faculties').insert([{ id: form.id, name: form.name, password: form.pass }]);
    setForm({ ...form, name: '', id: '', pass: '' });
    syncDatabase();
  };

  const addMapping = async () => {
    if (!form.mFac || !form.mClass || !form.mSub) return alert("Select Faculty, Class and enter Subject");
    await supabase.from('assignments').insert([{ fac_id: form.mFac, class_name: form.mClass, subject_name: form.mSub }]);
    setForm({ ...form, mSub: '' });
    syncDatabase();
  };

  const downloadMasterSheet = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Attendance");
    XLSX.writeFile(wb, `Amrit_Report_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div style={ui.container}>
      {/* HEADER SECTION */}
      <div style={ui.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <div style={ui.smallLogo}><Zap fill="white" size={20}/></div>
          <div><h2 style={{margin: 0}}>HOD Console</h2><small style={{color: '#06b6d4'}}>{loading ? 'Syncing...' : 'Data Secured'}</small></div>
        </div>
        <button onClick={() => setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="scroll-hide" style={ui.tabRow}>
        {[
          {id:'dashboard', label: 'DASHBOARD', icon: <LayoutGrid size={16}/>},
          {id:'staff', label: 'FACULTY', icon: <Users size={16}/>},
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
            <div className="glass-card" style={ui.statCard}><TrendingUp color="#10b981"/><h2>{db.logs.length}</h2><p>Sessions</p></div>
            <div className="glass-card" style={ui.statCard}><Users color="#06b6d4"/><h2>{db.staff.length}</h2><p>Staff</p></div>
            <div className="glass-card" style={ui.statCard}><Layers color="#8b5cf6"/><h2>{excelSheets.length}</h2><p>Classes</p></div>
          </div>
          <h4 style={ui.sectionTitle}>RECENT ACTIVITY</h4>
          <div className="glass-card" style={{overflow: 'hidden'}}>
            {db.logs.slice(0, 5).map((log, i) => (
              <div key={i} style={ui.feedRow}>
                <div style={ui.typeIcon}>{log.type === 'Theory' ? 'T' : 'P'}</div>
                <div style={{flex: 1}}><b>{log.class} - {log.sub}</b><br/><small>{log.faculty}</small></div>
                <div style={{textAlign: 'right'}}><b style={{color: '#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize: '10px'}}>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- STAFF MANAGEMENT --- */}
      {tab === 'staff' && (
        <div style={{animation: 'fadeIn 0.4s'}}>
          <div className="glass-card" style={{padding: '25px', marginBottom: '25px'}}>
            <h4 style={{marginTop: 0, color: '#06b6d4'}}>Add New Staff Member</h4>
            <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
              <input placeholder="Full Name" style={ui.input} value={form.name} onChange={e=>setForm({...form, name: e.target.value})}/>
              <input placeholder="Employee ID" style={ui.input} value={form.id} onChange={e=>setForm({...form, id: e.target.value})}/>
            </div>
            <input placeholder="System Password" type="password" style={ui.input} value={form.pass} onChange={e=>setForm({...form, pass: e.target.value})}/>
            <button style={ui.primaryBtn} onClick={addStaff}>REGISTER FACULTY</button>
          </div>
          <h4 style={ui.sectionTitle}>STAFF DIRECTORY</h4>
          {db.staff.map(f => (
            <div key={f.id} className="glass-card" style={{...ui.feedRow, marginBottom: '10px'}}>
              <div style={ui.avatar}>{f.name[0]}</div>
              <div style={{flex: 1}}><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
              <button onClick={async()=>{ if(window.confirm("Remove Faculty?")){ await supabase.from('faculties').delete().eq('id', f.id); syncDatabase(); }}} style={ui.delBtn}><Trash2 size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {/* --- MAPPING MANAGEMENT --- */}
      {tab === 'mapping' && (
        <div style={{animation: 'fadeIn 0.4s'}}>
          <div className="glass-card" style={{padding: '25px', marginBottom: '25px'}}>
            <h4 style={{marginTop: 0, color: '#06b6d4'}}>Allocate Class Workload</h4>
            <select style={ui.input} value={form.mFac} onChange={e=>setForm({...form, mFac: e.target.value})}>
              <option value="">Select Faculty</option>
              {db.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select style={ui.input} value={form.mClass} onChange={e=>setForm({...form, mClass: e.target.value})}>
              <option value="">Select Class</option>
              {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input placeholder="Subject (e.g., Mathematics-IV)" style={ui.input} value={form.mSub} onChange={e=>setForm({...form, mSub: e.target.value})}/>
            <button style={ui.primaryBtn} onClick={addMapping}>CONFIRM MAPPING</button>
          </div>
          <h4 style={ui.sectionTitle}>ACTIVE ALLOCATIONS</h4>
          {db.maps.map(m => (
            <div key={m.id} className="glass-card" style={{...ui.feedRow, marginBottom: '10px'}}>
              <div style={{flex: 1}}><b>{m.class_name}</b><br/><small style={{color: '#06b6d4'}}>{m.subject_name}</small></div>
              <button onClick={async()=>{ await supabase.from('assignments').delete().eq('id', m.id); syncDatabase(); }} style={ui.delBtn}><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {/* --- LOGS & MASTER SEARCH --- */}
      {tab === 'logs' && (
        <div style={{animation: 'fadeIn 0.4s'}}>
          <div style={ui.toolBar}>
            <div style={ui.searchBox}><Search size={18}/><input placeholder="Search Class, Faculty or Subject..." onChange={e=>setSearch(e.target.value)} style={ui.ghostInput}/></div>
            <button onClick={downloadMasterSheet} style={ui.excelBtn}><Download size={18}/> EXCEL</button>
          </div>
          <div className="glass-card">
            {db.logs.filter(l => 
              l.class.toLowerCase().includes(search.toLowerCase()) || 
              l.faculty.toLowerCase().includes(search.toLowerCase()) || 
              l.sub.toLowerCase().includes(search.toLowerCase())
            ).map((log, i) => (
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
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #0f172a, #020617)' },
  loginCard: { padding: '50px 40px', width: '330px', textAlign: 'center' },
  logoCircle: { width: '90px', height: '90px', margin: '0 auto 25px' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  smallLogo: { width: '45px', height: '45px', background: '#0891b2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabRow: { display: 'flex', gap: '12px', marginBottom: '35px', overflowX: 'auto', paddingBottom: '5px' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', padding: '14px 22px', borderRadius: '16px', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' },
  statCard: { padding: '25px', textAlign: 'center' },
  sectionTitle: { fontSize: '11px', color: '#64748b', letterSpacing: '2.5px', marginBottom: '20px', fontWeight: '800' },
  feedRow: { display: 'flex', alignItems: 'center', gap: '18px', padding: '18px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  typeIcon: { width: '35px', height: '35px', borderRadius: '10px', background: 'rgba(6,182,212,0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  input: { width: '100%', padding: '16px', marginBottom: '15px', borderRadius: '14px', background: '#020617', border: '1px solid #1e293b', color: '#fff', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: '18px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '12px', borderRadius: '14px', cursor: 'pointer' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  delBtn: { color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' },
  toolBar: { display: 'flex', gap: '15px', marginBottom: '25px' },
  searchBox: { flex: 1, background: '#1e293b', padding: '0 20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' },
  ghostInput: { background: 'none', border: 'none', color: '#fff', width: '100%', padding: '16px 0', fontSize: '14px' },
  excelBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0 25px', borderRadius: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }
};
