import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, 
  Database, Download, ShieldCheck, User, CheckCircle, 
  ChevronRight, Zap, MapPin, Calendar, PlusCircle, BarChart3, Users, Search 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration: Atma Malik Campus Coordinates ---
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

  // --- HOME PAGE / LOGIN UI ---
  if (view === 'login') return (
    <div style={{ ...styles.wrapper, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
       <div style={{ ...styles.card, maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ background: 'white', display: 'inline-block', padding: '15px', borderRadius: '25px', marginBottom: '20px' }}>
            <img src="/logo.png" style={{ width: '70px' }} alt="college_logo" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '5px' }}>AMRIT ERP</h2>
          <p style={{ color: '#94a3b8', fontSize: '12px', letterSpacing: '2px', marginBottom: '30px' }}>FACULTY PORTAL LOGIN</p>
          
          <input id="u" style={styles.input} placeholder="Faculty ID" />
          <input id="p" type="password" style={styles.input} placeholder="Password" />
          
          <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center', marginTop: '10px' }} 
            onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
            SECURE LOGIN <ShieldCheck size={18}/>
          </button>
          <p style={{ marginTop: '20px', fontSize: '11px', color: '#475569' }}>© 2026 Atma Malik Institute of Technology & Research</p>
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

// --- FIXED HOD PANEL (UNCHANGED AS REQUESTED) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [], assignments: [] });
  const [search, setSearch] = useState('');
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editMode, setEditMode] = useState(false);

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*').order('name');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: st } = await supabase.from('faculty_stats').select('*');
    const { data: asgn } = await supabase.from('assignments').select('*, faculties(name)');
    setList({ faculties: facs || [], attendance: att || [], stats: st || [], assignments: asgn || [] });
  };

  useEffect(() => { refresh(); }, []);

  const filteredLogs = list.attendance.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '18px' }}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={{ flex: 1, ...styles.btn, background: tab === t ? theme.primary : 'transparent', color: 'white', justifyContent: 'center' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} />
              <input style={{ ...styles.input, paddingLeft: '45px', marginBottom: 0 }} placeholder="Search logs..." onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={{ ...styles.btn, background: theme.accent, color: 'white' }} onClick={() => {
              const ws = XLSX.utils.json_to_sheet(list.attendance);
              const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "MasterReport");
              XLSX.writeFile(wb, "AMRIT_Full_Attendance.xlsx");
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
                  <button onClick={async () => { if(window.confirm("Delete Faculty Record?")) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', padding: '10px', borderRadius: '10px', color: '#f43f5e' }}><Trash2 size={18}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
          <div style={styles.card}>
            <h3>{editMode ? 'Update Faculty' : 'Add New Faculty'}</h3>
            <input style={styles.input} value={f.name} onChange={e => setF({...f, name: e.target.value})} placeholder="Faculty Name" />
            <input style={styles.input} value={f.id} disabled={editMode} onChange={e => setF({...f, id: e.target.value})} placeholder="Unique ID" />
            <input style={styles.input} value={f.pass} onChange={e => setF({...f, pass: e.target.value})} placeholder="Password" />
            <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
              else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
              setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); setTab('faculties');
            }}>SAVE FACULTY</button>
          </div>
          <div style={styles.card}>
            <h3>Workload Allotment</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}>
              <option>Select Faculty</option>
              {list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}>
              <option>Select Class</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', justifyContent: 'center' }} onClick={async () => {
              if(!f.sFac || !f.sClass || !f.sSub) return alert("Fill all details");
              await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]);
              alert("Subject Linked!"); refresh();
            }}>LINK SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (ALL FEATURES INCLUDED) ---
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
    if(present.length === 0) return alert("Mark at least one student!");
    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      if (dist > 200) { 
        setLoading(false); 
        return alert("ACCESS DENIED: You are outside the campus boundaries."); 
      }
      
      const { error } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, 
        start_time: sel.startTime, end_time: sel.endTime, present: present.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]);

      if(!error) { alert("Attendance Recorded Successfully!"); setIsReady(false); setPresent([]); }
      setLoading(false);
    }, () => { setLoading(false); alert("GPS Error: Please enable location services."); });
  };

  if (!isReady) return (
    <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto', animation: 'fadeIn 0.5s' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Calendar color="#6366f1"/> Start Session</h3>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}>
        <option value="">Choose Class</option>
        {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}>
        <option value="">Choose Subject</option>
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
      <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%', justifyContent: 'center' }} 
        onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Please fill all fields")}>
        INITIALIZE ROLL CALL <ChevronRight size={18}/>
      </button>
    </div>
  );

  return (
    <div style={{ ...styles.card, animation: 'fadeIn 0.5s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%', color: 'white' }}><ArrowLeft/></button>
        <div style={{ textAlign: 'right' }}>
          <b style={{ fontSize: '20px' }}>{sel.class}</b><br/><small style={{ color: '#6366f1' }}>{sel.sub} ({sel.type})</small>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ 
                 padding: '16px 0', 
                 background: present.includes(s.id) ? theme.primary : 'rgba(255,255,255,0.05)', 
                 color: 'white', borderRadius: '15px', textAlign: 'center', fontWeight: '900', 
                 border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.2s'
               }}>{s.id}</div>
        ))}
      </div>
      <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span>Marked: <b style={{color: theme.accent}}>{present.length}</b></span>
          <span>Class Total: <b>{students.length}</b></span>
        </div>
        <button disabled={loading} style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', justifyContent: 'center', height: '55px' }} onClick={submitAttendance}>
          {loading ? "VERIFYING LOCATION..." : <><MapPin size={18}/> SUBMIT ATTENDANCE</>}
        </button>
      </div>
    </div>
  );
      }
