import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' },
  loginWrapper: { 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    position: 'relative', 
    background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)',
    overflow: 'hidden' 
  },
  loginCard: { 
    background: '#ffffff', 
    padding: '45px 40px', 
    borderRadius: '30px', 
    width: '380px', 
    textAlign: 'center', 
    zIndex: 10, 
    position: 'relative', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  card: { background: '#1e293b', padding: '25px', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, width: '450px', pointerEvents: 'none', zIndex: 0 },
  label: { fontSize: '11px', color: '#475569', marginBottom: '8px', display: 'block', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { 
    padding: '15px', 
    borderRadius: '12px', 
    backgroundColor: '#f8fafc', 
    color: '#0f172a', 
    border: '2px solid #e2e8f0', 
    width: '100%', 
    marginBottom: '20px', 
    boxSizing: 'border-box',
    fontSize: '16px',
    transition: 'all 0.3s'
  },
  btnPrimary: { 
    background: '#2563eb', 
    color: 'white', 
    padding: '16px', 
    border: 'none', 
    borderRadius: '15px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    width: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px',
    fontSize: '16px',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
  },
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
      else alert("Invalid Credentials!");
    }
  };

  // --- HOME / LOGIN PAGE ---
  if (view === 'login') return (
    <div style={styles.loginWrapper}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '50px', zIndex: 10 }}>
        {/* Circular Logo Container */}
        <div style={{
          background: '#ffffff',
          padding: '10px',
          borderRadius: '50%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          border: '3px solid #3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src="/logo.png" style={{ width: '85px', height: '85px', borderRadius: '50%' }} alt="logo" />
        </div>

        {/* Branding Text */}
        <div style={{ textAlign: 'left', borderLeft: '5px solid #3b82f6', paddingLeft: '20px' }}>
          <h1 style={{ color: '#ffffff', margin: 0, fontSize: '34px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
            ATMA MALIK
          </h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '18px', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>
            Institute of Technology & Research
          </p>
        </div>
      </div>

      <div style={styles.loginCard}>
        <h2 style={{ color: '#1e293b', margin: '0 0 5px 0', fontSize: '28px', fontWeight: '800' }}>AMRIT ERP</h2>
        <div style={{ width: '50px', height: '4px', background: '#3b82f6', margin: '10px auto 25px', borderRadius: '2px' }}></div>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '30px' }}>Attendance Management System</p>
        
        <div style={{ textAlign: 'left' }}>
          <label style={styles.label}>FACULTY ID</label>
          <input id="u" style={styles.input} placeholder="Enter your ID" />
          <label style={styles.label}>PASSWORD</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>

        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
          SIGN IN
        </button>
      </div>
    </div>
  );

  // --- DASHBOARD LAYOUT ---
  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '12px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" style={{ width: '40px', height: '40px' }} alt="nav-logo" />
          <div>
            <b style={{ fontSize: '14px', display: 'block' }}>{user.name}</b>
            <small style={{ color: '#3b82f6', fontSize: '10px' }}>Atma Malik IOTR</small>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <LogOut size={16}/>
        </button>
      </nav>

      <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL ---
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
    setF({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' }); setEditId(null); refresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['1', '3', '2'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px', background: tab === t ? '#3b82f6' : '#1e293b', border: 'none', color: 'white', borderRadius: '10px', fontWeight: 'bold' }}>
            {t === '1' ? 'LOGS' : t === '3' ? 'STATS' : 'MANAGE'}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        {tab === '1' && (
          <div>
            <h3>Attendance Logs</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>{r.class} - {r.sub}<br/><small style={{color:'#94a3b8'}}>{r.faculty} | {r.time_str}</small></span>
                <b style={{ color: '#10b981' }}>{r.present}/{r.total}</b>
              </div>
            ))}
          </div>
        )}

        {tab === '3' && (
          <div style={{ overflowX: 'auto' }}>
            <h3>Faculty Stats</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px' }}><th>NAME</th><th>THEORY</th><th>PRACTICAL</th><th>ACTION</th></tr></thead>
              <tbody>
                {list.faculties.map(fac => {
                  const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                  return (
                    <tr key={fac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{padding: '12px 0'}}>{fac.name}</td><td>{s.theory_count}</td><td>{s.practical_count}</td>
                      <td>
                        <button onClick={() => { setF(fac); setEditId(fac.id); setTab('2'); }} style={{color:'#3b82f6', background:'none', border:'none'}}><Edit3 size={16}/></button>
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
              <h4><UserPlus size={18}/> {editId ? 'Update Faculty' : 'Add Faculty'}</h4>
              <input style={styles.input} value={f.name} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
              <input style={styles.input} value={f.id} placeholder="ID" disabled={editId} onChange={e => setF({...f, id: e.target.value})} />
              <input style={styles.input} value={f.pass} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={saveFac}>SAVE</button>
            </div>
            <div style={styles.mCard}>
              <h4><Database size={18}/> Link Subject</h4>
              <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{...styles.btnPrimary, background: '#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>MAP SUBJECT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL ---
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
      const R = 6371e3; const φ1 = pos.coords.latitude * Math.PI/180; const φ2 = CAMPUS_LAT * Math.PI/180;
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180; const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      if (d > 150) { setLoading(false); return alert("Outside Campus Range!"); }
      
      const dStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: dStr }]);
      setLoading(false); alert("Success!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("GPS Error!"); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <h3><Clock size={20}/> New Session</h3>
      <label style={{color:'#94a3b8', fontSize:'11px'}}>SELECT CLASS</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={{color:'#94a3b8', fontSize:'11px'}}>SELECT SUBJECT</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={{color:'#94a3b8', fontSize:'11px'}}>LECTURE TYPE</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{flex:1}}><label style={{color:'#94a3b8', fontSize:'11px'}}>START</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} /></div>
        <div style={{flex:1}}><label style={{color:'#94a3b8', fontSize:'11px'}}>END</label><input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} /></div>
      </div>
      <button style={{...styles.btnPrimary, opacity: (sel.class && sel.sub) ? 1 : 0.6}} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Fill all details")}>ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <button onClick={() => setIsReady(false)} style={{background:'none', border:'none', color:'#94a3b8'}}><ArrowLeft/></button>
        <b>{sel.class} | {sel.sub}</b>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{...styles.btnPrimary, marginTop: '20px', background: '#10b981'}} onClick={submitAtt}>{loading ? "SAVING..." : "SUBMIT"}</button>
    </div>
  );
}
