import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, Download, ShieldCheck, 
  User, Search, BookOpen, Fingerprint, MapPin, CheckCircle, 
  Users, BarChart3, Plus, Calendar, AlertCircle, Info, RefreshCw, X
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
    }).catch(e => console.error("Excel File Missing"));
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
        <div style={styles.logoWrap}><img src="/logo.png" style={{width:'50px'}} alt="logo" /></div>
        <h1 style={styles.title}>AMRIT</h1>
        <p style={styles.badge}>ADVANCED COLLEGE ERP</p>
        <div style={styles.inputGroup}><User size={18} style={styles.iconIn} /><input id="u" placeholder="ID" style={styles.inputField} /></div>
        <div style={styles.inputGroup}><Fingerprint size={18} style={styles.iconIn} /><input id="p" type="password" placeholder="Pass" style={styles.inputField} /></div>
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={styles.btnPrimary}>LOGIN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.appContainer}>
      <nav style={styles.navbar}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <div style={styles.userCircle}>{user.name[0]}</div>
           <b className="hide-mobile">{user.name}</b>
        </div>
        <button onClick={() => setView('login')} style={styles.logoutBtn}><LogOut size={18}/></button>
      </nav>
      <main style={styles.mainArea}>
        {view === 'hod' ? <HODPanel excelSheets={excelSheets} /> : <FacultyPanel user={user} />}
      </main>
      <style>{`
        @media (max-width: 600px) { .hide-mobile { display: none !important; } .grid-stack { grid-template-columns: 1fr !important; } .roll-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>
    </div>
  );
}

// --- HOD PANEL (With Full Faculty CRUD) ---
function HODPanel({ excelSheets }) {
  const [tab, setTab] = useState('logs');
  const [db, setDb] = useState({ facs: [], logs: [], assigns: [] });
  const [editFac, setEditFac] = useState(null);
  const [form, setForm] = useState({ n: '', i: '', p: '', fId: '', cl: '', sub: '' });

  const load = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: a } = await supabase.from('assignments').select('*');
    setDb({ facs: f || [], logs: l || [], assigns: a || [] });
  };
  useEffect(() => { load(); }, []);

  const crudFaculty = async (action, data) => {
    if (action === 'add') await supabase.from('faculties').insert([data]);
    if (action === 'update') await supabase.from('faculties').update({ name: data.name, password: data.password }).eq('id', data.id);
    if (action === 'delete') {
      if (window.confirm("Are you sure? This will delete faculty access.")) 
      await supabase.from('faculties').delete().eq('id', data.id);
    }
    setEditFac(null); load();
  };

  return (
    <div>
      <div style={styles.tabContainer}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, background: tab === t ? '#6366f1' : 'transparent'}}>{t.toUpperCase()}</button>
        ))}
      </div>

      {tab === 'faculties' && (
        <>
          {editFac && (
            <div style={styles.editModal}>
              <h3>Edit Faculty</h3>
              <input style={styles.inputSml} value={editFac.name} onChange={e=>setEditFac({...editFac, name: e.target.value})} />
              <input style={styles.inputSml} value={editFac.password} onChange={e=>setEditFac({...editFac, password: e.target.value})} />
              <div style={{display:'flex', gap:'10px'}}>
                <button style={styles.btnAction} onClick={()=>crudFaculty('update', editFac)}>Update</button>
                <button style={{...styles.btnAction, background:'#334155'}} onClick={()=>setEditFac(null)}>Cancel</button>
              </div>
            </div>
          )}
          {db.facs.map(f => (
            <div key={f.id} style={styles.itemRow}>
              <div><b>{f.name}</b><br/><small>ID: {f.id}</small></div>
              <div style={{display:'flex', gap:'10px'}}>
                <button onClick={()=>setEditFac(f)} style={styles.iconBtn}><Edit3 size={16}/></button>
                <button onClick={()=>crudFaculty('delete', f)} style={{...styles.iconBtn, color:'#f43f5e'}}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'manage' && (
        <div className="grid-stack" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
          <div style={styles.formCard}>
            <h3>Add New Faculty</h3>
            <input placeholder="Full Name" style={styles.inputSml} onChange={e=>setForm({...form, n:e.target.value})} />
            <input placeholder="Faculty ID" style={styles.inputSml} onChange={e=>setForm({...form, i:e.target.value})} />
            <input placeholder="Password" style={styles.inputSml} onChange={e=>setForm({...form, p:e.target.value})} />
            <button style={styles.btnAction} onClick={()=>crudFaculty('add', {id:form.i, name:form.n, password:form.p})}>SAVE</button>
          </div>
          <div style={styles.formCard}>
            <h3>Workload Allotment</h3>
            <select style={styles.inputSml} onChange={e=>setForm({...form, fId:e.target.value})}><option>Select Teacher</option>{db.facs.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputSml} onChange={e=>setForm({...form, cl:e.target.value})}><option>Select Class</option>{excelSheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <input placeholder="Subject" style={styles.inputSml} onChange={e=>setForm({...form, sub:e.target.value})} />
            <button style={{...styles.btnAction, background:'#10b981'}} onClick={async ()=>{await supabase.from('assignments').insert([{fac_id:form.fId, class_name:form.cl, subject_name:form.sub}]); alert("Linked!");}}>LINK</button>
          </div>
        </div>
      )}
      {tab === 'logs' && <div style={{textAlign:'center', padding:'20px'}}>Logs Section (Same as previous)</div>}
    </div>
  );
}

// --- FACULTY PANEL (With Time Tracking) ---
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

  const save = async () => {
    if (!setup.start || !setup.end) return alert("Please select Start & End Time!");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start} to ${setup.end}`,
        present: marked.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Done!"); setActive(false); setMarked([]);
    });
  };

  if (!active) return (
    <div style={styles.setupCard}>
      <h3><Clock/> Setup Lecture</h3>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, cl:e.target.value})}><option>Class</option>{[...new Set(myJobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.inputSml} onChange={e=>setSetup({...setup, sub:e.target.value})}><option>Subject</option>{myJobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
      <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
        <div style={{flex:1}}><small>Start Time</small><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, start:e.target.value})} /></div>
        <div style={{flex:1}}><small>End Time</small><input type="time" style={styles.inputSml} onChange={e=>setSetup({...setup, end:e.target.value})} /></div>
      </div>
      <button style={styles.btnPrimary} onClick={()=>setup.cl && setup.start ? setActive(true) : alert("Complete setup")}>START SESSION</button>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
        <button onClick={()=>setActive(false)} style={styles.backBtn}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{setup.cl}</b><br/><small>{setup.start}-{setup.end}</small></div>
      </div>
      <div className="roll-grid" style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x=>x!==s.id) : [...p, s.id])}
               style={{...styles.rollChip, background: marked.includes(s.id) ? '#6366f1' : '#1e293b'}}>{s.id}</div>
        ))}
      </div>
      <div style={styles.floatingAction}><button onClick={save} style={styles.submitLarge}>SUBMIT ATTENDANCE</button></div>
    </div>
  );
}

