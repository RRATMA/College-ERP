import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, Download, Search, 
  User, Users, BarChart3, Plus, RefreshCw, BookOpen, Fingerprint,
  Menu, X, CheckCircle2, MoreVertical
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => console.error("Excel mapping missing."));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={styles.glassCard}>
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'55px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>ADVANCED ERP SYSTEM</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="Admin/Faculty ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Password" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>LOG IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={styles.userCircle}>{user.name[0]}</div>
            <div>
              <div style={{fontWeight:'bold', fontSize:'14px'}}>{user.name}</div>
              <div style={{fontSize:'10px', color:'#818cf8', letterSpacing:'1px'}}>{user.role.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={16}/> <span className="hide-mobile">LOGOUT</span></button>
        </div>
      </nav>

      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .grid-responsive { grid-template-columns: 1fr !important; }
          .roll-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
        }
        @media (min-width: 1024px) {
          .main-content { max-width: 1200px; margin: 0 auto; }
        }
        input:focus, select:focus { border-color: #6366f1 !important; outline: none; box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
      `}</style>
    </div>
  );
}

// --- HOD PANEL (Responsive & Pro) ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('logs');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [] });
  const [search, setSearch] = useState('');
  const [editingFac, setEditingFac] = useState(null);
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [] });
  };
  useEffect(() => { loadData(); }, []);

  const totalLectures = db.logs.filter(l => l.type === 'Theory').length;
  const totalPracticals = db.logs.filter(l => l.type === 'Practical').length;

  return (
    <div className="main-content">
      <div className="grid-responsive" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'15px', marginBottom:'25px'}}>
        <div style={styles.statBox}><Users color="#6366f1"/> <div><small>Faculty</small><br/><b>{db.facs.length}</b></div></div>
        <div style={styles.statBox}><BookOpen color="#a855f7"/> <div><small>Theory</small><br/><b>{totalLectures}</b></div></div>
        <div style={styles.statBox}><CheckCircle2 color="#10b981"/> <div><small>Practicals</small><br/><b>{totalPracticals}</b></div></div>
      </div>

      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'logs' && (
        <div style={styles.fadeAnim}>
          <div style={styles.inputGroup}><Search size={18} style={styles.iconIn} /><input style={styles.inputField} placeholder="Search anything..." onChange={e=>setSearch(e.target.value.toLowerCase())} /></div>
          <button onClick={() => {
            const ws = XLSX.utils.json_to_sheet(db.logs);
            const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
            XLSX.writeFile(wb, "HOD_Master_Report.xlsx");
          }} style={styles.downloadBtn}><Download size={18}/> EXCEL REPORT</button>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            {db.logs.filter(l => (l.faculty+l.class+l.sub).toLowerCase().includes(search)).map(log => (
              <div key={log.id} style={styles.itemRow}>
                <div style={{flex:1}}><b>{log.class}</b><br/><small style={{color:'#94a3b8'}}>{log.sub} • {log.faculty}</small></div>
                <div style={{textAlign:'right'}}>
                  <div style={{...styles.typeTag, color: log.type === 'Theory' ? '#6366f1' : '#a855f7'}}>{log.type}</div>
                  <b style={{color:'#10b981'}}>{log.present}/{log.total}</b><br/><small style={{fontSize:'10px', color:'#64748b'}}>{log.time_str}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'faculties' && (
        <div style={styles.fadeAnim}>
          {db.facs.map(f => {
            const tCnt = db.logs.filter(l => l.faculty === f.name && l.type === 'Theory').length;
            const pCnt = db.logs.filter(l => l.faculty === f.name && l.type === 'Practical').length;
            return (
              <div key={f.id} style={styles.itemRow}>
                <div><b style={{fontSize:'16px'}}>{f.name}</b><br/><small style={{color:'#64748b'}}>ID: {f.id}</small></div>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                  <div style={styles.countBadge}>T: {tCnt}</div>
                  <div style={{...styles.countBadge, background:'rgba(168,85,247,0.1)', color:'#a855f7'}}>P: {pCnt}</div>
                  <button onClick={()=>setEditingFac(f)} style={styles.iconBtn}><Edit3 size={18}/></button>
                  <button onClick={async ()=>{ if(window.confirm("Delete?")) { await supabase.from('faculties').delete().eq('id', f.id); loadData(); } }} style={{...styles.iconBtn, color:'#f43f5e'}}><Trash2 size={18}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'manage' && (
        <div className="grid-responsive" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3><Plus size={18}/> New Faculty</h3>
            <input placeholder="Full Name" style={styles.inputSml} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="ID" style={styles.inputSml} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={async ()=>{await supabase.from('faculties').insert([{id:form.i, name:form.n, password:form.p}]); loadData(); alert("Faculty Added!");}}>REGISTER</button>
          </div>
          <div style={styles.formCard}>
            <h3><RefreshCw size={18}/> Load Allotment</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Choose Teacher</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Choose Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject Name" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Linked!");}}>MAP SUBJECT</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (Fully Mobile Responsive) ---
function FacultyPanel({ user }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
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
        setStudents(sheet.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      });
    }
  }, [setup.cl]);

  const saveAttendance = () => {
    if(!setup.start || !setup.end) return alert("Please select lecture timing!");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start} to ${setup.end}`,
        present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Attendance Saved!"); setActive(false); setMarked([]);
    });
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h2 style={{textAlign:'center', marginTop:0, color:'#6366f1'}}><Clock size={30} style={{marginBottom:'10px'}}/><br/>Session Setup</h2>
      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
        <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Select Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
        <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Select Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
        <select style={styles.inputSml} value={setup.ty} onChange={e=>setSetup({...setup, ty:e.target.value})}><option value="Theory">Theory Lecture</option><option value="Practical">Practical Lab</option></select>
        
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
          <div><small style={{color:'#94a3b8'}}>Start Time</small><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} /></div>
          <div><small style={{color:'#94a3b8'}}>End Time</small><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} /></div>
        </div>
        <button style={styles.btnPrimary} onClick={()=>setup.cl && setup.start ? setActive(true) : alert("Fill all details")}>OPEN ROLL CALL</button>
      </div>
    </div>
  );

  return (
    <div style={styles.fadeAnim}>
      <div style={styles.stickyHeader}>
        <button onClick={()=>setActive(false)} style={styles.backBtn}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}>
          <b style={{fontSize:'16px'}}>{setup.cl}</b><br/>
          <small style={{color:'#818cf8'}}>{setup.ty} | {setup.start}-{setup.end}</small>
        </div>
      </div>
      
      <div className="roll-grid" style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, 
                       background: marked.includes(s.id) ? 'linear-gradient(135deg, #6366f1, #a855f7)' : 'rgba(30, 41, 59, 0.5)',
                       border: marked.includes(s.id) ? 'none' : '1px solid #334155'}}>
            {s.id}
          </div>
        ))}
      </div>
      
      <div style={styles.floatingAction}>
        <button onClick={saveAttendance} style={styles.submitLarge}>
          SUBMIT ATTENDANCE ({marked.length}/{students.length})
        </button>
      </div>
    </div>
  );
}

