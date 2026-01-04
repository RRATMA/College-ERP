import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Zap, Database, UserCheck, 
  ChevronRight, FileSpreadsheet, Download, Users, Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- GLOBAL STYLES ---
const injectStyles = () => {
  if (document.getElementById('amrit-master-style')) return;
  const style = document.createElement("style");
  style.id = 'amrit-master-style';
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; color: #f1f5f9; margin: 0; }
    .glass { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; }
    .btn-cyan { background: #0891b2; color: white; border: none; padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
    .btn-cyan:hover { background: #0e7490; transform: translateY(-1px); }
    .input-box { background: #0f172a; border: 1px solid #1e293b; color: white; padding: 14px; border-radius: 10px; width: 100%; box-sizing: border-box; margin-bottom: 12px; outline: none; }
    .tab-active { background: #0891b2 !important; color: white; }
    .table-container { width: 100%; overflow-x: auto; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; background: rgba(30, 41, 59, 0.2); border-radius: 12px; overflow: hidden; }
    th { text-align: left; padding: 15px; background: rgba(255,255,255,0.05); color: #64748b; font-size: 12px; text-transform: uppercase; }
    td { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; border: 1px solid; }
    .badge-lec { color: #06b6d4; border-color: #06b6d4; background: rgba(6, 182, 212, 0.1); }
    .badge-prac { color: #10b981; border-color: #10b981; background: rgba(16, 185, 129, 0.1); }
  `;
  document.head.appendChild(style);
};

const CAMPUS = { LAT: 19.7042, LON: 72.7645, RANGE: 0.0008 };

export default function AmritERP() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setSheets(wb.SheetNames);
    }).catch(() => console.error("Excel file missing"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  if (view === 'home') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'50px', textAlign:'center', width:'320px'}}>
        <h1 style={{margin:0, fontSize:'40px', fontWeight:800, color:'#06b6d4'}}>AMRIT</h1>
        <p style={{color:'#64748b', marginBottom:'40px'}}>Engineering Portal</p>
        <button onClick={()=>setView('login')} className="btn-cyan" style={{width:'100%'}}>SIGN IN <ChevronRight/></button>
      </div>
    </div>
  );

  if (view === 'login') return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass" style={{padding:'35px', width:'300px'}}>
        <h2 style={{marginTop:0}}>Portal Access</h2>
        <input id="u" placeholder="User ID" className="input-box" />
        <input id="p" type="password" placeholder="Passcode" className="input-box" />
        <button onClick={()=>handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="btn-cyan" style={{width:'100%'}}>VERIFY</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />;
}

// --- HOD PANEL (WITH MASTER DOWNLOAD & WORKLOAD) ---
function HODPanel({ sheets, setView }) {
  const [tab, setTab] = useState('staff'); 
  const [db, setDb] = useState({ staff: [], logs: [] });
  const [form, setForm] = useState({});

  const sync = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', {ascending:false});
    setDb({ staff: f || [], logs: l || [] });
  };

  useEffect(() => { sync(); }, []);

  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MasterLogs");
    XLSX.writeFile(wb, "Amrit_Master_Sheet.xlsx");
  };

  const calculateCounts = (name) => {
    const sessions = db.logs.filter(l => l.faculty === name);
    return {
      theory: sessions.filter(s => s.type === 'Theory').length,
      practical: sessions.filter(s => s.type === 'Practical').length
    };
  };

  return (
    <div style={{padding:'20px', maxWidth:'1000px', margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px'}}>
        <h3>HOD Command Center</h3>
        <button onClick={()=>setView('home')} style={{background:'none', border:'none', color:'#f43f5e', cursor:'pointer'}}><LogOut/></button>
      </div>

      <div style={{display:'flex', gap:'10px', marginBottom:'30px'}}>
        <button onClick={()=>setTab('staff')} className={tab==='staff'?'tab-active':''} style={{padding:'10px 20px', borderRadius:'10px', border:'none', background:'#1e293b', color:'white', fontWeight:700}}>STAFF WORKLOAD</button>
        <button onClick={()=>setTab('logs')} className={tab==='logs'?'tab-active':''} style={{padding:'10px 20px', borderRadius:'10px', border:'none', background:'#1e293b', color:'white', fontWeight:700}}>MASTER LOGS</button>
      </div>

      {tab === 'staff' && (
        <div className="glass" style={{padding:'20px'}}>
          <h4 style={{marginTop:0}}>Faculty Load Tracker</h4>
          <table>
            <thead>
              <tr><th>Faculty</th><th>Theory Lectures</th><th>Practicals</th><th>Action</th></tr>
            </thead>
            <tbody>
              {db.staff.map(f => {
                const w = calculateCounts(f.name);
                return (
                  <tr key={f.id}>
                    <td><b>{f.name}</b></td>
                    <td><span className="badge badge-lec">{w.theory} Conducted</span></td>
                    <td><span className="badge badge-prac">{w.practical} Conducted</span></td>
                    <td><button onClick={async()=>{await supabase.from('faculties').delete().eq('id', f.id); sync();}} style={{color:'#f43f5e', background:'none', border:'none'}}><Trash2 size={16}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{marginTop:'30px', borderTop:'1px solid #1e293b', paddingTop:'20px'}}>
            <p style={{fontSize:'12px', fontWeight:800, color:'#64748b'}}>+ REGISTER NEW STAFF</p>
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="Name" className="input-box" onChange={e=>setForm({...form, n:e.target.value})}/>
              <input placeholder="ID" className="input-box" onChange={e=>setForm({...form, id:e.target.value})}/>
              <button className="btn-cyan" onClick={async()=>{await supabase.from('faculties').insert([{id:form.id, name:form.n, password:'123'}]); sync();}}>ADD</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <button onClick={downloadMaster} className="btn-cyan" style={{marginBottom:'20px', background:'#1e293b', border:'1px solid #334155'}}>
            <FileSpreadsheet size={18}/> DOWNLOAD MASTER SHEET (.XLSX)
          </button>
          <div className="glass">
            {db.logs.map(log => (
              <div key={log.id} style={{padding:'15px', borderBottom:'1px solid #0f172a', display:'flex', justifyContent:'space-between'}}>
                <div><b>{log.class} - {log.sub}</b><br/><small>{log.faculty} • {log.type}</small></div>
                <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (WITH SESSION TYPE LOGIC) ---
function FacultyPanel({ user, setView }) {
  const [session, setSession] = useState({ cl:'', sub:'', ty:'Theory' });
  const [active, setActive] = useState(false);
  const [roster, setRoster] = useState([]);
  const [marked, setMarked] = useState([]);

  const start = () => {
    if(!session.cl || !session.sub) return alert("Fill all details");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===session.cl.toLowerCase())]);
      setRoster(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const sync = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS.LAT,2)+Math.pow(pos.coords.longitude-CAMPUS.LON,2));
      if(d > CAMPUS.RANGE) return alert("Error: Out of Campus Range");
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: session.sub, class: session.cl, type: session.ty, 
        present: marked.length, total: roster.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);

      alert("Synced to Server!"); setView('home');
    }, () => alert("GPS Permission Denied"));
  };

  if (!active) return (
    <div style={{padding:'20px', maxWidth:'400px', margin:'0 auto'}}>
      <h3>Faculty: {user.name}</h3>
      <input placeholder="Class (e.g. FE-1)" className="input-box" onChange={e=>setSession({...session, cl:e.target.value})}/>
      <input placeholder="Subject" className="input-box" onChange={e=>setSession({...session, sub:e.target.value})}/>
      <select className="input-box" onChange={e=>setSession({...session, ty:e.target.value})}>
        <option value="Theory">Theory Lecture</option>
        <option value="Practical">Practical Session</option>
      </select>
      <button onClick={start} className="btn-cyan" style={{width:'100%'}}>START MARKING</button>
    </div>
  );

  return (
    <div style={{padding:'20px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={{background:'none', border:'none', color:'white'}}><ArrowLeft/></button>
        <h3>{session.cl} Marking</h3>
        <span style={{background:'#10b981', padding:'5px 12px', borderRadius:'10px'}}>{marked.length}/{roster.length}</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'100px'}}>
        {roster.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
          style={{padding:'18px 5px', textAlign:'center', borderRadius:'12px', background: marked.includes(s.id)?'#10b981':'#1e293b', fontWeight:800}}>{s.id}</div>
        ))}
      </div>
      <button onClick={sync} style={{position:'fixed', bottom:'20px', left:'20px', right:'20px'}} className="btn-cyan">SUBMIT ATTENDANCE</button>
    </div>
  );
                                                             }
