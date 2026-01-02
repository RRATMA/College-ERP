import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, CheckCircle, List } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' },
  loginWrapper: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative', background: '#0f172a', overflow: 'hidden' },
  loginCard: { background: '#ffffff', padding: '40px', borderRadius: '24px', width: '350px', textAlign: 'center', zIndex: 10, position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, width: '400px', pointerEvents: 'none', zIndex: 0 },
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
      else alert("Invalid Credentials!");
    }
  };

  // --- 1. Login Screen ---
  // हा कोड App.js मधील 'if (view === "login")' च्या जागी रिप्लेस कर.

// --- HOME PAGE (LOGIN VIEW) ---
  if (view === 'login') return (
    <div style={{
      ...styles.loginWrapper,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Deep professional gradient
      display: 'flex',
      flexDirection: 'column',
      gap: '30px'
    }}>
      {/* Background Watermark - Perfectly Centered */}
      <img src="/logo.png" style={{...styles.watermark, zIndex: 0, opacity: 0.05}} alt="bg" />
      
      {/* --- SANJIVANI STYLE HEADER --- */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '20px', 
        zIndex: 10,
        animation: 'fadeInDown 0.8s ease-out' 
      }}>
        {/* Circle Logo with Glow */}
        <div style={{
          background: '#ffffff',
          padding: '8px',
          borderRadius: '50%',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)', // Blue glow effect
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #3b82f6'
        }}>
          <img src="/logo.png" style={{ width: '75px', height: '75px', borderRadius: '50%' }} alt="college-logo" />
        </div>

        {/* College Text Branding */}
        <div style={{ 
          textAlign: 'left', 
          borderLeft: '4px solid #3b82f6', 
          paddingLeft: '20px' 
        }}>
          <h1 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '30px', 
            fontWeight: '900', 
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            lineHeight: '1.1',
            fontFamily: 'serif' // Makes it look more academic/official
          }}>
            Atma Malik
          </h1>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '16px', 
            color: '#60a5fa', // Lighter blue for better readability on dark bg
            fontWeight: '600',
            letterSpacing: '0.8px',
            textTransform: 'uppercase'
          }}>
            Institute of Technology & Research
          </p>
        </div>
      </div>

      {/* --- LOGIN CARD --- */}
      <div style={{ 
        ...styles.loginCard, 
        width: '380px', // Slightly wider for better spacing
        borderRadius: '24px', 
        padding: '45px 40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#ffffff',
        zIndex: 10
      }}>
        <div style={{ marginBottom: '35px' }}>
          <h2 style={{ 
            color: '#0f172a', 
            margin: 0, 
            fontSize: '26px', 
            fontWeight: '800',
            letterSpacing: '-0.5px' 
          }}>AMRIT ERP</h2>
          <div style={{ 
            width: '40px', 
            height: '4px', 
            background: '#3b82f6', 
            margin: '8px auto', 
            borderRadius: '2px' 
          }}></div>
          <p style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
            Faculty & Staff Attendance Portal
          </p>
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              fontSize: '11px', 
              color: '#475569', 
              fontWeight: '800', 
              display: 'block', 
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>FACULTY ID</label>
            <input 
              id="u" 
              style={{ 
                ...styles.input, 
                borderRadius: '12px', 
                padding: '14px', 
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '15px',
                transition: 'all 0.2s'
              }} 
              placeholder="e.g. AM1234" 
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              fontSize: '11px', 
              color: '#475569', 
              fontWeight: '800', 
              display: 'block', 
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>PASSWORD</label>
            <input 
              id="p" 
              type="password" 
              style={{ 
                ...styles.input, 
                borderRadius: '12px', 
                padding: '14px', 
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '15px'
              }} 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <button 
          style={{ 
            ...styles.btnPrimary, 
            padding: '15px', 
            borderRadius: '12px', 
            fontSize: '16px', 
            fontWeight: '700',
            background: '#2563eb',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            cursor: 'pointer'
          }} 
          onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}
        >
          SIGN IN TO PORTAL
        </button>
        
        <p style={{ marginTop: '25px', fontSize: '11px', color: '#94a3b8' }}>
          © 2026 Atma Malik IOTR. All Rights Reserved.
        </p>
      </div>
    </div>
  );
  // --- LINE 79: LOGIN VIEW END ---
