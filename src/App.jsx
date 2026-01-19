import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Users, Database, TrendingUp, 
  BookOpen, CheckCircle, Clock, ShieldAlert, BarChart3, ChevronRight, Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.555568; 
const CAMPUS_LON = 73.250732;
const RADIUS_LIMIT = 0.0018; 
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-pro-ui')) return;
  const s = document.createElement("style");
  s.id = 'amrit-pro-ui';
  s.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; overflow-x: hidden; }
    
    /* Advanced Glassmorphism */
    .glass { 
      background: rgba(15, 23, 42, 0.6); 
      backdrop-filter: blur(16px); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      border-radius: 24px; 
      padding: 24px; 
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
      transition: all 0.3s ease;
    }
    .glass:hover { border-color: rgba(6, 182, 212, 0.3); transform: translateY(-2px); }

    /* Stat Cards */
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { 
      padding: 20px; 
      position: relative; 
      overflow: hidden; 
      background: linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4));
    }
    .stat-card h3 { font-size: 32px; margin: 8px 0; font-weight: 800; letter-spacing: -1px; }
    .stat-card p { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 1px; }
    .icon-box { padding: 10px; border-radius: 12px; display: inline-flex; margin-bottom: 10px; }

    /* Inputs & Buttons */
    input, select { 
      background: rgba(15, 23, 42, 0.8); 
      border: 1px solid #1e293b; 
      color: #fff; 
      padding: 14px; 
      border-radius: 14px; 
      width: 100%; 
      margin-bottom: 12px;
      transition: 0.2s;
    }
    input:focus { border-color: #06b6d4; box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.1); }
    
    .btn-cyan { 
      background: linear-gradient(135deg, #0891b2, #06b6d4); 
      color: #fff; border: none; padding: 16px; border-radius: 14px; 
      font-weight: 700; cursor: pointer; width: 100%; 
      box-shadow: 0 4px 15px rgba(8, 145, 178, 0.3);
    }
    
    /* Interactive Roll Grid */
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 12px; }
    .roll-btn { 
      height: 60px; display: flex; align-items: center; justify-content: center;
      border-radius: 16px; font-weight: 800; background: #1e293b; 
      cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255,255,255,0.05); color: #94a3b8;
    }
    .roll-btn.active { 
      background: #10b981 !important; color: white !important; 
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); 
      transform: scale(1.1); border-color: #34d399;
    }
    
    /* Table Styling */
    .custom-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    .custom-table tr { background: rgba(30, 41, 59, 0.3); }
    .custom-table td { padding: 16px; border: none; }
    .custom-table td:first-child { border-radius: 16px 0 0 16px; }
    .custom-table td:last-child { border-radius: 0 16px 16px 0; }
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
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); } 
    else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } 
      else alert("Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #083344, #020617)' }}>
      <div className="glass" style={{ width: '360px', textAlign: 'center', padding: '40px' }}>
        <div style={{background: '#fff', width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: '10px', boxShadow: '0 0 20px rgba(6,182,212,0.4)'}}>
           <img src="/logo.png" style={{width: '100%'}} alt="Logo" />
        </div>
        <h1 style={{margin: '0', fontSize: '28px', color: '#fff', letterSpacing: '-1px'}}>AMRIT <span style={{color: '#06b6d4'}}>ERP</span></h1>
        <p style={{color: '#94a3b8', fontSize: '12px', marginBottom: '30px'}}>Academic Management & Tracking</p>
        <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
        <button className="btn-cyan" style={{marginTop: '10px'}} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('dash');
  const [db, setDb] = useState({ f: [], l: [] });

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setDb({ f: f || [], l: l || [] });
  };
  useEffect(() => { refresh(); }, []);

  const todayStr = new Date().toLocaleDateString('en-GB');
  const todayLogs = db.l.filter(l => l.time_str === todayStr);

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h2 style={{margin: 0, fontSize: '24px', fontWeight: 800}}>Dashboard <span style={{color: '#06b6d4'}}>Overview</span></h2>
          <p style={{color: '#94a3b8', fontSize: '13px'}}>{new Date().toDateString()}</p>
        </div>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
          <div className="glass" style={{padding:'8px 16px', borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px'}}>
             <div style={{width:'8px', height:'8px', background:'#10b981', borderRadius:'50%'}}></div>
             <span style={{fontSize:'12px', fontWeight:700}}>Server Online</span>
          </div>
          <button onClick={() => setView('login')} style={{background:'#f43f5e20', border:'none', color:'#f43f5e', padding:'10px', borderRadius:'12px', cursor:'pointer'}}><LogOut size={20}/></button>
        </div>
      </div>

      {tab === 'dash' && (
        <>
          <div className="stat-grid">
            <StatCard icon={<Users color="#06b6d4"/>} val={db.f.length} label="Total Staff" color="#06b6d4" />
            <StatCard icon={<BookOpen color="#a855f7"/>} val={todayLogs.length} label="Total Batches Today" color="#a855f7" />
            <StatCard icon={<Activity color="#10b981"/>} val={todayLogs.reduce((a,c)=>a+c.present,0)} label="Students Present" color="#10b981" />
            <StatCard icon={<ShieldAlert color="#f43f5e"/>} val={sheets.length} label="Classes Managed" color="#f43f5e" />
          </div>

          <div className="glass" style={{marginTop:'30px'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}><Clock size={20} color="#06b6d4"/> Live Attendance Feed</h3>
                <BarChart3 size={20} color="#94a3b8"/>
             </div>
             <table className="custom-table">
               <thead>
                 <tr style={{color:'#64748b', fontSize:'11px', textTransform:'uppercase'}}>
                   <th>Class</th><th>Subject</th><th>Faculty</th><th>Timing</th><th>Attendance</th>
                 </tr>
               </thead>
               <tbody>
                 {todayLogs.map((log, i) => (
                   <tr key={i}>
                     <td><b style={{color:'#06b6d4'}}>{log.class}</b></td>
                     <td>{log.sub}</td>
                     <td>{log.faculty}</td>
                     <td><span style={{color:'#94a3b8', fontSize:'12px'}}>{log.start_time} - {log.end_time}</span></td>
                     <td>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                           <div style={{flex:1, height:'6px', background:'#1e293b', borderRadius:'10px', width:'60px', overflow:'hidden'}}>
                              <div style={{width:`${(log.present/log.total)*100}%`, height:'100%', background:'#10b981'}}></div>
                           </div>
                           <b style={{fontSize:'12px'}}>{log.present}/{log.total}</b>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </>
      )}

      {/* Navigation Bar at Bottom */}
      <div style={{position:'fixed', bottom:'30px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'10px', background:'rgba(15,23,42,0.8)', padding:'8px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(10px)'}}>
         {['dash', 'staff', 'mapping', 'records'].map(t => (
           <button key={t} onClick={()=>setTab(t)} style={{
             padding:'10px 20px', border:'none', borderRadius:'14px', cursor:'pointer',
             background: tab === t ? '#06b6d4' : 'transparent',
             color: tab === t ? '#fff' : '#94a3b8',
             fontWeight: 700, transition: '0.3s'
           }}>{t.toUpperCase()}</button>
         ))}
      </div>
    </div>
  );
}

function StatCard({ icon, val, label, color }) {
  return (
    <div className="glass stat-card" style={{borderLeftColor: color}}>
      <div className="icon-box" style={{background: `${color}20`}}>{icon}</div>
      <h3>{val}</h3>
      <p>{label}</p>
    </div>
  );
}

function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
  }, [user.id]);

  const start = () => {
    if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
      setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
      setActive(true);
    });
  };

  const submit = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) return alert("Campus boundary error!");
      const dt = new Date().toLocaleDateString('en-GB');
      const { data: at } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
      }]).select().single();
      const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
      if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Submitted!"); setView('login');
    }, () => alert("GPS Error!"), {enableHighAccuracy: false});
  };

  if (!active) return (
    <div style={{ padding: '30px', maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass" style={{display:'flex', justifyContent:'space-between', marginBottom:'30px', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <div style={{width:'50px', height:'50px', background:'#fff', borderRadius:'50%', padding:'5px'}}><img src="/logo.png" style={{width:'100%'}} alt="Logo" /></div>
          <div><b style={{fontSize:'16px'}}>{user.name}</b><br/><small style={{color:'#94a3b8'}}>Faculty Access</small></div>
        </div>
        <LogOut onClick={()=>setView('login')} color="#f43f5e" style={{cursor:'pointer'}}/>
      </div>
      
      <div style={{display:'flex', gap:'12px', marginBottom:'24px'}}>
        {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
      </div>

      <p style={{fontSize:'12px', fontWeight:800, color:'#64748b', marginBottom:'10px'}}>SELECT ASSIGNED CLASS</p>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px'}}>
        {[...new Set(jobs.map(j => j.class_name))].map(c => (
          <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', cursor:'pointer', fontWeight:800, padding:'15px' }}>{c}</div>
        ))}
      </div>

      {setup.cl && (
        <div className="glass" style={{animation: 'fadeIn 0.5s ease'}}>
          <p style={{fontSize:'12px', fontWeight:800, color:'#64748b', marginBottom:'10px'}}>SELECT SUBJECT</p>
          {jobs.filter(j => j.class_name === setup.cl).map(j => (
            <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'16px', cursor:'pointer', background: setup.sub === j.subject_name ? 'rgba(8,145,178,0.2)' : '', borderColor: setup.sub === j.subject_name ? '#06b6d4' : '' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <b>{j.subject_name}</b>
                {setup.sub === j.subject_name && <CheckCircle size={18} color="#06b6d4"/>}
              </div>
            </div>
          ))}
          <div style={{display:'flex', gap:'12px', marginTop:'20px'}}>
             <div style={{flex:1}}><small style={{color:'#94a3b8'}}>Start Time</small><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/></div>
             <div style={{flex:1}}><small style={{color:'#94a3b8'}}>End Time</small><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
          </div>
          <button className="btn-cyan" onClick={start} style={{marginTop:'20px'}}>START MARKING SESSION</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems:'center' }}>
        <ArrowLeft onClick={() => setActive(false)} style={{cursor:'pointer'}} />
        <div style={{textAlign:'center'}}><b style={{fontSize:'18px'}}>{setup.cl}</b><br/><span style={{fontSize:'12px', color:'#06b6d4'}}>{setup.sub}</span></div>
        <div style={{background:'#10b98120', color:'#10b981', padding:'8px 16px', borderRadius:'14px', fontWeight:800}}>{marked.length}/{list.length}</div>
      </div>
      
      <div className="roll-grid">
        {list.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>
            {s.id}
          </div>
        ))}
      </div>
      
      <div style={{ height: '120px' }}></div>
      <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth:'400px' }}>
        <button onClick={submit} className="btn-cyan" style={{ background: '#10b981', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>FINALIZE ATTENDANCE</button>
      </div>
    </div>
  );
          }
