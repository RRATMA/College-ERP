import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, UserCheck, 
  FileWarning, ChevronRight, FileSpreadsheet, Layers, Users, Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER: INJECTED UI SYSTEM ---
const injectStyles = () => {
  if (document.getElementById('amrit-ultimate-v1')) return;
  const style = document.createElement("style");
  style.id = 'amrit-ultimate-v1';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f8fafc; margin: 0; }
    .glass-panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; }
    .btn-action { background: #0891b2; color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.3s all; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-action:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(8, 145, 178, 0.3); }
    .input-glass { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 14px; border-radius: 12px; width: 100%; box-sizing: border-box; margin-bottom: 12px; outline: none; }
    .input-glass:focus { border-color: #0891b2; box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.2); }
    .badge { font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-theory { background: rgba(6, 182, 212, 0.1); color: #06b6d4; border: 1px solid #06b6d4; }
    .badge-prac { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981; }
  `;
  document.head.appendChild(style);
};

const CAMPUS_GEOPENCE = { LAT: 19.7042, LON: 72.7645, RANGE: 0.0008 };

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [classNames, setClassNames] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setClassNames(wb.SheetNames);
    }).catch(() => console.error("Missing students_list.xlsx in public folder."));
  }, []);

  const authenticate = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Access Denied: Invalid Credentials");
    }
  };

  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle at top right, #083344, #020617)'}}>
      <div className="glass-panel" style={{padding:'60px 40px', textAlign:'center', width:'360px'}}>
        <div style={{width:'80px', height:'80px', background:'#0891b2', borderRadius:'24px', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <ShieldCheck size={40} color="white"/>
        </div>
        <h1 style={{margin:0, fontSize:'42px', fontWeight:800, letterSpacing:'-1px'}}>AMRIT</h1>
        <p style={{color:'#94a3b8', marginBottom:'40px', fontWeight:500}}>Engineering Management</p>
        <button onClick={()=>setView('login')} className="btn-action" style={{width:'100%'}}>ENTER PORTAL <ChevronRight/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass-panel" style={{padding:'40px', width:'320px'}}>
        <h2 style={{marginTop:0, fontWeight:800, fontSize:'24px'}}>Login</h2>
        <input id="uid" placeholder="User ID" className="input-glass" />
        <input id="ups" type="password" placeholder="Passcode" className="input-glass" />
        <button onClick={()=>authenticate(document.getElementById('uid').value, document.getElementById('ups').value)} className="btn-action" style={{width:'100%'}}>VERIFY IDENTITY</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel classes={classNames} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- TESTER & DEVELOPER: HOD PANEL WITH FULL ANALYTICS ---
function HODPanel({ classes, setView }) {
  const [activeTab, setActiveTab] = useState('staff'); 
  const [store, setStore] = useState({ staff: [], attendance: [], mapping: [] });
  const [temp, setTemp] = useState({});

  const refreshData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: a } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    const { data: m } = await supabase.from('assignments').select('*');
    setStore({ staff: f || [], attendance: a || [], mapping: m || [] });
  };

  useEffect(() => { refreshData(); }, []);

  const exportData = () => {
    const ws = XLSX.utils.json_to_sheet(store.attendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Report");
    XLSX.writeFile(wb, `Amrit_Master_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getWorkload = (facName) => {
    const logs = store.attendance.filter(l => l.faculty === facName);
    return {
      theory: logs.filter(l => l.type === 'Theory').length,
      prac: logs.filter(l => l.type === 'Practical').length
    };
  };

  return (
    <div style={{display:'flex', minHeight:'100vh'}}>
      {/* Sidebar Nav */}
      <div style={{width:'260px', borderRight:'1px solid rgba(255,255,255,0.05)', padding:'30px', background:'#020617'}}>
        <h2 style={{color:'#0891b2', fontWeight:800, fontSize:'28px', marginBottom:'40px'}}>HOD</h2>
        <nav style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          {[{id:'staff', l:'Staff Workload', i:<Users size={18}/>}, {id:'map', l:'Mapping', i:<Layers size={18}/>}, {id:'log', l:'Master Logs', i:<Database size={18}/>}].map(item => (
            <div key={item.id} onClick={()=>setActiveTab(item.id)} style={{
              padding:'14px 20px', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', fontWeight:600,
              background: activeTab === item.id ? '#0891b2' : 'transparent', color: activeTab === item.id ? 'white' : '#94a3b8'
            }}>{item.i} {item.l}</div>
          ))}
          <button onClick={()=>setView('home')} style={{marginTop:'50px', background:'none', border:'none', color:'#f43f5e', display:'flex', gap:'10px', fontWeight:700, cursor:'pointer'}}><LogOut size={18}/> Logout</button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{flex:1, padding:'40px', overflowY:'auto'}}>
        {activeTab === 'staff' && (
          <div>
            <div className="glass-panel" style={{padding:'24px', marginBottom:'30px'}}>
              <h4 style={{marginTop:0}}>Register Staff</h4>
              <div style={{display:'flex', gap:'10px'}}>
                <input placeholder="Full Name" className="input-glass" onChange={e=>setTemp({...temp, n:e.target.value})}/>
                <input placeholder="ID" className="input-glass" onChange={e=>setTemp({...temp, id:e.target.value})}/>
                <input placeholder="Pass" type="password" className="input-glass" onChange={e=>setTemp({...temp, p:e.target.value})}/>
              </div>
              <button className="btn-action" onClick={async()=>{await supabase.from('faculties').insert([{id:temp.id, name:temp.n, password:temp.p}]); refreshData();}}>ADD FACULTY</button>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
              {store.staff.map(f => {
                const w = getWorkload(f.name);
                return (
                  <div key={f.id} className="glass-panel" style={{padding:'20px', position:'relative'}}>
                    <div style={{fontWeight:700, fontSize:'18px', marginBottom:'15px'}}>{f.name}</div>
                    <div style={{display:'flex', gap:'10px'}}>
                      <span className="badge badge-theory">THEORY: {w.theory}</span>
                      <span className="badge badge-prac">PRACTICAL: {w.prac}</span>
                    </div>
                    <button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); refreshData();}} style={{position:'absolute', top:'20px', right:'20px', background:'none', border:'none', color:'#f43f5e', cursor:'pointer'}}><Trash2 size={18}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="glass-panel" style={{padding:'30px', maxWidth:'500px'}}>
            <h3 style={{marginTop:0}}>Mapping academic load</h3>
            <select className="input-glass" onChange={e=>setTemp({...temp, f:e.target.value})}><option>Select Faculty</option>{store.staff.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select className="input-glass" onChange={e=>setTemp({...temp, c:e.target.value})}><option>Select Class</option>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input placeholder="Subject Name" className="input-glass" onChange={e=>setTemp({...temp, s:e.target.value})}/>
            <button className="btn-action" style={{width:'100%', background:'#a855f7'}} onClick={async()=>{await supabase.from('assignments').insert([{fac_id:temp.f, class_name:temp.c, subject_name:temp.s}]); alert("Mapped Successfully!");}}>SAVE ASSIGNMENT</button>
          </div>
        )}

        {activeTab === 'log' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3 style={{margin:0}}>Historical Attendance Logs</h3>
              <button onClick={exportData} className="btn-action" style={{background:'#1e293b', border:'1px solid #334155'}}><FileSpreadsheet size={18}/> EXPORT MASTER DATA</button>
            </div>
            {store.attendance.map(log => (
              <div key={log.id} className="glass-panel" style={{padding:'15px 25px', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>{log.class} • {log.sub}</div>
                  <div style={{fontSize:'12px', color:'#94a3b8', marginTop:'4px'}}>{log.faculty} • {log.type} • {log.duration}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#10b981', fontWeight:800, fontSize:'18px'}}>{log.present}/{log.total}</div>
                  <div style={{fontSize:'11px', color:'#94a3b8'}}>{log.time_str}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL: GEOLOCATION & GRID LOGIC ---
function FacultyPanel({ user, setView }) {
  const [session, setSession] = useState({ cl:'', sub:'', ty:'Theory', s:'', e:'' });
  const [active, setActive] = useState(false);
  const [roster, setRoster] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myLoad, setMyLoad] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyLoad(res.data || [])); 
  }, [user.id]);

  const beginRoster = () => {
    if(!session.cl || !session.sub) return alert("Missing Selections");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===session.cl.toLowerCase())]);
      setRoster(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const uploadAttendance = () => {
    setIsSyncing(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_GEOPENCE.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_GEOPENCE.LON,2));
      if(dist > CAMPUS_GEOPENCE.RANGE) { setIsSyncing(false); return alert("ERROR: Geofence violation. Please mark attendance from inside the campus."); }
      
      const { data: record } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: session.sub, class: session.cl, type: session.ty, 
        duration: `${session.s}-${session.e}`, present: marked.length, total: roster.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const absentees = roster.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: record.id, student_roll: s.id, class_name: session.cl }));
      if(absentees.length > 0) await supabase.from('absentee_records').insert(absentees);
      
      alert("Cloud Sync Successful!"); setView('home');
    }, () => { setIsSyncing(false); alert("GPS Error: Access required to verify campus location."); });
  };

  if (!active) return (
    <div style={{padding:'30px', maxWidth:'500px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'30px'}}>
        <div><small style={{color:'#94a3b8'}}>Faculty</small><h2 style={{margin:0}}>Prof. {user.name}</h2></div>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#f43f5e'}}><LogOut/></button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px'}}>
        {[...new Set(myLoad.map(l=>l.class_name))].map(c => (
          <div key={c} onClick={()=>setSession({...session, cl:c})} style={{
            padding:'20px', borderRadius:'16px', textAlign:'center', cursor:'pointer', fontWeight:800,
            background: session.cl === c ? '#0891b2' : '#1e293b'
          }}>{c}</div>
        ))}
      </div>

      {session.cl && (
        <div className="glass-panel" style={{padding:'20px'}}>
          <p style={{fontSize:'11px', fontWeight:800, color:'#64748b', marginBottom:'10px'}}>SELECT SUBJECT</p>
          {myLoad.filter(l=>l.class_name===session.cl).map(l => (
            <div key={l.id} onClick={()=>setSession({...session, sub:l.subject_name})} style={{
              padding:'15px', borderRadius:'12px', marginBottom:'8px', textAlign:'center', cursor:'pointer', fontWeight:600,
              background: session.sub === l.subject_name ? '#0891b2' : '#1e293b'
            }}>{l.subject_name}</div>
          ))}
          <select className="input-glass" style={{marginTop:'15px'}} onChange={e=>setSession({...session, ty:e.target.value})}>
            <option value="Theory">Theory Lecture</option>
            <option value="Practical">Practical Session</option>
          </select>
          <button onClick={beginRoster} className="btn-action" style={{width:'100%', marginTop:'10px'}}><Zap size={18}/> START LIVE MARKING</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px', position:'sticky', top:0, background:'#020617', paddingBottom:'10px', zIndex:10}}>
        <button onClick={()=>setActive(false)} style={{background:'#1e293b', color:'white', border:'none', borderRadius:'50%', width:'45px', height:'45px'}}><ArrowLeft size={20}/></button>
        <div style={{textAlign:'center'}}><h3 style={{margin:0}}>{session.cl}</h3><small style={{color:'#64748b'}}>{session.sub}</small></div>
        <div style={{background:'#10b981', padding:'8px 15px', borderRadius:'12px', fontWeight:800}}>{marked.length}/{roster.length}</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'120px'}}>
        {roster.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} style={{
            padding:'18px 5px', borderRadius:'14px', textAlign:'center', fontWeight:800, cursor:'pointer',
            background: marked.includes(s.id)?'#10b981':'#1e293b', border: '1px solid rgba(255,255,255,0.05)'
          }}>{s.id}</div>
        ))}
      </div>
      <button disabled={isSyncing} onClick={uploadAttendance} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px'}} className="btn-action">
        {isSyncing ? "VERIFYING GPS & UPLOADING..." : "FINALIZE & CLOUD SYNC"}
      </button>
    </div>
  );
}

// --- HELPER COMPONENT ---
function ShieldCheck({size, color}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>; }
