import React, { useEffect, useState, useMemo } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, Search, 
  ChevronRight, FileSpreadsheet, Download, Users, UserPlus, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- UI ARCHITECTURE ENGINE ---
const injectStyles = () => {
  if (document.getElementById('amrit-final-system')) return;
  const style = document.createElement("style");
  style.id = 'amrit-final-system';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; overflow-x: hidden; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; }
    .btn-action { background: #0891b2; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn-action:hover { background: #0e7490; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(8, 145, 178, 0.3); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .input-field { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 14px; border-radius: 12px; width: 100%; box-sizing: border-box; outline: none; transition: 0.2s; }
    .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1); }
    .badge { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; border: 1px solid; letter-spacing: 0.5px; }
    .badge-lec { color: #06b6d4; border-color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
    .badge-prac { color: #10b981; border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
    table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    th { text-align: left; padding: 15px; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; }
    td { padding: 16px 15px; background: rgba(30, 41, 59, 0.3); }
    td:first-child { border-radius: 12px 0 0 12px; }
    td:last-child { border-radius: 0 12px 12px 0; }
  `;
  document.head.appendChild(style);
};

const CAMPUS_COORDS = { LAT: 19.7042, LON: 72.7645, RANGE: 0.0008 };

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  const handleLogin = async (u, p) => {
    if (!u || !p) return alert("All fields are mandatory.");
    setLoading(true);
    try {
      if (u === "HODCOM" && p === "COMP1578") {
        setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
      } else {
        const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
        if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
        else alert("Authentication Error: Invalid Credentials.");
      }
    } catch (e) { alert("Network Error: Could not reach Supabase."); }
    finally { setLoading(false); }
  };

  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle at top right, #083344, #020617)'}}>
      <div className="glass-card" style={{padding:'60px 40px', textAlign:'center', width:'340px'}}>
        <h1 style={{margin:0, fontSize:'48px', fontWeight:800, color:'#06b6d4', letterSpacing:'-3px'}}>AMRIT</h1>
        <p style={{color:'#94a3b8', marginBottom:'40px', fontSize:'14px', fontWeight:500}}>ENGINEERING RESOURCE PORTAL</p>
        <button onClick={()=>setView('login')} className="btn-action" style={{width:'100%'}}>SIGN IN <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass-card" style={{padding:'40px', width:'320px'}}>
        <h2 style={{marginTop:0, fontWeight:800}}>Portal Login</h2>
        <input id="uid" placeholder="Employee/Admin ID" className="input-field" style={{marginBottom:'12px'}} />
        <input id="ups" type="password" placeholder="Passcode" className="input-field" style={{marginBottom:'24px'}} />
        <button disabled={loading} onClick={()=>handleLogin(document.getElementById('uid').value, document.getElementById('ups').value)} className="btn-action" style={{width:'100%'}}>
          {loading ? <Loader2 className="animate-spin" /> : "AUTHENTICATE"}
        </button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD DASHBOARD: CRUD + AUTO-PASS + ANALYTICS ---
function HODPanel({ setView }) {
  const [tab, setTab] = useState('staff'); 
  const [data, setData] = useState({ staff: [], logs: [] });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name:'', id:'' });

  const refreshData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    setData({ staff: f || [], logs: l || [] });
  };

  useEffect(() => { refreshData(); }, []);

  const exportMasterData = () => {
    const ws = XLSX.utils.json_to_sheet(data.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Logs");
    XLSX.writeFile(wb, `Amrit_Master_Export.xlsx`);
  };

  const getStats = (name) => {
    const subset = data.logs.filter(l => l.faculty === name);
    return {
      theory: subset.filter(s => s.type === 'Theory').length,
      practical: subset.filter(s => s.type === 'Practical').length
    };
  };

  const filteredLogs = useMemo(() => {
    return data.logs.filter(l => 
      l.faculty.toLowerCase().includes(search.toLowerCase()) || 
      l.sub.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, data.logs]);

  return (
    <div style={{padding:'40px', maxWidth:'1200px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'40px'}}>
        <div><h1 style={{margin:0}}>Admin Oversight</h1><small style={{color:'#64748b'}}>Department of Computer Engineering</small></div>
        <button onClick={()=>setView('home')} className="btn-action" style={{background:'#1e293b'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'10px', marginBottom:'30px'}}>
        <button onClick={()=>setTab('staff')} className={`btn-action ${tab==='staff'?'':'grayscale opacity-50'}`}><Users size={18}/> STAFF MGMT</button>
        <button onClick={()=>setTab('logs')} className={`btn-action ${tab==='logs'?'':'grayscale opacity-50'}`}><Database size={18}/> MASTER LOGS</button>
      </div>

      {tab === 'staff' && (
        <div className="glass-card" style={{padding:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
            <h3 style={{margin:0}}>Faculty Load Tracker</h3>
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="Name" className="input-field" style={{width:'180px'}} value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
              <input placeholder="ID" className="input-field" style={{width:'120px'}} value={form.id} onChange={e=>setForm({...form, id:e.target.value})}/>
              <button className="btn-action" onClick={async()=>{
                if(!form.name || !form.id) return alert("Fill Name and ID");
                const pass = Math.floor(100000 + Math.random() * 900000).toString(); // AUTO GENERATOR
                await supabase.from('faculties').insert([{id:form.id, name:form.name, password:pass}]);
                alert(`SUCCESS! Passcode for ${form.name} is: ${pass}`);
                setForm({name:'', id:''}); refreshData();
              }}><UserPlus size={18}/> ADD STAFF</button>
            </div>
          </div>
          <table>
            <thead><tr><th>Faculty Name</th><th>Emp ID</th><th>Theory</th><th>Practical</th><th>Manage</th></tr></thead>
            <tbody>
              {data.staff.map(f => {
                const s = getStats(f.name);
                return (
                  <tr key={f.id}>
                    <td><b>{f.name}</b></td>
                    <td><code>{f.id}</code></td>
                    <td><span className="badge badge-lec">{s.theory} Lec</span></td>
                    <td><span className="badge badge-prac">{s.practical} Lab</span></td>
                    <td><button onClick={async()=>{if(window.confirm('Delete?')){await supabase.from('faculties').delete().eq('id', f.id); refreshData();}}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={18}/></button></td>
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
              <input placeholder="Search records..." className="input-field" style={{paddingLeft:'45px'}} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button onClick={exportMasterData} className="btn-action" style={{background:'#1e293b'}}><Download size={18}/> EXCEL</button>
          </div>
          <div className="glass-card" style={{padding:'10px', maxHeight:'600px', overflowY:'auto'}}>
            <table>
              <thead><tr><th>Class</th><th>Subject</th><th>Type</th><th>Attendance</th><th>Date</th></tr></thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.class}</td><td><b>{log.sub}</b></td>
                    <td><span className={`badge ${log.type==='Theory'?'badge-lec':'badge-prac'}`}>{log.type}</span></td>
                    <td><b style={{color:'#10b981'}}>{log.present}/{log.total}</b></td>
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

// --- FACULTY PANEL: GEOFENCED SYNC ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl:'', sub:'', ty:'Theory' });
  const [active, setActive] = useState(false);
  const [roster, setRoster] = useState([]);
  const [marked, setMarked] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const loadStudents = () => {
    if(!setup.cl || !setup.sub) return alert("All fields are required.");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())];
      if(!sheet) return alert("Sheet for class not found.");
      const data = XLSX.utils.sheet_to_json(sheet);
      setRoster(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const syncAttendance = () => {
    setSyncing(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_COORDS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_COORDS.LON,2));
      if(dist > CAMPUS_COORDS.RANGE) { setSyncing(false); return alert("Out of Campus! Location verification failed."); }
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: marked.length, total: roster.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Attendance Pushed Successfully."); setView('home');
    }, () => { setSyncing(false); alert("GPS Failure."); });
  };

  if (!active) return (
    <div style={{padding:'40px', maxWidth:'450px', margin:'0 auto'}}>
      <h3 style={{fontWeight:800}}>Faculty: {user.name}</h3>
      <input placeholder="Class (e.g. SE-A)" className="input-field" style={{marginBottom:'15px'}} onChange={e=>setSetup({...setup, cl:e.target.value})}/>
      <input placeholder="Subject" className="input-field" style={{marginBottom:'15px'}} onChange={e=>setSetup({...setup, sub:e.target.value})}/>
      <select className="input-field" style={{marginBottom:'30px'}} onChange={e=>setSetup({...setup, ty:e.target.value})}>
        <option value="Theory">Theory</option><option value="Practical">Practical</option>
      </select>
      <button onClick={loadStudents} className="btn-action" style={{width:'100%'}}>START SESSION</button>
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', alignItems:'center'}}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'white'}}><ArrowLeft/></button>
        <div style={{background:'#10b981', padding:'8px 16px', borderRadius:'12px', fontWeight:800}}>{marked.length}/{roster.length}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'12px', paddingBottom:'100px'}}>
        {roster.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
          style={{padding:'20px 5px', textAlign:'center', borderRadius:'16px', background: marked.includes(s.id)?'#10b981':'#1e293b', fontWeight:800, cursor:'pointer'}}>{s.id}</div>
        ))}
      </div>
      <button onClick={syncAttendance} disabled={syncing} style={{position:'fixed', bottom:'30px', left:'30px', right:'30px'}} className="btn-action">
        {syncing ? <Loader2 className="animate-spin" /> : "FINALIZE SESSION"}
      </button>
    </div>
  );
}
