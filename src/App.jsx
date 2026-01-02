import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, Download, Menu, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f0f2f5', color: '#1c1e21', fontFamily: 'sans-serif' },
  topBar: { background: '#1e3a8a', color: '#ffffff', padding: '8px 5%', display: 'flex', justifyContent: 'space-between', fontSize: '11px', flexWrap: 'wrap' },
  header: { background: '#ffffff', padding: '15px 5%', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '4px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', flexWrap: 'wrap' },
  loginWrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5', padding: '10px' },
  loginCard: { background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', margin: 'auto', zIndex: 10 },
  input: { padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', width: '100%', marginBottom: '15px', boxSizing: 'border-box', fontSize: '16px' }, // Font 16px for no zoom on iPhone
  btnPrimary: { background: '#1e3a8a', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
  card: { background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden', marginBottom: '20px' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, width: '80%', pointerEvents: 'none', zIndex: 0 },
  label: { fontSize: '12px', color: '#1e3a8a', marginBottom: '5px', display: 'block', fontWeight: '700' },
  rollBtn: (active) => ({ padding: '15px 5px', background: active ? '#10b981' : '#ffffff', color: active ? 'white' : '#1e3a8a', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', border: '1px solid #d1d5db', fontWeight: 'bold', fontSize: '16px' }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }
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
        <span><MapPin size={12}/> Aghai-Mohili, Shahapur</span>
        <span><Globe size={12}/> atmamalik.edu.in</span>
      </div>
      <header style={styles.header}>
        <img src="/logo.png" style={{ width: '55px', borderRadius: '50%', border: '2px solid #1e3a8a' }} alt="logo" />
        <div>
          <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: '20px', fontWeight: '900' }}>ATMA MALIK INSTITUTE OF TECHNOLOGY & RESEARCH</h1>
          <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>ATTENDANCE SYSTEM</p>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        <div style={styles.loginCard}>
          <div style={{ background: '#1e3a8a', color: 'white', padding: '15px', textAlign: 'center' }}><h3 style={{ margin: 0 }}>FACULTY LOGIN</h3></div>
          <div style={{ padding: '25px' }}>
            <label style={styles.label}>FACULTY ID</label>
            <input id="u" style={styles.input} placeholder="Enter ID" autoFocus />
            <label style={styles.label}>PASSWORD</label>
            <input id="p" type="password" style={styles.input} placeholder="••••••••" />
            <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>LOGIN</button>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e3a8a', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" style={{ width: '30px', background: 'white', borderRadius: '50%' }} alt="logo" />
          <div style={{lineHeight: 1}}><b style={{ fontSize: '13px' }}>{user.name}</b><br/><small style={{fontSize: '9px', color: '#93c5fd'}}>{user.role.toUpperCase()}</small></div>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>LOGOUT</button>
      </nav>
      <div style={{ padding: '15px' }}>
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

  return (
    <div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
        {['1', '3', '2'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={{ flex: '1 0 auto', padding: '10px 15px', background: tab === t ? '#1e3a8a' : '#fff', color: tab === t ? 'white' : '#444', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px' }}>
            {t === '1' ? 'LOGS' : t === '3' ? 'FACULTY' : 'MANAGE'}
          </button>
        ))}
      </div>
      
      <div style={styles.card}>
        {tab === '1' && (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
              <h4 style={{margin:0}}>Live Logs</h4>
              <button onClick={() => {
                const ws = XLSX.utils.json_to_sheet(list.attendance);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Logs");
                XLSX.writeFile(wb, "Attendance.xlsx");
              }} style={{background:'#10b981', color:'white', border:'none', padding:'6px 10px', borderRadius:'6px', fontSize:'10px', fontWeight:'bold'}}><Download size={12}/> EXCEL</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                <div style={{display:'flex', justifyContent:'space-between'}}><b>{r.class}</b> <span style={{color: '#10b981'}}>{r.present}/{r.total}</span></div>
                <div style={{color:'#666', fontSize: '11px'}}>{r.sub} • {r.faculty} • {r.time_str}</div>
              </div>
            ))}
          </>
        )}

        {tab === '3' && (
          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{background: '#f8fafc'}}><tr><th style={{padding: '8px'}}>Name</th><th style={{padding: '8px'}}>Lec/Pr</th><th style={{padding: '8px'}}>Act</th></tr></thead>
              <tbody>
                {list.faculties.map(fac => {
                   const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                   return (
                     <tr key={fac.id} style={{ borderBottom: '1px solid #eee' }}>
                       <td style={{padding: '8px'}}>{fac.name}</td>
                       <td style={{padding: '8px'}}>{s.theory_count}/{s.practical_count}</td>
                       <td style={{padding: '8px', display: 'flex', gap: '5px'}}>
                          <Edit3 size={14} color="#3b82f6" onClick={() => {setF(fac); setEditMode(true); setTab('2');}}/>
                          <Trash2 size={14} color="#ef4444" onClick={async () => { if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', fac.id); refresh();}}}/>
                       </td>
                     </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === '2' && (
          <div>
            <div style={{ marginBottom: '20px', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
              <h5 style={{margin: '0 0 10px 0'}}>{editMode ? 'Update Faculty' : 'Add Faculty'}</h5>
              <input style={styles.input} value={f.name} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
              <input style={styles.input} value={f.id} placeholder="ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
              <input style={styles.input} value={f.pass} placeholder="Pass" onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={async () => {
                if(editMode) await supabase.from('faculties').update({ name: f.name, password: f.pass }).eq('id', f.id);
                else await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]);
                setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); alert("Success");
              }}>{editMode ? 'UPDATE' : 'SAVE'}</button>
            </div>
            <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
              <h5 style={{margin: '0 0 10px 0'}}>Link Subject</h5>
              <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{...styles.btnPrimary, background: '#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>LINK</button>
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
      
      if (d > 150) { setLoading(false); return alert("Please go to campus for submission."); }
      const dStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: dStr }]);
      setLoading(false); alert("Success!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("GPS Error!"); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <h3 style={{fontSize: '18px'}}><Clock size={18}/> New Session</h3>
      <label style={styles.label}>Class</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>Subject</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={styles.label}>Type</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={{ ...styles.btnPrimary, opacity: (sel.class && sel.sub) ? 1 : 0.6 }} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Fill all fields")}>START ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: '#eee', padding: '8px', borderRadius: '50%' }}><ArrowLeft size={18}/></button>
        <div style={{textAlign: 'right'}}><b style={{fontSize: '14px'}}>{sel.class}</b><br/><small style={{fontSize: '11px'}}>{sel.sub}</small></div>
      </div>
      <div style={styles.grid}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <div style={{marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center'}}>
        <div style={{fontSize: '12px', color: '#666'}}>Present: <b>{present.length}/{students.length}</b></div>
        <button disabled={loading} style={{ ...styles.btnPrimary, marginTop: '10px', background: '#10b981' }} onClick={submitAtt}>{loading ? "Checking..." : "SUBMIT SESSION"}</button>
      </div>
    </div>
  );
  }
