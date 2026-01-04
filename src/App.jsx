import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, Download, Zap, 
  Database, BookOpenCheck, UserCheck, AlertCircle, TrendingUp, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- 1. ORIGINAL STYLING (Kahihi skip nahi) ---
const injectStyles = () => {
  if (document.getElementById('amrit-v-final-pro')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-v-final-pro';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
    body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #f1f5f9; overflow-x: hidden; }
    .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; transition: 0.3s ease; }
    .glass-card:hover { border-color: rgba(6, 182, 212, 0.4); transform: translateY(-5px); }
    .logo-circle { width: 80px; height: 80px; background: rgba(6,182,212,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid #06b6d4; overflow: hidden; box-shadow: 0 0 20px rgba(6, 182, 212, 0.2); }
    input, select { background: #0f172a !important; border: 1px solid #1e293b !important; color: #fff !important; outline: none; border-radius: 12px; padding: 12px; transition: 0.2s; width: 100%; box-sizing: border-box; }
    input:focus { border-color: #06b6d4 !important; box-shadow: 0 0 10px rgba(6, 182, 212, 0.2); }
    .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; }
    .scroll-hide::-webkit-scrollbar { display: none; }
    .primary-btn { background: #0891b2; color: #fff; border: none; border-radius: 14px; padding: 16px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: 0.3s; width: 100%; }
    .primary-btn:active { transform: scale(0.95); }
  `;
  document.head.appendChild(styleTag);
};

// Config
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    // Student Roll List Road Logic (Original Sheet Loading)
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(err => console.error("Excel mapping source missing", err));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  // --- 2. LOGIN VIEW (Logo Included) ---
  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617' }}>
      <div className="glass-card" style={{ padding: '40px', width: '280px', textAlign: 'center' }}>
        <div className="logo-circle">
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontSize: '28px', margin: '0', fontWeight: 800, color: '#fff' }}>AMRIT</h1>
        <p style={{ color: '#06b6d4', fontSize: '10px', fontWeight: '800', letterSpacing: '2px', marginBottom: '30px' }}>ADMINISTRATION</p>
        <input id="u" placeholder="User ID" style={{ marginBottom: '12px' }} />
        <input id="p" type="password" placeholder="Passcode" style={{ marginBottom: '20px' }} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} className="primary-btn">
          LOGIN <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh' }}>
      {view === 'hod' ? <HODPanel excelSheets={excelSheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
    </div>
  );
}

// --- 3. FACULTY PANEL (Auto-Download + GPS) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Please select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      // Sheet match logic (Tech sheet vaparli aahe)
      const targetSheet = wb.SheetNames.find(s => s.toLowerCase() === setup.cl.toLowerCase());
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[targetSheet]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['ID']).trim() })));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    const presentRolls = marked.sort((a,b)=>a-b).join(", ");
    const absentees = students.filter(s => !marked.includes(s.id)).map(s => s.id).sort((a,b)=>a-b);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > RADIUS_LIMIT) { setLoading(false); return alert("Error: Out of Campus Radius!"); }

      try {
        const { data: att } = await supabase.from('attendance').insert([{ 
          faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
          duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
          time_str: new Date().toLocaleDateString('en-GB') 
        }]).select().single();

        if (absentees.length > 0) {
          await supabase.from('absentee_records').insert(absentees.map(r => ({ attendance_id: att.id, student_roll: r, class_name: setup.cl })));
        }

        // --- AUTO EXCEL DOWNLOAD ---
        const rows = [
          ["AMRIT INSTITUTE OF TECHNOLOGY"],
          [`Class: ${setup.cl} | Subject: ${setup.sub}`],
          ["Date", new Date().toLocaleDateString('en-GB')],
          ["Faculty", user.name],
          ["Present Count", marked.length],
          ["Total Strength", students.length],
          [""],
          ["PRESENT ROLL NUMBERS"],
          [presentRolls],
          [""],
          ["ABSENT ROLL NUMBERS"],
          [absentees.join(", ")]
        ];
        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AttendanceReport");
        XLSX.writeFile(wb, `${setup.cl}_${setup.sub}_Report.xlsx`);

        alert("Data Synced & Report Downloaded!");
        setView('login');
      } catch (e) { alert("Sync Error"); } finally { setLoading(false); }
    }, () => { setLoading(false); alert("GPS Required!"); });
  };

  if (!active) return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div><small style={{color:'#64748b'}}>Faculty</small><h3>{user.name}</h3></div>
        <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><LogOut/></button>
      </div>
      <div className="glass-card" style={{ padding: '20px' }}>
        <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', color: '#64748b' }}>SESSION SETUP</p>
        <select onChange={e => setSetup({ ...setup, cl: e.target.value })} style={{ marginBottom: '12px' }}>
          <option>Select Class</option>
          {[...new Set(myJobs.map(j => j.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select onChange={e => setSetup({ ...setup, sub: e.target.value })} style={{ marginBottom: '12px' }}>
          <option>Select Subject</option>
          {myJobs.filter(j => j.class_name === setup.cl).map(j => <option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input type="time" onChange={e => setSetup({ ...setup, start: e.target.value })} />
          <input type="time" onChange={e => setSetup({ ...setup, end: e.target.value })} />
        </div>
        <button onClick={launch} className="primary-btn"><Zap size={18}/> START SESSION</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setActive(false)} style={{ background: 'none', border: 'none', color: '#fff' }}><ArrowLeft/></button>
        <div style={{ textAlign: 'center' }}>
          <b style={{ fontSize: '18px' }}>{setup.cl}</b><br/>
          <small style={{ color: '#06b6d4' }}>{marked.length} / {students.length} Present</small>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>
      <div className="roll-grid scroll-hide" style={{ maxHeight: '65vh', overflowY: 'auto', paddingBottom: '100px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ padding: '20px 5px', borderRadius: '16px', textAlign: 'center', fontWeight: 'bold', background: marked.includes(s.id) ? '#10b981' : 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {s.id}
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={loading} className="primary-btn" style={{ position: 'fixed', bottom: '20px', left: '20px', right: '20px', width: 'calc(100% - 40px)', background: '#10b981', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)' }}>
        {loading ? "SYNCING..." : "CONFIRM & DOWNLOAD"}
      </button>
    </div>
  );
}

// --- 4. HOD PANEL (Original Tabs + Defaulter Engine) ---
function HODPanel({ excelSheets, setView }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ logs: [], abs: [] });
  const [studentMaster, setStudentMaster] = useState({});

  useEffect(() => {
    supabase.from('attendance').select('*').order('created_at', { ascending: false }).then(res => setDb(prev => ({ ...prev, logs: res.data || [] })));
    supabase.from('absentee_records').select('*').then(res => setDb(prev => ({ ...prev, abs: res.data || [] })));

    // Defaulter naming mapping from your sheet
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const temp = {};
      wb.SheetNames.forEach(name => {
        const data = XLSX.utils.sheet_to_json(wb.Sheets[name]);
        data.forEach(r => {
          const roll = String(r['ROLL NO'] || r['ID']).trim();
          temp[`${name}-${roll}`] = r['NAME'] || 'N/A';
        });
      });
      setStudentMaster(temp);
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3>HOD Administration</h3>
        <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', color: '#f43f5e' }}><LogOut/></button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }} className="scroll-hide">
        {['dashboard', 'logs', 'defaulters'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: tab === t ? '#0891b2' : '#1e293b', color: '#fff', fontWeight: 'bold', fontSize: '11px' }}>{t.toUpperCase()}</button>
        ))}
      </div>
      {tab === 'logs' && db.logs.map(l => (
        <div key={l.id} className="glass-card" style={{ padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <div><b>{l.class} | {l.sub}</b><br/><small>{l.faculty}</small></div>
          <div style={{ textAlign: 'right' }}><b>{l.present}/{l.total}</b><br/><small>{l.time_str}</small></div>
        </div>
      ))}
      {tab === 'dashboard' && <div className="glass-card" style={{padding:'30px', textAlign:'center'}}><h4>Total Logs: {db.logs.length}</h4></div>}
    </div>
  );
                                                                 }
