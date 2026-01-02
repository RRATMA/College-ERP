import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, 
  Database, Download, ShieldCheck, User, CheckCircle, 
  ChevronRight, Zap, MapPin, Calendar, PlusCircle, BarChart3, Users, Search 
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
  danger: '#f43f5e',
};

const styles = {
  wrapper: {
    minHeight: '100vh', width: '100vw', background: '#0f172a', color: '#f8fafc', 
    fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden',
    backgroundImage: `radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0, transparent 50%)`,
    display: 'flex', flexDirection: 'column'
  },
  nav: {
    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', padding: '15px 5%',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky', top: 0, zIndex: 100
  },
  card: {
    background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '25px',
    border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px', width: '100%', boxSizing: 'border-box'
  },
  input: {
    width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(15, 23, 42, 0.5)', color: 'white', fontSize: '15px', marginBottom: '15px', outline: 'none', boxSizing: 'border-box'
  },
  btn: {
    padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s'
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelClasses(wb.SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.wrapper, justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
       <div style={{ ...styles.card, maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ background: 'white', display: 'inline-block', padding: '12px', borderRadius: '20px', marginBottom: '15px' }}>
            <img src="/logo.png" style={{ width: '60px' }} alt="logo" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '5px' }}>AMRIT</h2>
          <p style={{ color: '#6366f1', fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', marginBottom: '30px' }}>ATTENDANCE SYSTEM</p>
          <input id="u" style={styles.input} placeholder="Faculty ID" />
          <input id="p" type="password" style={styles.input} placeholder="Password" />
          <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center', height: '52px' }} 
            onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
            SIGN IN <ShieldCheck size={18}/>
          </button>
       </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: theme.primary, padding: '8px', borderRadius: '10px' }}><User size={18} color="white"/></div>
          <div><b style={{fontSize: '14px'}}>{user.name}</b><br/><small style={{color: '#a855f7'}}>{user.role.toUpperCase()}</small></div>
        </div>
        <button onClick={() => setView('login')} style={{ ...styles.btn, background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}><LogOut size={14}/> LOGOUT</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL: MANAGEMENT & LOGS ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [], assignments: [] });
  const [search, setSearch] = useState('');
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editMode, setEditMode] = useState(false);

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*').order('name');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: asgn } = await supabase.from('assignments').select('*');
    setList({ faculties: facs || [], attendance: att || [], assignments: asgn || [] });
  };

  useEffect(() => { refresh(); }, []);

  const filteredLogs = list.attendance.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ ...styles.card, margin: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Users color="#6366f1"/> <div><small>Faculty</small><br/><b>{list.faculties.length}</b></div>
        </div>
        <div style={{ ...styles.card, margin: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BarChart3 color="#10b981"/> <div><small>Total Sessions</small><br/><b>{list.attendance.length}</b></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '15px' }}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={{ flex: 1, ...styles.btn, background: tab === t ? theme.primary : 'transparent', color: 'white', justifyContent: 'center' }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input style={{ ...styles.input, marginBottom: 0 }} placeholder="Search..." onChange={e => setSearch(e.target.value)} />
            <button style={{ ...styles.btn, background: theme.accent, color: 'white' }} onClick={() => {
              const ws = XLSX.utils.json_to_sheet(list.attendance);
              const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
              XLSX.writeFile(wb, "AMRIT_Attendance.xlsx");
            }}><Download/></button>
          </div>
          {filteredLogs.map(log => (
            <div key={log.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between' }}>
              <div><b>{log.class}</b><br/><small>{log.sub} | {log.faculty}</small></div>
              <div style={{textAlign: 'right'}}><b style={{color: theme.accent}}>{log.present}/{log.total}</b><br/><small>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'faculties' && (
        list.faculties.map(fac => {
          const tCount = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Theory Lecture').length;
          const pCount = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Practical').length;
          return (
            <div key={fac.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><b>{fac.name}</b><br/><small>Theory: {tCount} | Practical: {pCount}</small></div>
              <div style={{display:'flex', gap:'5px'}}>
                <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{padding:'10px', borderRadius:'10px', border:'none', background:'rgba(99,102,241,0.1)', color:'#6366f1'}}><Edit3 size={16}/></button>
                <button onClick={async () => { if(window.confirm("Delete?")) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{padding:'10px', borderRadius:'10px', border:'none', background:'rgba(244,63,94,0.1)', color:'#f43f5e'}}><Trash2 size={16}/></button>
              </div>
            </div>
          );
        })
      )}

      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={styles.card}>
            <h3>{editMode ? 'Update Faculty' : 'Add Faculty'}</h3>
            <input style={styles.input} value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="Name" />
            <input style={styles.input} value={f.id} disabled={editMode} onChange={e => setF({...f, id: e.target.value})} placeholder="ID" />
            <input style={styles.input} value={f.pass} onChange={e => setF({...f, pass: e.target.value})} placeholder="Password" />
            <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
              else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
              setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); setTab('faculties');
            }}>SAVE RECORD</button>
          </div>
          <div style={styles.card}>
            <h3>Link Workload</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]);
              alert("Linked!"); refresh();
            }}>ALLOT SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: ATTENDANCE & GPS ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const submitAttendance = async () => {
    if(present.length === 0) return alert("Select students!");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 200) { setLoading(false); return alert("Outside Campus!"); }
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, 
        start_time: sel.startTime, end_time: sel.endTime, present: present.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Success!"); setIsReady(false); setPresent([]); setLoading(false);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!isReady) return (
    <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto' }}>
      <h3>Initialize Session</h3>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <select style={styles.input} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Check inputs")}>START ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%', color: 'white' }}><ArrowLeft/></button>
        <div style={{ textAlign: 'right' }}><b>{sel.class}</b><br/><small>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ padding: '16px 0', background: present.includes(s.id) ? theme.primary : 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '15px', textAlign: 'center', fontWeight: '900', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>{s.id}</div>
        ))}
      </div>
      <button disabled={loading} style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', marginTop: '30px', justifyContent: 'center' }} onClick={submitAttendance}>{loading ? "Verifying GPS..." : `SUBMIT (${present.length})`}</button>
    </div>
  );
          }
