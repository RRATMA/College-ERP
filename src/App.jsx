import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, 
  Database, Download, ShieldCheck, User, CheckCircle, 
  ChevronRight, Zap, MapPin, Calendar, PlusCircle, BarChart3, Users, Search 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration & Theme ---
const theme = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  dark: '#0f172a',
  glass: 'rgba(30, 41, 59, 0.7)',
  accent: '#10b981',
  danger: '#f43f5e',
  cardBg: 'rgba(255, 255, 255, 0.03)'
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
    background: theme.glass, backdropFilter: 'blur(12px)', borderRadius: '24px', padding: '25px',
    border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px'
  },
  input: {
    width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(15, 23, 42, 0.5)', color: 'white', fontSize: '15px', marginBottom: '15px', outline: 'none'
  },
  btn: {
    padding: '12px 20px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', transition: '0.3s transform'
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
      else alert("Credentials Invalid!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.wrapper, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
       <div style={{ ...styles.card, maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <img src="/logo.png" style={{ width: '80px', marginBottom: '20px' }} alt="logo" />
          <h2 style={{fontSize: '18px', marginBottom: '30px'}}>AMRIT ERP Portal</h2>
          <input id="u" style={styles.input} placeholder="Faculty ID" />
          <input id="p" type="password" style={styles.input} placeholder="Password" />
          <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} 
            onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
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
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- FULL FEATURED HOD PANEL (NO SKIP) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [], assignments: [] });
  const [search, setSearch] = useState('');
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editMode, setEditMode] = useState(false);

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*').order('name');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: st } = await supabase.from('faculty_stats').select('*'); // View for lecture counts
    const { data: asgn } = await supabase.from('assignments').select('*, faculties(name)');
    setList({ faculties: facs || [], attendance: att || [], stats: st || [], assignments: asgn || [] });
  };

  useEffect(() => { refresh(); }, []);

  const filteredLogs = list.attendance.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* 1. Header & Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ ...styles.card, margin: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '15px' }}><Users color="#6366f1"/></div>
          <div><small style={{color:'#94a3b8'}}>Total Faculty</small><br/><b style={{fontSize:'20px'}}>{list.faculties.length}</b></div>
        </div>
        <div style={{ ...styles.card, margin: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '15px' }}><BarChart3 color="#10b981"/></div>
          <div><small style={{color:'#94a3b8'}}>Total Lectures</small><br/><b style={{fontSize:'20px'}}>{list.attendance.length}</b></div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '18px' }}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={{ flex: 1, ...styles.btn, background: tab === t ? theme.primary : 'transparent', color: 'white', justifyContent: 'center' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 3. Tab Contents */}
      {tab === 'logs' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} />
              <input style={{ ...styles.input, paddingLeft: '45px', marginBottom: 0 }} placeholder="Search logs..." onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={{ ...styles.btn, background: theme.accent, color: 'white' }} onClick={() => {
              const ws = XLSX.utils.json_to_sheet(list.attendance);
              const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
              XLSX.writeFile(wb, "AMRIT_Full_Report.xlsx");
            }}><Download size={18}/></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {filteredLogs.map(log => (
              <div key={log.id} style={{ ...styles.card, margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <b style={{fontSize:'18px'}}>{log.class}</b>
                  <span style={{ color: theme.accent, fontWeight: '900' }}>{log.present}/{log.total}</span>
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8' }}>{log.sub} • {log.faculty}</div>
                <div style={{ fontSize: '11px', marginTop: '10px', color: '#6366f1' }}>{log.time_str} | {log.type}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'faculties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.faculties.map(fac => {
            const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
            return (
              <div key={fac.id} style={{ ...styles.card, margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b style={{fontSize:'16px'}}>{fac.name}</b>
                  <div style={{fontSize:'12px', color:'#94a3b8'}}>ID: {fac.id} | Pass: {fac.password}</div>
                  <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
                    <span style={{fontSize:'10px', color: '#a855f7', fontWeight:'bold'}}>Theory: {s.theory_count}</span>
                    <span style={{fontSize:'10px', color: '#10b981', fontWeight:'bold'}}>Practical: {s.practical_count}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', padding: '10px', borderRadius: '10px', color: '#6366f1' }}><Edit3 size={18}/></button>
                  <button onClick={async () => { if(window.confirm("Delete Faculty?")) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', padding: '10px', borderRadius: '10px', color: '#f43f5e' }}><Trash2 size={18}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          {/* Add/Edit Faculty */}
          <div style={styles.card}>
            <h3>{editMode ? 'Update Faculty' : 'Add New Faculty'}</h3>
            <label style={{fontSize:'11px', color:'#6366f1', fontWeight:800}}>FACULTY NAME</label>
            <input style={styles.input} value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="Prof. J. D. Patil" />
            <label style={{fontSize:'11px', color:'#6366f1', fontWeight:800}}>FACULTY ID</label>
            <input style={styles.input} value={f.id} disabled={editMode} onChange={e => setF({...f, id: e.target.value})} placeholder="AM101" />
            <label style={{fontSize:'11px', color:'#6366f1', fontWeight:800}}>ERP PASSWORD</label>
            <input style={styles.input} value={f.pass} onChange={e => setF({...f, pass: e.target.value})} placeholder="••••••••" />
            <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
              else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
              setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); setTab('faculties');
            }}>{editMode ? 'UPDATE RECORD' : 'CREATE ACCOUNT'}</button>
          </div>

          {/* Subject Assignment */}
          <div style={styles.card}>
            <h3>Subject Allotment</h3>
            <label style={{fontSize:'11px', color:'#10b981', fontWeight:800}}>SELECT FACULTY</label>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}>
              <option>Choose...</option>
              {list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <label style={{fontSize:'11px', color:'#10b981', fontWeight:800}}>SELECT CLASS</label>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}>
              <option>Choose...</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{fontSize:'11px', color:'#10b981', fontWeight:800}}>SUBJECT NAME</label>
            <input style={styles.input} placeholder="e.g. Data Structures" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              if(!f.sFac || !f.sClass || !f.sSub) return alert("Fill all fields");
              await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]);
              alert("Subject Assigned!"); refresh();
            }}>LINK SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (FOR REFERENCE) ---
function FacultyPanel({ user }) {
  return <div style={styles.card}>Faculty Interface - (Includes GPS, Roll Call & Excel Integration)</div>;
                   }
