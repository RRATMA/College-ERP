import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, CheckCircle2, LayoutGrid, Clock, 
  Users, Calendar, Download, ShieldCheck, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// 📍 CAMPUS SETTINGS
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel not found"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("ID किंवा Password चुकीचा आहे!");
    }
  };

  // --- 🎨 HOME VIEW (ORIGINAL DESIGN) ---
  if (view === 'login') return (
    <div style={landingStyles.wrapper}>
      <img src="/logo.png" style={landingStyles.logo} alt="Logo" />
      <h1 style={landingStyles.title}>AMRIT ERP</h1>
      <p style={landingStyles.subtitle}>Academic Excellence Portal</p>
      <div style={landingStyles.cardGrid}>
        <div style={landingStyles.card} onClick={() => setView('login_hod')}>
          <div style={landingStyles.iconBox}><Layers size={24} color="#6366f1"/></div>
          <div style={{flex:1, textAlign:'left'}}>
            <b style={{display:'block'}}>Admin Portal</b>
            <small style={{color:'#64748b'}}>HOD & Management</small>
          </div>
          <ChevronRight size={18} color="#1e293b"/>
        </div>
        <div style={landingStyles.card} onClick={() => setView('login_faculty')}>
          <div style={{...landingStyles.iconBox, background:'rgba(16,185,129,0.1)'}}><User size={24} color="#10b981"/></div>
          <div style={{flex:1, textAlign:'left'}}>
            <b style={{display:'block'}}>Faculty Terminal</b>
            <small style={{color:'#64748b'}}>Attendance & Records</small>
          </div>
          <ChevronRight size={18} color="#1e293b"/>
        </div>
      </div>
    </div>
  );

  // --- LOGIN FORM ---
  if (view === 'login_hod' || view === 'login_faculty') return (
    <div style={loginStyles.wrapper}>
      <button style={loginStyles.back} onClick={() => setView('login')}><ArrowLeft size={18}/> BACK</button>
      <div style={loginStyles.glassBox}>
        <div style={loginStyles.iconCircle}><ShieldCheck size={32} color="#6366f1"/></div>
        <h2 style={{margin:'0 0 30px 0'}}>{view === 'login_hod' ? 'Admin Access' : 'Faculty Access'}</h2>
        <div style={loginStyles.inputGroup}>
          <User size={18} style={loginStyles.fieldIcon}/><input id="u" placeholder="User ID" style={loginStyles.input}/>
        </div>
        <div style={loginStyles.inputGroup}>
          <Fingerprint size={18} style={loginStyles.fieldIcon}/><input id="p" type="password" placeholder="Passcode" style={loginStyles.input}/>
        </div>
        <button style={loginStyles.btn} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh', background:'#020617'}}>
      {view === 'hod' ? <HODPanel setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
    </div>
  );
}

