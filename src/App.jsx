import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, User, Fingerprint, 
  BookOpen, Layers, FileSpreadsheet, ChevronRight, 
  CheckCircle2, LayoutGrid, Timer, MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;
const RADIUS_LIMIT = 0.0008;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelSheets, setExcelSheets] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(() => {});
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginPage}>
      <div style={{...styles.glassCard, width: isMobile ? '90%' : '400px'}}>
        <div style={styles.logoBox}><img src="/logo.png" style={styles.mainLogo} alt="Logo" /></div>
        <h1 style={styles.title}>AMRIT ERP</h1>
        <p style={styles.badge}>INSTITUTIONAL GATEWAY</p>
        <div style={styles.inputBox}><User size={18} style={styles.inIcon}/><input id="u" placeholder="User ID" style={styles.inputF}/></div>
        <div style={styles.inputBox}><Fingerprint size={18} style={styles.inIcon}/><input id="p" type="password" placeholder="Passcode" style={styles.inputF}/></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnMain}>ACCESS SYSTEM <ChevronRight size={18}/></button>
      </div>
    </div>
  );

  return (
    <div style={styles.appWrap}>
      <main style={styles.container}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} isMobile={isMobile} setUser={setUser} setView={setView} /> : <FacultyPanel user={user} isMobile={isMobile} setView={setView} />}
      </main>
    </div>
  );
}

// --- REDESIGNED FACULTY PANEL ---
function FacultyPanel({ user, isMobile, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || []));
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub) return alert("Select Class & Subject");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-CAMPUS_LAT,2)+Math.pow(pos.coords.longitude-CAMPUS_LON,2));
      if(dist > RADIUS_LIMIT) { setLoading(false); return alert("❌ OUTSIDE CAMPUS RANGE"); }

      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        present: marked.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();

      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: att.id, student_roll: s.id, class_name: setup.cl }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      alert("✅ Done!"); setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!active) return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.topBar}>
        <div style={fStyles.userPlate}>
          <div style={fStyles.miniAv}>{user.name[0]}</div>
          <div><h4 style={{margin:0}}>Prof. {user.name}</h4><small style={{color:'#818cf8'}}>Faculty Portal</small></div>
        </div>
        <button onClick={()=>setView('login')} style={fStyles.exitBtn}><LogOut size={18}/></button>
      </div>

      <div style={fStyles.section}>
        <label style={fStyles.label}>SELECT CLASS</label>
        <div style={fStyles.tileGrid}>
          {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
            <div key={c} onClick={()=>setSetup({...setup, cl:c})} 
                 style={{...fStyles.tile, borderColor: setup.cl===c?'#6366f1':'#1e293b', background: setup.cl===c?'rgba(99,102,241,0.1)':'#0f172a'}}>
              <LayoutGrid size={20} color={setup.cl===c?'#6366f1':'#475569'}/>
              <span style={{fontWeight:'700', color:setup.cl===c?'#fff':'#94a3b8'}}>{c}</span>
              {setup.cl===c && <div style={fStyles.activeDot}/>}
            </div>
          ))}
        </div>
      </div>

      {setup.cl && (
        <div style={{animation:'fadeIn 0.3s ease'}}>
          <label style={fStyles.label}>SELECT SUBJECT</label>
          <div style={fStyles.subList}>
            {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
              <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} 
                   style={{...fStyles.subRow, background: setup.sub===j.subject_name?'#6366f1':'#1e293b'}}>
                <BookOpen size={16}/> {j.subject_name}
              </div>
            ))}
          </div>

          <label style={fStyles.label}>LECTURE TYPE</label>
          <div style={fStyles.toggleWrap}>
            <button onClick={()=>setSetup({...setup, ty:'Theory'})} style={{...fStyles.toggleBtn, background: setup.ty==='Theory'?'#fff':'transparent', color: setup.ty==='Theory'?'#000':'#fff'}}>Theory</button>
            <button onClick={()=>setSetup({...setup, ty:'Practical'})} style={{...fStyles.toggleBtn, background: setup.ty==='Practical'?'#fff':'transparent', color: setup.ty==='Practical'?'#000':'#fff'}}>Practical</button>
          </div>
        </div>
      )}

      <div style={fStyles.bottomAction}>
        <button onClick={launch} style={fStyles.launchBtn}>START SESSION <ChevronRight/></button>
      </div>
    </div>
  );

  return (
    <div style={fStyles.mobileWrapper}>
      <div style={fStyles.stickyHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <button onClick={()=>setActive(false)} style={fStyles.circleBtn}><ArrowLeft/></button>
          <div><h3 style={{margin:0}}>{setup.cl}</h3><small style={{color:'#818cf8'}}>{setup.sub}</small></div>
        </div>
        <div style={fStyles.statsBadge}><b>{marked.length}</b>/{students.length}</div>
      </div>

      <div style={fStyles.rollArea}>
        {students.map(s => (
          <div key={s.id} onClick={() => { if(window.navigator.vibrate) window.navigator.vibrate(10); setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])}}
               style={{...fStyles.rollChip, background: marked.includes(s.id)?'linear-gradient(135deg, #6366f1, #4f46e5)':'#1e293b', border: marked.includes(s.id)?'none':'1px solid #334155'}}>
            <span style={{fontSize:'10px', opacity:0.5, fontWeight:'800'}}>ROLL</span>
            <span style={{fontSize:'24px', fontWeight:'900'}}>{s.id}</span>
            {marked.includes(s.id) && <CheckCircle2 size={16} style={fStyles.checkIcon}/>}
          </div>
        ))}
      </div>

      <div style={fStyles.bottomAction}>
        <button disabled={loading} onClick={submit} style={{...fStyles.submitBtn, background: loading?'#334155':'#10b981'}}>
          {loading ? "SYNCING GPS..." : `SUBMIT ${marked.length} ATTENDANCE`}
        </button>
      </div>
    </div>
  );
}

