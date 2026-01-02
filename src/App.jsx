import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, 
  Download, ShieldCheck, User, Search,
  LayoutDashboard, BookOpen, Fingerprint, GraduationCap, Settings, 
  MapPin, CheckCircle, ChevronRight, Users, BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  // Fetch Excel Sheet Names on Mount
  useEffect(() => {
    fetch('/students_list.xlsx')
      .then(res => res.arrayBuffer())
      .then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      }).catch(e => console.error("Excel Load Error"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid ID/Pass!");
    }
  };

  // --- LOGIN VIEW ---
  if (view === 'login') return (
    <div style={styles.loginWrapper}>
      <div style={styles.loginCard}>
        <div style={styles.logoCircle}><img src="/logo.png" style={{ width: '50px' }} alt="logo" /></div>
        <h1 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '28px' }}>AMRIT</h1>
        <p style={styles.subTitle}>ATTENDANCE SYSTEM</p>
        <div style={{ position: 'relative', width: '100%' }}>
          <User size={18} style={styles.inputIcon} />
          <input id="u" placeholder="Faculty ID" style={styles.input} />
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <Fingerprint size={18} style={styles.inputIcon} />
          <input id="p" type="password" placeholder="Password" style={styles.input} />
        </div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.mainBtn}>
          LOGIN <ShieldCheck size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrapper}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={styles.userIconBox}><User size={18} color="white"/></div>
          <div className="hide-mobile">
            <b style={{fontSize: '14px'}}>{user.name}</b><br/>
            <small style={{color: '#818cf8'}}>{user.role.toUpperCase()}</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> EXIT</button>
      </nav>

      <main style={styles.mainContent}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </main>

      <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none !important; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .manage-grid { grid-template-columns: 1fr !important; }
        }
        button:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [search, setSearch] = useState('');

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*').order('name');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setList({ faculties: facs || [], attendance: att || [] });
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ animation: 'fadeIn 0.5s' }}>
      <div className="stats-grid" style={styles.statsGrid}>
        <div style={styles.statCard}><Users color="#6366f1"/> <div><small>Faculty</small><br/><b>{list.faculties.length}</b></div></div>
        <div style={styles.statCard}><BarChart3 color="#10b981"/> <div><small>Total Logs</small><br/><b>{list.attendance.length}</b></div></div>
      </div>

      <div style={styles.tabBar}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...styles.tabBtn, background: tab === t ? '#6366f1' : 'transparent' }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <input style={styles.input} placeholder="Search Class/Teacher..." onChange={e => setSearch(e.target.value)} />
          {list.attendance.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase())).map(log => (
            <div key={log.id} style={styles.logCard}>
              <div><b>{log.class}</b><br/><small>{log.sub} • {log.faculty}</small></div>
              <div style={{textAlign: 'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'faculties' && list.faculties.map(fac => {
         const t = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Theory Lecture').length;
         const p = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Practical').length;
         return (
          <div key={fac.id} style={styles.logCard}>
            <div><b>{fac.name}</b><br/><small>ID: {fac.id}</small></div>
            <div style={{display:'flex', gap:'10px'}}><div style={styles.miniStat}>T: {t}</div><div style={styles.miniStat}>P: {p}</div></div>
          </div>
         );
      })}

      {tab === 'manage' && (
        <div className="manage-grid" style={styles.manageGrid}>
          <div style={styles.logCard}>
            <h3>Register</h3>
            <input style={styles.input} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} placeholder="ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} placeholder="Pass" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={{ ...styles.mainBtn, height:'45px' }} onClick={async () => { await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); refresh(); alert("Done"); }}>SAVE</button>
          </div>
          <div style={styles.logCard}>
            <h3>Allotment</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.mainBtn, height:'45px', background:'#10b981' }} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked"); }}>LINK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture' });
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyAssigns(res.data || []));
  }, [user.id]);

  useEffect(() => {
    if (sel.class) {
      fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sel.class]);
        setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No'] || ''), name: s['STUDENT NAME'] })).filter(s => s.id));
      });
    }
  }, [sel.class]);

  const submitAtt = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 200) return alert("Outside Campus!");
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, 
        present: present.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Submitted!"); setIsReady(false); setPresent([]);
    }, () => alert("GPS Required"));
  };

  if (!isReady) return (
    <div style={styles.centerCard}>
      <h3>New Session</h3>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <button style={styles.mainBtn} onClick={() => sel.class && sel.sub ? setIsReady(true) : alert("Check Info")}>START</button>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
        <button onClick={()=>setIsReady(false)} style={{background:'none', border:'none', color:'white'}}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{sel.class}</b><br/><small>{sel.sub}</small></div>
      </div>
      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ ...styles.rollBtn, background: present.includes(s.id) ? '#6366f1' : '#1e293b' }}>{s.id}</div>
        ))}
      </div>
      <div style={styles.bottomBar}>
        <button onClick={submitAtt} style={styles.submitBtn}>SUBMIT ({present.length})</button>
      </div>
    </div>
  );
}

// --- STYLES OBJECT ---
const styles = {
  loginWrapper: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', padding: '20px' },
  loginCard: { background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', padding: '40px 30px', borderRadius: '28px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  logoCircle: { background: 'white', display: 'inline-flex', padding: '15px', borderRadius: '22px', marginBottom: '20px' },
  subTitle: { color: '#818cf8', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '35px' },
  input: { width: '100%', padding: '15px 15px 15px 45px', borderRadius: '14px', border: '1px solid #334155', background: '#0f172a', color: 'white', marginBottom: '15px', boxSizing: 'border-box' },
  inputIcon: { position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' },
  mainBtn: { width: '100%', height: '55px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  appWrapper: { minHeight: '100vh', background: '#020617', color: 'white' },
  nav: { background: 'rgba(15, 23, 42, 0.9)', padding: '12px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 },
  userIconBox: { background: '#6366f1', padding: '8px', borderRadius: '10px' },
  logoutBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold' },
  mainContent: { padding: '20px', maxWidth: '1100px', margin: '0 auto' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' },
  statCard: { background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(255,255,255,0.05)' },
  tabBar: { display: 'flex', background: '#0f172a', padding: '5px', borderRadius: '15px', marginBottom: '20px' },
  tabBtn: { flex: 1, border: 'none', color: 'white', padding: '10px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  logCard: { background: 'rgba(30, 41, 59, 0.4)', padding: '18px', borderRadius: '18px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' },
  miniStat: { background: '#1e293b', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' },
  manageGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  centerCard: { background: 'rgba(30, 41, 59, 0.5)', padding: '30px', borderRadius: '24px', maxWidth: '450px', margin: '40px auto' },
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px', paddingBottom: '100px' },
  rollBtn: { height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' },
  bottomBar: { position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' },
  submitBtn: { width: '100%', maxWidth: '500px', height: '55px', background: '#10b981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px' }
};
