import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, 
  Database, Download, ShieldCheck, User, CheckCircle, 
  ChevronRight, Zap, MapPin, Calendar, PlusCircle, BarChart3 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const theme = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  dark: '#0f172a',
  glass: 'rgba(30, 41, 59, 0.7)',
  accent: '#10b981',
  danger: '#f43f5e'
};

const styles = {
  wrapper: {
    minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif",
    backgroundImage: `radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0, transparent 50%)`
  },
  nav: {
    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', padding: '15px 5%',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky', top: 0, zIndex: 100
  },
  card: {
    background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '25px',
    border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px'
  },
  input: {
    width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(15, 23, 42, 0.5)', color: 'white', fontSize: '15px', marginBottom: '15px', outline: 'none'
  },
  btn: {
    padding: '14px 25px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', transition: '0.3s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  // Load classes from Excel on Mount
  useEffect(() => {
    fetch('/students_list.xlsx')
      .then(res => res.arrayBuffer())
      .then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      }).catch(err => console.error("Excel load error:", err));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data, error } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) {
        setUser({ ...data, role: 'faculty' });
        setView('faculty');
      } else {
        alert("Invalid ID or Password!");
      }
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.wrapper, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ ...styles.card, maxWidth: '420px', width: '100%', textAlign: 'center' }}>
        <div style={{ background: 'white', display: 'inline-block', padding: '12px', borderRadius: '24px', marginBottom: '20px' }}>
          <img src="/logo.png" style={{ width: '80px' }} alt="logo" />
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1.3, marginBottom: '5px' }}>
          Atma Malik Institute of Technology and Research
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '2px', marginBottom: '30px' }}>ATTENDANCE ERP SYSTEM</p>
        
        <div style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '12px', fontWeight: '800', color: '#6366f1', marginLeft: '5px' }}>FACULTY ID</label>
          <input id="u" style={styles.input} placeholder="Enter your ID" />
          <label style={{ fontSize: '12px', fontWeight: '800', color: '#6366f1', marginLeft: '5px' }}>PASSWORD</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>
        
        <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', marginTop: '10px' }} 
                onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
          SIGN IN TO PORTAL
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: theme.primary, padding: '8px', borderRadius: '10px' }}><User size={18} color="white"/></div>
          <div style={{ lineHeight: 1 }}>
            <b style={{ fontSize: '15px' }}>{user.name}</b><br/>
            <small style={{ color: '#6366f1', fontWeight: '800', fontSize: '10px' }}>{user.role.toUpperCase()}</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ ...styles.btn, background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px 15px', fontSize: '11px' }}>
          <LogOut size={14}/> LOGOUT
        </button>
      </nav>

      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- FULL HOD PANEL (EVERYTHING INCLUDED) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editMode, setEditMode] = useState(false);

  const refreshData = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: stats } = await supabase.from('faculty_stats').select('*'); // Calculated from SQL View
    setList({ faculties: facs || [], attendance: att || [], stats: stats || [] });
  };

  useEffect(() => { refreshData(); }, []);

  const downloadMasterReport = () => {
    const ws = XLSX.utils.json_to_sheet(list.attendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceData");
    XLSX.writeFile(wb, "AMRIT_Master_Attendance_Report.xlsx");
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
        <button onClick={() => {setTab('logs'); setEditMode(false);}} style={{ ...styles.btn, background: tab === 'logs' ? theme.primary : 'rgba(255,255,255,0.05)', color: 'white' }}>
          <Database size={16}/> LIVE LOGS
        </button>
        <button onClick={() => {setTab('list'); setEditMode(false);}} style={{ ...styles.btn, background: tab === 'list' ? theme.primary : 'rgba(255,255,255,0.05)', color: 'white' }}>
          <BarChart3 size={16}/> FACULTY STATS
        </button>
        <button onClick={() => {setTab('manage'); setEditMode(false);}} style={{ ...styles.btn, background: tab === 'manage' ? theme.primary : 'rgba(255,255,255,0.05)', color: 'white' }}>
          <PlusCircle size={16}/> MANAGEMENT
        </button>
      </div>

      {tab === 'logs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Attendance Archive</h3>
            <button style={{ ...styles.btn, background: theme.accent, color: 'white', fontSize: '12px' }} onClick={downloadMasterReport}>
              <Download size={14}/> EXCEL DOWNLOAD
            </button>
          </div>
          {list.attendance.map(r => (
            <div key={r.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '10px' }}>
                <b style={{ fontSize: '18px' }}>{r.class}</b>
                <span style={{ color: theme.accent, fontWeight: '900' }}>{r.present}/{r.total}</span>
              </div>
              <div style={{ fontSize: '14px' }}><b>Sub:</b> {r.sub}</div>
              <div style={{ fontSize: '14px' }}><b>Fac:</b> {r.faculty}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>{r.time_str} • {r.type}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'list' && list.faculties.map(fac => {
        const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
        return (
          <div key={fac.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b style={{ fontSize: '17px' }}>{fac.name}</b>
              <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 'bold', marginTop: '4px' }}>
                ID: {fac.id} | Theory: {s.theory_count} | Practical: {s.practical_count}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', padding: '10px', borderRadius: '12px', color: '#6366f1' }}><Edit3 size={18}/></button>
              <button onClick={async () => { if(window.confirm(`Delete ${fac.name}?`)) { await supabase.from('faculties').delete().eq('id', fac.id); refreshData(); } }} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', padding: '10px', borderRadius: '12px', color: theme.danger }}><Trash2 size={18}/></button>
            </div>
          </div>
        ))}

      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div style={styles.card}>
            <h3>{editMode ? 'Update Faculty' : 'Register Faculty'}</h3>
            <input style={styles.input} value={f.name} placeholder="Faculty Full Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} value={f.id} placeholder="Faculty ID (Unique)" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} value={f.pass} placeholder="Login Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%' }} onClick={async () => {
              if(!f.name || !f.id || !f.pass) return alert("Fill all fields!");
              if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
              else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
              setF({name:'', id:'', pass:''}); setEditMode(false); refreshData(); setTab('list');
            }}>{editMode ? 'SAVE CHANGES' : 'CREATE ACCOUNT'}</button>
          </div>

          <div style={styles.card}>
            <h3>Assign Workload</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}>
              <option>Select Faculty</option>
              {list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}>
              <option>Select Class</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Subject (e.g. Java Programming)" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%' }} onClick={async () => {
              if(!f.sFac || !f.sClass || !f.sSub) return alert("Complete the link details!");
              await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]);
              alert("Subject Assigned Successfully!");
            }}>LINK SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FULL FACULTY PANEL (EVERYTHING INCLUDED) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id)
      .then(res => setMyAssigns(res.data || []));
  }, [user.id]);

  useEffect(() => {
    if (sel.class) {
      fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sel.class]);
        setStudents(data.map(s => ({ 
          id: String(s['ROLL NO'] || s['Roll No'] || ''), 
          name: s['STUDENT NAME'] 
        })).filter(s => s.id));
      });
    }
  }, [sel.class]);

  const finalizeAttendance = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      if (dist > 200) {
        setLoading(false);
        return alert("Access Denied: You must be inside the college campus to submit attendance.");
      }

      const { error } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, 
        type: sel.type, start_time: sel.startTime, end_time: sel.endTime, 
        present: present.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);

      if(!error) {
        alert("Success: Attendance has been recorded.");
        setIsReady(false);
      } else {
        alert("Error: " + error.message);
      }
      setLoading(false);
    }, () => {
      setLoading(false);
      alert("GPS Error: Please enable location services.");
    });
  };

  if (!isReady) return (
    <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Calendar color="#6366f1"/> Schedule Session</h3>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}>
        <option value="">Select Class</option>
        {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}>
        <option value="">Select Subject</option>
        {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
      </select>
      <select style={styles.input} onChange={e => setSel({...sel, type: e.target.value})}>
        <option>Theory Lecture</option>
        <option>Practical</option>
      </select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%' }} 
              onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Please complete the form")}>
        INITIALIZE ROLL CALL
      </button>
    </div>
  );

  return (
    <div style={{ ...styles.card, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '50%', color: 'white' }}>
          <ArrowLeft size={20}/>
        </button>
        <div style={{ textAlign: 'right' }}>
          <b style={{ fontSize: '20px' }}>{sel.class}</b><br/>
          <small style={{ color: '#6366f1', fontWeight: '800' }}>{sel.sub.toUpperCase()}</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ 
                 padding: '18px 0', 
                 background: present.includes(s.id) ? theme.primary : 'rgba(255,255,255,0.05)', 
                 color: 'white', borderRadius: '15px', textAlign: 'center', fontWeight: '900', 
                 border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.2s'
               }}>
            {s.id}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}>Present Students: </span>
          <b style={{ fontSize: '20px', color: theme.accent }}>{present.length}</b>
          <span style={{ fontSize: '14px', color: '#94a3b8' }}> / {students.length}</span>
        </div>
        <button disabled={loading} style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%' }} onClick={finalizeAttendance}>
          {loading ? <Clock className="animate-spin" size={18}/> : <MapPin size={18}/>}
          {loading ? "VERIFYING GPS..." : "SUBMIT ATTENDANCE"}
        </button>
      </div>
    </div>
  );
      }
