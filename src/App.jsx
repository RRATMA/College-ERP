import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#f0f2f5', color: '#1c1e21', fontFamily: 'sans-serif' },
  topBar: { background: '#1e3a8a', color: '#ffffff', padding: '10px 8%', display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  header: { background: '#ffffff', padding: '15px 8%', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '4px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  loginWrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5' },
  loginCard: { background: '#ffffff', width: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', marginTop: '40px', zIndex: 10 },
  input: { padding: '12px', borderRadius: '6px', backgroundColor: '#ffffff', border: '1px solid #ddd', width: '100%', marginBottom: '15px', boxSizing: 'border-box', fontSize: '15px' },
  btnPrimary: { background: '#1e3a8a', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '16px' },
  card: { background: '#ffffff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, width: '400px', pointerEvents: 'none', zIndex: 0 },
  label: { fontSize: '12px', color: '#1e3a8a', marginBottom: '5px', display: 'block', fontWeight: '700' },
  rollBtn: (active) => ({ padding: '15px 0', background: active ? '#10b981' : '#ffffff', color: active ? 'white' : '#1e3a8a', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid #d1d5db', fontWeight: 'bold' }),
  mGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }
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
    <div style={styles.loginWrapper}>
      <div style={styles.topBar}>
        <div style={{display:'flex', gap:'20px'}}><MapPin size={14}/> Sinnar, Nashik | <Phone size={14}/> +91 2551 222XXX</div>
        <div><Globe size={14}/> atmamalik.edu.in</div>
      </div>
      <header style={styles.header}>
        <div style={{ background: '#fff', padding: '5px', borderRadius: '50%', border: '2px solid #1e3a8a', display:'flex' }}>
          <img src="/logo.png" style={{ width: '70px', height: '70px', borderRadius: '50%' }} alt="logo" />
        </div>
        <div>
          <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: '28px', fontWeight: '900' }}>ATMA MALIK</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>INSTITUTE OF TECHNOLOGY & RESEARCH</p>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        <div style={styles.loginCard}>
          <div style={{ background: '#1e3a8a', color: 'white', padding: '15px', textAlign: 'center' }}><h3 style={{ margin: 0 }}>FACULTY LOGIN</h3></div>
          <div style={{ padding: '30px' }}>
            <label style={styles.label}>FACULTY ID</label>
            <input id="u" style={styles.input} placeholder="Enter ID" />
            <label style={styles.label}>PASSWORD</label>
            <input id="p" type="password" style={styles.input} placeholder="••••••••" />
            <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e3a8a', padding: '12px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" style={{ width: '35px', background: 'white', borderRadius: '50%' }} alt="logo" />
          <b style={{ fontSize: '14px' }}>{user.name} ({user.role.toUpperCase()})</b>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>LOGOUT</button>
      </nav>
      <div style={{ padding: '30px 8%', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
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

  const downloadMasterSheet = () => {
    const ws = XLSX.utils.json_to_sheet(list.attendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceLogs");
    XLSX.writeFile(wb, "Master_Attendance_Sheet.xlsx");
  };

  const handleFaculty = async () => {
    if (editMode) await supabase.from('faculties').update({ name: f.name, password: f.pass }).eq('id', f.id);
    else await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]);
    setF({ name: '', id: '', pass: '' }); setEditMode(false); refresh(); alert("Success!");
  };

  const deleteFac = async (id) => {
    if (window.confirm("Delete this faculty?")) {
      await supabase.from('faculties').delete().eq('id', id);
      refresh();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '25px' }}>
        {['1', '3', '2'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px', background: tab === t ? '#1e3a8a' : '#fff', color: tab === t ? 'white' : '#444', border: '1px solid #ddd', borderRadius: '6px', fontWeight: 'bold', cursor:'pointer' }}>
            {t === '1' ? 'LOGS' : t === '3' ? 'FACULTY LIST' : 'MANAGE'}
          </button>
        ))}
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        
        {tab === '1' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <h3 style={{color:'#1e3a8a'}}>Attendance Records</h3>
              <button onClick={downloadMasterSheet} style={{background:'#10b981', color:'white', border:'none', padding:'10px 15px', borderRadius:'6px', display:'flex', gap:'5px', fontWeight:'bold', cursor:'pointer'}}><Download size={16}/> MASTER SHEET</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <span><b>{r.class}</b> - {r.sub}<br/><small>{r.faculty} | {r.time_str}</small></span>
                <b style={{ color: '#10b981' }}>{r.present}/{r.total}</b>
              </div>
            ))}
          </div>
        )}

        {tab === '3' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ textAlign: 'left', background: '#f8fafc' }}><th style={{padding:'10px'}}>NAME</th><th style={{padding:'10px'}}>ID</th><th style={{padding:'10px'}}>LECTURES</th><th style={{padding:'10px'}}>PRACTICALS</th><th style={{padding:'10px'}}>ACTIONS</th></tr></thead>
            <tbody>
              {list.faculties.map(fac => {
                const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                return (
                  <tr key={fac.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{padding:'10px'}}>{fac.name}</td>
                    <td style={{padding:'10px'}}>{fac.id}</td>
                    <td style={{padding:'10px', fontWeight:'bold', color:'#3b82f6'}}>{s.theory_count}</td>
                    <td style={{padding:'10px', fontWeight:'bold', color:'#10b981'}}>{s.practical_count}</td>
                    <td style={{padding:'10px'}}>
                      <button onClick={() => { setF(fac); setEditMode(true); setTab('2'); }} style={{ color:'#3b82f6', background:'none', border:'none', marginRight:'10px' }}><Edit3 size={16}/></button>
                      <button onClick={() => deleteFac(fac.id)} style={{ color:'#ef4444', background:'none', border:'none' }}><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tab === '2' && (
          <div style={styles.mGrid}>
            <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
              <h4>{editMode ? 'Update Faculty' : 'Add Faculty'}</h4>
              <input style={styles.input} value={f.name} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
              <input style={styles.input} value={f.id} placeholder="ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
              <input style={styles.input} value={f.pass} placeholder="Pass" onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={handleFaculty}>{editMode ? 'UPDATE' : 'SAVE'}</button>
            </div>
            <div style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
              <h4>Link Subject</h4>
              <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input style={styles.input} placeholder="Subject" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{ ...styles.btnPrimary, background: '#10b981' }} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>LINK</button>
            </div>
          </div>
        )}
      </div>
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
      const φ1 = pos.coords.latitude * Math.PI/180; const φ2 = CAMPUS_LAT * Math.PI/180;
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180; const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      if (d > 150) { setLoading(false); return alert("Outside Campus!"); }
      const dStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: dStr }]);
      setLoading(false); alert("Synced!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("GPS Error!"); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <h3><Clock/> New Session</h3>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={{ ...styles.btnPrimary, opacity: (sel.class && sel.sub) ? 1 : 0.6 }} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Fill all")}>OPEN ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: '#eee', padding: '10px', borderRadius: '50%' }}><ArrowLeft/></button>
        <b>{sel.class} | {sel.sub}</b>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{ ...styles.btnPrimary, marginTop: '20px', background: '#10b981' }} onClick={submitAtt}>{loading ? "Checking Location..." : "SUBMIT ATTENDANCE"}</button>
    </div>
  );
}
