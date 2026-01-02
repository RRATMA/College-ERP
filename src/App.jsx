import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, Download, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const theme = {
  primary: '#2563eb',
  dark: '#0f172a',
  bg: '#f8fafc',
  white: '#ffffff',
  text: '#1e293b',
  accent: '#3b82f6'
};

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: theme.bg, fontFamily: "'Inter', sans-serif" },
  loginWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    minHeight: '100vh', 
    background: `linear-gradient(135deg, ${theme.dark} 0%, #1e3a8a 100%)`,
    padding: '20px'
  },
  loginCard: { 
    background: 'rgba(255, 255, 255, 0.95)', 
    width: '100%', 
    maxWidth: '400px', 
    borderRadius: '24px', 
    padding: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
    backdropFilter: 'blur(10px)',
    margin: 'auto'
  },
  headerMobile: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  inputGroup: { marginBottom: '20px' },
  label: { fontSize: '12px', fontWeight: '700', color: theme.dark, marginBottom: '8px', display: 'block', letterSpacing: '0.5px' },
  input: { 
    width: '100%', 
    padding: '14px 16px', 
    borderRadius: '12px', 
    border: '2px solid #e2e8f0', 
    fontSize: '16px', 
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  btnPrimary: { 
    width: '100%', 
    padding: '16px', 
    borderRadius: '12px', 
    background: theme.primary, 
    color: 'white', 
    fontWeight: '700', 
    fontSize: '16px', 
    border: 'none', 
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
  },
  nav: {
    background: theme.white,
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  actionCard: {
    background: theme.white,
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
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
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginWrapper}>
      <div style={styles.headerMobile}>
        <img src="/logo.png" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid white', marginBottom: '15px' }} alt="logo" />
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '800' }}>ATMA MALIK</h1>
        <p style={{ color: theme.accent, margin: 0, fontSize: '12px', fontWeight: '600' }}>INSTITUTE OF TECHNOLOGY & RESEARCH</p>
      </div>

      <div style={styles.loginCard}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '22px', textAlign: 'center' }}>AMRIT ERP</h2>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Attendance Management System</p>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>FACULTY ID</label>
          <input id="u" style={styles.input} placeholder="Enter your ID" />
        </div>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>PASSWORD</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>
        
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
          SIGN IN
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" style={{ width: '35px' }} alt="logo" />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontWeight: '800', fontSize: '14px' }}>{user.name}</div>
            <small style={{ color: theme.primary, fontSize: '10px', fontWeight: '700' }}>{user.role.toUpperCase()}</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: '700', fontSize: '12px' }}>LOGOUT</button>
      </nav>

      <div style={{ padding: '20px' }}>
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
      {/* Custom Tab UI */}
      <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', marginBottom: '20px' }}>
        {['logs', 'list', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '12px', background: tab === t ? 'white' : 'transparent', color: tab === t ? theme.primary : '#64748b', boxShadow: tab === t ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <h3 style={{margin:0, fontSize:'18px'}}>Session Logs</h3>
            <button onClick={() => {
              const ws = XLSX.utils.json_to_sheet(list.attendance);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Logs");
              XLSX.writeFile(wb, "Master_Sheet.xlsx");
            }} style={{background:'#10b981', color:'white', border:'none', padding:'8px 12px', borderRadius:'8px', fontSize:'11px', fontWeight:'700'}}><Download size={14}/> EXCEL</button>
          </div>
          {list.attendance.map(r => (
            <div key={r.id} style={styles.actionCard}>
              <div>
                <div style={{fontWeight:'700', fontSize:'15px'}}>{r.class} <span style={{color: theme.primary}}>• {r.sub}</span></div>
                <div style={{fontSize:'12px', color:'#64748b'}}>{r.faculty} | {r.time_str}</div>
              </div>
              <div style={{background:'#f1f5f9', padding:'8px 12px', borderRadius:'10px', fontWeight:'800', color:'#10b981'}}>{r.present}/{r.total}</div>
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
              <div key={fac.id} style={styles.actionCard}>
                <div>
                  <div style={{fontWeight:'700'}}>{fac.name}</div>
                  <div style={{fontSize:'11px', color:'#64748b'}}>ID: {fac.id} | Theory: {s.theory_count} | Practical: {s.practical_count}</div>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{background:'#dbeafe', color:theme.primary, border:'none', padding:'8px', borderRadius:'8px'}}><Edit3 size={16}/></button>
                  <button onClick={async () => {if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', fac.id); refresh();}}} style={{background:'#fee2e2', color:'#ef4444', border:'none', padding:'8px', borderRadius:'8px'}}><Trash2 size={16}/></button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'manage' && (
        <div style={{background:'white', padding:'20px', borderRadius:'20px', border:'1px solid #e2e8f0'}}>
          <h3 style={{marginTop:0}}>{editMode ? 'Update' : 'Add'} Faculty</h3>
          <input style={styles.input} value={f.name} placeholder="Full Name" onChange={e => setF({...f, name: e.target.value})} />
          <input style={styles.input} value={f.id} placeholder="Faculty ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
          <input style={styles.input} value={f.pass} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
          <button style={styles.btnPrimary} onClick={async () => {
            if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
            else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
            setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); alert("Saved!"); setTab('list');
          }}>{editMode ? 'UPDATE FACULTY' : 'ADD NEW FACULTY'}</button>
          
          <hr style={{margin:'25px 0', border:'0', borderTop:'1px solid #e2e8f0'}} />
          
          <h3>Assign Subject</h3>
          <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
          <button style={{...styles.btnPrimary, background:'#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>LINK SUBJECT</button>
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
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 150) { setLoading(false); return alert("Outside Campus!"); }
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]);
      setLoading(false); alert("Submitted!"); setIsReady(false);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!isReady) return (
    <div style={{background:'white', padding:'24px', borderRadius:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.05)'}}>
      <h3 style={{marginTop:0, fontSize:'20px'}}><Clock size={20}/> New Session</h3>
      <label style={styles.label}>CLASS</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Choose Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>SUBJECT</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Choose Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={styles.label}>SESSION TYPE</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={styles.btnPrimary} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Fill All Fields")}>CONTINUE</button>
    </div>
  );

  return (
    <div style={{background:'white', padding:'20px', borderRadius:'24px'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b style={{fontSize:'16px'}}>{sel.class}</b><br/><small style={{color:'#64748b'}}>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={{ padding: '15px 0', background: present.includes(s.id) ? theme.primary : '#f1f5f9', color: present.includes(s.id) ? 'white' : theme.dark, borderRadius: '12px', textAlign: 'center', fontWeight: '800', border: '1px solid #e2e8f0' }}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{ ...styles.btnPrimary, marginTop: '25px', background: '#10b981' }} onClick={submitAtt}>{loading ? "Verifying..." : `SUBMIT (${present.length})`}</button>
    </div>
  );
      }
