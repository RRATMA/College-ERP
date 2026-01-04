import React, { useEffect, useState, useMemo } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, Search, 
  ChevronRight, FileSpreadsheet, Download, Users, UserPlus, ShieldAlert, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- SYSTEM ARCHITECTURE STYLING ---
const injectStyles = () => {
  if (document.getElementById('amrit-prod-core')) return;
  const style = document.createElement("style");
  style.id = 'amrit-prod-core';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; }
    .btn-action { background: #0891b2; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn-action:hover { background: #0e7490; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(8, 145, 178, 0.3); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .input-field { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 14px; border-radius: 12px; width: 100%; box-sizing: border-box; outline: none; transition: 0.2s; }
    .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1); }
    .status-badge { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; border: 1px solid; letter-spacing: 0.5px; }
    .status-lec { color: #06b6d4; border-color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
    .status-prac { color: #10b981; border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
    table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
    th { text-align: left; padding: 15px; color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 800; }
    td { padding: 16px 15px; background: rgba(30, 41, 59, 0.3); }
    td:first-child { border-radius: 12px 0 0 12px; }
    td:last-child { border-radius: 0 12px 12px 0; }
  `;
  document.head.appendChild(style);
};

const CAMPUS_GEO = { LAT: 19.7042, LON: 72.7645, TOL: 0.0008 };

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  const handleAuth = async (u, p) => {
    if (!u || !p) return alert("Credentials required.");
    setIsLoading(true);
    try {
      if (u === "HODCOM" && p === "COMP1578") {
        setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
      } else {
        const { data, error } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
        if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
        else throw new Error("Invalid User ID or Password");
      }
    } catch (err) { alert(err.message); } 
    finally { setIsLoading(false); }
  };

  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle at 10% 20%, #083344 0%, #020617 90%)'}}>
      <div className="glass-card" style={{padding:'60px 40px', textAlign:'center', width:'340px'}}>
        <div style={{fontSize:'48px', fontWeight:800, color:'#06b6d4', letterSpacing:'-3px', marginBottom:'8px'}}>AMRIT</div>
        <div style={{height:'2px', width:'40px', background:'#0891b2', margin:'0 auto 20px'}}></div>
        <p style={{color:'#94a3b8', marginBottom:'40px', fontWeight:500, fontSize:'14px'}}>ACADEMIC RESOURCE INTERFACE</p>
        <button onClick={()=>setView('login')} className="btn-action" style={{width:'100%'}}>ACCESS PORTAL <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass-card" style={{padding:'40px', width:'320px'}}>
        <h2 style={{marginTop:0, fontWeight:800, fontSize:'24px'}}>Security Login</h2>
        <input id="uid" placeholder="Identity ID" className="input-field" style={{marginBottom:'12px'}} />
        <input id="ups" type="password" placeholder="Passcode" className="input-field" style={{marginBottom:'24px'}} />
        <button disabled={isLoading} onClick={()=>handleAuth(document.getElementById('uid').value, document.getElementById('ups').value)} className="btn-action" style={{width:'100%'}}>
          {isLoading ? <Loader2 className="animate-spin" /> : "VERIFY IDENTITY"}
        </button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD DASHBOARD: SEARCH + CRUD + ANALYTICS ---
function HODPanel({ setView }) {
  const [activeTab, setActiveTab] = useState('staff'); 
  const [store, setStore] = useState({ staff: [], logs: [] });
  const [search, setSearch] = useState("");
  const [newStaff, setNewStaff] = useState({ n:'', id:'', p:'' });

  const syncDatabase = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    setStore({ staff: f || [], logs: l || [] });
  };

  useEffect(() => { syncDatabase(); }, []);

  const downloadMasterReport = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(store.logs);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Master_Records");
      XLSX.writeFile(wb, `Amrit_ERP_Full_Report.xlsx`);
    } catch (e) { alert("Export failed: Data structure mismatch."); }
  };

  const calculateLoad = (name) => {
    const subset = store.logs.filter(l => l.faculty === name);
    return {
      theory: subset.filter(s => s.type === 'Theory').length,
      practical: subset.filter(s => s.type === 'Practical').length
    };
  };

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    return store.logs.filter(l => 
      l.faculty.toLowerCase().includes(q) || 
      l.sub.toLowerCase().includes(q) ||
      l.class.toLowerCase().includes(q)
    );
  }, [search, store.logs]);

  return (
    <div style={{padding:'40px', maxWidth:'1200px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
        <div>
          <h1 style={{margin:0, fontSize:'28px', fontWeight:800}}>Admin Oversight</h1>
          <p style={{color:'#64748b', fontSize:'14px'}}>Managing <b>{store.staff.length}</b> Faculty Members</p>
        </div>
        <button onClick={()=>setView('home')} className="btn-action" style={{background:'#1e293b'}}><LogOut size={18}/> EXIT</button>
      </div>

      <div style={{display:'flex', gap:'15px', marginBottom:'30px'}}>
        <button onClick={()=>setActiveTab('staff')} className="btn-action" style={{background: activeTab==='staff'?'#0891b2':'#0f172a'}}><Users size={18}/> Staff Records</button>
        <button onClick={()=>setActiveTab('logs')} className="btn-action" style={{background: activeTab==='logs'?'#0891b2':'#0f172a'}}><Database size={18}/> Session Logs</button>
      </div>

      {activeTab === 'staff' && (
        <div className="glass-card" style={{padding:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
            <h3 style={{margin:0}}>Faculty CRUD Operations</h3>
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="Name" className="input-field" style={{width:'180px'}} value={newStaff.n} onChange={e=>setNewStaff({...newStaff, n:e.target.value})}/>
              <input placeholder="Emp ID" className="input-field" style={{width:'120px'}} value={newStaff.id} onChange={e=>setNewStaff({...newStaff, id:e.target.value})}/>
              <button className="btn-action" onClick={async()=>{
                if(!newStaff.n || !newStaff.id) return alert("Validation Error: Name and ID required.");
                await supabase.from('faculties').insert([{id:newStaff.id, name:newStaff.n, password:'123'}]);
                setNewStaff({n:'', id:'', p:''}); syncDatabase();
              }}><UserPlus size={18}/> ADD</button>
            </div>
          </div>

          <table>
            <thead>
              <tr><th>Faculty</th><th>Theory Lec</th><th>Practical Lab</th><th>Management</th></tr>
            </thead>
            <tbody>
              {store.staff.map(f => {
                const stats = calculateLoad(f.name);
                return (
                  <tr key={f.id}>
                    <td><div style={{fontWeight:700}}>{f.name}</div><small style={{color:'#64748b'}}>{f.id}</small></td>
                    <td><span className="status-badge status-lec">{stats.theory} COMPLETED</span></td>
                    <td><span className="status-badge status-prac">{stats.practical} COMPLETED</span></td>
                    <td><button onClick={async()=>{if(window.confirm('Wipe faculty record?')){await supabase.from('faculties').delete().eq('id', f.id); syncDatabase();}}} style={{background:'none', border:'none', color:'#f43f5e', cursor:'pointer'}}><Trash2 size={18}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
            <div style={{position:'relative', flex:1}}>
              <Search style={{position:'absolute', left:'15px', top:'15px', color:'#64748b'}} size={18}/>
              <input placeholder="Search session by subject, teacher or class..." className="input-field" style={{paddingLeft:'45px'}} onChange={e=>setSearch(e.target.value)} />
            </div>
            <button onClick={downloadMasterReport} className="btn-action" style={{background:'#1e293b', border:'1px solid #334155'}}><Download size={18}/> DOWNLOAD MASTER</button>
          </div>
          <div className="glass-card" style={{padding:'10px', maxHeight:'600px', overflowY:'auto'}}>
            <table>
              <thead>
                <tr><th>Class</th><th>Subject</th><th>Faculty</th><th>Type</th><th>Attendance</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.class}</td>
                    <td><b>{log.sub}</b></td>
                    <td>{log.faculty}</td>
                    <td><span className={`status-badge ${log.type==='Theory'?'status-lec':'status-prac'}`}>{log.type}</span></td>
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

// --- FACULTY PANEL: LOCATION VERIFIED SYNC ---
function FacultyPanel({ user, setView }) {
  const [session, setSession] = useState({ cl:'', sub:'', ty:'Theory' });
  const [isActive, setIsActive] = useState(false);
  const [roster, setRoster] = useState([]);
  const [marked, setMarked] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const initSession = () => {
    if(!session.cl || !session.sub) return alert("Select Class and Subject.");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===session.cl.toLowerCase())];
      if(!sheet) throw new Error("Class ID not found in master sheet.");
      const data = XLSX.utils.sheet_to_json(sheet);
      setRoster(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setIsActive(true);
    }).catch(e => alert(e.message));
  };

  const handleFinalSync = () => {
    setIsSyncing(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_GEO.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_GEO.LON,2));
      if(dist > CAMPUS_GEO.TOL) { setIsSyncing(false); return alert("SECURITY ALERT: Out of campus range. Attendance cannot be synced."); }
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: session.sub, class: session.cl, type: session.ty, 
        present: marked.length, total: roster.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);

      alert("Data Integrity Verified. Sync Complete."); setView('home');
    }, () => { setIsSyncing(false); alert("GPS Failure: Ensure location is enabled."); });
  };

  if (!isActive) return (
    <div style={{padding:'40px', maxWidth:'450px', margin:'0 auto'}}>
      <h3 style={{fontSize:'24px', fontWeight:800}}>Instructor: {user.name}</h3>
      <div style={{marginTop:'30px'}}>
        <p style={{fontSize:'12px', color:'#64748b', fontWeight:800, textTransform:'uppercase'}}>Session Details</p>
        <input placeholder="Class (e.g. SE-A)" className="input-field" style={{marginBottom:'15px'}} onChange={e=>setSession({...session, cl:e.target.value})}/>
        <input placeholder="Subject Name" className="input-field" style={{marginBottom:'15px'}} onChange={e=>setSession({...session, sub:e.target.value})}/>
        <select className="input-field" style={{marginBottom:'30px'}} onChange={e=>setSession({...session, ty:e.target.value})}>
          <option value="Theory">Theory Lecture</option>
          <option value="Practical">Practical / Lab</option>
        </select>
        <button onClick={initSession} className="btn-action" style={{width:'100%'}}><Zap size={18}/> INITIALIZE MARKING</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', position:'sticky', top:0, background:'#020617', paddingBottom:'10px', zIndex:10}}>
        <button onClick={()=>setIsActive(false)} style={{background:'none', border:'none', color:'white'}}><ArrowLeft/></button>
        <div style={{textAlign:'center'}}><h3 style={{margin:0}}>{session.cl}</h3><small>{session.sub}</small></div>
        <div style={{background:'#10b981', padding:'8px 16px', borderRadius:'12px', fontWeight:800}}>{marked.length}/{roster.length}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'12px', paddingBottom:'120px'}}>
        {roster.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
          style={{padding:'20px 5px', textAlign:'center', borderRadius:'16px', background: marked.includes(s.id)?'#10b981':'#1e293b', fontWeight:800, cursor:'pointer', border:'1px solid rgba(255,255,255,0.05)'}}>{s.id}</div>
        ))}
      </div>
      <button onClick={handleFinalSync} disabled={isSyncing} style={{position:'fixed', bottom:'30px', left:'30px', right:'30px'}} className="btn-action">
        {isSyncing ? <Loader2 className="animate-spin" /> : "FINALIZE & PUSH TO CLOUD"}
      </button>
    </div>
  );
          }
