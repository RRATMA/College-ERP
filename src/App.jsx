import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, Download, ShieldCheck, 
  User, Search, BookOpen, Fingerprint, MapPin, CheckCircle, 
  Users, BarChart3, Plus, Calendar, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// कॉलेज लोकेशन (GPS Lock साठी)
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  // १. एक्सेल मधून क्लासेसची नावे सुरुवातीलाच लोड करणे
  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel File Missing in Public Folder"));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("चुकीचा ID किंवा पासवर्ड!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'50px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>HOD CONTROL CENTER</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="Faculty ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>SECURE LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <div style={styles.userCircle}>{user.name[0]}</div>
           <b className="hide-mobile">{user.name} <small style={{color:'#6366f1'}}>({user.role})</small></b>
        </div>
        <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={18}/></button>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
      <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none !important; }
          .grid-stack { grid-template-columns: 1fr !important; }
          .roll-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
        }
        button:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}

// --- HOD PANEL: सर्व फीचर्ससह ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('logs');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [] });
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });
  const [search, setSearch] = useState('');
  const [dateFilt, setDateFilt] = useState('');

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [] });
  };
  useEffect(() => { loadData(); }, []);

  const deleteAttendance = async (id) => {
    if(window.confirm("हा रेकॉर्ड कायमचा डिलीट करायचा का?")) {
      await supabase.from('attendance').delete().eq('id', id);
      loadData();
    }
  };

  const downloadMaster = () => {
    const ws = XLSX.utils.json_to_sheet(db.logs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceReport");
    XLSX.writeFile(wb, `Master_Report_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid-stack" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'15px', marginBottom:'20px'}}>
        <div style={styles.statBox}><Users color="#6366f1"/> <div><small>Teachers</small><br/><b>{db.facs.length}</b></div></div>
        <div style={styles.statBox}><BarChart3 color="#10b981"/> <div><small>Lectures</small><br/><b>{db.logs.length}</b></div></div>
        <div style={styles.statBox}><BookOpen color="#a855f7"/> <div><small>Classes</small><br/><b>{excelSheets.length}</b></div></div>
      </div>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* TAB 1: Attendance Logs & Filter */}
      {tab === 'logs' && (
        <>
          <div className="grid-stack" style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:'10px', marginBottom:'15px'}}>
            <div style={styles.inputGroup}><Search size={18} style={styles.iconIn} /><input style={styles.inputField} placeholder="Class किंवा शिक्षक शोधा..." onChange={e=>setSearch(e.target.value)} /></div>
            <button onClick={downloadMaster} style={{...styles.btnPrimary, background:'#10b981'}}><Download size={18}/> EXCEL</button>
          </div>
          <input type="text" placeholder="तारीख फिल्टर (उदा. 01/01/2026)" style={{...styles.inputField, marginBottom:'15px'}} onChange={e=>setDateFilt(e.target.value)} />
          
          {db.logs.filter(l => (l.class+l.faculty).toLowerCase().includes(search.toLowerCase()) && l.time_str.includes(dateFilt)).map(log => (
            <div key={log.id} style={styles.itemRow}>
              <div><b>{log.class}</b><br/><small>{log.sub} | {log.faculty} ({log.type})</small></div>
              <div style={{textAlign:'right'}}>
                <b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/>
                <button onClick={()=>deleteAttendance(log.id)} style={styles.delBtn}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* TAB 2: Faculty Statistics */}
      {tab === 'faculties' && db.facs.map(fac => {
        const theory = db.logs.filter(l => l.faculty === fac.name && l.type === 'Theory').length;
        const practical = db.logs.filter(l => l.faculty === fac.name && l.type === 'Practical').length;
        return (
          <div key={fac.id} style={styles.itemRow}>
            <div><b>{fac.name}</b><br/><small>ID: {fac.id}</small></div>
            <div style={{display:'flex', gap:'10px'}}><div style={styles.miniStat}>T: {theory}</div><div style={styles.miniStat}>P: {practical}</div></div>
          </div>
        )
      })}

      {/* TAB 3: Management (Add Faculty & Workload) */}
      {tab === 'manage' && (
        <div className="grid-stack" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3><Plus size={18}/> Register Teacher</h3>
            <input placeholder="Name" style={styles.inputSml} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("शिक्षक ॲड झाले!");}}>SAVE TEACHER</button>
          </div>
          <div style={styles.formCard}>
            <h3><RefreshCw size={18}/> Assign Workload</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>शिक्षक निवडा</option>{db.facs.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>क्लास निवडा</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="विषयाचे नाव" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("वर्कलोड लिंक झाला!");}}>LINK SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL: हजेरी आणि GPS ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [isRollCall, setIsRollCall] = useState(false);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setAssignments(res.data || []));
  }, [user.id]);

  useEffect(() => {
    if (setup.cl) {
      fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[setup.cl]);
        setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']), name: s['STUDENT NAME'] })).filter(s => s.id));
      });
    }
  }, [setup.cl]);

  const submitFinal = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
      if (dist > 0.01) return alert("कॅम्पसच्या बाहेरून हजेरी घेता येणार नाही!");
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: present.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("हजेरी सबमिट झाली!"); setIsRollCall(false); setPresent([]);
    }, () => alert("GPS सुरु करा!"));
  };

  if (!isRollCall) return (
    <div style={styles.setupCard}>
      <h3 style={{textAlign:'center'}}><Calendar/> New Session</h3>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>क्लास निवडा</option>{[...new Set(assignments.map(a=>a.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>विषय निवडा</option>{assignments.filter(a=>a.class_name===setup.cl).map(a=><option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory</option><option value="Practical">Practical</option></select>
      <button style={styles.btnPrimary} onClick={()=>setup.cl && setup.sub ? setIsRollCall(true) : alert("सर्व माहिती भरा!")}>हजेरी सुरु करा</button>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
        <button onClick={()=>setIsRollCall(false)} style={styles.backBtn}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl}</b><br/><small>{setup.sub}</small></div>
      </div>
      <div className="roll-grid" style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, background: present.includes(s.id) ? '#6366f1' : '#1e293b'}}>
            {s.id}
          </div>
        ))}
      </div>
      <div style={styles.floatingBar}><button onClick={submitFinal} style={styles.submitBtn}>सबमिट ({present.length})</button></div>
    </div>
  );
}

// --- CSS STYLES ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(12px)', padding:'30px', borderRadius:'24px', width:'100%', maxWidth:'360px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' },
  logoWrap: { background:'#fff', padding:'12px', borderRadius:'15px', display:'inline-block', marginBottom:'20px' },
  title: { color:'#fff', margin:0, fontSize:'28px' },
  badge: { color:'#6366f1', fontSize:'10px', fontWeight:'900', letterSpacing:'2px', marginBottom:'30px' },
  inputGroup: { position:'relative', marginBottom:'15px', width:'100%' },
  iconIn: { position:'absolute', left:'15px', top:'15px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'12px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'15px', borderRadius:'12px', background:'linear-gradient(135deg, #6366f1, #a855f7)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', padding:'10px 5%', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #334155', position:'sticky', top:0, zIndex:100 },
  userCircle: { width:'32px', height:'32px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'rgba(244, 63, 94, 0.1)', border:'none', color:'#f43f5e', padding:'8px', borderRadius:'10px', cursor:'pointer' },
  mainArea: { padding:'20px', maxWidth:'1100px', margin:'0 auto' },
  statBox: { background:'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'15px', display:'flex', alignItems:'center', gap:'10px', border:'1px solid rgba(255,255,255,0.05)' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'12px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer' },
  itemRow: { background:'rgba(30, 41, 59, 0.3)', padding:'15px', borderRadius:'15px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.03)' },
  delBtn: { border:'none', background:'none', color:'#f43f5e', cursor:'pointer', marginTop:'5px' },
  miniStat: { background:'#1e293b', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', color:'#818cf8' },
  formCard: { background:'rgba(30, 41, 59, 0.3)', padding:'20px', borderRadius:'18px', border:'1px solid rgba(255,255,255,0.05)' },
  inputSml: { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'10px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  setupCard: { background:'rgba(30, 41, 59, 0.4)', padding:'30px', borderRadius:'20px', maxWidth:'400px', margin:'0 auto', border:'1px solid #334155' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'100px' },
  rollChip: { height:'60px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', border:'1px solid rgba(255,255,255,0.05)' },
  floatingBar: { position:'fixed', bottom:0, left:0, width:'100%', padding:'15px', background:'#0f172a', display:'flex', justifyContent:'center', borderTop:'1px solid #334155' },
  submitBtn: { width:'100%', maxWidth:'400px', padding:'15px', background:'#10b981', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'16px' },
  backBtn: { background:'rgba(255,255,255,0.05)', border:'none', color:'#fff', padding:'10px', borderRadius:'50%' }
};
