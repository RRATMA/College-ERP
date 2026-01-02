import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, FileSpreadsheet, Trash2, Edit3, UserPlus, List, CheckCircle, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

const CAMPUS_LAT = 19.7042; const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' },
  loginWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', background: '#0f172a' },
  loginCard: { background: '#ffffff', padding: '40px', borderRadius: '24px', width: '350px', textAlign: 'center', zIndex: 10, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, width: '380px', pointerEvents: 'none', z_index: 0 },
  label: { fontSize: '11px', color: '#94a3b8', marginBottom: '6px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', width: '100%', marginBottom: '15px', boxSizing: 'border-box' },
  btnPrimary: { background: '#2563eb', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  rollBtn: (active) => ({ padding: '15px 0', background: active ? '#10b981' : 'rgba(30, 41, 59, 0.8)', color: 'white', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }),
  mGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  mCard: { background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }
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
      else alert("Invalid Login!");
    }
  };

if (view === 'login') return (
    <div style={styles.loginWrapper}>
      {/* Background Watermark */}
      <img src="/logo.png" style={styles.watermark} />
      
      {/* --- SANJIVANI STYLE TOP HEADER --- */}
      <div style={{ 
        position: 'absolute', 
        top: '40px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '100%', 
        gap: '20px',
        padding: '0 20px'
      }}>
        {/* Left Side Logo */}
        <img src="/logo.png" style={{ width: '90px', height: 'auto', filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' }} />
        
        {/* Right Side College Name */}
        <div style={{ textAlign: 'left', borderLeft: '3px solid #3b82f6', paddingLeft: '20px' }}>
          <h1 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '28px', 
            fontWeight: '900', 
            letterSpacing: '1px',
            lineHeight: '1.1',
            textTransform: 'uppercase'
          }}>
            Atma Malik <br/>
            <span style={{ fontSize: '20px', fontWeight: '500', color: '#3b82f6' }}>
              Institute of Technology & Research
            </span>
          </h1>
        </div>
      </div>

      {/* --- LOGIN CARD --- */}
      <div style={{ ...styles.loginCard, marginTop: '120px' }}>
        <h2 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '24px' }}>AMRIT ERP</h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '25px' }}>Attendance Management System</p>
        
        <div style={{ textAlign: 'left' }}>
          <label style={{...styles.label, color: '#475569'}}>Faculty ID</label>
          <input id="u" style={styles.input} placeholder="Enter your ID" />
          
          <label style={{...styles.label, color: '#475569'}}>Password</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>

        <button 
          style={styles.btnPrimary} 
          onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}
        >
          LOG IN
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ 
        background: '#1e293b', 
        padding: '12px 5%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '2px solid #3b82f6' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" style={{ width: '40px', height: '40px' }} />
          <div>
            <b style={{ fontSize: '14px', display: 'block' }}>{user.name}</b>
            <small style={{ color: '#3b82f6', fontSize: '10px' }}>Atma Malik IOTR</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={16}/> Logout
        </button>
      </nav>

      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" style={{ width: '35px' }} alt="nav-logo" />
          <b style={{ fontSize: '14px' }}>{user.name}</b>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <LogOut size={16}/>
        </button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );

