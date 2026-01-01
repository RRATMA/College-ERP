import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, CheckCircle, MapPin, GraduationCap, Users, BookOpen, ListChecks, PlusCircle, UserPlus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Professional UI Styles ---
const styles = {
  container: { width: '100vw', minHeight: '100vh', color: 'white', fontFamily: '"Inter", sans-serif' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '30px', width: '450px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', zIndex: 10 },
  input: { padding: '14px', borderRadius: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', width: '100%', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' },
  btn: (bg) => ({ backgroundColor: bg, color: 'white', padding: '14px 20px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', transition: '0.3s' }),
  nav: { background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '24px', marginTop: '20px', border: '1px solid #334155' },
  tabBtn: (active) => ({ padding: '12px 24px', cursor: 'pointer', border: 'none', backgroundColor: active ? '#2563eb' : '#0f172a', color: 'white', borderRadius: '10px', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }),
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '15px', marginTop: '20px' },
  rollBtn: (active) => ({ padding: '20px 0', background: active ? '#10b981' : '#1e293b', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', border: active ? '2px solid #34d399' : '1px solid #334155', transition: '0.2s' })
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [faculties, setFaculties] = useState([]);
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    const initData = async () => {
      try {
        const { data } = await supabase.from('faculties').select('*');
        setFaculties(data || []);
        const res = await fetch('/students_list.xlsx');
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const wb = XLSX.read(ab, { type: 'array' });
          setExcelClasses(wb.SheetNames);
        }
      } catch (err) { console.error("Init Error:", err); }
    };
    initData();
  }, []);

  const handleLogin = (u, p) => {
    const uid = u.trim();
    const pass = p.trim();
    if (uid === "HODCOM" && pass === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod');
    } else {
      const f = faculties.find(x => x.id === uid && x.password === pass);
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed! Please check ID & Password.");
    }
  };

  if (view === 'login') return (
    <div style={{ 
      ...styles.container, 
      ...styles.centered,
      backgroundColor: '#0b1120',
      backgroundImage: 'url("/logo.png")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: '500px',
      backgroundBlendMode: 'overlay'
    }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" alt="Logo" style={{ width: '90px', marginBottom: '15px' }} />
        <h1 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.3', marginBottom: '5px' }}>
          Atma Malik Institute of Technology and Research
        </h1>
        <p style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '14px', marginBottom: '30px' }}>AMRIT</p>
        
        <input id="u" style={styles.input} placeholder="User ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={{ ...styles.btn('#2563eb'), width: '100%', marginTop: '10px' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
          LOGIN
        </button>
      </div>
    </div>
  );

  return (
    <div style={{...styles.container, backgroundColor: '#0b1120'}}>
      <nav style={styles.nav}>
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>DEPARTMENT OF COMPUTER ENGINEERING</span>
          <br /><b>{user.name} ({user.role.toUpperCase()})</b>
        </div>
        <button onClick={() => setView('login')} style={{ ...styles.btn('#ef4444'), padding: '8px 16px' }}><LogOut size={16} /> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (COMPLETE) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('report');
  const [data, setData] = useState({ faculties: [], assigns: [], attendance: [] });
  const [form, setForm] = useState({ fName: '', fId: '', fPass: '', sFac: '', sClass: '', sSub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: a } = await supabase.from('assignments').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setData({ faculties: f || [], assigns: a || [], attendance: att || [] });
  };

  useEffect(() => { loadData(); }, []);

  const onAddFac = async () => {
    if(!form.fId || !form.fName) return alert("All fields required!");
    await supabase.from('faculties').insert([{ id: form.fId, name: form.fName, password: form.fPass }]);
    alert("Faculty Registered!"); loadData();
  };

  const onAssign = async () => {
    if(!form.sFac || !form.sClass || !form.sSub) return alert("Select all details!");
    await supabase.from('assignments').insert([{ fac_id: form.sFac, class_name: form.sClass, subject_name: form.sSub }]);
    alert("Subject Assigned!"); loadData();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button style={styles.tabBtn(tab==='report')} onClick={()=>setTab('report')}><ListChecks size={20}/> Attendance Reports</button>
        <button style={styles.tabBtn(tab==='fac')} onClick={()=>setTab('fac')}><UserPlus size={20}/> Add Faculty</button>
        <button style={styles.tabBtn(tab==='assign')} onClick={()=>setTab('assign')}><PlusCircle size={20}/> Assign Subjects</button>
      </div>

      <div style={styles.card}>
        {tab === 'report' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#94a3b8', textAlign: 'left', borderBottom: '2px solid #334155' }}>
                  <th style={{ padding: '15px' }}>Date & Time</th><th>Class</th><th>Subject</th><th>Faculty</th><th>Present</th>
                </tr>
              </thead>
              <tbody>
                {data.attendance.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '15px' }}>{r.time_str}</td><td>{r.class}</td><td>{r.sub}</td><td>{r.faculty}</td>
                    <td style={{ color: '#34d399', fontWeight: 'bold' }}>{r.present} / {r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'fac' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h3>Register New Faculty</h3>
            <input style={styles.input} placeholder="Name" onChange={e=>setForm({...form, fName: e.target.value})} />
            <input style={styles.input} placeholder="ID (Username)" onChange={e=>setForm({...form, fId: e.target.value})} />
            <input style={styles.input} type="password" placeholder="Password" onChange={e=>setForm({...form, fPass: e.target.value})} />
            <button style={{...styles.btn('#10b981'), width: '100%'}} onClick={onAddFac}>Register Faculty</button>
          </div>
        )}

        {tab === 'assign' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h3>Link Faculty to Class</h3>
            <select style={styles.input} onChange={e=>setForm({...form, sFac: e.target.value})}>
              <option value="">-- Choose Faculty --</option>
              {data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select style={styles.input} onChange={e=>setForm({...form, sClass: e.target.value})}>
              <option value="">-- Choose Class --</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Subject Name" onChange={e=>setForm({...form, sSub: e.target.value})} />
            <button style={{...styles.btn('#2563eb'), width: '100%'}} onClick={onAssign}>Assign Now</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (COMPLETE) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '' });
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
        const sheet = wb.Sheets[sel.class];
        if (sheet) {
          const data = XLSX.utils.sheet_to_json(sheet);
          setStudents(data.map(s => ({
            id: String(s['ROLL NO'] || s['Roll No'] || ''),
            name: s['STUDENT NAME'] || s['Student Name'] || '',
            email: s['EMAIL'] || s['Email'] || ''
          })).filter(s => s.id));
        }
      });
    }
  }, [sel.class]);

  const submitAtt = async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - 19.5545, 2) + Math.pow(pos.coords.longitude - 73.2522, 2));
      if (dist > 0.005) return alert("❌ Error: Outside Campus!");

      const timeStr = new Date().toLocaleString('en-GB');

      // 1. Database
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, present: present.length, total: students.length, time_str: timeStr }]);
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A' }));
      await supabase.from('attendance_logs').insert(logs);

      // 2. 3-Day Absent Email
      for (const s of students.filter(x => !present.includes(x.id))) {
        const { data: history } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
        if (history?.length === 3 && history.every(h => h.status === 'A') && s.email) {
          emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', { student_name: s.name, to_email: s.email, subject: sel.sub, date: timeStr }, 'YOUR_PUBLIC_KEY');
        }
      }

      // 3. 5-Column Excel
      const excelData = students.map(s => ({ "ROLL NO": s.id, "NAME": s.name, "SUBJECT": sel.sub, "DATE_TIME": timeStr, "STATUS": present.includes(s.id) ? "P" : "A" }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Attendance.xlsx`);

      alert("✅ Attendance Submitted!");
      setSel({ class: '', sub: '' }); setPresent([]);
    }, () => alert("Please enable GPS!"));
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><BookOpen /> Start Session</h2>
      <select style={{...styles.input, backgroundColor: '#0b1120'}} onChange={e => setSel({ ...sel, class: e.target.value })}>
        <option value="">-- Select Class --</option>
        {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={{...styles.input, backgroundColor: '#0b1120', marginTop: '10px'}} onChange={e => setSel({ ...sel, sub: e.target.value })}>
        <option value="">-- Select Subject --</option>
        {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
      </select>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setSel({ class: '', sub: '' })} style={styles.btn('#475569')}><ArrowLeft size={18} /> Back</button>
        <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
          <MapPin size={20} /> Campus Geofence Active
        </div>
      </div>

      <div style={{ background: '#0b1120', padding: '15px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' }}>
        <h4 style={{ margin: 0, color: '#94a3b8' }}>{sel.class} | {sel.sub}</h4>
        <p style={{ fontSize: '24px', fontWeight: '900', margin: '5px 0' }}>Present: {present.length} / {students.length}</p>
      </div>

      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>
            {s.id}
          </div>
        ))}
      </div>

      <button style={{ ...styles.btn('#10b981'), width: '100%', marginTop: '30px', padding: '20px', fontSize: '18px' }} onClick={submitAtt}>
        <CheckCircle /> SUBMIT ATTENDANCE
      </button>
    </div>
  );
    }
      
