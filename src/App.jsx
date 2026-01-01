import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, MapPin, BookOpen, UserPlus, Link as LinkIcon, Clock, BarChart3, Info, List, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const SERVICE_ID = "service_gj2hxal"; 
const TEMPLATE_ID = "template_et0w07w";
const PUBLIC_KEY = "n1VUJUSNKnim4ndVq"; 
const CAMPUS_LAT = 19.7042; // Change to your college Lat
const CAMPUS_LON = 72.7645; // Change to your college Lon

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  inputGroup: { textAlign: 'left', marginBottom: '15px', position: 'relative', zIndex: 2 },
  label: { fontSize: '12px', color: '#94a3b8', marginBottom: '5px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', width: '100%', outline: 'none', fontSize: '14px' },
  btnPrimary: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '30px', marginTop: '20px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.04, width: '450px', pointerEvents: 'none', userSelect: 'none', zIndex: 0 },
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px', marginTop: '20px', position: 'relative', zIndex: 1 },
  rollBtn: (active) => ({ padding: '15px 0', background: active ? '#10b981' : '#0f172a', color: 'white', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #334155', fontWeight: 'bold', transition: '0.2s' }),
  statsBar: { background: '#0f172a', padding: '15px', borderRadius: '20px', display: 'flex', justifyContent: 'space-around', marginBottom: '20px', border: '1px solid #334155' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [faculties, setFaculties] = useState([]);
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('faculties').select('*');
      setFaculties(data || []);
      const res = await fetch('/students_list.xlsx');
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      }
    };
    fetchData();
  }, []);

  const handleLogin = (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod'); }
    else {
      const f = faculties.find(x => x.id === u && x.password === p);
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Authentication Failed!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: 'url("/logo.png")', backgroundSize: '400px', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundBlendMode: 'overlay' }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" style={{ width: '70px', marginBottom: '10px' }} alt="Logo" />
        <h2 style={{ color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>AMRIT ERP SYSTEM</h2>
        <p style={{ color: '#2563eb', fontSize: '12px', fontWeight: 'bold', marginBottom: '25px' }}>COMPUTER ENGINEERING DEPARTMENT</p>
        <input id="u" style={styles.input} placeholder="Faculty ID" />
        <div style={{ height: '10px' }}></div>
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={{ ...styles.btnPrimary, marginTop: '20px' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN TO DASHBOARD</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div><small style={{ color: '#94a3b8' }}>Welcome back,</small><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '8px' }}><LogOut size={18}/> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (WITH DETAILED LOGS & ASSIGNMENTS) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
  const [list, setList] = useState({ faculties: [], attendance: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });

  const refresh = async () => {
    const { data: fac } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setList({ faculties: fac || [], attendance: att || [] });
  };
  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto' }}>
        {[{id:'1', n:'Attendance Logs'}, {id:'2', n:'Add Faculty'}, {id:'3', n:'Assign Subjects'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tab === t.id ? '#2563eb' : '#1e293b', color: 'white', border: '1px solid #334155', fontWeight: 'bold', minWidth: '150px' }}>{t.n}</button>
        ))}
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} alt="watermark" />
        {tab === '1' && (
          <div>
            <h3 style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}><List/> Session History Reports</h3>
            {list.attendance.length === 0 && <p>No logs available yet.</p>}
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '15px', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '15px', marginBottom: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div>
                  <b style={{ color: '#60a5fa', fontSize: '16px' }}>{r.class} - {r.sub}</b><br/>
                  <small style={{ color: '#94a3b8' }}>Taken by: {r.faculty} | {r.time_str} | {r.type}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ color: '#10b981', fontSize: '18px' }}>{r.present}/{r.total}</b><br/>
                  <small style={{ fontSize: '11px', color: '#475569' }}>Slot: {r.start_time}-{r.end_time}</small>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === '2' && (
          <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h3>Create Faculty Account</h3>
            <input style={styles.input} placeholder="Faculty Full Name" onChange={e => setF({...f, name: e.target.value})} />
            <div style={{ height: '12px' }}></div>
            <input style={styles.input} placeholder="Assign User ID" onChange={e => setF({...f, id: e.target.value})} />
            <div style={{ height: '12px' }}></div>
            <input style={styles.input} type="password" placeholder="Assign Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={{ ...styles.btnPrimary, marginTop: '20px' }} onClick={async () => { if(!f.name || !f.id) return alert("Fill all fields"); await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); alert("Faculty Registered!"); refresh(); }}>SAVE FACULTY</button>
          </div>
        )}
        {tab === '3' && (
          <div style={{ maxWidth: '400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h3>Link Subject to Faculty</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <div style={{ height: '12px' }}></div>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <div style={{ height: '12px' }}></div>
            <input style={styles.input} placeholder="Enter Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{ ...styles.btnPrimary, marginTop: '20px' }} onClick={async () => { await supabase.from('assignments').insert([{fac_id:f.sFac, class_name:f.sClass, subject_name:f.sSub}]); alert("Subject Linked!"); refresh(); }}>CONFIRM LINK</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (WITH LABELS & GPS & EXCEL) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Lecture', startTime: '', endTime: '' });
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(({ data }) => setMyAssigns(data || []));
  }, [user.id]);

  useEffect(() => {
    if (sel.class) {
      fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sel.class]);
        setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No'] || ''), name: s['STUDENT NAME'], email: s['EMAIL'] })).filter(s => s.id));
      });
    }
  }, [sel.class]);

  const submitAtt = async () => {
    if(!sel.startTime || !sel.endTime) return alert("Please set Lecture Start and End time!");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

      if (dist > 150) return alert(`❌ Geofence Error: You are ${Math.round(dist)} meters away from campus. Please be within 150m.`);

      const timeStr = new Date().toLocaleDateString('en-GB');
      
      // 1. Database Update
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);

      // 2. Automated 3-Day Absent Email
      for (let s of students) {
        if (!present.includes(s.id)) {
          const { data: past } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
          if (past?.length === 3 && past.every(l => l.status === 'A')) {
            emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_name: s.name, to_email: s.email, subject_name: sel.sub, faculty_name: user.name }, PUBLIC_KEY);
          }
        }
      }

      // 3. Official Excel Download (6 Detailed Columns)
      const exportData = students.map(s => ({
        "ROLL NO": s.id,
        "STUDENT NAME": s.name,
        "STATUS": present.includes(s.id) ? "P" : "A",
        "SUBJECT": sel.sub,
        "DATE": timeStr,
        "LECTURE SLOT": `${sel.startTime} - ${sel.endTime}`
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance_Report");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Report.xlsx`);

      alert("✅ Attendance Submitted & Excel Downloaded!"); 
      setSel({ ...sel, sub: '' }); setPresent([]);
    }, (err) => alert("GPS Permission Denied!"), { enableHighAccuracy: true });
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="watermark" />
      <h3 style={{ display: 'flex', gap: '10px' }}><Clock/> Session Configuration</h3>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Choose Class</label>
        <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Choose Subject</label>
        <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      </div>
      <div style={styles.inputGroup}>
        <label style={styles.label}>Session Type</label>
        <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option value="Lecture">Theory Lecture</option><option value="Practical">Practical / Lab</option></select>
      </div>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{ ...styles.inputGroup, flex: 1 }}>
          <label style={styles.label}>Lecture Start Time</label>
          <input type="time" style={styles.input} onChange={e=>setSel({...sel, startTime:e.target.value})} />
        </div>
        <div style={{ ...styles.inputGroup, flex: 1 }}>
          <label style={styles.label}>Lecture End Time</label>
          <input type="time" style={styles.input} onChange={e=>setSel({...sel, endTime:e.target.value})} />
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="watermark" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => setSel({...sel, sub:''})} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', gap: '5px' }}><ArrowLeft size={18}/> Back</button>
        <div style={{ textAlign: 'right' }}><b>{sel.class} | {sel.sub}</b><br/><small>{sel.startTime}-{sel.endTime}</small></div>
      </div>
      
      <div style={{ ...styles.statsBar, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center' }}><small style={{ color: '#94a3b8' }}>Present</small><br/><b style={{ color: '#10b981', fontSize: '24px' }}>{present.length}</b></div>
        <div style={{ textAlign: 'center' }}><small style={{ color: '#94a3b8' }}>Absent</small><br/><b style={{ color: '#ef4444', fontSize: '24px' }}>{students.length - present.length}</b></div>
        <div style={{ textAlign: 'center' }}><small style={{ color: '#94a3b8' }}>Total</small><br/><b style={{ fontSize: '24px' }}>{students.length}</b></div>
      </div>

      <div style={styles.rollGrid}>{students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}</div>
      
      <button style={{ ...styles.btnPrimary, marginTop: '30px', background: '#10b981', position: 'relative', zIndex: 1 }} onClick={submitAtt}>
        <Download size={18}/> SUBMIT & DOWNLOAD EXCEL
      </button>
    </div>
  );
}