// --- PRO STYLES (UI/UX Optimized) ---
const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(15, 23, 42, 0.8)', backdropFilter:'blur(15px)', padding:'40px 30px', borderRadius:'30px', width:'100%', maxWidth:'400px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' },
  logoWrap: { background:'#fff', display:'inline-flex', padding:'12px', borderRadius:'18px', marginBottom:'20px' },
  title: { color:'#fff', margin:0, fontSize:'32px', letterSpacing:'-1px', fontWeight:'800' },
  badge: { color:'#6366f1', fontSize:'11px', fontWeight:'900', letterSpacing:'3px', marginBottom:'35px' },
  inputGroup: { position:'relative', marginBottom:'18px' },
  iconIn: { position:'absolute', left:'15px', top:'15px', color:'#64748b' },
  inputField: { width:'100%', padding:'15px 15px 15px 48px', borderRadius:'15px', border:'1px solid #1e293b', background:'#0f172a', color:'#fff', boxSizing:'border-box', transition:'0.3s' },
  btnPrimary: { width:'100%', padding:'16px', borderRadius:'15px', background:'linear-gradient(135deg, #6366f1, #a855f7)', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer', fontSize:'16px', boxShadow:'0 10px 15px -3px rgba(99,102,241,0.4)' },
  
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff', fontFamily:'"Inter", sans-serif' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', backdropFilter:'blur(10px)', borderBottom:'1px solid #1e293b', position:'sticky', top:0, zIndex:1000 },
  navContent: { maxWidth:'1200px', margin:'0 auto', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  userCircle: { width:'38px', height:'38px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', fontSize:'18px' },
  logoutBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'8px 16px', borderRadius:'12px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' },
  
  mainArea: { padding:'20px', minHeight:'calc(100vh - 80px)' },
  statBox: { background:'rgba(30,41,59,0.4)', padding:'20px', borderRadius:'24px', display:'flex', alignItems:'center', gap:'15px', border:'1px solid rgba(255,255,255,0.03)' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'6px', borderRadius:'18px', marginBottom:'25px', border:'1px solid #1e293b' },
  tabLink: { flex:1, border:'none', color:'#94a3b8', padding:'12px', borderRadius:'14px', fontWeight:'600', cursor:'pointer', transition:'0.3s' },
  
  itemRow: { background:'rgba(30,41,59,0.3)', padding:'18px 20px', borderRadius:'20px', marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.02)', transition:'0.2s' },
  countBadge: { background:'rgba(99,102,241,0.1)', color:'#6366f1', padding:'5px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:'bold' },
  typeTag: { fontSize:'10px', fontWeight:'800', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' },
  iconBtn: { background:'rgba(255,255,255,0.03)', border:'none', color:'#94a3b8', padding:'10px', borderRadius:'12px', cursor:'pointer' },
  
  formCard: { background:'rgba(30,41,59,0.4)', padding:'25px', borderRadius:'26px', border:'1px solid #1e293b' },
  inputSml: { width:'100%', padding:'12px 15px', borderRadius:'12px', border:'1px solid #1e293b', background:'#0f172a', color:'#fff', marginBottom:'12px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'14px', borderRadius:'12px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  
  setupCard: { background:'rgba(30,41,59,0.5)', padding:'35px', borderRadius:'30px', maxWidth:'480px', margin:'40px auto', border:'1px solid #1e293b', boxShadow:'0 20px 25px -5px rgba(0,0,0,0.3)' },
  stickyHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'15px 20px', background:'rgba(15,23,42,0.8)', backdropFilter:'blur(10px)', borderRadius:'20px', marginBottom:'20px', position:'sticky', top:'80px', zIndex:100 },
  backBtn: { background:'rgba(255,255,255,0.05)', border:'none', color:'#fff', padding:'10px', borderRadius:'14px', cursor:'pointer' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(75px, 1fr))', gap:'12px', paddingBottom:'120px' },
  rollChip: { height:'70px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'18px', fontWeight:'bold', fontSize:'18px', cursor:'pointer', transition:'0.2s' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'25px 20px', background:'linear-gradient(to top, #020617 80%, transparent)', display:'flex', justifyContent:'center', boxSizing:'border-box' },
  submitLarge: { width:'100%', maxWidth:'600px', height:'60px', background:'linear-gradient(135deg, #10b981, #059669)', color:'#fff', border:'none', borderRadius:'18px', fontWeight:'800', fontSize:'17px', cursor:'pointer', boxShadow:'0 10px 20px -5px rgba(16,185,129,0.4)' },
  downloadBtn: { width:'100%', background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)', padding:'14px', borderRadius:'15px', fontWeight:'bold', cursor:'pointer', marginBottom:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  fadeAnim: { animation: 'fadeIn 0.4s ease-in-out' }
};
