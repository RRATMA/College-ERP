import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, 
  Download, ShieldCheck, User, Search,
  LayoutDashboard, BookOpen, Fingerprint, GraduationCap, Settings, 
  MapPin, CheckCircle, ChevronRight, Users, BarChart3, Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- कॉलेज लोकेशन कॉन्फिगरेशन (GPS Lock) ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  // १. एक्सेल मधून क्लासेसची नावे लोड करणे
  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelClasses(wb.SheetNames);
    }).catch(e => console.error("Excel mapping failed. File not found in public folder."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("ID किंवा पासवर्ड चुकीचा आहे!");
    }
  };

  // --- लॉगिन स्क्रीन ---
  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'55px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>ATTENDANCE SYSTEM</p>
        <div style={styles.inputGroup}>
          <User size={18} style={styles.iconIn} />
          <input id="u" placeholder="Faculty ID" style={styles.inputField} />
        </div>
        <div style={styles.inputGroup}>
          <Fingerprint size={18} style={styles.iconIn} />
          <input id="p" type="password" placeholder="Password" style={styles.inputField} />
        </div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>
          SIGN IN <ShieldCheck size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <div style={styles.userCircle}>{user.name[0]}</div>
          <div className="hide-mobile">
            <b style={{fontSize:'14px'}}>{user.name}</b><br/>
            <small style={{color:'#818cf8'}}>{user.role.toUpperCase()}</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> EXIT</button>
      </nav>

      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </main>

      {/* मोबाईल रिस्पॉन्सिव्हनेस साठी CSS */}
      <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .roll-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
        }
        button:active { transform: scale(0.96); transition: 0.1s; }
      `}</style>
    </div>
  );
}

// --- HOD PANEL: मास्टर कंट्रोल ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [data, setData] = useState({ facs: [], logs: [], assigns: [] });
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    setData({ facs: f || [], logs: l || [], assigns: a || [] });
  };
  useEffect(() => { loadAll(); }, []);

  // मास्टर एक्सेल शीट डाउनलोड फंक्शन
  const downloadMasterSheet = () => {
    if (data.logs.length === 0) return alert("डेटा उपलब्ध नाही!");
    const ws = XLSX.utils.json_to_sheet(data.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance_Report");
    XLSX.writeFile(wb, `Master_Attendance_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div>
      <div className="grid-2" style={styles.statsRow}>
        <div style={styles.statBox}><Users color="#6366f1"/> <div><small>Faculty</small><br/><b>{data.facs.length}</b></div></div>
        <div style={styles.statBox}><BarChart3 color="#10b981"/> <div><small>Total Lectures</small><br/><b>{data.logs.length}</b></div></div>
      </div>

      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <button onClick={downloadMasterSheet} style={styles.downloadBtn}>
            <Download size={18} /> DOWNLOAD MASTER SHEET (.XLSX)
          </button>
          <div style={styles.inputGroup}>
            <Search size={18} style={styles.iconIn} />
            <input style={styles.inputField} placeholder="Class किंवा शिक्षकाचे नाव शोधा..." onChange={e => setSearch(e.target.value)} />
          </div>
          {data.logs.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase())).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} | {log.faculty}</small></div>
              <div style={{textAlign:'right'}}><b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {tab === 'faculties' && data.facs.map(fac => {
        const tCount = data.logs.filter(a => a.faculty === fac.name && a.type === 'Theory').length;
        const pCount = data.logs.filter(a => a.faculty === fac.name && a.type === 'Practical').length;
        return (
          <div key={fac.id} style={styles.itemRow}>
            <div><b>{fac.name}</b><br/><small>ID: {fac.id} | Pass: {fac.password}</small></div>
            <div style={{display:'flex', gap:'8px'}}>
               <div style={styles.miniStat}>T: {tCount}</div>
               <div style={styles.miniStat}>P: {pCount}</div>
            </div>
          </div>
        )
      })}

      {tab === 'manage' && (
        <div className="grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formBox}>
            <h3 style={{marginTop:0}}><Plus size={16}/> Add Teacher</h3>
            <input placeholder="Full Name" style={styles.inputSml} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="Faculty ID" style={styles.inputSml} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadAll(); alert("Teacher Registered!");}}>REGISTER</button>
          </div>
          <div style={styles.formBox}>
            <h3 style={{marginTop:0}}><BookOpen size={16}/> Link Workload</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Faculty</option>{data.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelClasses.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <input placeholder="Subject Name" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Workload Assigned!");}}>ASSIGN SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: हजेरी आणि GPS ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  useEffect(() => {
    if (setup.cl) {
      fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const sheet = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
        setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']), name: s['STUDENT NAME'] })).filter(s => s.id));
      });
    }
  }, [setup.cl]);

  const saveFinal = () => {
    if(marked.length === 0) return alert("किमान एक विद्यार्थी निवडा!");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      // GPS Distance Logic (Simplified)
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > 0.01) return alert("तुम्ही कॉलेज कॅम्पसच्या बाहेर आहात!");
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Attendance Saved Successfully!"); setActive(false); setMarked([]);
    }, () => alert("GPS सुरु करा!"));
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2 style={{textAlign:'center'}}><Clock style={{verticalAlign:'middle', marginRight:'10px'}}/> Setup Session</h2>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, ty:e.target.value})}><option>Theory</option><option>Practical</option></select>
      <button style={styles.btnPrimary} onClick={()=>setup.cl && setup.sub ? setActive(true) : alert("माहिती अपूर्ण आहे!")}>START ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
        <button onClick={()=>setActive(false)} style={styles.backBtn}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl}</b><br/><small>{setup.sub} ({setup.ty})</small></div>
      </div>
      <div className="roll-grid" style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(prev => prev.includes(s.id) ? prev.filter(x=>x!==s.id) : [...prev, s.id])}
               style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b', boxShadow: marked.includes(s.id) ? '0 0 15px #6366f155' : 'none'}}>
            {s.id}
          </div>
        ))}
      </div>
      <div style={styles.floatingAction}>
        <button onClick={saveFinal} style={styles.submitLarge}>SUBMIT ATTENDANCE ({marked.length})</button>
      </div>
    </div>
  );
}

