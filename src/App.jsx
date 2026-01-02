import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Geofencing Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#f0f2f5', color: '#1c1e21', fontFamily: '"Segoe UI", Roboto, sans-serif' },
  topBar: { background: '#1e3a8a', color: '#ffffff', padding: '10px 8%', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500' },
  header: { background: '#ffffff', padding: '20px 8%', display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '4px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  loginWrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f0f2f5' },
  loginCard: { 
    background: '#ffffff', 
    width: '420px', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
    marginTop: '40px',
    zIndex: 10
  },
  input: { 
    padding: '14px', 
    borderRadius: '6px', 
    backgroundColor: '#ffffff', 
    color: '#0f172a', 
    border: '1px solid #ddd', 
    width: '100%', 
    marginBottom: '20px', 
    boxSizing: 'border-box',
    fontSize: '16px'
  },
  btnPrimary: { 
    background: '#1e3a8a', 
    color: 'white', 
    padding: '15px', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    width: '100%', 
    fontSize: '16px',
    transition: '0.3s'
  },
  card: { background: '#ffffff', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, width: '450px', pointerEvents: 'none', zIndex: 0 },
  rollBtn: (active) => ({ 
    padding: '18px 0', 
    background: active ? '#10b981' : '#ffffff', 
    color: active ? 'white' : '#1e3a8a', 
    borderRadius: '8px', 
    textAlign: 'center', 
    cursor: 'pointer', 
    border: active ? '1px solid #10b981' : '1px solid #d1d5db', 
    fontWeight: '800',
    fontSize: '16px',
    boxShadow: active ? '0 4px 10px rgba(16,185,129,0.3)' : 'none'
  })
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
      else alert("Login Failed! Please check ID/Password.");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginWrapper}>
      {/* Top Bar like eusc.edu.bd */}
      <div style={styles.topBar}>
        <div style={{display:'flex', gap:'25px'}}>
           <span style={{display:'flex', alignItems:'center', gap:'6px'}}><MapPin size={14}/> Sinnar, Nashik</span>
           <span style={{display:'flex', alignItems:'center', gap:'6px'}}><Phone size={14}/> +91 2551 222XXX</span>
        </div>
        <div style={{display:'flex', gap:'20px'}}>
            <span style={{display:'flex', alignItems:'center', gap:'6px'}}><Globe size={14}/> www.atmamalik.edu.in</span>
        </div>
      </div>

      {/* Branded Header */}
      <header style={styles.header}>
        <div style={{ background: '#fff', padding: '5px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '2px solid #1e3a8a' }}>
          <img src="/logo.png" style={{ width: '80px', height: '80px', borderRadius: '50%' }} alt="logo" />
        </div>
        <div>
          <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '1px' }}>ATMA MALIK</h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#3b82f6', fontWeight: '600', textTransform: 'uppercase' }}>Institute of Technology & Research</p>
        </div>
      </header>

      {/* Login Section */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        
        <div style={styles.loginCard}>
          <div style={{ background: '#1e3a8a', color: 'white', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '20px', letterSpacing: '1px' }}>FACULTY ERP LOGIN</h3>
          </div>
          <div style={{ padding: '40px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', display: 'block', marginBottom: '8px' }}>FACULTY ID</label>
            <input id="u" style={styles.input} placeholder="Enter your ID" />
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#444', display: 'block', marginBottom: '8px' }}>PASSWORD</label>
            <input id="p" type="password" style={styles.input} placeholder="••••••••" />
            <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
              LOGIN TO DASHBOARD
            </button>
          </div>
          <div style={{ background: '#f9fafb', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#999', borderTop: '1px solid #eee' }}>
            © 2026 Atma Malik IOTR - All Rights Reserved
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e3a8a', padding: '15px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', padding: '2px' }} alt="nav-logo" />
          <div style={{lineHeight: '1.2'}}>
            <b style={{ fontSize: '16px', display: 'block' }}>{user.name}</b>
            <span style={{ color: '#93c5fd', fontSize: '11px' }}>ID: {user.id} | {user.role.toUpperCase()}</span>
          </div>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'8px' }}>
          <LogOut size={16}/> LOGOUT
        </button>
      </nav>

      <div style={{ padding: '40px 8%', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL COMPONENT ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
  const [list, setList] = useState({ faculties: [], attendance: [], stats: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: stats } = await supabase.from('faculty_stats').select('*');
    setList({ faculties: facs || [], attendance: att || [], stats: stats || [] });
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '2px', marginBottom: '30px', background: '#d1d5db', padding: '2px', borderRadius: '8px' }}>
        {['1', '3', '2'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '15px', background: tab === t ? '#1e3a8a' : 'transparent', border: 'none', color: tab === t ? 'white' : '#4b5563', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            {t === '1' ? 'ATTENDANCE LOGS' : t === '3' ? 'FACULTY STATS' : 'MANAGE SYSTEM'}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        
        {tab === '1' && (
          <div style={{ zIndex: 1, position: 'relative' }}>
            <h3 style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', color: '#1e3a8a' }}>Live Attendance Feed</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span><b>{r.class}</b> - {r.sub}<br/><small style={{color:'#64748b'}}>{r.faculty} • {r.type} • {r.time_str}</small></span>
                <div style={{textAlign:'right'}}>
                   <b style={{ color: '#10b981', fontSize: '18px' }}>{r.present}/{r.total}</b><br/>
                   <small style={{color:'#94a3b8'}}>Students Present</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === '2' && (
          <div style={{ ...styles.mGrid, zIndex: 1, position: 'relative' }}>
            <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '10px' }}>
              <h4 style={{ color: '#1e3a8a', marginTop: 0 }}><UserPlus size={18}/> Add New Faculty</h4>
              <input style={styles.input} placeholder="Full Name" onChange={e => setF({...f, name: e.target.value})} />
              <input style={styles.input} placeholder="Faculty ID" onChange={e => setF({...f, id: e.target.value})} />
              <input style={styles.input} type="password" placeholder="System Password" onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={async () => { await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]); refresh(); alert("Faculty Added!"); }}>REGISTER FACULTY</button>
            </div>
            <div style={{ padding: '20px', border: '1px solid #eee', borderRadius: '10px' }}>
              <h4 style={{ color: '#10b981', marginTop: 0 }}><Database size={18}/> Subject Allocation</h4>
              <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Teacher</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input style={styles.input} placeholder="Subject Name (e.g. Python)" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{ ...styles.btnPrimary, background: '#10b981' }} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Subject Linked Successfully!"); }}>LINK SUBJECT</button>
            </div>
          </div>
        )}

        {tab === '3' && (
           <div style={{ zIndex: 1, position: 'relative', overflowX: 'auto' }}>
             <h3 style={{ color: '#1e3a8a' }}>Faculty Workload Summary</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
               <thead>
                 <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                   <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>FACULTY NAME</th>
                   <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>LECTURES</th>
                   <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>PRACTICALS</th>
                 </tr>
               </thead>
               <tbody>
                 {list.faculties.map(fac => {
                   const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                   return (
                     <tr key={fac.id}>
                       <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{fac.name}</td>
                       <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{s.theory_count}</td>
                       <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{s.practical_count}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL COMPONENT ---
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
      const φ1 = pos.coords.latitude * Math.PI/180; 
      const φ2 = CAMPUS_LAT * Math.PI/180;
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180; 
      const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      if (d > 150) { setLoading(false); return alert("Access Denied! You are " + Math.round(d) + "m away from campus."); }
      
      const dStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: dStr }]);
      
      setLoading(false); alert("Attendance successfully synced with server!"); 
      setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("Please enable GPS to submit attendance."); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <h3 style={{ color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}><Clock/> Configure Lecture Session</h3>
      <div style={{ marginTop: '20px' }}>
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>SELECT CLASS</label>
        <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">-- Choose Class --</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
        
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>SELECT SUBJECT</label>
        <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">-- Choose Subject --</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
        
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>LECTURE TYPE</label>
        <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{flex:1}}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>START TIME</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} /></div>
          <div style={{flex:1}}><label style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>END TIME</label><input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} /></div>
        </div>
        
        <button style={{ ...styles.btnPrimary, opacity: (sel.class && sel.sub) ? 1 : 0.6 }} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Mandatory fields missing!")}>
          START ROLL CALL SESSION
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="bg" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', zIndex: 1, position: 'relative' }}>
        <button onClick={() => setIsReady(false)} style={{ background: '#f1f5f9', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><ArrowLeft size={20}/></button>
        <div style={{ textAlign: 'right' }}>
          <span style={{ background: '#1e3a8a', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{sel.class}</span>
          <h3 style={{ margin: '5px 0 0 0', color: '#1e3a8a' }}>{sel.sub}</h3>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px', zIndex: 1, position: 'relative' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>
            {s.id}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, position: 'relative' }}>
        <div>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Students Present:</span>
          <h2 style={{ margin: 0, color: '#10b981' }}>{present.length} / {students.length}</h2>
        </div>
        <button disabled={loading} style={{ ...styles.btnPrimary, width: '200px', background: '#10b981' }} onClick={submitAtt}>
          {loading ? "VERIFYING GPS..." : "SUBMIT SESSION"}
        </button>
      </div>
    </div>
  );
}
