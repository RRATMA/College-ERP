import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, MapPin, BookOpen, ListChecks, UserPlus, Link as LinkIcon, Clock, ShieldCheck, BarChart3, Info, Calendar, Search } from 'lucide-react';
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
  
  // Watermark Style
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.03, width: '450px', pointerEvents: 'none', zIndex: 0, userSelect: 'none' },
  
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px', marginTop: '20px', position: 'relative', zIndex: 1 },
  rollBtn: (active) => ({ aspectRatio: '1/1', background: active ? '#10b981' : '#1e293b', color: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '800', border: '2px solid #334155', transition: '0.2s' }),
  logCard: { background: 'rgba(15, 23, 42, 0.7)', padding: '20px', borderRadius: '20px', marginBottom: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
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
      else alert("Login Failed: Invalid Faculty Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, ...styles.centered, backgroundImage: 'url("/logo.png")', backgroundSize: '450px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'overlay' }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" style={{ width: '80px', marginBottom: '15px' }} />
        <h2 style={{ color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>AMRIT ERP SYSTEM</h2>
        <p style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '13px', marginBottom: '25px' }}>OFFICIAL FACULTY PORTAL</p>
        <input id="u" style={styles.input} placeholder="User/Faculty ID" />
        <input id="p" type="password" style={styles.input} placeholder="Enter Password" />
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>AUTHORIZE LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div><small style={{ color: '#94a3b8' }}>ATMA MALIK - COMPUTER DEPT</small><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ ...styles.btnPrimary, background: '#ef4444', width: 'auto', padding: '8px 18px' }}><LogOut size={16} /> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (FULLY DETAILED) ---
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
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
        {[{id:'1', lbl:'Reports Log', icon:<ListChecks/>}, {id:'2', lbl:'Add Faculty', icon:<UserPlus/>}, {id:'3', lbl:'Link Subjects', icon:<LinkIcon/>}, {id:'4', lbl:'Global Stats', icon:<BarChart3/>}].map(t => (
          <button key={t.id} style={{ flex: 1, minWidth:'140px', padding: '15px', borderRadius: '15px', background: tab === t.id ? '#2563eb' : '#1e293b', color: 'white', border: '1px solid #334155', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }} onClick={() => setTab(t.id)}>
            {t.icon} {t.lbl}
          </button>
        ))}
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} />
        {tab === '1' && (
          <div>
            <h3 style={{marginBottom:'20px'}}>Consolidated Attendance Logs</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={styles.logCard}>
                <div>
                  <b style={{color:'#60a5fa', fontSize:'17px'}}>{r.class} | {r.sub}</b><br/>
                  <small style={{color:'#94a3b8'}}>{r.faculty} • {r.type} • {r.time_str}</small>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:'22px', fontWeight:'900', color: r.present > 0 ? '#10b981' : '#ef4444'}}>{r.present}/{r.total}</span><br/>
                  <small style={{fontSize:'10px', color:'#475569'}}>{r.start_time}-{r.end_time}</small>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === '2' && (
          <div style={{maxWidth: '450px', margin: '0 auto'}}>
            <h3 style={{textAlign:'center', marginBottom:'20px'}}>Create Faculty Account</h3>
            <input style={styles.input} placeholder="Full Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} placeholder="Login ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} type="password" placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); alert("Registered!"); refresh(); }}>SAVE ACCOUNT</button>
          </div>
        )}
        {tab === '3' && (
          <div style={{maxWidth: '450px', margin: '0 auto'}}>
            <h3 style={{textAlign:'center', marginBottom:'20px'}}>Map Subjects to Faculty</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>-- Select Faculty --</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>-- Select Class --</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject Name (e.g. DBMS)" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('assignments').insert([{fac_id:f.sFac, class_name:f.sClass, subject_name:f.sSub}]); alert("Mapped Successfully!"); refresh(); }}>AUTHORIZE MAPPING</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (FULLY DETAILED) ---
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
    if(!sel.startTime || !sel.endTime) return alert("Error: Start & End time required!");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

      if (dist > 150) return alert(`❌ Geofencing Error: You are ${Math.round(dist)}m away from campus. Access Denied.`);

      const timeStr = new Date().toLocaleDateString('en-GB');
      
      // 1. Database Update
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);

      // 2. Automated Parent Notification (3-Day Rule)
      for (let s of students) {
        if (!present.includes(s.id)) {
          const { data: past } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
          if (past?.length === 3 && past.every(l => l.status === 'A')) {
            emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_name: s.name, to_email: s.email, subject_name: sel.sub, faculty_name: user.name }, PUBLIC_KEY);
          }
        }
      }

      // 3. Official Report Generation (6 Columns Detailed)
      const exportData = students.map(s => ({
        "ROLL NO": s.id,
        "STUDENT NAME": s.name,
        "ATTENDANCE STATUS": present.includes(s.id) ? "PRESENT" : "ABSENT",
        "SUBJECT": sel.sub,
        "DATE": timeStr,
        "SESSION SLOT": `${sel.startTime} TO ${sel.endTime}`
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "AttendanceReport");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Log.xlsx`);

      alert("✅ Attendance Successfully Synced!"); 
      setSel({ ...sel, sub: '' }); setPresent([]);
    }, (err) => alert("GPS Restricted: Please enable high-accuracy location."), { enableHighAccuracy: true });
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <h3 style={{display:'flex', gap:'12px', alignItems:'center', marginBottom:'25px'}}><BookOpen/> Configure New Session</h3>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
        <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      </div>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option value="Lecture">Theory Lecture</option><option value="Practical">Practical Session / Lab</option></select>
      <div style={{display:'flex', gap:'15px'}}>
        <div style={{flex:1}}><small style={{color:'#94a3b8'}}>Start Time</small><input type="time" style={{...styles.input, marginTop:'5px'}} onChange={e=>setSel({...sel, startTime:e.target.value})} /></div>
        <div style={{flex:1}}><small style={{color:'#94a3b8'}}>End Time</small><input type="time" style={{...styles.input, marginTop:'5px'}} onChange={e=>setSel({...sel, endTime:e.target.value})} /></div>
      </div>
      <div style={{padding:'15px', background:'rgba(37, 99, 235, 0.1)', borderRadius:'12px', display:'flex', gap:'10px', alignItems:'center', marginTop:'10px'}}>
        <Info size={20} color="#2563eb" /> <small style={{color:'#94a3b8'}}>Attendance can only be marked within the college campus boundary (150m).</small>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', position:'relative', zIndex:1}}>
        <button onClick={() => setSel({...sel, sub:''})} style={{...styles.btnPrimary, background:'#334155', width:'auto', padding:'8px 15px'}}><ArrowLeft size={16}/> Modify Session</button>
        <div style={{textAlign:'right'}}>
          <b style={{fontSize:'18px', color:'#10b981'}}>{sel.class} | {sel.sub}</b><br/>
          <small style={{color:'#94a3b8'}}>{sel.type} ({sel.startTime}-{sel.endTime})</small>
        </div>
      </div>
      
      <div style={{background:'#0f172a', padding:'18px', borderRadius:'20px', display:'flex', justifyContent:'space-around', border:'1px solid #334155', marginBottom:'20px', position:'relative', zIndex:1}}>
        <div style={{textAlign:'center'}}><small style={{color:'#94a3b8'}}>Present Count</small><br/><b style={{color:'#10b981', fontSize:'24px'}}>{present.length}</b></div>
        <div style={{textAlign:'center', borderLeft:'1px solid #334155', borderRight:'1px solid #334155', padding:'0 30px'}}><small style={{color:'#94a3b8'}}>Absent</small><br/><b style={{color:'#ef4444', fontSize:'24px'}}>{students.length - present.length}</b></div>
        <div style={{textAlign:'center'}}><small style={{color:'#94a3b8'}}>Total</small><br/><b style={{fontSize:'24px'}}>{students.length}</b></div>
      </div>

      <div style={styles.rollGrid}>{students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}</div>
      
      <button style={{...styles.btnPrimary, marginTop:'35px', padding:'20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', position:'relative', zIndex:1, fontSize:'18px'}} onClick={submitAtt}>
        FINALIZE & DOWNLOAD REPORT
      </button>
    </div>
  );
}