// --- HOD PANEL (MINIMAL) ---
function HODPanel({ excelSheets, isMobile, setUser, setView }) {
  return (
    <div style={{textAlign:'center', padding:'50px 20px'}}>
      <h2>HOD Dashboard</h2>
      <p>Manage faculties and check reports.</p>
      <button onClick={()=>setView('login')} style={styles.btnMain}>LOGOUT</button>
    </div>
  );
}

// --- STYLING (THE PERFECT MOBILE UI) ---
const fStyles = {
  mobileWrapper: { padding:'20px 15px 120px 15px', minHeight:'100vh', display:'flex', flexDirection:'column' },
  topBar: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px' },
  userPlate: { display:'flex', alignItems:'center', gap:'12px' },
  miniAv: { width:'40px', height:'40px', background:'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900' },
  exitBtn: { background:'rgba(244,63,94,0.1)', color:'#f43f5e', border:'none', padding:'10px', borderRadius:'12px' },
  
  section: { marginBottom:'25px' },
  label: { fontSize:'11px', fontWeight:'900', color:'#475569', letterSpacing:'1.5px', marginBottom:'15px', display:'block' },
  tileGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  tile: { height:'80px', borderRadius:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer', border:'2px solid transparent', position:'relative', transition:'0.2s' },
  activeDot: { position:'absolute', top:'10px', right:'10px', width:'6px', height:'6px', background:'#6366f1', borderRadius:'50%' },
  
  subList: { display:'flex', flexDirection:'column', gap:'10px', marginBottom:'25px' },
  subRow: { padding:'18px', borderRadius:'15px', fontWeight:'700', fontSize:'14px', display:'flex', alignItems:'center', gap:'12px', transition:'0.2s' },
  
  toggleWrap: { background:'#1e293b', padding:'5px', borderRadius:'15px', display:'flex', gap:'5px' },
  toggleBtn: { flex:1, padding:'12px', border:'none', borderRadius:'11px', fontWeight:'800', fontSize:'12px' },
  
  bottomAction: { position:'fixed', bottom:'20px', left:'20px', right:'20px', zIndex:100 },
  launchBtn: { width:'100%', padding:'20px', borderRadius:'20px', border:'none', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', fontWeight:'900', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:'0 15px 30px rgba(99,102,241,0.3)' },
  
  stickyHeader: { position:'sticky', top:'0', background:'rgba(2, 6, 23, 0.9)', backdropFilter:'blur(10px)', padding:'15px 0', display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:100, marginBottom:'20px' },
  circleBtn: { background:'#1e293b', border:'none', color:'#fff', width:'45px', height:'45px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' },
  statsBadge: { background:'#10b981', padding:'8px 15px', borderRadius:'15px', fontWeight:'900' },
  
  rollArea: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' },
  rollChip: { height:'110px', borderRadius:'25px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative' },
  checkIcon: { position:'absolute', top:'10px', right:'10px', color:'#fff' },
  submitBtn: { width:'100%', padding:'22px', borderRadius:'22px', border:'none', color:'#fff', fontWeight:'900', fontSize:'18px', boxShadow:'0 10px 30px rgba(0,0,0,0.5)' }
};

const styles = {
  appWrap: { minHeight:'100vh', background:'#020617', color:'#f1f5f9', fontFamily:'sans-serif' },
  loginPage: { height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'radial-gradient(circle at top right, #1e1b4b, #020617)' },
  glassCard: { background:'rgba(15, 23, 42, 0.6)', backdropFilter:'blur(20px)', padding:'40px', borderRadius:'40px', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center' },
  logoBox: { width:'70px', height:'70px', background:'#000', borderRadius:'20px', margin:'0 auto 20px', border:'1px solid #6366f1', display:'flex', alignItems:'center', justifyContent:'center' },
  mainLogo: { width:'50px' },
  title: { fontSize:'26px', fontWeight:'900', color:'#fff', margin:0 },
  badge: { fontSize:'10px', color:'#818cf8', fontWeight:'800', marginBottom:'30px', letterSpacing:'1.5px' },
  inputBox: { position:'relative', marginBottom:'12px' },
  inIcon: { position:'absolute', left:'15px', top:'15px', color:'#475569' },
  inputF: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'15px', background:'#020617', border:'1px solid #1e293b', color:'#fff', boxSizing:'border-box' },
  btnMain: { width:'100%', padding:'18px', borderRadius:'15px', background:'linear-gradient(135deg, #6366f1, #4f46e5)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
  container: { maxWidth:'1200px', margin:'0 auto' }
};
