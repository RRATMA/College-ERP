import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Download, FileSpreadsheet, 
  UserPlus, List, ShieldCheck, Mail, MapPin, CheckCircle2, RotateCw, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const SERVICE_ID = "service_gj2hxal"; 
const TEMPLATE_ID = "template_et0w07w";
const PUBLIC_KEY = "n1VUJUSNKnim4ndVq"; 
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif' },
  // Interactive Login
  loginWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)' },
  loginCard: { background: '#ffffff', padding: '45px', borderRadius: '35px', width: '380px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  // Colorful Dashboard Cards
  card: { background: 'linear-gradient(145deg, #1e293b, #111827)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.03, width: '450px', pointerEvents: 'none', zIndex: 0 },
  // Inputs & Labels
  label: { fontSize: '11px', color: '#94a3b8', marginBottom: '8px', display: 'block', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' },
  input: { padding: '15px', borderRadius: '15px', backgroundColor: '#f1f5f9', color: '#0f172a', border: 'none', width: '100%', marginBottom: '20px', fontSize: '15px', outline: 'none', transition: '0.3s' },
  // Dynamic Buttons
  btnPrimary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '16px', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' },
  btnSuccess: { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', padding: '16px', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  // Stats & Grid
  statsBar: { background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-around', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.1)' },
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '12px' },
  rollBtn: (active) => ({ padding: '18px 0', background: active ? '#10b981' : '#1e293b', color: 'white', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', border: active ? 'none' : '1px solid #334155', fontWeight: 'bold', fontSize: '16px', transition: '0.2s transform' })
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [faculties, setFaculties] = useState([]);
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('faculties').select('*');
      setFaculties(data || []);
      const res = await fetch('/students_list.xlsx');
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      }
    };
    fetchData();
  }, []);

  const handleLogin = (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod'); }
    else {
      const f = faculties.find(x => x.id === u && x.password === p);
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={styles.loginWrapper}>
      <div style={styles.loginCard}>
        <img src="/logo.png" style={{ width: '70px', marginBottom: '15px' }} alt="Logo" />
        <h2 style={{ color: '#0f172a', fontWeight: '900', margin: '0 0 30px 0' }}>AMRIT ERP</h2>
        <div style={{ textAlign: 'left' }}>
          <label style={{...styles.label, color: '#64748b'}}>Faculty ID</label>
          <input id="u" style={styles.input} placeholder="Enter ID" />
          <label style={{...styles.label, color: '#64748b'}}>Password</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div><small style={{ color: '#94a3b8' }}>ATMA MALIK IOTR</small><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold' }}>LOGOUT</button>
      </nav>
      <div style={{ padding: '25px', maxWidth: '900px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1');
  const [list, setList] = useState({ faculties: [], attendance: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });

  useEffect(() => {
    supabase.from('faculties').select('*').then(res => setList(prev => ({...prev, faculties: res.data || []})));
    supabase.from('attendance').select('*').order('created_at', { ascending: false }).then(res => setList(prev => ({...prev, attendance: res.data || []})));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button onClick={() => setTab('1')} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: 'none', background: tab === '1' ? '#3b82f6' : '#1e293b', color: 'white', fontWeight: 'bold' }}>LOGS</button>
        <button onClick={() => setTab('2')} style={{ flex: 1, padding: '18px', borderRadius: '18px', border: 'none', background: tab === '2' ? '#3b82f6' : '#1e293b', color: 'white', fontWeight: 'bold' }}>CONTROLS</button>
      </div>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.watermark} />
        {tab === '1' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#60a5fa' }}>Attendance History</h3>
              <button onClick={() => {
                const ws = XLSX.utils.json_to_sheet(list.attendance);
                const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Master");
                XLSX.writeFile(wb, "Master_Report.xlsx");
              }} style={{...styles.btnPrimary, width: 'auto', background: '#10b981', padding: '10px 20px'}}><FileSpreadsheet size={18}/> MASTER SHEET</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div><b>{r.class} | {r.sub}</b><br/><small style={{color: '#94a3b8'}}>{r.faculty} • {r.time_str}</small></div>
                <div style={{ textAlign: 'right' }}><b style={{ color: '#22c55e', fontSize: '18px' }}>{r.present}/{r.total}</b></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h3 style={{ color: '#60a5fa' }}>Faculty Management</h3>
            <input style={styles.input} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.input} placeholder="ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.input} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('faculties').insert([{id:f.id, name:f.name, password:f.pass}]); alert("Saved!"); }}>ADD FACULTY</button>
            <hr style={{ margin: '30px 0', opacity: 0.1 }} />
            <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subject" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={styles.btnPrimary} onClick={async () => { await supabase.from('assignments').insert([{fac_id:f.sFac, class_name:f.sClass, subject_name:f.sSub}]); alert("Linked!"); }}>LINK SUBJECT</button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
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
    if(!sel.startTime || !sel.endTime) return alert("Please set Lecture Timings!");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3;
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

      if (dist > 150) { setLoading(false); return alert(`Geofence Alert: You are ${Math.round(dist)}m away.`); }

      const timeStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: timeStr }]);
      
      // Email logic
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A', date: timeStr }));
      await supabase.from('attendance_logs').insert(logs);
      
      // Report download
      const exportData = students.map(s => ({ "ROLL NO": s.id, "NAME": s.name, "STATUS": present.includes(s.id) ? "P" : "A", "SUBJECT": sel.sub, "TYPE": sel.type, "DATE": timeStr, "TIME": `${sel.startTime}-${sel.endTime}` }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Att");
      XLSX.writeFile(wb, `${sel.class}_${sel.sub}.xlsx`);

      setLoading(false); alert("Success!"); setSel({...sel, sub: ''}); setPresent([]);
    }, () => { setLoading(false); alert("GPS Required!"); }, { enableHighAccuracy: true });
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa' }}><Clock/> Lecture Setup</h3>
        <label style={styles.label}>Class</label>
        <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}><option>Choose</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
        <label style={styles.label}>Subject</label>
        <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}><option>Choose</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
        <label style={styles.label}>Session Type</label>
        <select style={styles.input} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical / Lab</option></select>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}><label style={styles.label}>Start Time</label><input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} /></div>
          <div style={{ flex: 1 }}><label style={styles.label}>End Time</label><input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} /></div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
          <button onClick={() => setSel({...sel, sub: ''})} style={{ background: 'none', border: 'none', color: '#94a3b8' }}><ArrowLeft/> Back</button>
          <div style={{ textAlign: 'right' }}><b style={{ color: '#60a5fa' }}>{sel.class} | {sel.sub}</b></div>
        </div>
        <div style={styles.statsBar}>
          <div style={{ textAlign: 'center' }}><small style={{ color: '#94a3b8' }}>PRESENT</small><br/><b style={{ color: '#22c55e', fontSize: '28px' }}>{present.length}</b></div>
          <div style={{ textAlign: 'center' }}><small style={{ color: '#94a3b8' }}>TOTAL</small><br/><b style={{ fontSize: '28px' }}>{students.length}</b></div>
        </div>
        <div style={styles.rollGrid}>{students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}</div>
        <button disabled={loading} style={{...styles.btnSuccess, marginTop: '35px'}} onClick={submitAtt}>{loading ? "Syncing..." : "SUBMIT & DOWNLOAD"}</button>
      </div>
    </div>
  );
      }
