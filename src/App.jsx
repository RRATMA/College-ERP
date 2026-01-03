import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Search, User, Fingerprint, Mail, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';

// --- Configuration (तुझ्या जुन्या IDs नुसार) ---
const supabaseUrl = "https://fuzvclatvujyiyihscsh.supabase.co"; 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1enZjbGF0dnVqeXlpaHNjc2giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTgwMDUyMSwiZXhwIjoyMDUxMzc2NTIxfQ.t8HNoTbe7Y5v_fX7WpE5W9R-m9eG-I1W-G-I1W-G-I1";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.005; 

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel mapping error."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Login!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <span><b>{user.name}</b> ({user.role})</span>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> Logout</button>
        </div>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
    </div>
  );
}

// --- HOD PANEL (With Manage Tab) ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('logs');
  const [db, setDb] = useState({ facs: [], logs: [], critical: [] });
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: c } = await supabase.from('critical_absentees_view').select('*');
    setDb({ facs: f || [], logs: l || [], critical: c || [] });
  };
  useEffect(() => { loadData(); }, []);

  const sendEmailAlert = (roll, className) => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[className]);
      const student = sheet.find(s => String(s['ROLL NO'] || s['Roll No']) === roll);
      
      if (student && student.Email) {
        emailjs.send('service_7s8u8qc', 'template_z0f0l1v', { 
          to_email: student.Email,
          student_roll: roll,
          class_name: className 
        }, 'l-T3MhUjIqj9y0U8p').then(() => alert("Email Sent!"));
      } else alert("Email not found in Excel!");
    });
  };

  return (
    <div>
      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'alerts', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'manage' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3>Register Faculty</h3>
            <input placeholder="Name" style={styles.inputSml} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("Faculty Added!");}}>SAVE</button>
          </div>
          <div style={styles.formCard}>
            <h3>Link Workload</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Linked!");}}>LINK</button>
          </div>
        </div>
      )}

      {tab === 'alerts' && db.critical.map(c => (
        <div key={c.student_roll} style={styles.itemRow}>
          <span>Roll: {c.student_roll} ({c.class_name})</span>
          <button onClick={() => sendEmailAlert(c.student_roll, c.class_name)} style={styles.emailBtn}><Mail size={14}/> Notify Parent</button>
        </div>
      ))}
      {/* Logs and Faculties maps can be added here similarly */}
    </div>
  );
}

// --- FACULTY PANEL (Attendance Logic) ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const startAttendance = () => {
    if(!setup.cl || !setup.start) return alert("Select Class and Time!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })));
      setActive(true);
    });
  };

  const submitAttendance = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) return alert("Outside Geofence!");

      const { data: attRecord } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const absents = students.filter(s => !marked.includes(s.id)).map(s => ({
        attendance_id: attRecord.id, student_roll: s.id, class_name: setup.cl
      }));
      if(absents.length > 0) await supabase.from('absentee_records').insert(absents);
      alert("Attendance Saved!"); setActive(false);
    });
  };

  if(!active) return (
    <div style={styles.setupCard}>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} />
      <input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} />
      <button style={styles.btnPrimary} onClick={startAttendance}>Start Attendance</button>
    </div>
  );

  return (
    <div style={styles.rollGrid}>
      {students.map(s => (
        <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
             style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
      ))}
      <button style={styles.submitLarge} onClick={submitAttendance}>Submit ({marked.length}/{students.length})</button>
    </div>
  );
}

const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center' },
  glassCard: { background:'#1e293b', padding:'30px', borderRadius:'20px', width:'320px', textAlign:'center' },
  title: { color:'#fff', marginBottom:'20px' },
  inputGroup: { position:'relative', marginBottom:'15px' },
  iconIn: { position:'absolute', left:'10px', top:'10px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'10px 10px 10px 35px', borderRadius:'8px', background:'#0f172a', color:'#fff', border:'1px solid #334155' },
  btnPrimary: { width:'100%', padding:'12px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'#0f172a', padding:'15px 20px', display:'flex', justifyContent:'space-between' },
  logoutBtn: { background:'#f43f5e', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px' },
  mainArea: { padding:'20px' },
  tabContainer: { display:'flex', gap:'10px', marginBottom:'20px' },
  tabLink: { flex:1, padding:'10px', color:'#fff', border:'1px solid #334155', borderRadius:'8px', cursor:'pointer' },
  itemRow: { background:'#1e293b', padding:'15px', borderRadius:'10px', marginBottom:'10px', display:'flex', justifyContent:'space-between' },
  formCard: { background:'#1e293b', padding:'20px', borderRadius:'15px' },
  inputSml: { width:'100%', padding:'8px', marginBottom:'10px', background:'#0f172a', color:'#fff', border:'1px solid #334155', borderRadius:'5px' },
  btnAction: { width:'100%', padding:'10px', background:'#6366f1', color:'#fff', border:'none', borderRadius:'5px' },
  setupCard: { maxWidth:'400px', margin:'0 auto', background:'#1e293b', padding:'30px', borderRadius:'20px' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px' },
  rollChip: { height:'50px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'10px', cursor:'pointer' },
  submitLarge: { gridColumn:'1/-1', padding:'15px', background:'#10b981', color:'#fff', border:'none', borderRadius:'10px', marginTop:'20px' },
  emailBtn: { background:'#10b981', color:'#fff', border:'none', padding:'5px 10px', borderRadius:'5px', cursor:'pointer', display:'flex', gap:'5px', alignItems:'center' },
  countTag: { background:'#0f172a', padding:'2px 5px', borderRadius:'4px', fontSize:'12px' }
};
