import React, { useEffect, useState, useMemo } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, Search, 
  ChevronRight, FileSpreadsheet, Download, Users, UserPlus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- UI STYLING ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-db-core')) return;
  const style = document.createElement("style");
  style.id = 'amrit-db-core';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .btn-cyan { background: #0891b2; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
    .btn-cyan:hover { background: #0e7490; transform: translateY(-1px); }
    .input-box { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 14px; border-radius: 10px; width: 100%; box-sizing: border-box; outline: none; }
    .tab-btn { padding: 12px 24px; border-radius: 12px; border: none; background: transparent; color: #64748b; font-weight: 700; cursor: pointer; }
    .tab-btn.active { background: #0891b2; color: white; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid; }
    .badge-lec { color: #06b6d4; border-color: #06b6d4; background: rgba(6, 182, 212, 0.05); }
    .badge-prac { color: #10b981; border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { text-align: left; padding: 15px; background: rgba(255,255,255,0.03); color: #64748b; font-size: 11px; text-transform: uppercase; }
    td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.03); }
  `;
  document.head.appendChild(style);
};

const CAMPUS = { LAT: 19.7042, LON: 72.7645, TOL: 0.0008 };

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 

  useEffect(() => { injectStyles(); }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Authentication Failed.");
    }
  };

  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle at top right, #083344, #020617)'}}>
      <div className="glass" style={{padding:'60px 40px', textAlign:'center', width:'340px'}}>
        <h1 style={{margin:0, fontSize:'42px', fontWeight:800, color:'#06b6d4'}}>AMRIT</h1>
        <p style={{color:'#64748b', marginBottom:'40px'}}>DATABASE INTEGRATED ERP</p>
        <button onClick={()=>setView('login')} className="btn-cyan" style={{width:'100%'}}>ENTER PORTAL <ChevronRight/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'40px', width:'320px'}}>
        <h2 style={{marginTop:0}}>Sign In</h2>
        <input id="u" placeholder="ID" className="input-box" style={{marginBottom:'15px'}} />
        <input id="p" type="password" placeholder="Password" className="input-box" style={{marginBottom:'25px'}} />
        <button onClick={()=>handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="btn-cyan" style={{width:'100%'}}>LOG IN</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL: THE CORE DATABASE HUB ---
function HODPanel({ setView }) {
  const [tab, setTab] = useState('staff'); 
  const [db, setDb] = useState({ staff: [], logs: [] });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name:'', id:'', pass:'' });

  const refresh = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    setDb({ staff: f || [], logs: l || [] });
  };

  useEffect(() => { refresh(); }, []);

  // 1. MASTER DOWNLOAD (EXCEL)
  const exportMaster = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Logs");
    XLSX.writeFile(wb, `Amrit_DB_Export.xlsx`);
  };

  // 2. WORKLOAD CALCULATION (LECTURE vs PRACTICAL)
  const getStats = (name) => {
    const sessions = db.logs.filter(l => l.faculty === name);
    return {
      theory: sessions.filter(s => s.type === 'Theory').length,
      practical: sessions.filter(s => s.type === 'Practical').length
    };
  };

  // 3. SEARCH LOGIC
  const filteredLogs = useMemo(() => {
    return db.logs.filter(l => 
      l.faculty.toLowerCase().includes(search.toLowerCase()) || 
      l.sub.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, db.logs]);

  return (
    <div style={{padding:'30px', maxWidth:'1100px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <h2>HOD Control Center</h2>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'10px', marginBottom:'30px'}}>
        <button onClick={()=>setTab('staff')} className={`tab-btn ${tab==='staff'?'active':''}`}>STAFF & WORKLOAD</button>
        <button onClick={()=>setTab('logs')} className={`tab-btn ${tab==='logs'?'active':''}`}>LOGS & SEARCH</button>
      </div>

      {tab === 'staff' && (
        <div className="glass" style={{padding:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px'}}>
            <h3>Faculty Management</h3>
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="Name" className="input-box" style={{width:'150px'}} onChange={e=>setForm({...form, name:e.target.value})}/>
              <input placeholder="ID" className="input-box" style={{width:'100px'}} onChange={e=>setForm({...form, id:e.target.value})}/>
              <input placeholder="Pass" type="password" className="input-box" style={{width:'100px'}} onChange={e=>setForm({...form, pass:e.target.value})}/>
              <button className="btn-cyan" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); refresh();}}><UserPlus size={18}/> ADD</button>
            </div>
          </div>
          <table>
            <thead><tr><th>Faculty</th><th>Theory (Lec)</th><th>Practical (Lab)</th><th>Action</th></tr></thead>
            <tbody>
              {db.staff.map(f => {
                const w = getStats(f.name);
                return (
                  <tr key={f.id}>
                    <td><b>{f.name}</b></td>
                    <td><span className="badge badge-lec">{w.theory}</span></td>
                    <td><span className="badge badge-prac">{w.practical}</span></td>
                    <td><button onClick={async()=>{if(window.confirm('Delete?')){await supabase.from('faculties').delete().eq('id', f.id); refresh();}}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={18}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
            <div style={{position:'relative', flex:1}}>
              <Search style={{position:'absolute', left:'15px', top:'15px', color:'#64748b'}} size={18}/>
              <input placeholder="Search Logs..." className="input-box" style={{paddingLeft:'45px'}} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button onClick={exportMaster} className="btn-cyan" style={{background:'#1e293b'}}><Download size={18}/> DOWNLOAD MASTER</button>
          </div>
          <div className="glass" style={{padding:'10px'}}>
            <table>
              <thead><tr><th>Class</th><th>Subject</th><th>Faculty</th><th>Type</th><th>Attendance</th><th>Date</th></tr></thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.class}</td>
                    <td><b>{log.sub}</b></td>
                    <td>{log.faculty}</td>
                    <td><span className={`badge ${log.type==='Theory'?'badge-lec':'badge-prac'}`}>{log.type}</span></td>
                    <td><b>{log.present}/{log.total}</b></td>
                    <td><small>{log.time_str}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (DATABASE PUSH) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl:'', sub:'', ty:'Theory' });
  const [active, setActive] = useState(false);
  const [roster, setRoster] = useState([]);
  const [marked, setMarked] = useState([]);

  const start = () => {
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setRoster(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const sync = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS.LON,2));
      if(d > CAMPUS.TOL) return alert("Out of Campus Range");
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: marked.length, total: roster.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);

      alert("Synced!"); setView('home');
    });
  };

  if (!active) return (
    <div style={{padding:'30px', maxWidth:'450px', margin:'0 auto'}}>
      <h3>Prof. {user.name}</h3>
      <input placeholder="Class" className="input-box" style={{marginBottom:'15px'}} onChange={e=>setSetup({...setup, cl:e.target.value})}/>
      <input placeholder="Subject" className="input-box" style={{marginBottom:'15px'}} onChange={e=>setSetup({...setup, sub:e.target.value})}/>
      <select className="input-box" style={{marginBottom:'25px'}} onChange={e=>setSetup({...setup, ty:e.target.value})}>
        <option value="Theory">Theory</option>
        <option value="Practical">Practical</option>
      </select>
      <button onClick={start} className="btn-cyan" style={{width:'100%'}}>START SESSION</button>
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'white'}}><ArrowLeft/></button>
        <h3>{setup.cl} Marking</h3>
        <span style={{background:'#10b981', padding:'6px 12px', borderRadius:'10px'}}>{marked.length}/{roster.length}</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'100px'}}>
        {roster.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
          style={{padding:'18px 5px', textAlign:'center', borderRadius:'14px', background: marked.includes(s.id)?'#10b981':'#1e293b', fontWeight:800}}>{s.id}</div>
        ))}
      </div>
      <button onClick={sync} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px'}} className="btn-cyan">SYNC TO DATABASE</button>
    </div>
  );
                                }