// --- 👨‍🏫 FACULTY PANEL (3-DAY ABSENCE LOGIC) ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
      setStudents(sh.map(s => ({ id: String(s.RollNo || s['ROLL NO']), email: s.Email || s.email })));
      setActive(true);
    });
  };

  const checkAndSend3DayEmail = async (absentees) => {
    const serviceId = "service_v18e398";
    const templateId = "template_60e6s68";
    const publicKey = "7mXh-E-e3K0Y_vTid";

    for (let s of absentees) {
      // १. मागील २ दिवसांचे रेकॉर्ड्स तपासा (सलगतेसाठी)
      const { data: history } = await supabase
        .from('absentee_records')
        .select('student_roll')
        .eq('student_roll', s.id)
        .eq('class_name', setup.cl)
        .order('created_at', { ascending: false })
        .limit(2);

      // २. जर आधीच २ वेळा गैरहजर असेल (तर आजचा ३ रा दिवस)
      if (history && history.length === 2 && s.email) {
        await emailjs.send(serviceId, templateId, {
          to_email: s.email,
          student_roll: s.id,
          class_name: setup.cl,
          subject_name: setup.sub,
          period: "3 Consecutive Days",
          date: new Date().toLocaleDateString()
        }, publicKey);
        console.log(`Alert: 3rd day email sent for ${s.id}`);
      }
    }
  };

  const submitAttendance = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("Range Error!"); }
      
      const { data: att } = await supabase.from('attendance').insert([{
        faculty: user.name, sub: setup.sub, class: setup.cl,
        present: marked.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB')
      }]).select().single();

      const absentees = students.filter(s => !marked.includes(s.id));
      if(absentees.length > 0) {
        // प्रथम डेटाबेसमध्ये आजचा रेकॉर्ड सेव्ह करा
        await supabase.from('absentee_records').insert(absentees.map(s => ({ 
            attendance_id: att.id, 
            student_roll: s.id,
            class_name: setup.cl 
        })));
        
        // त्यानंतर ३ दिवसांचे लॉजिक तपासा आणि ईमेल पाठवा
        await checkAndSend3DayEmail(absentees);
      }
      
      alert("Attendance Saved. 3-Day Alerts Sent if applicable.");
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if(!active) return (
    <div style={{padding:'20px', color:'#fff'}}>
      <h2>Prof. {user.name}</h2>
      <select onChange={e=>setSetup({...setup, cl:e.target.value})} style={loginStyles.input}>
        <option>Select Class</option>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <button style={loginStyles.btn} onClick={launch}>START SESSION</button>
    </div>
  );

  return (
    <div style={{padding:'20px', color:'#fff'}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px'}}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])} 
               style={{padding:'20px', borderRadius:'15px', background:marked.includes(s.id)?'#6366f1':'#1e293b'}}>
            {s.id}
          </div>
        ))}
      </div>
      <button disabled={loading} onClick={submitAttendance} style={loginStyles.btn}>SUBMIT</button>
    </div>
  );
}

// --- 🏛️ HOD PANEL ---
function HODPanel({ setView }) {
  return <div style={{color:'#fff', padding:'40px'}}>HOD View Active. <button onClick={()=>setView('login')}>Logout</button></div>;
}

// --- 🎨 STYLES (ORIGINAL CENTERED) ---
const landingStyles = {
  wrapper: { minHeight:'100vh', background:'radial-gradient(circle at center, #1e1b4b 0%, #020617 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px' },
  logo: { width:'100px', height:'100px', marginBottom:'20px' },
  title: { fontSize:'42px', fontWeight:'900', color:'#fff', margin:'0' },
  subtitle: { color:'#6366f1', letterSpacing:'4px', fontSize:'11px', fontWeight:'800', textTransform:'uppercase', marginBottom:'50px' },
  cardGrid: { display:'flex', flexDirection:'column', gap:'15px', width:'100%', maxWidth:'350px' },
  card: { background:'rgba(255,255,255,0.03)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.08)', padding:'20px', borderRadius:'22px', display:'flex', alignItems:'center', gap:'15px', cursor:'pointer', color:'#fff' },
  iconBox: { background:'rgba(99,102,241,0.1)', padding:'12px', borderRadius:'15px' }
};

const loginStyles = {
  wrapper: { minHeight:'100vh', background:'#020617', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px' },
  glassBox: { width:'100%', maxWidth:'380px', background:'rgba(15, 23, 42, 0.6)', padding:'40px', borderRadius:'35px', border:'1px solid rgba(255,255,255,0.05)', textAlign:'center', color:'#fff' },
  back: { position:'absolute', top:'30px', left:'30px', border:'none', background:'none', color:'#475569', fontWeight:'bold', cursor:'pointer' },
  inputGroup: { position:'relative', marginBottom:'15px' },
  input: { width:'100%', padding:'16px 16px 16px 48px', background:'#0f172a', border:'1px solid #1e293b', borderRadius:'15px', color:'#fff', boxSizing:'border-box', marginBottom:'10px' },
  fieldIcon: { position:'absolute', left:'16px', top:'16px', color:'#475569' },
  btn: { width:'100%', padding:'16px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'800', marginTop:'15px' }
};
  