// --- 3. HOD Panel Component ---
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
    setF({ name: '', id: '', pass: '', sFac:'', sClass:'', sSub:'' }); setEditId(null); refresh();
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
            <h3>Attendance History</h3>
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
            <h3>Faculty Performance</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px' }}><th>NAME</th><th>ID</th><th>THEORY</th><th>PRAC</th><th>ACTION</th></tr></thead>
              <tbody>
                {list.faculties.map(fac => {
                  const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                  return (
                    <tr key={fac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{padding: '12px 0'}}>{fac.name}</td><td>{fac.id}</td><td>{s.theory_count}</td><td>{s.practical_count}</td>
                      <td>
                        <button onClick={() => { setF(fac); setEditId(fac.id); setTab('2'); }} style={{color:'#3b82f6', background:'none', border:'none', marginRight:'10px'}}><Edit3 size={16}/></button>
                        <button onClick={async () => { if(window.confirm("Delete Faculty?")) { await supabase.from('faculties').delete().eq('id', fac.id); refresh(); } }} style={{color:'#ef4444', background:'none', border:'none'}}><Trash2 size={16}/></button>
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
              <h4 style={{display:'flex', gap:'8px', marginTop:0}}><UserPlus size={18} color="#3b82f6"/> {editId ? 'Edit Faculty' : 'Register Faculty'}</h4>
              <label style={styles.label}>Full Name</label><input style={styles.input} value={f.name} onChange={e => setF({...f, name: e.target.value})} />
              <label style={styles.label}>ID</label><input style={styles.input} value={f.id} disabled={editId} onChange={e => setF({...f, id: e.target.value})} />
              <label style={styles.label}>Password</label><input style={styles.input} type="password" value={f.pass} onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={saveFac}>{editId ? 'UPDATE' : 'SAVE'}</button>
            </div>
            <div style={styles.mCard}>
              <h4 style={{display:'flex', gap:'8px', marginTop:0}}><Database size={18} color="#10b981"/> Link Subject</h4>
              <label style={styles.label}>Select Teacher</label>
              <select style={styles.input} value={f.sFac} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Choose</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <label style={styles.label}>Select Class</label>
              <select style={styles.input} value={f.sClass} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Choose</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <label style={styles.label}>Subject Name</label><input style={styles.input} value={f.sSub} placeholder="e.g. Java" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{...styles.btnPrimary, background: '#10b981'}} onClick={async () => { 
                if(!f.sFac || !f.sClass || !f.sSub) return alert("Fill all mapping details");
                await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); 
                alert("Subject Linked!"); setF({...f, sSub:''});
              }}>LINK SUBJECT</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 4. Faculty Panel Component ---
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
      // Haversine formula for geofencing (150m)
      const R = 6371e3; const φ1 = pos.coords.latitude * Math.PI/180; const φ2 = CAMPUS_LAT * Math.PI/180;
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180; const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      if (d > 150) { setLoading(false); return alert("Out of Campus Range!"); }

      const dateStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: dateStr }]);
      
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: dateStr }));
      await supabase.from('attendance_logs').insert(logs);

      setLoading(false); alert("Success!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("GPS Error!"); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20}/> New Session</h3>
      <label style={styles.label}>Class</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}>
        <option value="">Select Class</option>
        {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <label style={styles.label}>Subject</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}>
        <option value="">Select Subject</option>
        {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
      </select>
      <label style={styles.label}>Type</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{flex:1}}><label style={styles.label}>Start</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} /></div>
        <div style={{flex:1}}><label style={styles.label}>End</label><input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} /></div>
      </div>
      <button style={{...styles.btnPrimary, opacity: (sel.class && sel.sub) ? 1 : 0.6}} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Mandatory fields missing!")}>START ROLL CALL</button>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setIsReady(false)} style={{background:'none', border:'none', color:'#94a3b8'}}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b>{sel.class}</b><br/><small>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{...styles.btnPrimary, marginTop: '25px', background: '#10b981'}} onClick={submitAtt}>{loading ? "SYNCING..." : "SUBMIT ATTENDANCE"}</button>
    </div>
  );
}
