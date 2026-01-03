import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Search, Layers, FileSpreadsheet, LayoutGrid, 
  Users, Download, PlusCircle, TrendingUp, Zap, Database, 
  CheckCircle2, Clock, Shield, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER MODE: CSS OVERRIDE ---
const injectStyles = () => {
  if (document.getElementById('amrit-pro-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-pro-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    
    :root {
      --bg: #030712;
      --glass: rgba(15, 23, 42, 0.6);
      --cyan: #06b6d4;
      --cyan-glow: rgba(6, 182, 212, 0.3);
      --border: rgba(255, 255, 255, 0.08);
    }

    body { 
      font-family: 'Plus Jakarta Sans', sans-serif; 
      background: var(--bg); 
      background-image: radial-gradient(circle at 0% 0%, #083344 0%, transparent 40%),
                        radial-gradient(circle at 100% 100%, #1e1b4b 0%, transparent 40%);
      margin: 0; 
      color: #f1f5f9; 
      min-height: 100vh;
    }

    .glass-card { 
      background: var(--glass); 
      backdrop-filter: blur(16px); 
      border: 1px solid var(--border); 
      border-radius: 28px; 
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }

    .nav-btn {
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      color: #94a3b8;
      padding: 10px 20px;
      border-radius: 100px;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-btn.active {
      background: var(--cyan);
      color: white;
      box-shadow: 0 0 20px var(--cyan-glow);
      border-color: var(--cyan);
    }

    .stat-card {
      padding: 24px;
      text-align: left;
      position: relative;
      overflow: hidden;
    }

    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; right: 0; width: 60px; height: 60px;
      background: linear-gradient(135deg, transparent 50%, var(--cyan-glow) 100%);
      opacity: 0.5;
    }

    .activity-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.01);
      transition: 0.2s;
    }

    .activity-row:hover { background: rgba(255,255,255,0.04); }

    .type-badge {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 14px;
    }

    input, select {
      background: rgba(0,0,0,0.2) !important;
      border: 1px solid var(--border) !important;
      color: white !important;
      padding: 16px !important;
      border-radius: 16px !important;
    }

    .neon-text { color: var(--cyan); text-shadow: 0 0 10px var(--cyan-glow); }
    
    @keyframes pulse-ring { 0% { transform: scale(.8); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0; } }
  `;
  document.head.appendChild(styleTag);
};

export default function AmritSystem() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.warn("Excel sheet not loaded. Check public folder."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("System Error: Identity not verified.");
    }
  };

  // --- LOGIN PAGE (Original Home Style) ---
  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-card" style={{ padding: '50px', width: '340px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#000', borderRadius: '50%', margin: '0 auto 20px', border: '2px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--cyan-glow)' }}>
          <Zap color={ui.cyan} fill={ui.cyan} size={40} />
        </div>
        <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 800, letterSpacing: '-1px' }}>AMRIT</h1>
        <p style={{ color: ui.cyan, fontSize: '11px', fontWeight: 800, marginBottom: '40px', letterSpacing: '3px' }}>MANAGEMENT SYSTEM</p>
        <input id="u" placeholder="Admin ID" style={{ width: '100%', marginBottom: '15px' }} />
        <input id="p" type="password" placeholder="Passphrase" style={{ width: '100%', marginBottom: '30px' }} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{ width: '100%', padding: '16px', background: ui.cyan, color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>LOGIN SYSTEM</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODDashboard excelSheets={excelSheets} setView={setView} /> : <div style={{padding:'50px'}}>Faculty Panel Active</div>;
}

// --- DESIGNER HOD PANEL (Matching Tablet Image) ---
function HODDashboard({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ staff: [], logs: [], maps: [] });
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ sName: '', sId: '', sPass: '', mFac: '', mClass: '', mSub: '' });

  const sync = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setData({ staff: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { sync(); }, [tab]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--cyan-glow)' }}>
            <Shield color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>AMRIT <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '18px' }}>HOD Panel</span></h1>
            <span style={{ color: 'var(--cyan)', fontSize: '12px', fontWeight: 600 }}>CONTROL CENTER</span>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '15px', cursor: 'pointer' }}><LogOut /></button>
      </div>

      {/* Tabs (Matching Tablet UI Pill style) */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <button onClick={() => setTab('dashboard')} className={`nav-btn ${tab === 'dashboard' ? 'active' : ''}`}><LayoutGrid size={18} /> DASHBOARD</button>
        <button onClick={() => setTab('staff')} className={`nav-btn ${tab === 'staff' ? 'active' : ''}`}><Users size={18} /> STAFF</button>
        <button onClick={() => setTab('mapping')} className={`nav-btn ${tab === 'mapping' ? 'active' : ''}`}><PlusCircle size={18} /> MAPPING</button>
        <button onClick={() => setTab('logs')} className={`nav-btn ${tab === 'logs' ? 'active' : ''}`}><FileSpreadsheet size={18} /> LOGS</button>
      </div>

      {/* DASHBOARD TAB (Matching Stat Cards in Image) */}
      {tab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <div className="glass-card stat-card">
              <TrendingUp color="var(--cyan)" size={20} style={{ marginBottom: '15px' }} />
              <h2 style={{ fontSize: '32px', margin: 0 }}>{data.logs.length}</h2>
              <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>Today Sessions</p>
            </div>
            <div className="glass-card stat-card">
              <Users color="var(--cyan)" size={20} style={{ marginBottom: '15px' }} />
              <h2 style={{ fontSize: '32px', margin: 0 }}>{data.staff.length}</h2>
              <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>Faculties</p>
            </div>
            <div className="glass-card stat-card">
              <Layers color="var(--cyan)" size={20} style={{ marginBottom: '15px' }} />
              <h2 style={{ fontSize: '32px', margin: 0 }}>{excelSheets.length}</h2>
              <p style={{ margin: 0, opacity: 0.6, fontSize: '13px' }}>Active Classes</p>
            </div>
            <div className="glass-card stat-card" style={{ background: 'linear-gradient(135deg, #164e63, #083344)' }}>
              <Zap color="white" size={20} style={{ marginBottom: '15px' }} />
              <h2 style={{ fontSize: '32px', margin: 0 }}>LIVE</h2>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '13px' }}>System Status</p>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', letterSpacing: '2px', opacity: 0.8, marginBottom: '20px' }}>RECENT ACTIVITY FEED</h3>
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            {data.logs.slice(0, 6).map((log, i) => (
              <div key={i} className="activity-row">
                <div className="type-badge" style={{ background: log.type === 'Theory' ? '#0e7490' : '#15803d', color: 'white' }}>
                  {log.type === 'Theory' ? 'T' : 'P'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{log.class} — {log.sub}</div>
                  <div style={{ fontSize: '12px', opacity: 0.5 }}>{log.faculty} • {log.time_str}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#22c55e', fontWeight: 800 }}>{log.present}/{log.total}</div>
                  <div style={{ fontSize: '10px', opacity: 0.4 }}>ATTENDANCE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAFF TAB */}
      {tab === 'staff' && (
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ marginTop: 0 }}>Staff Directory</h2>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <input placeholder="Faculty Name" value={form.sName} onChange={e=>setForm({...form, sName:e.target.value})} />
            <input placeholder="Staff ID" value={form.sId} onChange={e=>setForm({...form, sId:e.target.value})} />
            <input placeholder="Set Password" type="password" value={form.sPass} onChange={e=>setForm({...form, sPass:e.target.value})} />
            <button onClick={async()=>{
              await supabase.from('faculties').insert([{ id: form.sId, name: form.sName, password: form.sPass }]);
              setForm({...form, sName:'', sId:'', sPass:''}); sync();
            }} style={{ padding: '0 30px', background: 'var(--cyan)', border: 'none', borderRadius: '16px', fontWeight: 'bold', color: 'white' }}>ADD</button>
          </div>
          {data.staff.map(f => (
            <div key={f.id} className="activity-row">
              <div style={{ flex: 1 }}><b>{f.name}</b> <br/> <small style={{ opacity: 0.5 }}>Employee ID: {f.id}</small></div>
              <button onClick={async()=>{ if(window.confirm("Remove staff?")) { await supabase.from('faculties').delete().eq('id', f.id); sync(); }}} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      )}

      {/* MAPPING TAB */}
      {tab === 'mapping' && (
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2>Subject Mapping</h2>
          <select value={form.mFac} onChange={e=>setForm({...form, mFac:e.target.value})} style={{ marginBottom: '15px', display: 'block' }}>
            <option value="">Select Faculty Member</option>
            {data.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={form.mClass} onChange={e=>setForm({...form, mClass:e.target.value})} style={{ marginBottom: '15px', display: 'block' }}>
            <option value="">Select Class (from Excel)</option>
            {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Subject Name" value={form.mSub} onChange={e=>setForm({...form, mSub:e.target.value})} />
          <button onClick={async()=>{
            await supabase.from('assignments').insert([{ fac_id: form.mFac, class_name: form.mClass, subject_name: form.mSub }]);
            setForm({...form, mSub:''}); sync();
          }} style={{ width: '100%', padding: '16px', background: 'var(--cyan)', border: 'none', borderRadius: '16px', fontWeight: 'bold', color: 'white' }}>CREATE ASSIGNMENT</button>
          <div style={{marginTop:'30px'}}>
            {data.maps.map(m => (
              <div key={m.id} className="activity-row">
                <div style={{ flex: 1 }}><b>{m.class_name}</b> <br/> <small style={{ opacity: 0.5 }}>{m.subject_name}</small></div>
                <button onClick={async()=>{ await supabase.from('assignments').delete().eq('id', m.id); sync(); }} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {tab === 'logs' && (
        <div>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '15px', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
              <Search size={18} opacity={0.5} />
              <input placeholder="Search logs by class, faculty..." onChange={e=>setSearch(e.target.value)} style={{ background: 'none !important', border: 'none !important', width: '100%' }} />
            </div>
            <button onClick={() => {
              const ws = XLSX.utils.json_to_sheet(data.logs);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "MasterAttendance");
              XLSX.writeFile(wb, "Amrit_Master_Log.xlsx");
            }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0 25px', borderRadius: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={18} /> EXPORT</button>
          </div>
          <div className="glass-card">
            {data.logs.filter(l => l.class.toLowerCase().includes(search.toLowerCase())).map((l, i) => (
              <div key={i} className="activity-row">
                <div style={{ flex: 1 }}><b>{l.class} | {l.sub}</b><br/><small>{l.faculty} • {l.time_str}</small></div>
                <div style={{ textAlign: 'right' }}><b style={{ color: 'var(--cyan)' }}>{l.present}/{l.total}</b><br/><small style={{fontSize:'10px', opacity:0.5}}>{l.type}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ui = {
  cyan: '#06b6d4',
  loginWrap: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  loginCard: { padding: '50px', width: '340px', textAlign: 'center' },
  logoCircle: { width: '80px', height: '80px', background: '#000', borderRadius: '50%', margin: '0 auto 20px', border: '2px solid #06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};
