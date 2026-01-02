import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const UI_COLORS = {
  navy: '#1e3a8a',
  blue: '#3b82f6',
  green: '#10b981',
  red: '#ef4444',
  bg: '#f1f5f9',
  card: '#ffffff'
};

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: UI_COLORS.bg, fontFamily: "'Inter', sans-serif" },
  loginHero: { 
    background: `linear-gradient(rgba(30, 58, 138, 0.9), rgba(30, 58, 138, 0.95)), url('/campus-bg.jpg') center/cover`,
    height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' 
  },
  glassCard: {
    background: 'rgba(255, 255, 255, 1)',
    borderRadius: '24px', padding: '35px', width: '100%', maxWidth: '420px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.3)'
  },
  headerBox: { textAlign: 'center', marginBottom: '30px' },
  appLabel: { background: UI_COLORS.navy, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', marginBottom: '10px', display: 'inline-block' },
  input: { 
    width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '16px', marginBottom: '15px', 
    boxSizing: 'border-box', transition: '0.2s', outline: 'none' 
  },
  primaryBtn: { 
    width: '100%', padding: '16px', borderRadius: '12px', background: UI_COLORS.navy, color: 'white', 
    fontWeight: 'bold', border: 'none', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(30, 58, 138, 0.2)' 
  },
  navBar: { background: 'white', padding: '10px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 },
  tabBar: { display: 'flex', background: '#e2e8f0', padding: '5px', borderRadius: '15px', marginBottom: '25px' },
  tabItem: (active) => ({ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', background: active ? 'white' : 'transparent', color: active ? UI_COLORS.navy : '#64748b', transition: '0.3s' }),
  card: { background: 'white', borderRadius: '20px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '15px' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelClasses(wb.SheetNames);
    });
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod'); }
    else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginHero}>
      <div style={styles.headerBox}>
        <img src="/logo.png" style={{ width: '85px', height: '85px', marginBottom: '15px', borderRadius: '50%', border: '4px solid white' }} alt="logo" />
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>ATMA MALIK IOTR</h1>
        <p style={{ color: '#93c5fd', margin: 0, fontSize: '13px', fontWeight: '600' }}>FACULTY ERP SYSTEM</p>
      </div>

      <div style={styles.glassCard}>
        <div style={{textAlign: 'center', marginBottom: '25px'}}>
          <span style={styles.appLabel}>V2.0 STABLE</span>
          <h2 style={{margin: 0, fontSize: '20px', color: UI_COLORS.navy}}>Welcome Back</h2>
        </div>
        
        <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '8px'}}>FACULTY ID</label>
        <input id="u" style={styles.input} placeholder="Enter your ID" />
        
        <label style={{fontSize: '12px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '8px'}}>PASSWORD</label>
        <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        
        <button style={styles.primaryBtn} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
        
        <p style={{textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '25px'}}>Designed for Institute of Technology & Research</p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.navBar}>
        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
          <img src="/logo.png" style={{width: '35px'}} alt="logo" />
          <div style={{lineHeight: 1.1}}><b style={{fontSize:'15px'}}>{user.name}</b><br/><small style={{fontSize:'10px', color:UI_COLORS.blue}}>{user.role.toUpperCase()}</small></div>
        </div>
        <button onClick={() => setView('login')} style={{background:'#fee2e2', border:'none', padding:'8px 12px', borderRadius:'10px', color:UI_COLORS.red, fontWeight:'bold', fontSize:'12px'}}>LOGOUT</button>
      </nav>
      
      <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs'); 
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editMode, setEditMode] = useState(false);

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: stats } = await supabase.from('faculty_stats').select('*');
    setList({ faculties: facs || [], attendance: att || [], stats: stats || [] });
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div style={styles.tabBar}>
        {['logs', 'list', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={styles.tabItem(tab === t)}>
            {t === 'logs' ? 'LIVE LOGS' : t === 'list' ? 'FACULTY LIST' : 'SETTINGS'}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <h3 style={{margin:0, fontSize:'18px'}}>Recent Sessions</h3>
            <button onClick={() => {
              const ws = XLSX.utils.json_to_sheet(list.attendance);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Logs");
              XLSX.writeFile(wb, "Master_Sheet.xlsx");
            }} style={{background: UI_COLORS.green, color:'white', border:'none', padding:'8px 15px', borderRadius:'10px', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}><Download size={14}/> EXCEL</button>
          </div>
          {list.attendance.map(r => (
            <div key={r.id} style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                <span style={{fontWeight:'800', fontSize:'16px'}}>{r.class}</span>
                <span style={{color:UI_COLORS.green, fontWeight:'900'}}>{r.present}/{r.total}</span>
              </div>
              <div style={{fontSize:'13px', color:'#64748b'}}><b>{r.sub}</b> • {r.faculty}</div>
              <div style={{fontSize:'11px', color:'#94a3b8', marginTop:'5px'}}>{r.time_str} • {r.type}</div>
            </div>
          ))}
        </>
      )}

      {tab === 'list' && (
        <>
          <h3 style={{fontSize:'18px', marginBottom:'15px'}}>Faculty Performance</h3>
          {list.faculties.map(fac => {
            const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
            return (
              <div key={fac.id} style={styles.card}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:'700'}}>{fac.name}</div>
                    <div style={{fontSize:'11px', color:UI_COLORS.blue, fontWeight:'bold'}}>ID: {fac.id}</div>
                  </div>
                  <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{background:'#eff6ff', color:UI_COLORS.blue, border:'none', padding:'10px', borderRadius:'12px'}}><Edit3 size={18}/></button>
                    <button onClick={async () => {if(window.confirm("Delete Faculty?")){await supabase.from('faculties').delete().eq('id', fac.id); refresh();}}} style={{background:'#fff1f2', color:UI_COLORS.red, border:'none', padding:'10px', borderRadius:'12px'}}><Trash2 size={18}/></button>
                  </div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #f1f5f9'}}>
                  <div style={{textAlign:'center'}}><small style={{color:'#64748b'}}>THEORY</small><br/><b style={{fontSize:'18px'}}>{s.theory_count}</b></div>
                  <div style={{textAlign:'center', borderLeft:'1px solid #f1f5f9'}}><small style={{color:'#64748b'}}>PRACTICAL</small><br/><b style={{fontSize:'18px'}}>{s.practical_count}</b></div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'manage' && (
        <div style={styles.card}>
          <h3 style={{marginTop:0}}>{editMode ? 'Update' : 'Register'} Faculty</h3>
          <input style={styles.input} value={f.name} placeholder="Faculty Full Name" onChange={e => setF({...f, name: e.target.value})} />
          <input style={styles.input} value={f.id} placeholder="Unique ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
          <input style={styles.input} value={f.pass} placeholder="Login Password" onChange={e => setF({...f, pass: e.target.value})} />
          <button style={styles.primaryBtn} onClick={async () => {
            if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
            else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
            setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); alert("Data Saved!"); setTab('list');
          }}>{editMode ? 'CONFIRM CHANGES' : 'CREATE ACCOUNT'}</button>
          
          <div style={{margin:'30px 0', textAlign:'center', borderTop:'1px dotted #cbd5e1', paddingTop:'20px'}}>
            <h4 style={{margin:0, color:'#64748b'}}>Link Subject to Faculty</h4>
          </div>
          
          <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <input style={styles.input} placeholder="Subject Name (e.g. MQC)" onChange={e => setF({...f, sSub: e.target.value})} />
          <button style={{...styles.primaryBtn, background: UI_COLORS.green}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Successfully Linked!"); }}>LINK SUBJECT</button>
        </div>
      )}
    </div>
  );
}

function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
  const [isReady, setIsReady] = useState(false);
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyAssigns(res.data || [])); 
  }, [user.id]);

  useEffect(() => {
    if (sel.class) {
      fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[sel.class]);
        setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No'] || ''), name: s['STUDENT NAME'] })).filter(s => s.id));
      });
    }
  }, [sel.class]);

  const submitAtt = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180; const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 150) { setLoading(false); return alert("Error: Please submit attendance while on campus."); }
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]);
      setLoading(false); alert("Session Recorded Successfully!"); setIsReady(false);
    }, () => { setLoading(false); alert("Location Access Denied!"); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={styles.card}>
      <h3 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}><Clock color={UI_COLORS.blue}/> Setup Session</h3>
      <label style={{fontSize:'11px', fontWeight:'800', color:'#64748b'}}>CLASS</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={{fontSize:'11px', fontWeight:'800', color:'#64748b'}}>SUBJECT</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={{fontSize:'11px', fontWeight:'800', color:'#64748b'}}>TYPE</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={styles.primaryBtn} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Please complete form")}>START ATTENDANCE</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: '#f1f5f9', padding: '12px', borderRadius: '15px' }}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b style={{fontSize:'18px'}}>{sel.class}</b><br/><small style={{color:UI_COLORS.blue, fontWeight:'bold'}}>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ 
                 padding: '18px 0', background: present.includes(s.id) ? UI_COLORS.navy : 'white', 
                 color: present.includes(s.id) ? 'white' : UI_COLORS.navy, borderRadius: '15px', 
                 textAlign: 'center', fontWeight: '900', border: '2px solid #e2e8f0', boxShadow: present.includes(s.id) ? '0 5px 15px rgba(30,58,138,0.3)' : 'none' 
               }}>{s.id}</div>
        ))}
      </div>
      <div style={{marginTop:'30px', padding:'15px', background:'#f8fafc', borderRadius:'15px', border:'1px solid #e2e8f0', textAlign:'center'}}>
         <div style={{fontSize:'13px', color:'#64748b'}}>Total Present: <b style={{fontSize:'20px', color:UI_COLORS.navy}}>{present.length}</b></div>
         <button disabled={loading} style={{ ...styles.primaryBtn, marginTop: '15px', background: UI_COLORS.green }} onClick={submitAtt}>{loading ? "Syncing..." : "SUBMIT TO DATABASE"}</button>
      </div>
    </div>
  );
    }
