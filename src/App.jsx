import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, CheckCircle, MapPin, BookOpen, ListChecks, UserPlus, Users, Link as LinkIcon, Clock, ShieldCheck, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Global Configuration ---
const SERVICE_ID = "service_gj2hxal"; 
const TEMPLATE_ID = "template_et0w07w";
const PUBLIC_KEY = "n1VUJUSNKnim4ndVq"; 

// कॉलेजचे अचूक को-ऑर्डिनेट्स (तुमच्या कॉलेजचे टाका)
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif', overflowX: 'hidden' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  loginCard: { background: 'rgba(255, 255, 255, 0.95)', padding: '50px 40px', borderRadius: '40px', width: '450px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', zIndex: 10, border: '1px solid rgba(255, 255, 255, 0.2)' },
  input: { padding: '15px', borderRadius: '15px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '2px solid #e2e8f0', width: '100%', marginBottom: '15px', outline: 'none', fontSize: '16px' },
  btnPrimary: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '15px 25px', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' },
  nav: { background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', padding: '20px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 },
  card: { background: '#1e293b', padding: '30px', borderRadius: '30px', marginTop: '25px', border: '1px solid #334155', position: 'relative', overflow: 'hidden' },
  tabBtn: (active) => ({ padding: '15px', cursor: 'pointer', backgroundColor: active ? '#2563eb' : 'transparent', color: 'white', borderRadius: '15px', border: active ? 'none' : '1px solid #334155', flex: 1, fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }),
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '15px', marginTop: '25px' },
  rollBtn: (active) => ({ padding: '25px 0', background: active ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#334155', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', fontWeight: '800', fontSize: '18px', border: 'none', transition: '0.2s' }),
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, width: '400px', pointerEvents: 'none', zIndex: 0 }
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
    if (u.trim() === "HODCOM" && p.trim() === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod');
    } else {
      const f = faculties.find(x => x.id === u.trim() && x.password === p.trim());
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, ...styles.centered, backgroundImage: 'url("/logo.png")', backgroundSize: '600px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'overlay' }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" alt="Logo" style={{ width: '100px', marginBottom: '15px' }} />
        <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900' }}>ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH</h2>
        <p style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '30px' }}>AMRIT ERP PORTAL</p>
        <input id="u" style={styles.input} placeholder="User ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={{ ...styles.btnPrimary, width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div><span style={{ fontSize: '12px', color: '#94a3b8' }}>COMPUTER ENGINEERING</span><br /><b style={{ fontSize: '18px' }}>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ ...styles.btnPrimary, background: '#ef4444', padding: '10px 20px' }}><LogOut size={18} /> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

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
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button style={styles.tabBtn(tab === '1')} onClick={() => setTab('1')}><ListChecks size={24}/> Reports</button>
        <button style={styles.tabBtn(tab === '2')} onClick={() => setTab('2')}><UserPlus size={24}/> Faculty</button>
        <button style={styles.tabBtn(tab === '3')} onClick={() => setTab('3')}><LinkIcon size={24}/> Link Sub</button>
        <button style={styles.tabBtn(tab === '4')} onClick={() => setTab('4')}><BarChart3 size={24}/> Stats</button>
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} alt="wm" />
        {tab === '1' && (
          <div>
            <h3>Recent Attendance Reports</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '20px', background: '#0f172a', borderRadius: '20px', marginBottom: '10px', display:'flex', justifyContent:'space-between', border: '1px solid #334155' }}>
                <div><b style={{ color: '#2563eb' }}>{r.class}</b> - {r.sub}<br/><small style={{color:'#94a3b8'}}>{r.faculty} | {r.time_str} | {r.start_time}-{r.end_time}</small></div>
                <div style={{ color: '#10b981', fontWeight: '900', fontSize: '20px' }}>{r.present}/{r.total}</div>
              </div>
            ))}
          </div>
        )}
        {tab === '2' && (
          <div style={{maxWidth: '450px', margin: '0 auto'}}>
            <h3 style={{textAlign:'center'}}>Register Faculty</h3>
            <input style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} placeholder="ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} type="password" placeholder="Pass" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={{...styles.btnPrimary, width:'100%', background:'#10b981'}} onClick={async () => { await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); alert("Saved!"); refresh(); }}>SAVE</button>
          </div>
        )}
        {tab === '3' && (
          <div style={{maxWidth: '450px', margin: '0 auto'}}>
            <h3 style={{textAlign:'center'}}>Link Class & Subject</h3>
            <select style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} onChange={e => setF({...f, sFac: e.target.value})}>
              <option value="">Faculty</option>
              {list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <select style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} onChange={e => setF({...f, sClass: e.target.value})}>
              <option value="">Class</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{...styles.btnPrimary, width:'100%'}} onClick={async () => { await supabase.from('assignments').insert([{fac_id:f.sFac, class_name:f.sClass, subject_name:f.sSub}]); alert("Linked!"); refresh(); }}>LINK</button>
          </div>
        )}
        {tab === '4' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#0f172a', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
              <Users size={40} color="#2563eb" style={{margin:'0 auto 10px'}}/>
              <h2>{list.faculties.length}</h2><p>Faculties</p>
            </div>
            <div style={{ background: '#0f172a', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
              <ShieldCheck size={40} color="#10b981" style={{margin:'0 auto 10px'}}/>
              <h2>{list.attendance.length}</h2><p>Sessions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    if(!sel.startTime || !sel.endTime) return alert("Select Time!");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      // Haversine formula for 150m accuracy
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      if (distance > 150) {
        return alert(`❌ ACCESS DENIED!\n\nतुम्ही कॅम्पसपासून ${Math.round(distance)} मीटर लांब आहात. हजेरी फक्त १५० मीटरच्या आतच घेता येईल.`);
      }

      const timeStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);

      // Email Alerts
      for (let s of students) {
        if (!present.includes(s.id)) {
          const { data: past } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
          if (past?.length === 3 && past.every(l => l.status === 'A')) {
            emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_name: s.name, to_email: s.email, subject_name: sel.sub, faculty_name: user.name }, PUBLIC_KEY);
          }
        }
      }

      // Final Detailed Excel Download
      const excelData = students.map(s => ({ 
        "ROLL NO": s.id, 
        "NAME": s.name, 
        "STATUS": present.includes(s.id) ? "Present" : "Absent",
        "SUBJECT": sel.sub,
        "DATE": timeStr,
        "TIME SLOT": `${sel.startTime} - ${sel.endTime}`
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_${timeStr}.xlsx`);

      alert("✅ Attendance Submitted & Excel Downloaded!"); 
      setSel({ ...sel, sub: '' }); setPresent([]);
    }, (err) => alert("Please enable GPS/Location!"), { enableHighAccuracy: true });
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="wm" />
      <h2><BookOpen/> Session Setup</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'20px'}}>
        <select style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} onChange={e => setSel({...sel, class: e.target.value})}>
          <option value="">Class</option>
          {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} onChange={e => setSel({...sel, sub: e.target.value})}>
          <option value="">Subject</option>
          {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
        </select>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
        <input type="time" style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} onChange={e=>setSel({...sel, startTime:e.target.value})} />
        <input type="time" style={{...styles.input, backgroundColor:'#0f172a', color:'white'}} onChange={e=>setSel({...sel, endTime:e.target.value})} />
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'30px' }}>
        <button onClick={() => setSel({ ...sel, sub: '' })} style={{...styles.btnPrimary, background:'#475569'}}><ArrowLeft/> Change</button>
        <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{sel.class} | {sel.sub}</b></div>
      </div>
      <div style={styles.rollGrid}>{students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}</div>
      <button style={{ ...styles.btnPrimary, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '100%', marginTop: '30px', padding:'20px' }} onClick={submitAtt}>SUBMIT & DOWNLOAD REPORT</button>
    </div>
  );
    }
