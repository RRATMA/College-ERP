import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Search, User, Fingerprint, BookOpen, 
  Layers, FileSpreadsheet, LayoutGrid, Users, Download, 
  PlusCircle, TrendingUp, Zap, Database, CheckCircle2, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-system-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-system-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .active-tab { background: #0891b2 !important; color: white !important; box-shadow: 0 0 20px rgba(8, 145, 178, 0.4); }
    .neon-logo { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; background: #000; display: flex; align-items: center; justify-content: center; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 20px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { width: 100%; padding: 14px; margin-bottom: 15px; border-radius: 12px; background: #0f172a; border: 1px solid #1e293b; color: #fff; box-sizing: border-box; }
    button:active { transform: scale(0.98); }
  `;
  document.head.appendChild(styleTag);
};

export default function AmritSystem() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'hod', 'faculty'
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    // Load local excel metadata for mapping
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel configuration missing."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' });
      setView('hod');
    } else {
      const { data, error } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Access Denied: Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div className="neon-logo" style={ui.logoCircle}><img src="/logo.png" alt="Logo" style={{width: '70%'}} /></div>
        <h1 style={{fontSize: '28px', margin: '0 0 5px', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '30px', letterSpacing: '2px'}}>UNIFIED CONTROL</p>
        <input id="u" placeholder="Employee/Admin ID" />
        <input id="p" type="password" placeholder="Passphrase" />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return (
    <div>
      {view === 'hod' ? (
        <HODPanel excelSheets={excelSheets} setView={setView} />
      ) : (
        <FacultyPanel user={user} setView={setView} />
      )}
    </div>
  );
}

// --- HOD PANEL: ALL 4 FUNCTIONS TESTED ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ staff: [], logs: [], maps: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ sName: '', sId: '', sPass: '', mFac: '', mClass: '', mSub: '' });

  const sync = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ staff: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { sync(); }, [tab]);

  const addStaff = async () => {
    if (!form.sName || !form.sId) return alert("Enter Faculty Info");
    await supabase.from('faculties').insert([{ id: form.sId, name: form.sName, password: form.sPass }]);
    setForm({...form, sName:'', sId:'', sPass:''}); sync();
  };

  const addMap = async () => {
    if (!form.mFac || !form.mClass || !form.mSub) return alert("Incomplete Mapping");
    await supabase.from('assignments').insert([{ fac_id: form.mFac, class_name: form.mClass, subject_name: form.mSub }]);
    setForm({...form, mSub:''}); sync();
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
          <div style={ui.smallLogo}><Database color="white" size={20}/></div>
          <h2 style={{margin:0}}>HOD Console</h2>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        <button onClick={()=>setTab('dashboard')} className={tab==='dashboard'?'active-tab':''} style={ui.tabBtn}><LayoutGrid size={16}/> DASHBOARD</button>
        <button onClick={()=>setTab('staff')} className={tab==='staff'?'active-tab':''} style={ui.tabBtn}><Users size={16}/> STAFF</button>
        <button onClick={()=>setTab('mapping')} className={tab==='mapping'?'active-tab':''} style={ui.tabBtn}><PlusCircle size={16}/> MAPPING</button>
        <button onClick={()=>setTab('logs')} className={tab==='logs'?'active-tab':''} style={ui.tabBtn}><FileSpreadsheet size={16}/> LOGS</button>
      </div>

      {tab === 'dashboard' && (
        <div style={{animation: 'fadeIn 0.3s'}}>
          <div style={ui.statsGrid}>
            <div className="glass-card" style={ui.statCard}><h3>{db.logs.length}</h3><p>Sessions</p></div>
            <div className="glass-card" style={ui.statCard}><h3>{db.staff.length}</h3><p>Faculty</p></div>
            <div className="glass-card" style={ui.statCard}><h3>{excelSheets.length}</h3><p>Classes</p></div>
          </div>
          <h4 style={ui.label}>RECENT ATTENDANCE SYNC</h4>
          <div className="glass-card">
            {db.logs.slice(0, 5).map((l, i) => (
              <div key={i} style={ui.listRow}>
                <div><b>{l.class}</b><br/><small>{l.faculty} • {l.sub}</small></div>
                <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{l.present}/{l.total}</b><br/><small>{l.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <h4>Faculty Registration</h4>
          <input placeholder="Full Name" value={form.sName} onChange={e=>setForm({...form, sName:e.target.value})} />
          <input placeholder="Staff ID" value={form.sId} onChange={e=>setForm({...form, sId:e.target.value})} />
          <input placeholder="Password" type="password" value={form.sPass} onChange={e=>setForm({...form, sPass:e.target.value})} />
          <button onClick={addStaff} style={ui.primaryBtn}>ADD TO SUPABASE</button>
          <div style={{marginTop:'25px'}}>
            {db.staff.map(f => (
              <div key={f.id} style={ui.listRow}>
                <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
                <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); sync()}} style={ui.delBtn}><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <h4>Allocate Workload</h4>
          <select value={form.mFac} onChange={e=>setForm({...form, mFac:e.target.value})}>
            <option value="">Choose Teacher</option>
            {db.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={form.mClass} onChange={e=>setForm({...form, mClass:e.target.value})}>
            <option value="">Choose Class (from Excel)</option>
            {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Subject Title" value={form.mSub} onChange={e=>setForm({...form, mSub:e.target.value})} />
          <button onClick={addMap} style={ui.primaryBtn}>ASSIGN SUBJECT</button>
          <div style={{marginTop:'25px'}}>
            {db.maps.map(m => (
              <div key={m.id} style={ui.listRow}>
                <div><b>{m.class_name}</b><br/><small>{m.subject_name}</small></div>
                <button onClick={async()=>{await supabase.from('assignments').delete().eq('id', m.id); sync()}} style={ui.delBtn}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <div style={ui.searchBar}><Search size={18}/><input placeholder="Search records..." onChange={e=>setSearch(e.target.value)} style={{background:'none', border:'none', color:'#fff', width:'100%', outline:'none'}}/></div>
            <button onClick={()=>{
              const ws = XLSX.utils.json_to_sheet(db.logs);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "AttendanceMaster");
              XLSX.writeFile(wb, "Amrit_Master_Sheet.xlsx");
            }} style={ui.downloadBtn}><Download size={18}/> EXCEL</button>
          </div>
          <div className="glass-card">
            {db.logs.filter(l => l.class.toLowerCase().includes(search.toLowerCase())).map((l, i) => (
              <div key={i} style={ui.listRow}>
                <div><b>{l.class} | {l.sub}</b><br/><small>{l.faculty} • {l.time_str}</small></div>
                <b>{l.present}/{l.total}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (STUB) ---
function FacultyPanel({ user, setView }) {
  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <h2>Welcome, {user.name}</h2>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>
      <div className="glass-card" style={{padding:'40px', textAlign:'center'}}>
        <CheckCircle2 size={48} color="#0891b2" style={{marginBottom:'20px'}}/>
        <h3>Faculty System Online</h3>
        <p>Attendance module is ready for class mapping.</p>
      </div>
    </div>
  );
}

// --- UI CONFIGURATION ---
const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '45px', width: '310px', textAlign: 'center' },
  logoCircle: { width: '85px', height: '85px', margin: '0 auto 20px' },
  container: { maxWidth: '900px', margin: '0 auto', padding: '40px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  smallLogo: { width: '42px', height: '42px', background: '#0891b2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', padding: '12px 20px', borderRadius: '14px', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace:'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' },
  statCard: { padding: '25px', textAlign: 'center' },
  label: { fontSize:'10px', color:'#64748b', letterSpacing:'1.5px', marginBottom:'15px' },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  primaryBtn: { width: '100%', padding: '16px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' },
  delBtn: { color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' },
  searchBar: { flex: 1, background: '#1e293b', padding: '0 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' },
  downloadBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
};
