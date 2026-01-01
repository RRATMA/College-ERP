import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, CheckCircle, MapPin, BookOpen, ListChecks, UserPlus, Users, Link as LinkIcon, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// Constants for EmailJS
const SERVICE_ID = "YOUR_SERVICE_ID"; // तुझे ID इथे टाक
const TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const PUBLIC_KEY = "YOUR_PUBLIC_KEY";

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '30px', width: '420px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 10 },
  input: { padding: '12px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', marginBottom: '15px', outline: 'none' },
  btnPrimary: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '25px', marginTop: '20px', border: '1px solid #334155' },
  tabBtn: (active) => ({ padding: '15px', cursor: 'pointer', backgroundColor: active ? '#2563eb' : 'transparent', color: 'white', borderRadius: '12px', border: active ? 'none' : '1px solid #334155', flex: 1, fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }),
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px', marginTop: '20px' },
  rollBtn: (active) => ({ padding: '20px 0', background: active ? '#10b981' : '#334155', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', border: 'none' })
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
    <div style={{ ...styles.container, ...styles.centered, backgroundImage: 'url("/logo.png")', backgroundSize: '400px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'overlay' }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" alt="Logo" style={{ width: '80px', marginBottom: '10px' }} />
        <h1 style={{ color: '#0f172a', fontSize: '18px', fontWeight: '900' }}>ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH</h1>
        <p style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '20px' }}>AMRIT ERP SYSTEM</p>
        <input id="u" style={styles.input} placeholder="User ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={{ ...styles.btnPrimary, width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><span style={{ fontSize: '10px', color: '#94a3b8' }}>COMPUTER DEPT</span><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ ...styles.btnPrimary, background: '#ef4444' }}><LogOut size={16} /> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
  const [list, setList] = useState({ faculties: [], attendance: [], assigns: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });

  const refresh = async () => {
    const { data: fac } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: ass } = await supabase.from('assignments').select('*');
    setList({ faculties: fac || [], attendance: att || [], assigns: ass || [] });
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button style={styles.tabBtn(tab === '1')} onClick={() => setTab('1')}><ListChecks /> Reports</button>
        <button style={styles.tabBtn(tab === '2')} onClick={() => setTab('2')}><UserPlus /> Faculty</button>
        <button style={styles.tabBtn(tab === '3')} onClick={() => setTab('3')}><LinkIcon /> Link Sub</button>
        <button style={styles.tabBtn(tab === '4')} onClick={() => setTab('4')}><Users /> Stats</button>
      </div>
      <div style={styles.card}>
        {tab === '1' && (
          <div>
            <h3>Attendance Log</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '15px', borderBottom: '1px solid #334155', display:'flex', justifyContent:'space-between' }}>
                <div><b>{r.class}</b> - {r.sub} ({r.type})<br/><small>{r.faculty} | {r.time_str} | {r.start_time}-{r.end_time}</small></div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>{r.present}/{r.total}</div>
              </div>
            ))}
          </div>
        )}
        {tab === '2' && (
          <div style={{maxWidth:'400px'}}>
            <h3>Add Faculty</h3>
            <input style={styles.input} placeholder="Name" onChange={e => setF({ ...f, name: e.target.value })} />
            <input style={styles.input} placeholder="ID" onChange={e => setF({ ...f, id: e.target.value })} />
            <input style={styles.input} placeholder="Pass" onChange={e => setF({ ...f, pass: e.target.value })} />
            <button style={{...styles.btnPrimary, background:'#10b981', width:'100%'}} onClick={async () => { await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]); alert("Faculty Added!"); refresh(); }}>Save</button>
          </div>
        )}
        {tab === '3' && (
          <div style={{maxWidth:'400px'}}>
            <h3>Class-Subject Linking</h3>
            <select style={styles.input} onChange={e => setF({ ...f, sFac: e.target.value })}>
              <option value="">Select Faculty</option>
              {list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <select style={styles.input} onChange={e => setF({ ...f, sClass: e.target.value })}>
              <option value="">Select Class</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Subject Name" onChange={e => setF({ ...f, sSub: e.target.value })} />
            <button style={{...styles.btnPrimary, width:'100%'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); refresh(); }}>Confirm</button>
          </div>
        )}
        {tab === '4' && (
          <div style={{textAlign:'center', padding:'40px'}}>
            <h1 style={{fontSize:'50px', color:'#2563eb'}}>{list.attendance.length}</h1>
            <p>Total Lectures Conducted</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL ---
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
      const timeStr = new Date().toLocaleDateString('en-GB');
      
      // 1. Save Summary to Supabase
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type,
        start_time: sel.startTime, end_time: sel.endTime,
        present: present.length, total: students.length, time_str: timeStr 
      }]);

      // 2. Save Individual Logs
      const logs = students.map(s => ({
        student_id: s.id, class_name: sel.class, subject_name: sel.sub,
        status: present.includes(s.id) ? 'P' : 'A', date: timeStr
      }));
      await supabase.from('attendance_logs').insert(logs);

      // 3. Excel Report
      const excelData = students.map(s => ({ 
        "ROLL NO": s.id, "NAME": s.name, "SUBJECT": sel.sub, "TYPE": sel.type,
        "START": sel.startTime, "END": sel.endTime, "STATUS": present.includes(s.id) ? "P" : "A" 
      }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Att");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}.xlsx`);

      alert("Success!");
      setSel({ class: '', sub: '', type: 'Lecture', startTime: '', endTime: '' }); setPresent([]);
    }, () => alert("Enable GPS Access!"));
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <h3>Setup Session</h3>
      <select style={styles.input} onChange={e => setSel({ ...sel, class: e.target.value })}>
        <option value="">Class</option>
        {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={styles.input} onChange={e => setSel({ ...sel, sub: e.target.value })}>
        <option value="">Subject</option>
        {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
      </select>
      <select style={styles.input} value={sel.type} onChange={e => setSel({ ...sel, type: e.target.value })}>
        <option value="Lecture">Lecture</option>
        <option value="Practical">Practical</option>
      </select>
      <div style={{display:'flex', gap:'10px'}}>
        <div style={{flex:1}}><small>Start Time</small><input type="time" style={styles.input} onChange={e=>setSel({...sel, startTime:e.target.value})} /></div>
        <div style={{flex:1}}><small>End Time</small><input type="time" style={styles.input} onChange={e=>setSel({...sel, endTime:e.target.value})} /></div>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
        <button onClick={() => setSel({ ...sel, sub: '' })} style={{...styles.btnPrimary, background:'#475569'}}><ArrowLeft size={18}/> Back</button>
        <span style={{color:'#10b981'}}><MapPin size={18}/> Campus Active</span>
      </div>
      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>
            {s.id}
          </div>
        ))}
      </div>
      <button style={{ ...styles.btnPrimary, background:'#10b981', width: '100%', marginTop: '30px', padding:'18px' }} onClick={submitAtt}>SUBMIT</button>
    </div>
  );
  }
                         
