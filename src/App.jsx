import React, { useEffect, useState } from 'react';
import { 
  LogOut, Clock, User, Fingerprint, Mail, AlertTriangle, 
  Users, BookOpen, ArrowLeft, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';

// --- Configuration ---
const supabase = createClient(
  "https://fuzvclatvujyiyihscsh.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1enZjbGF0dnVqeXlpaHNjc2giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNTgwMDUyMSwiZXhwIjoyMDUxMzc2NTIxfQ.t8HNoTbe7Y5v_fX7WpE5W9R-m9eG-I1W-G-I1W-G-I1"
);

const CAMPUS_LOC = { lat: 19.7042, lon: 72.7645 };

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [sheets, setSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setSheets(wb.SheetNames);
    }).catch(() => console.log("Excel not found yet."));
  }, []);

  const login = async (id, pass) => {
    if (id === "HODCOM" && pass === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', id).eq('password', pass).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <h1 style={styles.heroTitle}>AMRIT ERP</h1>
        <p style={{color: '#94a3b8', marginBottom: '25px'}}>Institutional Portal</p>
        <div style={styles.inputWrap}><User size={18}/><input id="uid" placeholder="User ID" style={styles.input}/></div>
        <div style={styles.inputWrap}><Fingerprint size={18}/><input id="ups" type="password" placeholder="Password" style={styles.input}/></div>
        <button onClick={() => login(document.getElementById('uid').value, document.getElementById('ups').value)} style={styles.btnPrimary}>AUTHENTICATE</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <div style={styles.avatar}>{user.name[0]}</div>
            <span className="hide-mobile"><b>{user.name}</b></span>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> Logout</button>
        </div>
      </nav>
      <main style={styles.main}>
        {view === 'hod' ? <HODPannel sheets={sheets}/> : <FacultyPannel user={user}/>}
      </main>
      <style>{`
        @media (max-width: 768px) { 
          .hide-mobile { display: none; } 
          .grid-resp { grid-template-columns: 1fr !important; }
          .roll-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

// --- HOD PANNEL ---
function HODPannel({ sheets }) {
  const [tab, setTab] = useState('alerts');
  const [data, setData] = useState({ facs: [], logs: [], alerts: [] });
  const [form, setForm] = useState({ name: '', id: '', pass: '', fId: '', cl: '', sub: '' });

  const fetchData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('critical_absentees_view').select('*');
    setData({ facs: f || [], logs: l || [], alerts: a || [] });
  };
  useEffect(() => { fetchData(); }, []);

  const sendAlert = (roll, className) => {
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[className]);
      const student = rows.find(s => String(s['ROLL NO'] || s['Roll No']) === roll);
      if (student?.Email) {
        emailjs.send('service_7s8u8qc', 'template_z0f0l1v', { 
          to_email: student.Email, 
          student_roll: roll,
          class_name: className 
        }, 'l-T3MhUjIqj9y0U8p')
        .then(() => alert("Alert Email Sent!"));
      } else alert("Email not found in Excel!");
    });
  };

  return (
    <div>
      <div style={styles.tabBar}>
        {['alerts', 'manage', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabBtn, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'alerts' && (
        <div style={styles.fade}>
          <h2 style={styles.secTitle}><AlertTriangle color="#f43f5e"/> 3-Day Absentee Alerts</h2>
          {data.alerts.length === 0 && <p>No critical absentees found.</p>}
          {data.alerts.map(a => (
            <div key={a.student_roll} style={styles.row}>
              <div><b>Roll: {a.student_roll}</b><br/><small>{a.class_name}</small></div>
              <button onClick={() => sendAlert(a.student_roll, a.class_name)} style={styles.emailBtn}><Mail size={14}/> Send Email</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'manage' && (
        <div className="grid-resp" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.card}>
            <h3>Register Faculty</h3>
            <input placeholder="Faculty Name" style={styles.inputSml} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Faculty ID" style={styles.inputSml} onChange={e=>setForm({...form, id:e.target.value})}/>
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, pass:e.target.value})}/>
            <button style={styles.btnAction} onClick={async () => { await supabase.from('faculties').insert([{id:form.id, name:form.name, password:form.pass}]); fetchData(); alert("Success!"); }}>Register</button>
          </div>
          <div style={styles.card}>
            <h3>Link Workload</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Faculty</option>{data.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})}/>
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Linked!"); }}>Assign</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANNEL ---
function FacultyPannel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [list, setList] = useState([]);
  const [marked, setMarked] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setJobs(res.data || []));
  }, [user.id]);

  const start = () => {
    if(!setup.cl || !setup.start) return alert("Select details!");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setList(data.map(s => String(s['ROLL NO'] || s['Roll No'])));
      setActive(true);
    });
  };

  const submit = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LOC.lat, 2) + Math.pow(pos.coords.longitude - CAMPUS_LOC.lon, 2));
      if (dist > 0.005) return alert("You must be on campus!");

      const { data: att } = await supabase.from('attendance').insert([{
        faculty: user.name, sub: setup.sub, class: setup.cl, duration: `${setup.start}-${setup.end}`,
        present: marked.length, total: list.length, time_str: new Date().toLocaleDateString()
      }]).select().single();

      const abs = list.filter(r => !marked.includes(r)).map(r => ({ attendance_id: att.id, student_roll: r, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("Attendance Saved!"); setActive(false);
    });
  };

  if(!active) return (
    <div style={styles.cardCenter}>
      <h2 style={{marginBottom:'20px'}}><Clock/> New Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class</option>{[...new Set(jobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option>{jobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px'}}><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})}/><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})}/></div>
      <button style={styles.btnPrimary} onClick={start}>Take Attendance</button>
    </div>
  );

  return (
    <div>
      <div style={styles.row}>
        <button onClick={()=>setActive(false)} style={styles.backBtn}><ArrowLeft/></button>
        <span><b>{setup.cl}</b> | {setup.sub}</span>
      </div>
      <div className="roll-grid" style={styles.rollGrid}>
        {list.map(r => (
          <div key={r} onClick={() => setMarked(p => p.includes(r) ? p.filter(x=>x!==r) : [...p, r])}
               style={{...styles.chip, background: marked.includes(r) ? '#6366f1' : '#1e293b'}}>{r}</div>
        ))}
      </div>
      <button style={styles.submitBtn} onClick={submit}>SUBMIT ({marked.length}/{list.length})</button>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'#1e293b', padding:'40px', borderRadius:'24px', textAlign:'center', width:'100%', maxWidth:'380px', border:'1px solid #334155' },
  heroTitle: { color:'#fff', fontSize:'28px', margin:0, fontWeight:'bold' },
  inputWrap: { display:'flex', alignItems:'center', background:'#0f172a', padding:'12px', borderRadius:'12px', marginBottom:'15px', color:'#94a3b8', border:'1px solid #334155' },
  input: { background:'transparent', border:'none', color:'#fff', marginLeft:'10px', width:'100%', outline:'none' },
  btnPrimary: { width:'100%', padding:'15px', borderRadius:'12px', background:'#6366f1', color:'#fff', fontWeight:'bold', border:'none', cursor:'pointer' },
  appWrap: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'#0f172a', padding:'15px 20px', borderBottom:'1px solid #334155', position:'sticky', top:0, zIndex:10 },
  navContent: { maxWidth:'1200px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' },
  avatar: { width:'32px', height:'32px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'8px 12px', borderRadius:'8px', cursor:'pointer', fontSize:'14px' },
  main: { padding:'20px', maxWidth:'1200px', margin:'0 auto' },
  tabBar: { display:'flex', gap:'10px', marginBottom:'25px', overflowX:'auto' },
  tabBtn: { padding:'10px 18px', borderRadius:'10px', color:'#fff', border:'1px solid #334155', cursor:'pointer', whiteSpace:'nowrap', fontSize:'13px' },
  row: { background:'#1e293b', padding:'15px', borderRadius:'12px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  card: { background:'#1e293b', padding:'20px', borderRadius:'16px', border:'1px solid #334155' },
  cardCenter: { maxWidth:'400px', margin:'40px auto', background:'#1e293b', padding:'30px', borderRadius:'24px', border:'1px solid #334155' },
  inputSml: { width:'100%', padding:'12px', marginBottom:'12px', borderRadius:'8px', background:'#0f172a', color:'#fff', border:'1px solid #334155', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'8px', background:'#6366f1', color:'#fff', border:'none', cursor:'pointer', fontWeight:'bold' },
  emailBtn: { background:'#10b981', color:'#fff', border:'none', padding:'8px 12px', borderRadius:'8px', display:'flex', gap:'5px', cursor:'pointer', fontSize:'12px' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(70px, 1fr))', gap:'10px', margin:'20px 0' },
  chip: { height:'55px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', border:'1px solid #334155' },
  submitBtn: { width:'100%', padding:'18px', borderRadius:'15px', background:'#10b981', color:'#fff', fontWeight:'bold', fontSize:'18px', border:'none', cursor:'pointer' },
  backBtn: { background:'none', border:'none', color:'#fff', cursor:'pointer' }
};