const styles = {
  loginPage: { minHeight:'100vh', background:'#020617', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  glassCard: { background:'rgba(30, 41, 59, 0.7)', backdropFilter:'blur(12px)', padding:'30px', borderRadius:'24px', width:'100%', maxWidth:'360px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' },
  title: { color:'#fff', margin:0, fontSize:'28px' },
  badge: { color:'#6366f1', fontSize:'10px', fontWeight:'900', letterSpacing:'2px', marginBottom:'30px' },
  inputGroup: { position:'relative', marginBottom:'15px' },
  iconIn: { position:'absolute', left:'15px', top:'15px', color:'#94a3b8' },
  inputField: { width:'100%', padding:'15px 15px 15px 45px', borderRadius:'12px', border:'1px solid #334155', background:'#0f172a', color:'#fff', boxSizing:'border-box' },
  btnPrimary: { width:'100%', padding:'16px', borderRadius:'12px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer' },
  appContainer: { minHeight:'100vh', background:'#020617', color:'#fff' },
  navbar: { background:'rgba(15, 23, 42, 0.9)', padding:'10px 5%', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #334155' },
  userCircle: { width:'32px', height:'32px', background:'#6366f1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  logoutBtn: { background:'none', border:'none', color:'#f43f5e', cursor:'pointer' },
  mainArea: { padding:'20px', maxWidth:'1000px', margin:'0 auto' },
  tabContainer: { display:'flex', background:'#0f172a', padding:'5px', borderRadius:'12px', marginBottom:'20px' },
  tabLink: { flex:1, border:'none', color:'#fff', padding:'10px', borderRadius:'10px', fontWeight:'bold', cursor:'pointer' },
  itemRow: { background:'rgba(30, 41, 59, 0.3)', padding:'15px', borderRadius:'12px', marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid rgba(255,255,255,0.05)' },
  iconBtn: { background:'none', border:'none', color:'#94a3b8', cursor:'pointer' },
  editModal: { background:'#1e293b', padding:'20px', borderRadius:'15px', marginBottom:'20px', border:'1px solid #6366f1' },
  formCard: { background:'rgba(30, 41, 59, 0.3)', padding:'20px', borderRadius:'15px', border:'1px solid #334155' },
  inputSml: { width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #334155', background:'#0f172a', color:'#fff', marginBottom:'10px', boxSizing:'border-box' },
  btnAction: { width:'100%', padding:'12px', borderRadius:'10px', background:'#6366f1', color:'#fff', border:'none', fontWeight:'bold' },
  setupCard: { background:'rgba(30, 41, 59, 0.4)', padding:'30px', borderRadius:'20px', maxWidth:'400px', margin:'0 auto', border:'1px solid #334155' },
  rollGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(65px, 1fr))', gap:'10px', paddingBottom:'100px' },
  rollChip: { height:'60px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' },
  floatingAction: { position:'fixed', bottom:0, left:0, width:'100%', padding:'15px', background:'#0f172a', display:'flex', justifyContent:'center' },
  submitLarge: { width:'100%', maxWidth:'500px', padding:'15px', background:'#10b981', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'bold' },
  backBtn: { background:'rgba(255,255,255,0.05)', border:'none', color:'#fff', padding:'10px', borderRadius:'50%' }
};
