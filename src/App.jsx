import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, CheckCircle, MapPin, BookOpen, ListChecks, UserPlus, Users, Link as LinkIcon, Clock, ShieldCheck, BarChart3, Info, Calendar, ClipboardList } from 'lucide-react';
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
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', zIndex: 10 },
  input: { padding: '14px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '2px solid #e2e8f0', width: '100%', marginBottom: '15px', outline: 'none' },
  btnPrimary: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '14px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', width: '100%' },
  nav: { background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 },
  card: { background: '#1e293b', padding: '25px', borderRadius: '30px', marginTop: '20px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' },
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px', marginTop: '20px' },
  rollBtn: (active) => ({ aspectRatio: '1/1', background: active ? '#10b981' : '#0f172a', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '800', border: active ? 'none' : '1px solid #334155' }),
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, width: '400px', pointerEvents: 'none', zIndex: 0 },
  logItem: { background: 'rgba(15, 23, 42, 0.6)', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
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
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod');
    } else {
      const f = faculties.find(x => x.id === u && x.password === p);
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, ...styles.centered, backgroundImage: 'url("/logo.png")', backgroundSize: '500px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'overlay' }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" style={{ width: '80px', marginBottom: '10px' }} />
        <h2 style={{ color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>AMRIT ERP SYSTEM</h2>
        <p style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '25px' }}>COMPUTER ENGINEERING</p>
        <input id="u" style={styles.input} placeholder="User ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div><small style={{ color: '#94a3b8' }}>ATMA MALIK IOTR</small><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ ...styles.btnPrimary, background: '#ef4444', width: 'auto', padding: '8px 15px' }}><LogOut size={16} /> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (With Logs) ---
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button style={{...styles.tabBtn, background: tab==='1'?'#2563eb':'#1e293b', flex:1, padding:'15px', borderRadius:'15px', color:'white', border:'1px solid #334155'}} onClick={() => setTab('1')}>Attendance Logs</button>
        <button style={{...styles.tabBtn, background: tab==='2'?'#2563eb':'#1e293b', flex:1, padding:'15px', borderRadius:'15px', color:'white', border:'1px solid #334155'}} onClick={() => setTab('2')}>Add Faculty</button>
        <button style={{...styles.tabBtn, background: tab==='3'?'#2563eb':'#1e293b', flex:1, padding:'15px', borderRadius:'15px', color:'white', border:'1px solid #334155'}} onClick={() => setTab('3')}>Assign Subject</button>
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} />
        {tab === '1' && (
          <div>
            <h3>Recent Activity Logs</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={styles.logItem}>
                <div>
                  <b style={{color:'#60a5fa'}}>{r.class} - {r.sub}</b> ({r.type})<br/>
                  <small style={{color:'#94a3b8'}}>{r.faculty} • {r.time_str} • {r.start_time}-{r.end_time}</small>
                </div>
                <div style={{textAlign:'right'}}>
                  <b style={{color:'#10b981'}}>{r.present}/{r.total}</b><br/>
                  <small style={{fontSize:'10px', color:'#475569'}}>SYNCED</small>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === '2' && (
          <div style={{maxWidth:'400px', margin:'0 auto'}}>
            <h3>Register New Faculty</h3>
            <input style={styles.input} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} placeholder="ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} type="password" placeholder="Pass" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); alert("Faculty Added!"); refresh(); }}>SAVE</button>
          </div>
        )}
        {tab === '3' && (
          <div style={{maxWidth:'400px', margin:'0 auto'}}>
            <h3>Assign Subject to Class</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('assignments').insert([{fac_id:f.sFac, class_name:f.sClass, subject_name:f.sSub}]); alert("Linked!"); refresh(); }}>LINK</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (All Features) ---
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
    if(!sel.startTime || !sel.endTime) return alert("Select Session Time!");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      // 150m Range Check
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

      if (dist > 150) return alert(`❌ Range Restriction!\nYou are ${Math.round(dist)}m away. Please come within 150m.`);

      const timeStr = new Date().toLocaleDateString('en-GB');
      
      // 1. Log to Database
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);

      // 2. Email Alert Logic
      for (let s of students) {
        if (!present.includes(s.id)) {
          const { data: past } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
          if (past?.length === 3 && past.every(l => l.status === 'A')) {
            emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_name: s.name, to_email: s.email, subject_name: sel.sub, faculty_name: user.name }, PUBLIC_KEY);
          }
        }
      }

      // 3. Detailed Excel Download (6 Columns)
      const exportData = students.map(s => ({
        "ROLL NO": s.id,
        "NAME": s.name,
        "STATUS": present.includes(s.id) ? "Present" : "Absent",
        "SUBJECT": sel.sub,
        "DATE": timeStr,
        "TIME": `${sel.startTime}-${sel.endTime}`
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance_Report");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Report.xlsx`);

      alert("✅ Attendance Synced & Excel Downloaded!"); 
      setSel({ ...sel, sub: '' }); setPresent([]);
    }, (err) => alert("GPS Error! Enable location access."), { enableHighAccuracy: true });
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <h3>Start Session</h3>
      <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option value="Lecture">Theory Lecture</option><option value="Practical">Practical / Lab</option></select>
      <div style={{display:'flex', gap:'10px'}}>
        <input type="time" style={styles.input} onChange={e=>setSel({...sel, startTime:e.target.value})} />
        <input type="time" style={styles.input} onChange={e=>setSel({...sel, endTime:e.target.value})} />
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', position:'relative', zIndex:1}}>
        <button onClick={() => setSel({...sel, sub:''})} style={{background:'none', border:'none', color:'#94a3b8'}}><ArrowLeft/> Back</button>
        <div style={{textAlign:'right'}}><b>{sel.class} | {sel.sub}</b><br/><small>{sel.type}</small></div>
      </div>
      
      <div style={{background:'#0f172a', padding:'15px', borderRadius:'15px', display:'flex', justifyContent:'space-around', marginBottom:'15px', position:'relative', zIndex:1}}>
        <div style={{textAlign:'center'}}><small>Present</small><br/><b style={{color:'#10b981', fontSize:'22px'}}>{present.length}</b></div>
        <div style={{textAlign:'center'}}><small>Absent</small><br/><b style={{color:'#ef4444', fontSize:'22px'}}>{students.length - present.length}</b></div>
      </div>

      <div style={{...styles.rollGrid, position:'relative', zIndex:1}}>{students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}</div>
      
      <button style={{...styles.btnPrimary, marginTop:'30px', background:'#10b981', position:'relative', zIndex:1}} onClick={submitAtt}>SUBMIT & DOWNLOAD EXCEL</button>
    </div>
  );
              }
