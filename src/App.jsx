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
    .neon-logo { animation: pulse 3s infinite; border: 2px solid #06b6d4; border-radius: 50%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 5px #06b6d4; } 50% { box-shadow: 0 0 25px #06b6d4; } }
    .scroll-hide::-webkit-scrollbar { display: none; }
    input, select { transition: 0.3s; width: 100%; padding: 14px; margin-bottom: 12px; border-radius: 12px; background: #020617; border: 1px solid #1e293b; color: #fff; box-sizing: border-box; }
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
    }).catch(() => console.error("Excel file missing in public/ folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed!");
    }
  };

  if (view === 'login') return (
    <div style={ui.loginWrap}>
      <div className="glass-card" style={ui.loginCard}>
        <div className="neon-logo" style={ui.logoCircle}><img src="/logo.png" alt="Logo" style={{width: '85%'}} /></div>
        <h1 style={{fontSize: '32px', margin: '0', fontWeight: 800}}>AMRIT</h1>
        <p style={{color: '#06b6d4', fontSize: '10px', fontWeight: '800', marginBottom: '30px', letterSpacing: '2px'}}>HOD PANEL</p>
        <input id="u" placeholder="Admin ID" />
        <input id="p" type="password" placeholder="Password" />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={ui.primaryBtn}>LOGIN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <div>Faculty Panel Active</div>;
}

function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ staff: [], logs: [], maps: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ sName: '', sId: '', sPass: '', mFac: '', mClass: '', mSub: '' });

  // 1. Unified Sync Function (Works for all features)
  const syncAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ staff: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { syncAll(); }, [tab]);

  // 2. Staff Actions
  const addStaff = async () => {
    if (!form.sName || !form.sId) return alert("Enter details");
    await supabase.from('faculties').insert([{ id: form.sId, name: form.sName, password: form.sPass }]);
    setForm({...form, sName: '', sId: '', sPass: ''}); syncAll();
  };

  // 3. Mapping Actions
  const addMap = async () => {
    if (!form.mFac || !form.mClass || !form.mSub) return alert("Select all fields");
    await supabase.from('assignments').insert([{ fac_id: form.mFac, class_name: form.mClass, subject_name: form.mSub }]);
    setForm({...form, mSub: ''}); syncAll();
  };

  // 4. Export Action
  const exportLogs = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Amrit_Master_Sheet.xlsx");
  };

  return (
    <div style={ui.container}>
      <div style={ui.header}>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
          <div style={ui.smallLogo}><Zap fill="white" size={20}/></div>
          <h2 style={{margin:0}}>HOD Console</h2>
        </div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut/></button>
      </div>

      <div className="scroll-hide" style={ui.tabRow}>
        <button onClick={()=>setTab('dashboard')} className={tab==='dashboard'?'active-tab':''} style={ui.tabBtn}><LayoutGrid size={16}/> DASHBOARD</button>
        <button onClick={()=>setTab('staff')} className={tab==='staff'?'active-tab':''} style={ui.tabBtn}><Users size={16}/> STAFF</button>
        <button onClick={()=>setTab('mapping')} className={tab==='mapping'?'active-tab':''} style={ui.tabBtn}><PlusCircle size={16}/> MAPPING</button>
        <button onClick={()=>setTab('logs')} className={tab==='logs'?'active-tab':''} style={ui.tabBtn}><FileSpreadsheet size={16}/> LOGS</button>
      </div>

      {tab === 'dashboard' && (
        <div>
          <div style={ui.statsGrid}>
            <div className="glass-card" style={ui.statCard}><h3>{db.logs.length}</h3><p>Sessions</p></div>
            <div className="glass-card" style={ui.statCard}><h3>{db.staff.length}</h3><p>Staff</p></div>
            <div className="glass-card" style={ui.statCard}><h3>{excelSheets.length}</h3><p>Classes</p></div>
          </div>
          <div className="glass-card" style={{padding:'20px'}}>
            <h4>Recent Activity</h4>
            {db.logs.slice(0, 5).map((l, i) => (
              <div key={i} style={ui.listRow}><b>{l.class}</b> - {l.sub} <span style={{float:'right', color:'#10b981'}}>{l.present}/{l.total}</span></div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <h4>Register Faculty</h4>
          <input placeholder="Name" value={form.sName} onChange={e=>setForm({...form, sName:e.target.value})} />
          <input placeholder="Staff ID" value={form.sId} onChange={e=>setForm({...form, sId:e.target.value})} />
          <input placeholder="Password" type="password" value={form.sPass} onChange={e=>setForm({...form, sPass:e.target.value})} />
          <button onClick={addStaff} style={ui.primaryBtn}>ADD TO DIRECTORY</button>
          <hr style={{opacity:0.1, margin:'20px 0'}}/>
          {db.staff.map(f => (
            <div key={f.id} style={ui.listRow}>{f.name} (ID: {f.id}) <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); syncAll()}} style={ui.delBtn}><Trash2 size={16}/></button></div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass-card" style={{padding:'20px'}}>
          <h4>Subject Allocation</h4>
          <select value={form.mFac} onChange={e=>setForm({...form, mFac:e.target.value})}>
            <option>Select Faculty</option>
            {db.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={form.mClass} onChange={e=>setForm({...form, mClass:e.target.value})}>
            <option>Select Class</option>
            {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Subject Name" value={form.mSub} onChange={e=>setForm({...form, mSub:e.target.value})} />
          <button onClick={addMap} style={ui.primaryBtn}>CONFIRM ALLOCATION</button>
          <hr style={{opacity:0.1, margin:'20px 0'}}/>
          {db.maps.map(m => (
            <div key={m.id} style={ui.listRow}><b>{m.class_name}</b>: {m.subject_name} <button onClick={async()=>{await supabase.from('assignments').delete().eq('id', m.id); syncAll()}} style={ui.delBtn}><Trash2 size={16}/></button></div>
          ))}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <div style={ui.searchBar}><Search size={18}/><input placeholder="Search logs..." onChange={e=>setSearch(e.target.value)} style={{background:'none', border:'none', color:'#fff', width:'100%'}}/></div>
            <button onClick={exportLogs} style={ui.downloadBtn}><Download size={18}/> EXCEL</button>
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

const ui = {
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' },
  loginCard: { padding: '40px', width: '300px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '30px 20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  smallLogo: { width: '40px', height: '40px', background: '#0891b2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabRow: { display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' },
  tabBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace:'nowrap' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' },
  statCard: { padding: '20px', textAlign: 'center' },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  primaryBtn: { width: '100%', padding: '15px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
  delBtn: { color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' },
  searchBar: { flex: 1, background: '#1e293b', padding: '0 15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' },
  downloadBtn: { background: '#10b981', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
};