function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editId, setEditId] = useState(null);

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: stats } = await supabase.from('faculty_stats').select('*');
    setList({ faculties: facs || [], attendance: att || [], stats: stats || [] });
  };

  useEffect(() => { refresh(); }, []);

  const saveFac = async () => {
    if (editId) await supabase.from('faculties').update({ name: f.name, password: f.pass }).eq('id', editId);
    else await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]);
    setF({ name: '', id: '', pass: '' }); setEditId(null); refresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['1', '3', '2'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px', background: tab === t ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 'bold' }}>
            {t === '1' ? 'LOGS' : t === '3' ? 'FACULTY STATS' : 'MANAGE'}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} />
        
        {tab === '1' && (
          <div>
            <h3>Attendance Logs</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #334155' }}>
                <span>{r.class} - {r.sub}<br/><small>{r.faculty} | {r.time_str}</small></span>
                <b style={{ color: '#10b981' }}>{r.present}/{r.total}</b>
              </div>
            ))}
          </div>
        )}

        {tab === '3' && (
          <div style={{ overflowX: 'auto' }}>
            <h3>Registered Faculty List</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px' }}><th>NAME</th><th>ID</th><th>LEC</th><th>PRAC</th><th>ACTION</th></tr></thead>
              <tbody>
                {list.faculties.map(fac => {
                  const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                  return (
                    <tr key={fac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{padding: '12px 0'}}>{fac.name}</td><td>{fac.id}</td><td>{s.theory_count}</td><td>{s.practical_count}</td>
                      <td>
                        <button onClick={() => { setF(fac); setEditId(fac.id); setTab('2'); }} style={{color:'#3b82f6', background:'none', border:'none'}}><Edit3 size={16}/></button>
                        <button onClick={async () => { if(window.confirm("Delete?")) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{color:'#ef4444', background:'none', border:'none'}}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === '2' && (
          <div style={styles.mGrid}>
            <div style={styles.mCard}>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><UserPlus color="#3b82f6"/> <b>{editId ? 'UPDATE FACULTY' : 'REGISTER FACULTY'}</b></div>
              <label style={styles.label}>Name</label><input style={styles.input} value={f.name} onChange={e => setF({...f, name: e.target.value})} />
              <label style={styles.label}>ID</label><input style={styles.input} value={f.id} disabled={editId} onChange={e => setF({...f, id: e.target.value})} />
              <label style={styles.label}>Password</label><input style={styles.input} value={f.pass} onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={saveFac}>{editId ? 'UPDATE' : 'SAVE'}</button>
            </div>
            <div style={styles.mCard}>
              <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}><Database color="#10b981"/> <b>LINK SUBJECT</b></div>
              <label style={styles.label}>Faculty</label>
              <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <label style={styles.label}>Class</label>
              <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <label style={styles.label}>Subject</label><input style={styles.input} placeholder="Name" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{...styles.btnPrimary, background: '#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>MAP SUBJECT</button>
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

  useEffect(() => { supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyAssigns(res.data || [])); }, [user.id]);

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
      const dist = 6371e3 * (2 * Math.atan2(Math.sqrt(Math.sin(((CAMPUS_LAT - pos.coords.latitude) * Math.PI/180)/2) ** 2 + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(((CAMPUS_LON - pos.coords.longitude) * Math.PI/180)/2) ** 2), Math.sqrt(1 - (Math.sin(((CAMPUS_LAT - pos.coords.latitude) * Math.PI/180)/2) ** 2 + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(((CAMPUS_LON - pos.coords.longitude) * Math.PI/180)/2) ** 2))));
      if (dist > 150) { setLoading(false); return alert("Outside Campus!"); }
      const d = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: d }]);
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: d }));
      await supabase.from('attendance_logs').insert(logs);
      setLoading(false); alert("Submitted!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("GPS Error!"); }, { enableHighAccuracy: true });
  };

  const isValid = sel.class && sel.sub && sel.startTime && sel.endTime;

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20}/> Check The All Things Before Take Attendance</h3>
      <label style={styles.label}>Class</label><select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>Subject</label><select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={styles.label}>Type</label><select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}><div style={{flex:1}}><label style={styles.label}>Start</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} /></div><div style={{flex:1}}><label style={styles.label}>End</label><input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} /></div></div>
      <button style={{...styles.btnPrimary, opacity: isValid ? 1 : 0.6}} onClick={() => isValid ? setIsReady(true) : alert("Mandatory!")}>ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <button onClick={() => setIsReady(false)} style={{background:'none', border:'none', color:'#94a3b8'}}><ArrowLeft/></button>
        <b>{sel.class} | {sel.sub}</b>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{...styles.btnPrimary, marginTop: '20px', background: '#10b981'}} onClick={submitAtt}>{loading ? "SYNCING..." : "SUBMIT"}</button>
    </div>
  );
}