// --- CSS STYLES (OBJECTS) ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(12px)', padding:'40px 30px', borderRadius:'28px', width:'100%', maxWidth:'380px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' },
  logoWrap: { background:'#fff', display:'inline-flex', padding:'15px', borderRadius:'20px', marginBottom:'20px' },
  title: { color:'#fff', margin:0, fontSize:'32px', letterSpacing:'-1px' },
  badge: { color:'#6366f1', fontSize:'11px', fontWeight:'900', letterSpacing:'2px', marginBottom:'35px' },
  inputGroup: { position:'relative', marginBottom:'15px', width:'100%' },
  iconIn: { position:'absolute', left:'15px', top:'15px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'14px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'16px', borderRadius:'14px', background:'linear-gradient(135deg, #6366f1, #a855f7)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', padding:'12px 5%', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #334155', position:'sticky', top:0, zIndex:100 },
  userCircle: { width:'35px', height:'35px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', color:'#f43f5e', border:'none', padding:'8px 15px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  statsRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'25px' },
  statBox: { background:'rgba(30, 41, 59, 0.5)', padding:'20px', borderRadius:'20px', display:'flex', alignItems:'center', gap:'15px', border:'1px solid rgba(255,255,255,0.05)' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'15px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
  downloadBtn: { width:'100%', background:'#10b981', color:'white', border:'none', padding:'12px', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  itemRow: { background:'rgba(30, 41, 59, 0.4)', padding:'15px 20px', borderRadius:'18px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.03)' },
  miniStat: { background:'#1e293b', padding:'5px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:'bold', color:'#818cf8' },
  formBox: { background:'rgba(30, 41, 59, 0.4)', padding:'20px', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'20px' },
  inputSml: { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'12px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  setupCard: { background:'rgba(30, 41, 59, 0.5)', padding:'30px', borderRadius:'25px', maxWidth:'450px', margin:'40px auto' },
  backBtn: { background:'rgba(255,255,255,0.05)', border:'none', color:'#fff', padding:'10px', borderRadius:'50%', cursor:'pointer' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'120px' },
  rollChip: { height:'65px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', border:'1px solid rgba(255,255,255,0.05)', transition:'0.2s' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'20px', background:'rgba(15, 23, 42, 0.95)', borderTop:'1px solid #334155', display:'flex', justifyContent:'center', boxSizing:'border-box' },
  submitLarge: { width:'100%', maxWidth:'500px', height:'55px', background:'#10b981', color:'#fff', border:'none', borderRadius:'15px', fontWeight:'bold', fontSize:'16px', cursor:'pointer' }
};
