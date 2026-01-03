import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Search, Layers, FileSpreadsheet, LayoutGrid, 
  Users, Download, PlusCircle, TrendingUp, Zap, Shield, Database, 
  Activity, Clock, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES (Cyber-Glass Theme) ---
const injectStyles = () => {
  if (document.getElementById('amrit-ultimate-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-ultimate-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    :root { --cyan: #06b6d4; --glow: rgba(6, 182, 212, 0.4); --bg: #030712; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: #f1f5f9; margin: 0; }
    
    .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 28px; }
    .neon-border { border: 1px solid var(--cyan); box-shadow: 0 0 15px var(--glow); }
    
    .nav-pill { background: rgba(255,255,255,0.05); padding: 10px 22px; border-radius: 100px; cursor: pointer; border: 1px solid transparent; transition: 0.3s; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .nav-pill.active { background: var(--cyan); color: white; box-shadow: 0 0 20px var(--glow); }
    
    .stat-box { padding: 25px; min-width: 180px; position: relative; overflow: hidden; }
    .stat-box h2 { font-size: 36px; margin: 0; font-weight: 800; }
    
    .feed-item { display: flex; align-items: center; gap: 15px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .feed-item:hover { background: rgba(255,255,255,0.02); }

    input, select { background: #000 !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; padding: 14px !important; border-radius: 14px !important; width: 100%; margin-bottom: 12px; }
    input:focus { border-color: var(--cyan) !important; outline: none; box-shadow: 0 0 10px var(--glow); }
    
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .live-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
  `;
  document.head.appendChild(styleTag);
};

export default function AmritSystem() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel fail:", e));
  }, []);

  const login = async (id, pass) => {
    if (id === "HODCOM" && pass === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', id).eq('password', pass).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Authentication Failed");
    }
  };

  if (view === 'home') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, #0f172a 0%, #030712 100%)' }}>
      <div className="glass" style={{ padding: '60px', width: '350px', textAlign: 'center', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
        {/* CUSTOM LOGO CONTAINER */}
        <div style={{ width: '100px', height: '100px', margin: '0 auto 25px', borderRadius: '50%', background: '#000', border: '2px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 0 30px var(--glow)' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: 800, margin: 0, letterSpacing: '-1.5px' }}>AMRIT</h1>
        <p style={{ color: 'var(--cyan)', fontSize: '11px', fontWeight: 800, letterSpacing: '4px', marginBottom: '40px' }}>SYSTEM TERMINAL</p>
        <input id="u" placeholder="Admin/Faculty ID" />
        <input id="p" type="password" placeholder="Security Passphrase" />
        <button onClick={() => login(document.getElementById('u').value, document.getElementById('p').value)} style={{ width: '100%', padding: '16px', background: 'var(--cyan)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>ENTER SYSTEM</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <div style={{padding:'40px'}}>Faculty Mode Online</div>;
}

function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ staff: [], logs: [], maps: [] });
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({ sName: '', sId: '', sPass: '', mFac: '', mClass: '', mSub: '' });

  useEffect(() => {
    const fetchData = async () => {
      const { data: f } = await supabase.from('faculties').select('*').order('name');
      const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
      const { data: m } = await supabase.from('assignments').select('*');
      setDb({ staff: f || [], logs: l || [], maps: m || [] });
    };
    fetchData();
  }, [tab, refresh]);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '50px 20px' }}>
      {/* TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="neon-border" style={{ width: '50px', height: '50px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <Zap color="var(--cyan)" fill="var(--cyan)" size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>AMRIT <span style={{ fontWeight: 300, opacity: 0.5 }}>HOD Panel</span></h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)', fontSize: '12px', fontWeight: 700 }}>
               <div className="live-dot" /> SYSTEM CONTROL CENTER
            </div>
          </div>
        </div>
        <button onClick={() => setView('home')} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><LogOut size={18} /> EXIT</button>
      </div>

      {/* NAV PILLS (Image Style) */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
        <div onClick={() => setTab('dashboard')} className={`nav-pill ${tab === 'dashboard' ? 'active' : ''}`}><LayoutGrid size={18}/> DASHBOARD</div>
        <div onClick={() => setTab('staff')} className={`nav-pill ${tab === 'staff' ? 'active' : ''}`}><Users size={18}/> STAFF</div>
        <div onClick={() => setTab('mapping')} className={`nav-pill ${tab === 'mapping' ? 'active' : ''}`}><PlusCircle size={18}/> MAPPING</div>
        <div onClick={() => setTab('logs')} className={`nav-pill ${tab === 'logs' ? 'active' : ''}`}><FileSpreadsheet size={18}/> LOGS</div>
      </div>

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '50px' }}>
            <div className="glass stat-box">
              <Activity color="var(--cyan)" size={20} style={{marginBottom:'10px'}}/>
              <h2>{db.logs.length}</h2>
              <p style={{opacity:0.5, fontSize:'13px', margin:0}}>Today Sessions</p>
            </div>
            <div className="glass stat-box">
              <Users color="var(--cyan)" size={20} style={{marginBottom:'10px'}}/>
              <h2>{db.staff.length}</h2>
              <p style={{opacity:0.5, fontSize:'13px', margin:0}}>Faculties</p>
            </div>
            <div className="glass stat-box">
              <Layers color="var(--cyan)" size={20} style={{marginBottom:'10px'}}/>
              <h2>{excelSheets.length}</h2>
              <p style={{opacity:0.5, fontSize:'13px', margin:0}}>Active Classes</p>
            </div>
            <div className="glass stat-box neon-border" style={{background: 'linear-gradient(135deg, #083344, #030712)'}}>
              <TrendingUp color="white" size={20} style={{marginBottom:'10px'}}/>
              <h2>100%</h2>
              <p style={{opacity:0.8, fontSize:'13px', margin:0}}>Data Uptime</p>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', letterSpacing: '2px', opacity: 0.6, marginBottom: '20px' }}>RECENT ACTIVITY FEED</h3>
          <div className="glass" style={{ overflow: 'hidden' }}>
            {db.logs.slice(0, 6).map((log, i) => (
              <div key={i} className="feed-item">
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(6,182,212,0.1)', color: 'var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{log.type[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{log.class} - {log.sub}</div>
                  <div style={{ fontSize: '12px', opacity: 0.5 }}>{log.faculty} • {log.time_str}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '18px' }}>{log.present}/{log.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STAFF MANAGEMENT */}
      {tab === 'staff' && (
        <div className="glass" style={{ padding: '35px' }}>
          <h2 style={{marginTop:0, marginBottom:'25px'}}>Staff Registration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', marginBottom: '30px' }}>
            <input placeholder="Faculty Full Name" value={form.sName} onChange={e=>setForm({...form, sName:e.target.value})} />
            <input placeholder="Employee ID" value={form.sId} onChange={e=>setForm({...form, sId:e.target.value})} />
            <input placeholder="System Password" type="password" value={form.sPass} onChange={e=>setForm({...form, sPass:e.target.value})} />
            <button onClick={async()=>{
              await supabase.from('faculties').insert([{ id: form.sId, name: form.sName, password: form.sPass }]);
              setForm({...form, sName:'', sId:'', sPass:''}); setRefresh(r=>r+1);
            }} style={{ padding: '0 30px', background: 'var(--cyan)', border: 'none', borderRadius: '14px', fontWeight: 800, color: 'white', cursor: 'pointer', height: '50px' }}>REGISTER</button>
          </div>
          {db.staff.map(f => (
            <div key={f.id} className="feed-item">
              <div style={{ flex: 1 }}><b>{f.name}</b> <br/> <small style={{ opacity: 0.5 }}>ID: {f.id}</small></div>
              <button onClick={async()=>{ if(window.confirm("Remove Faculty?")) { await supabase.from('faculties').delete().eq('id', f.id); setRefresh(r=>r+1); }}} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      )}

      {/* MAPPING SYSTEM */}
      {tab === 'mapping' && (
        <div className="glass" style={{ padding: '35px' }}>
          <h2 style={{marginTop:0, marginBottom:'25px'}}>Subject Allocation</h2>
          <div style={{ maxWidth: '500px' }}>
            <label style={{fontSize:'12px', opacity:0.5}}>Choose Faculty Member</label>
            <select value={form.mFac} onChange={e=>setForm({...form, mFac:e.target.value})}>
              <option value="">-- Select Teacher --</option>
              {db.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <label style={{fontSize:'12px', opacity:0.5}}>Choose Class (from Excel)</label>
            <select value={form.mClass} onChange={e=>setForm({...form, mClass:e.target.value})}>
              <option value="">-- Select Class Sheet --</option>
              {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <label style={{fontSize:'12px', opacity:0.5}}>Assign Subject</label>
            <input placeholder="e.g. Data Structures" value={form.mSub} onChange={e=>setForm({...form, mSub:e.target.value})} />
            <button onClick={async()=>{
              await supabase.from('assignments').insert([{ fac_id: form.mFac, class_name: form.mClass, subject_name: form.mSub }]);
              setForm({...form, mSub:''}); setRefresh(r=>r+1);
            }} style={{ width: '100%', padding: '16px', background: 'var(--cyan)', border: 'none', borderRadius: '14px', fontWeight: 800, color: 'white', cursor: 'pointer', marginTop: '10px' }}>LINK ASSIGNMENT</button>
          </div>
          <div style={{marginTop:'40px'}}>
             {db.maps.map(m => (
                <div key={m.id} className="feed-item">
                  <div style={{ flex: 1 }}><b>{m.class_name}</b> <br/> <small style={{ opacity: 0.5 }}>{m.subject_name}</small></div>
                  <button onClick={async()=>{ await supabase.from('assignments').delete().eq('id', m.id); setRefresh(r=>r+1); }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
        }
