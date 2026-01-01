import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Download, FileSpreadsheet, List, UserPlus, ShieldCheck, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const SERVICE_ID = "service_gj2hxal"; 
const TEMPLATE_ID = "template_et0w07w";
const PUBLIC_KEY = "n1VUJUSNKnim4ndVq"; 
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif' },
  loginWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '30px', width: '380px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', zIndex: 10 },
  card: { background: '#1e293b', padding: '25px', borderRadius: '30px', marginTop: '20px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.04, width: '450px', pointerEvents: 'none', userSelect: 'none', zIndex: 0 },
  input: { padding: '12px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', width: '100%', marginBottom: '15px', outline: 'none', fontSize: '14px' },
  btnPrimary: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  label: { fontSize: '11px', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px', marginTop: '20px', position: 'relative', zIndex: 1 },
  rollBtn: (active) => ({ padding: '15px 0', background: active ? '#10b981' : '#0f172a', color: 'white', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: '1px solid #334155', fontWeight: 'bold', transition: '0.2s' }),
  statsBar: { background: '#0f172a', padding: '15px', borderRadius: '20px', display: 'flex', justifyContent: 'space-around', marginBottom: '20px', border: '1px solid #334155', position: 'relative', zIndex: 1 }
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
    <div style={styles.loginWrapper}>
      <div style={styles.loginCard}>
        <img src="/logo.png" style={{ width: '70px', marginBottom: '10px' }} alt="Logo" />
        <h2 style={{ color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>AMRIT ERP LOGIN</h2>
        <div style={{ textAlign: 'left', marginTop: '20px' }}>
            <label style={{...styles.label, color:'#64748b'}}>Faculty ID</label>
            <input id="u" style={styles.input} placeholder="e.g. PROF123" />
            <label style={{...styles.label, color:'#64748b'}}>Password</label>
            <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div><small style={{ color: '#94a3b8' }}>ATMA MALIK IOTR</small><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold' }}>Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (MASTER LOGS & SHEET) ---
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

  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(list.attendance);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "MasterData");
    XLSX.writeFile(wb, "Department_Master_Report.xlsx");
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setTab('1')} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tab === '1' ? '#2563eb' : '#1e293b', color: 'white', border: 'none', fontWeight: 'bold' }}>ATTENDANCE LOGS</button>
        <button onClick={() => setTab('2')} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: tab === '2' ? '#2563eb' : '#1e293b', color: 'white', border: 'none', fontWeight: 'bold' }}>ADMIN DASHBOARD</button>
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} alt="watermark" />
        {tab === '1' && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>History Reports</h3>
              <button onClick={downloadMaster} style={{ ...styles.btnPrimary, width: 'auto', background: '#10b981', padding: '10px 15px' }}><FileSpreadsheet size={18}/> DOWNLOAD MASTER SHEET</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                <div><b>{r.class} | {r.sub}</b><br/><small style={{color:'#94a3b8'}}>{r.faculty} • {r.time_str} • {r.type}</small></div>
                <div style={{ textAlign: 'right' }}><b style={{ color: '#10b981' }}>{r.present}/{r.total}</b><br/><small style={{fontSize:'10px'}}>{r.start_time}-{r.end_time}</small></div>
              </div>
            ))}
          </div>
        )}
        {tab === '2' && (
          <div style={{ position: 'relative', zIndex: 1, maxWidth: '400px', margin: '0 auto' }}>
            <h3>Faculty Management</h3>
            <input style={styles.input} placeholder="Full Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} placeholder="User ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} type="password" placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); alert("Registered!"); refresh(); }}>SAVE FACULTY</button>
            <hr style={{margin:'25px 0', borderColor:'#334155'}}/>
            <h3>Assign Subject</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('assignments').insert([{fac_id:f.sFac, class_name:f.sClass, subject_name:f.sSub}]); alert("Mapped!"); refresh(); }}>LINK SUBJECT</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (Theory/Practical, GPS, Email, Excel) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);
  const [loading, setLoading] = useState(false);

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
    if(!sel.startTime || !sel.endTime) return alert("❌ Timing Required!");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

      if (dist > 150) { setLoading(false); return alert(`Geofence Alert: You are ${Math.round(dist)}m away.`); }

      const timeStr = new Date().toLocaleDateString('en-GB');
      
      // 1. Database Main Record
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      
      // 2. Individual Logs & Email Rule
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);

      for (let s of students) {
        if (!present.includes(s.id)) {
          const { data: past } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
          if (past?.length === 3 && past.every(l => l.status === 'A')) {
            emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_name: s.name, to_email: s.email, subject_name: sel.sub, faculty_name: user.name }, PUBLIC_KEY);
          }
        }
      }

      // 3. Detailed 6-Column Excel
      const exportData = students.map(s => ({
        "ROLL NO": s.id, "STUDENT NAME": s.name, "STATUS": present.includes(s.id) ? "P" : "A",
        "SUBJECT": sel.sub, "SESSION": sel.type, "DATE": timeStr, "TIME": `${sel.startTime}-${sel.endTime}`
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Report.xlsx`);

      setLoading(false); alert("Success!"); setSel({ ...sel, sub: '' }); setPresent([]);
    }, (err) => { setLoading(false); alert("GPS Error"); }, { enableHighAccuracy: true });
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="watermark" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{display:'flex', gap:'8px'}}><Clock/> Configuration</h3>
        <label style={styles.label}>Select Class</label>
        <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option>Choose</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <label style={styles.label}>Select Subject</label>
        <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option>Choose</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
        <label style={styles.label}>Session Type</label>
        <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option value="Theory Lecture">Theory Lecture</option><option value="Practical / Lab">Practical / Lab</option><option value="Tutorial">Tutorial</option></select>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}><label style={styles.label}>Lecture Start Time</label><input type="time" style={styles.input} onChange={e=>setSel({...sel, startTime:e.target.value})} /></div>
          <div style={{ flex: 1 }}><label style={styles.label}>Lecture End Time</label><input type="time" style={styles.input} onChange={e=>setSel({...sel, endTime:e.target.value})} /></div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => setSel({...sel, sub:''})} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor:'pointer' }}><ArrowLeft/> Back</button>
          <div style={{ textAlign: 'right' }}><b>{sel.class} | {sel.sub}</b><br/><small>{sel.type}</small></div>
        </div>
        <div style={styles.statsBar}>
          <div style={{ textAlign: 'center' }}><small style={{color:'#94a3b8'}}>Present</small><br/><b style={{ color: '#10b981', fontSize: '24px' }}>{present.length}</b></div>
          <div style={{ textAlign: 'center' }}><small style={{color:'#94a3b8'}}>Absent</small><br/><b style={{ color: '#ef4444', fontSize: '24px' }}>{students.length - present.length}</b></div>
          <div style={{ textAlign: 'center' }}><small style={{color:'#94a3b8'}}>Total</small><br/><b style={{ fontSize: '24px' }}>{students.length}</b></div>
        </div>
        <div style={styles.rollGrid}>{students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}</div>
        <button disabled={loading} style={{ ...styles.btnPrimary, marginTop: '30px', background: loading ? '#475569' : '#10b981' }} onClick={submitAtt}>
          {loading ? "Syncing..." : <><Download size={18}/> SUBMIT & DOWNLOAD REPORT</>}
        </button>
      </div>
    </div>
  );
    }
