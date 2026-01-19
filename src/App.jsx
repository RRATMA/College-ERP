import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, Download, Calendar, ShieldCheck, BarChart3, FileSpreadsheet, PlusCircle, Activity, LayoutDashboard, Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0030; // Reliable Range
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-modern-ui')) return;
  const s = document.createElement("style");
  s.id = 'amrit-modern-ui';
  s.innerHTML = `
    :root { --primary: #06b6d4; --accent: #10b981; --danger: #f43f5e; --bg: #020617; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: #f1f5f9; margin: 0; overflow-x: hidden; }
    
    /* Animated Background */
    body::before {
      content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
      z-index: -1;
    }

    /* Glassmorphism Cards */
    .glass { 
      background: rgba(30, 41, 59, 0.45); 
      backdrop-filter: blur(16px); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      border-radius: 24px; 
      padding: 24px; 
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass:hover { transform: translateY(-5px); border-color: rgba(6, 182, 212, 0.3); }

    .logo-circle { 
      width: 50px; height: 50px; border-radius: 14px; 
      border: 2px solid var(--primary); background: #fff; padding: 2px;
    }

    /* Stat Cards Optimization */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { border-bottom: 4px solid var(--primary); }
    .stat-card.red { border-bottom-color: var(--danger); }
    .stat-card h3 { font-size: 32px; margin: 12px 0 4px 0; font-weight: 800; letter-spacing: -1px; }
    .stat-card p { font-size: 12px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin: 0; }

    /* Inputs & Buttons */
    input, select { 
      background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; color: #fff; 
      padding: 14px; border-radius: 16px; width: 100%; outline: none; margin-bottom: 12px;
      transition: 0.3s;
    }
    input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1); }
    
    .btn-cyan { 
      background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
      color: #fff; border: none; padding: 16px; border-radius: 16px; font-weight: 700;
      cursor: pointer; width: 100%; box-shadow: 0 4px 15px rgba(8, 145, 178, 0.3);
      transition: 0.3s;
    }
    .btn-cyan:hover { transform: scale(1.02); filter: brightness(1.1); }

    /* Modern Tabs */
    .tab-nav { display: flex; gap: 8px; background: rgba(15, 23, 42, 0.8); padding: 8px; border-radius: 20px; margin-bottom: 30px; }
    .tab-link { 
      flex: 1; text-align: center; cursor: pointer; padding: 12px; color: #94a3b8; 
      font-weight: 700; border-radius: 14px; transition: 0.3s; font-size: 13px;
    }
    .tab-link.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2); }

    /* Attendance Grid */
    .roll-btn { 
      aspect-ratio: 1/1; display: flex; align-items: center; justify-content: center;
      border-radius: 16px; font-weight: 800; background: #1e293b; color: #64748b;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.05); transition: 0.2s;
    }
    .roll-btn.active { background: var(--accent) !important; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.5s ease-out forwards; }
  `;
  document.head.appendChild(s);
};

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      setSheets(XLSX.read(ab, { type: 'array' }).SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { 
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); 
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } 
      else { alert("Login Failed!"); }
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass animate-in" style={{ width: '350px', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
          <img src="/logo.png" className="logo-circle" alt="Logo" style={{width: '80px', height: '80px'}} />
          <h1 style={{fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', margin: '15px 0 5px 0'}}>AMRIT <span style={{color: '#06b6d4'}}>ERP</span></h1>
          <p style={{fontSize: '12px', color: '#94a3b8', fontWeight: '600'}}>DIGITAL ATTENDANCE SYSTEM</p>
        </div>
        <input id="u" placeholder="Employee ID" />
        <input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL DESIGN ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [], m: [] });

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ f: f || [], l: l || [], m: m || [] });
  };
  useEffect(() => { refresh(); }, []);

  const today = new Date().toLocaleDateString('en-GB');
  const tLogs = db.l.filter(l => l.time_str === today);
  const theory = tLogs.filter(l => l.type === 'Theory').length;
  const practical = tLogs.filter(l => l.type === 'Practical').length;

  return (
    <div style={{ padding: '25px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }} className="animate-in">
        <div>
          <h2 style={{margin: 0, fontSize: '28px', fontWeight: 900}}>Welcome, <span style={{color: '#06b6d4'}}>HOD Admin</span></h2>
          <p style={{color: '#94a3b8', margin: 0, fontWeight: 600}}>Computer Engineering Department</p>
        </div>
        <button onClick={() => setView('login')} style={{background: 'rgba(244, 63, 94, 0.1)', border: 'none', padding: '12px', borderRadius: '14px', cursor: 'pointer'}}>
          <LogOut color="#f43f5e" size={24} />
        </button>
      </header>

      <div className="stat-grid animate-in">
        <div className="glass stat-card">
           <Activity size={20} color="#06b6d4" />
           <h3>{db.l.length}</h3><p>Total Lectures Conducted</p>
        </div>
        <div className="glass stat-card">
           <Calendar size={20} color="#06b6d4" />
           <h3>{theory}T | {practical}P</h3><p>Today's Session Split</p>
        </div>
        <div className="glass stat-card">
           <Users size={20} color="#06b6d4" />
           <h3>{tLogs.reduce((a,c)=>a+c.present,0)}</h3><p>Students Present Today</p>
        </div>
        <div className="glass stat-card red">
           <TrendingUp size={20} color="#f43f5e" />
           <select id="dc" style={{fontSize: '14px', margin: '10px 0 5px 0', padding: '5px', background: 'transparent', border: 'none'}}>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
           <button onClick={()=>alert("Exporting Defaulters...")} style={{background: '#f43f5e', border: 'none', color: 'white', borderRadius: '8px', padding: '5px 15px', fontWeight: 700, fontSize: '11px', cursor: 'pointer'}}>DOWNLOAD DEFAULTER</button>
        </div>
      </div>

      <nav className="tab-nav animate-in">
        <div onClick={()=>setTab('dash')} className={`tab-link ${tab==='dash'?'active':''}`}><LayoutDashboard size={18} style={{marginBottom: -4, marginRight: 8}}/>Dashboard</div>
        <div onClick={()=>setTab('staff')} className={`tab-link ${tab==='staff'?'active':''}`}><Users size={18} style={{marginBottom: -4, marginRight: 8}}/>Staff Mgmt</div>
        <div onClick={()=>setTab('records')} className={`tab-link ${tab==='records'?'active':''}`}><FileSpreadsheet size={18} style={{marginBottom: -4, marginRight: 8}}/>Master Records</div>
      </nav>

      {tab === 'dash' && (
        <div className="glass animate-in" style={{minHeight: '300px'}}>
           <h3 style={{marginTop: 0}}>Recent Activity</h3>
           <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
             <thead>
               <tr style={{color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #1e293b'}}>
                 <th style={{padding: '12px'}}>Faculty</th><th style={{padding: '12px'}}>Subject</th><th style={{padding: '12px'}}>Class</th><th style={{padding: '12px'}}>Attendance</th>
               </tr>
             </thead>
             <tbody>
               {db.l.slice(0, 5).map(log => (
                 <tr key={log.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                   <td style={{padding: '12px', fontWeight: 600}}>{log.faculty}</td>
                   <td style={{padding: '12px'}}>{log.sub}</td>
                   <td style={{padding: '12px'}}><span style={{background: '#1e293b', padding: '4px 10px', borderRadius: '6px'}}>{log.class}</span></td>
                   <td style={{padding: '12px', color: '#10b981', fontWeight: 800}}>{((log.present/log.total)*100).toFixed(0)}%</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
      
      {/* Rest of the HOD tabs (Staff & Records) same as previous logic but inside .glass animate-in */}
    </div>
  );
}

// --- FACULTY PANEL DESIGN ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  if (!active) return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }} className="animate-in">
      <header style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
           <div className="logo-circle"><img src="/logo.png" style={{width:'100%', height:'100%', objectFit:'contain'}} /></div>
           <div><b>{user.name}</b><br/><small style={{color: '#94a3b8'}}>Faculty Dashboard</small></div>
        </div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" style={{cursor: 'pointer'}}/>
      </header>

      <div style={{display: 'flex', gap: '12px', marginBottom: '25px'}}>
        {['Theory', 'Practical'].map(t => (
          <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>
        ))}
      </div>

      <div className="glass">
        <p style={{fontSize: '11px', fontWeight: 800, color: '#06b6d4', marginBottom: '10px'}}>SELECT CLASS</p>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px'}}>
          {[...new Set(jobs.map(j => j.class_name))].map(c => (
            <div key={c} onClick={() => setSetup({ ...setup, cl: c })} style={{ 
              padding: '12px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', fontWeight: 800,
              background: setup.cl === c ? '#06b6d4' : '#1e293b'
            }}>{c}</div>
          ))}
        </div>

        {setup.cl && (
          <div className="animate-in">
            <p style={{fontSize: '11px', fontWeight: 800, color: '#06b6d4', marginBottom: '10px'}}>SELECT SUBJECT</p>
            {jobs.filter(j => j.class_name === setup.cl).map(j => (
              <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ 
                marginBottom: '10px', padding: '15px', cursor: 'pointer', borderLeft: setup.sub === j.subject_name ? '4px solid #06b6d4' : 'none',
                background: setup.sub === j.subject_name ? 'rgba(6, 182, 212, 0.1)' : ''
              }}>{j.subject_name}</div>
            ))}
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '15px'}}>
               <div><small>START TIME</small><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/></div>
               <div><small>END TIME</small><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
            </div>
            
            <button className="btn-cyan" onClick={() => { 
                if(!setup.cl || !setup.sub || !setup.s) return alert("Select all details");
                fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
                  const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
                  setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
                  setActive(true);
                });
            }}>TAKE ATTENDANCE</button>
            <button className="btn-cyan" onClick={() => alert("Downloading Master Sheet...")} style={{marginTop: '10px', background: '#1e293b', border: '1px solid #06b6d4'}}>DOWNLOAD MY MASTER</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <ArrowLeft onClick={() => setActive(false)} style={{cursor: 'pointer'}} />
        <div style={{textAlign: 'center'}}><b style={{fontSize: '20px'}}>{setup.cl}</b><br/><small>{setup.sub}</small></div>
        <div style={{background: '#10b981', padding: '8px 18px', borderRadius: '14px', fontWeight: 900, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'}}>{marked.length} / {list.length}</div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px', paddingBottom: '120px' }}>
        {list.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '25px', background: 'linear-gradient(to top, #020617 80%, transparent)', backdropFilter: 'blur(10px)' }}>
        <button onClick={() => alert("Submitting...")} className="btn-cyan" style={{ background: '#10b981' }}>FINALIZE & UPLOAD</button>
      </div>
    </div>
  );
             }
