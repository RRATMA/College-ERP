import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, FileSpreadsheet, Trash2, Edit3, UserPlus, List } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

const SERVICE_ID = "service_gj2hxal"; 
const TEMPLATE_ID = "template_et0w07w";
const PUBLIC_KEY = "n1VUJUSNKnim4ndVq"; 
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' },
  loginWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', background: '#0f172a' },
  loginCard: { background: '#ffffff', padding: '40px', borderRadius: '24px', width: '350px', textAlign: 'center', zIndex: 10, position: 'relative' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, width: '350px', pointerEvents: 'none', zIndex: 0 },
  label: { fontSize: '11px', color: '#94a3b8', marginBottom: '5px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '10px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', width: '100%', marginBottom: '15px', boxSizing: 'border-box' },
  btnPrimary: { background: '#2563eb', color: 'white', padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  rollBtn: (active) => ({ padding: '15px 0', background: active ? '#10b981' : 'rgba(30, 41, 59, 0.8)', color: 'white', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' })
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelClasses(wb.SheetNames);
    }).catch(e => console.error("Excel Load Error", e));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod'); }
    else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Authentication Failed!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginWrapper}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={styles.loginCard}>
        <img src="/logo.png" style={{ width: '50px', marginBottom: '10px' }} />
        <h2 style={{ color: '#0f172a', margin: '0 0 20px 0' }}>AMRIT ERP</h2>
        <div style={{ textAlign: 'left' }}>
          <label style={{...styles.label, color: '#64748b'}}>Faculty ID</label>
          <input id="u" style={styles.input} placeholder="ID Number" />
          <label style={{...styles.label, color: '#64748b'}}>Password</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <b>{user.name} ({user.role.toUpperCase()})</b>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}><LogOut size={16}/></button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL: LOGS, CRUD & STATS ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: stats } = await supabase.from('faculty_stats').select('*');
    setList({ faculties: facs || [], attendance: att || [], stats: stats || [] });
  };

  useEffect(() => { fetchData(); }, []);

  const saveFac = async () => {
    if (!f.name || !f.id || !f.pass) return alert("All fields mandatory");
    if (editId) { await supabase.from('faculties').update({ name: f.name, password: f.pass }).eq('id', editId); setEditId(null); }
    else { await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]); }
    setF({ name: '', id: '', pass: '' }); fetchData(); alert("Success!");
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setTab('1')} style={{ flex: 1, padding: '12px', background: tab === '1' ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>LOGS</button>
        <button onClick={() => setTab('3')} style={{ flex: 1, padding: '12px', background: tab === '3' ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>LIST & STATS</button>
        <button onClick={() => setTab('2')} style={{ flex: 1, padding: '12px', background: tab === '2' ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>MANAGE</button>
      </div>

      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} />
        
        {tab === '1' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h3>History Logs</h3>
              <button onClick={() => {
                const ws = XLSX.utils.json_to_sheet(list.attendance);
                const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Master");
                XLSX.writeFile(wb, "Master_Attendance_Report.xlsx");
              }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer' }}>Master Excel</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span><b>{r.class}</b> - {r.sub}<br/><small style={{color:'#94a3b8'}}>{r.faculty} | {r.time_str}</small></span>
                <b style={{ color: '#10b981' }}>{r.present}/{r.total}</b>
              </div>
            ))}
          </div>
        )}

        {tab === '3' && (
          <div style={{ overflowX: 'auto' }}>
            <h3>Registered Faculty & Load</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead><tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px', borderBottom: '1px solid #334155' }}><th>NAME</th><th>ID</th><th>LEC</th><th>PRAC</th><th>ACTION</th></tr></thead>
              <tbody>
                {list.faculties.map(fac => {
                  const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                  return (
                    <tr key={fac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{padding: '12px 0'}}>{fac.name}</td><td>{fac.id}</td><td>{s.theory_count}</td><td>{s.practical_count}</td>
                      <td>
                        <button onClick={() => { setF(fac); setEditId(fac.id); setTab('2'); }} style={{ background: 'none', border: 'none', color: '#3b82f6', marginRight: '10px', cursor: 'pointer' }}><Edit3 size={16}/></button>
                        <button onClick={async () => { if(window.confirm("Delete Faculty?")) { await supabase.from('faculties').delete().eq('id', fac.id); fetchData(); } }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === '2' && (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h3>{editId ? 'Edit Faculty' : 'Add New Faculty'}</h3>
            <input style={styles.input} value={f.name} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} value={f.id} placeholder="Faculty ID" disabled={editId} onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} value={f.pass} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={styles.btnPrimary} onClick={saveFac}>{editId ? 'UPDATE DETAILS' : 'REGISTER FACULTY'}</button>
            <hr style={{ margin: '30px 0', opacity: 0.1 }} />
            <h3>Map Subject to Faculty</h3>
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{...styles.btnPrimary, background: '#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Mapped!"); }}>LINK SUBJECT</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL: VALIDATION & GEOLOCTION ---
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
        setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No'] || ''), name: s['STUDENT NAME'], email: s['EMAIL'] })).filter(s => s.id));
      });
    }
  }, [sel.class]);

  const submitAtt = async () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

      if (dist > 150) { setLoading(false); return alert(`Geolocation Error: You are ${Math.round(dist)}m away from campus.`); }

      const timeStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);

      // Email Logic
      for (let s of students) {
        if (!present.includes(s.id)) {
          const { data: past } = await supabase.from('attendance_logs').select('status').eq('student_id', s.id).eq('subject_name', sel.sub).order('created_at', { ascending: false }).limit(3);
          if (past?.length === 3 && past.every(l => l.status === 'A')) {
            emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_name: s.name, to_email: s.email, subject_name: sel.sub, faculty_name: user.name }, PUBLIC_KEY);
          }
        }
      }

      const exportData = students.map(s => ({ "ROLL NO": s.id, "NAME": s.name, "STATUS": present.includes(s.id) ? "P" : "A", "SUBJECT": sel.sub, "SESSION": sel.type, "DATE": timeStr, "TIME": `${sel.startTime}-${sel.endTime}` }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Attendance.xlsx`);

      setLoading(false); alert("Attendance Synced & Exported!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("GPS Error: Please enable location."); }, { enableHighAccuracy: true });
  };

  const isValid = sel.class && sel.sub && sel.startTime && sel.endTime;

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}><Clock size={20}/> Check The All Things Before Take Attendance</h3>
      <label style={styles.label}>Class</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>Subject</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={styles.label}>Session Type</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical / Lab</option></select>
      <div style={{ display: 'flex', gap: '15px' }}>
        <div style={{flex:1}}><label style={styles.label}>Start Time</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} /></div>
        <div style={{flex:1}}><label style={styles.label}>End Time</label><input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} /></div>
      </div>
      <button style={{...styles.btnPrimary, opacity: isValid ? 1 : 0.6}} onClick={() => isValid ? setIsReady(true) : alert("Fill all mandatory fields!")}>ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <button onClick={() => setIsReady(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft/></button>
        <div style={{ textAlign: 'right' }}><b>{sel.class}</b><br/><small>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
        <div style={{textAlign:'center'}}><small>PRESENT</small><br/><b style={{color:'#10b981', fontSize:'22px'}}>{present.length}</b></div>
        <div style={{textAlign:'center'}}><small>TOTAL</small><br/><b style={{fontSize:'22px'}}>{students.length}</b></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{...styles.btnPrimary, marginTop: '25px', background: '#10b981'}} onClick={submitAtt}>{loading ? "PROCESSING..." : "SUBMIT & GENERATE EXCEL"}</button>
    </div>
  );
}
