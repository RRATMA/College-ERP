import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, 
  Database, Download, ShieldCheck, User, CheckCircle, 
  ChevronRight, Zap, MapPin, Calendar, PlusCircle, BarChart3, Users, Search,
  LayoutDashboard, BookOpen, Fingerprint, GraduationCap, Settings
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration & High-End Theme ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const theme = {
  primary: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  accent: '#10b981', // Emerald Green
  danger: '#ef4444', // Rose Red
  bg: '#020617',     // Deep Space Blue
  card: 'rgba(30, 41, 59, 0.5)', 
  border: 'rgba(255, 255, 255, 0.08)',
  textMain: '#f8fafc',
  textMuted: '#94a3b8'
};

const styles = {
  wrapper: {
    minHeight: '100vh', width: '100vw', background: theme.bg, color: theme.textMain, 
    fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden',
    backgroundImage: `radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.15) 0, transparent 40%), radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.15) 0, transparent 40%)`,
    display: 'flex', flexDirection: 'column'
  },
  nav: {
    background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)', padding: '15px 5%',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100
  },
  card: {
    background: theme.card, backdropFilter: 'blur(16px)', borderRadius: '28px', padding: '28px',
    border: `1px solid ${theme.border}`, marginBottom: '20px', width: '100%', boxSizing: 'border-box',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
  },
  input: {
    width: '100%', padding: '15px 20px', borderRadius: '16px', border: `1px solid ${theme.border}`,
    background: 'rgba(15, 23, 42, 0.6)', color: 'white', fontSize: '15px', marginBottom: '18px', 
    outline: 'none', transition: '0.3s border'
  },
  btn: {
    padding: '14px 24px', borderRadius: '16px', border: 'none', fontWeight: '700', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '10px', transition: '0.3s transform, 0.3s opacity',
    fontSize: '15px'
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
      else alert("Authentication Failed!");
    }
  };

  // --- HOME / LOGIN UI (PIMPED UP) ---
  if (view === 'login') return (
    <div style={{ ...styles.wrapper, justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
       <div style={{ ...styles.card, maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ background: 'white', display: 'inline-block', padding: '15px', borderRadius: '24px', marginBottom: '20px', boxShadow: '0 0 30px rgba(79, 70, 229, 0.3)' }}>
            <img src="/logo.png" style={{ width: '65px' }} alt="logo" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-1.5px', background: theme.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AMRIT</h1>
          <p style={{ color: theme.textMuted, fontSize: '12px', fontWeight: '700', letterSpacing: '2px', marginBottom: '35px' }}>ATTENDANCE SYSTEM</p>
          
          <div style={{ position: 'relative' }}>
             <User size={18} style={{ position: 'absolute', left: '18px', top: '16px', color: theme.textMuted }} />
             <input id="u" style={{ ...styles.input, paddingLeft: '50px' }} placeholder="Faculty ID" />
          </div>
          <div style={{ position: 'relative' }}>
             <Fingerprint size={18} style={{ position: 'absolute', left: '18px', top: '16px', color: theme.textMuted }} />
             <input id="p" type="password" style={{ ...styles.input, paddingLeft: '50px' }} placeholder="Password" />
          </div>
          
          <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center', marginTop: '10px' }} 
            onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
            SECURE ACCESS <ShieldCheck size={18}/>
          </button>
       </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: theme.primary, padding: '10px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <User size={20} color="white"/>
          </div>
          <div><b style={{fontSize: '15px'}}>{user.name}</b><br/><small style={{color: '#818cf8', fontWeight:'700'}}>{user.role.toUpperCase()}</small></div>
        </div>
        <button onClick={() => setView('login')} style={{ ...styles.btn, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px 16px' }}>
          <LogOut size={16}/> 
          <span className="hide-mobile">LOGOUT</span>
        </button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (ICON & COLOR UPDATE) ---
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
    <div style={{ animation: 'fadeIn 0.6s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ ...styles.card, margin: 0, padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '14px', borderRadius: '18px' }}><Users color="#6366f1" size={28}/></div>
          <div><p style={{color: theme.textMuted, fontSize:'13px', margin:0}}>Total Faculty</p><b style={{fontSize:'26px'}}>{list.faculties.length}</b></div>
        </div>
        <div style={{ ...styles.card, margin: 0, padding: '25px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '14px', borderRadius: '18px' }}><BarChart3 color="#10b981" size={28}/></div>
          <div><p style={{color: theme.textMuted, fontSize:'13px', margin:0}}>Total Sessions</p><b style={{fontSize:'26px'}}>{list.attendance.length}</b></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '20px' }}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} 
            style={{ flex: 1, ...styles.btn, background: tab === t ? theme.primary : 'transparent', color: 'white', justifyContent: 'center' }}>
            {t === 'logs' && <LayoutDashboard size={18}/>}
            {t === 'faculties' && <GraduationCap size={18}/>}
            {t === 'manage' && <Settings size={18}/>}
            <span style={{fontSize: '12px'}}>{t.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '18px', top: '16px', color: theme.textMuted }} />
              <input style={{ ...styles.input, paddingLeft: '50px', marginBottom: 0 }} placeholder="Search Class or Teacher..." onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={{ ...styles.btn, background: theme.accent, color: 'white' }} onClick={() => {
                const ws = XLSX.utils.json_to_sheet(list.attendance);
                const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "AttendanceLogs");
                XLSX.writeFile(wb, "Amrit_Attendance_Report.xlsx");
            }}><Download size={20}/></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {filteredLogs.map(log => (
              <div key={log.id} style={{ ...styles.card, margin: 0, transition: '0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <b style={{ fontSize: '20px', letterSpacing: '-0.5px' }}>{log.class}</b>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: theme.accent, padding: '4px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '14px' }}>{log.present}/{log.total}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textMuted, fontSize: '14px' }}>
                  <BookOpen size={14}/> {log.sub}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textMuted, fontSize: '14px', marginTop: '4px' }}>
                  <User size={14}/> {log.faculty}
                </div>
                <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: `1px solid ${theme.border}`, fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#6366f1', fontWeight: '800' }}>
                  <span>{log.time_str}</span>
                  <span>{log.type.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'faculties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {list.faculties.map(fac => {
            const tCount = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Theory Lecture').length;
            const pCount = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Practical').length;
            return (
              <div key={fac.id} style={{ ...styles.card, margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '50px', height: '50px', background: theme.primary, borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '20px' }}>{fac.name[0]}</div>
                  <div>
                    <b style={{ fontSize: '18px' }}>{fac.name}</b>
                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>ID: {fac.id} • Key: {fac.password}</div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                       <span style={{ fontSize: '10px', fontWeight: '800', color: '#818cf8' }}>THEORY: {tCount}</span>
                       <span style={{ fontSize: '10px', fontWeight: '800', color: theme.accent }}>PRACTICAL: {pCount}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '14px', color: '#f8fafc' }}><Edit3 size={18}/></button>
                  <button onClick={async () => { if(window.confirm(`Remove ${fac.name}?`)) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', padding: '12px', borderRadius: '14px', color: '#ef4444' }}><Trash2 size={18}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><UserPlus color="#6366f1"/> <h3>Faculty Onboarding</h3></div>
            <input style={styles.input} value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="Full Name (e.g. Prof. Patil)" />
            <input style={styles.input} value={f.id} disabled={editMode} onChange={e => setF({...f, id: e.target.value})} placeholder="System ID (Unique)" />
            <input style={styles.input} value={f.pass} onChange={e => setF({...f, pass: e.target.value})} placeholder="Security Password" />
            <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
              else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
              setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); setTab('faculties');
            }}>{editMode ? 'UPDATE FACULTY' : 'REGISTER FACULTY'}</button>
          </div>
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><Zap color="#10b981"/> <h3>Quick Workload Allot</h3></div>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject Title" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]);
              alert("Assignment Linked Successfully!"); refresh();
            }}>SYNC WORKLOAD</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (PREMIUM INTERFACE) ---
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
    if(present.length === 0) return alert("Please select students!");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 200) { setLoading(false); return alert("Out of Campus Boundaries!"); }
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, 
        start_time: sel.startTime, end_time: sel.endTime, present: present.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Attendance Submitted!"); setIsReady(false); setPresent([]); setLoading(false);
    }, () => { setLoading(false); alert("GPS Error: Location Required!"); });
  };

  if (!isReady) return (
    <div style={{ ...styles.card, maxWidth: '500px', margin: '40px auto', animation: 'slideUp 0.5s' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ background: 'rgba(79, 70, 229, 0.1)', display: 'inline-block', padding: '18px', borderRadius: '24px', marginBottom: '15px' }}><Clock size={32} color="#6366f1"/></div>
        <h3 style={{ margin: 0 }}>Configure Session</h3>
        <p style={{ color: theme.textMuted, fontSize: '13px' }}>Set lecture details to start roll call</p>
      </div>

      <label style={{ fontSize: '11px', color: '#6366f1', fontWeight: '800', marginLeft: '5px' }}>TARGET CLASS</label>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      
      <label style={{ fontSize: '11px', color: '#6366f1', fontWeight: '800', marginLeft: '5px' }}>SUBJECT TITLE</label>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      
      <label style={{ fontSize: '11px', color: '#6366f1', fontWeight: '800', marginLeft: '5px' }}>SESSION TYPE</label>
      <select style={styles.input} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1 }}><label style={{ fontSize: '10px', color: theme.textMuted }}>START</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.tar
