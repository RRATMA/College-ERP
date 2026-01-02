import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Download, ShieldCheck, User, CheckCircle, ChevronRight, Zap, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const theme = {
  primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  dark: '#0f172a',
  glass: 'rgba(30, 41, 59, 0.7)',
  accent: '#10b981'
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
    padding: '14px 25px', borderRadius: '14px', border: 'none', fontWeight: '800', cursor: 'pointer', transition: '0.3s'
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
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod'); }
    else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.wrapper, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div style={{ ...styles.card, maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <img src="/logo.png" style={{ width: '80px', marginBottom: '20px' }} alt="logo" />
        <h1 style={{ fontSize: '18px', fontWeight: '900', lineHeight: 1.3 }}>Atma Malik Institute of Technology and Research</h1>
        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '10px 0 30px 0' }}>ATTENDANCE ERP SYSTEM</p>
        <input id="u" style={styles.input} placeholder="Faculty ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: theme.primary, padding: '8px', borderRadius: '10px' }}><User size={18} color="white"/></div>
          <div style={{ lineHeight: 1 }}>
            <b style={{ fontSize: '14px' }}>{user.name}</b><br/>
            <small style={{ color: '#6366f1', fontWeight: '800', fontSize: '10px' }}>{user.role.toUpperCase()}</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ ...styles.btn, background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px 15px', fontSize: '11px' }}>LOGOUT</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- FULL FEATURED HOD PANEL ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editMode, setEditMode] = useState(false);

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: stats } = await supabase.from('faculty_stats').select('*');
    setList({ faculties: facs || [], attendance: att || [], stats: stats || [] });
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto' }}>
        {['logs', 'list', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={{ ...styles.btn, background: tab === t ? theme.primary : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '12px' }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {list.attendance.map(r => (
            <div key={r.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <b style={{ fontSize: '18px' }}>{r.class}</b>
                <span style={{ color: '#10b981', fontWeight: '900' }}>{r.present}/{r.total}</span>
              </div>
              <p style={{ margin: '10px 0 5px 0', fontSize: '14px' }}>{r.sub} • {r.faculty}</p>
              <small style={{ color: '#94a3b8' }}>{r.time_str} • {r.type}</small>
            </div>
          ))}
          <button style={{ position: 'fixed', bottom: '20px', right: '20px', ...styles.btn, background: theme.accent, color: 'white' }} onClick={() => {
            const ws = XLSX.utils.json_to_sheet(list.attendance);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Logs");
            XLSX.writeFile(wb, "Master_Report.xlsx");
          }}><Download size={18}/></button>
        </div>
      )}

      {tab === 'list' && list.faculties.map(fac => {
        const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
        return (
          <div key={fac.id} style={{ ...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <b style={{ fontSize: '16px' }}>{fac.name}</b>
              <div style={{ fontSize: '11px', color: '#6366f1' }}>ID: {fac.id} | Theory: {s.theory_count} | Prac: {s.practical_count}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{ background: 'rgba(99,102,241,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#6366f1' }}><Edit3 size={16}/></button>
              <button onClick={async () => { if(window.confirm("Delete?")) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{ background: 'rgba(244,63,94,0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#f43f5e' }}><Trash2 size={16}/></button>
            </div>
          </div>
        ))}

      {tab === 'manage' && (
        <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto' }}>
          <h3>{editMode ? 'Edit' : 'Add'} Faculty</h3>
          <input style={styles.input} value={f.name} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
          <input style={styles.input} value={f.id} placeholder="ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
          <input style={styles.input} value={f.pass} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
          <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%' }} onClick={async () => {
            if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
            else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
            refresh(); setTab('list'); alert("Success!");
          }}>SAVE DATA</button>
          <hr style={{ margin: '30px 0', borderColor: 'rgba(255,255,255,0.05)' }} />
          <h3>Assign Subject</h3>
          <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
          <button style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%' }} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>LINK SUBJECT</button>
        </div>
      )}
    </div>
  );
}

// --- FULL FEATURED FACULTY PANEL ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyAssigns(res.data || [])); }, [user.id]);

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
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 200) { setLoading(false); return alert("Out of Campus!"); }
      
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]);
      alert("Attendance Submitted Successfully!"); setIsReady(false); setLoading(false);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!isReady) return (
    <div style={{ ...styles.card, maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Clock color="#6366f1"/> Create Session</h3>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <select style={styles.input} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={{ ...styles.btn, background: theme.primary, color: 'white', width: '100%' }} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Fill All Fields")}>START ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '50%', color: 'white' }}><ArrowLeft/></button>
        <div style={{ textAlign: 'right' }}><b style={{ fontSize: '18px' }}>{sel.class}</b><br/><small style={{ color: '#6366f1' }}>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ padding: '15px 0', background: present.includes(s.id) ? '#6366f1' : 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px', textAlign: 'center', fontWeight: '900', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>{s.id}</div>
        ))}
      </div>
      <button disabled={loading} style={{ ...styles.btn, background: theme.accent, color: 'white', width: '100%', marginTop: '30px' }} onClick={submitAttendance}>{loading ? "Verifying..." : `SUBMIT (${present.length} PRESENT)`}</button>
    </div>
  );
          }
