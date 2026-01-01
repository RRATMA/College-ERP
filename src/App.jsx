import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Download, FileSpreadsheet, ChevronDown, Calendar, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";
import emailjs from '@emailjs/browser';

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: '"Inter", sans-serif' },
  // Clean Login
  loginWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' },
  loginCard: { background: '#ffffff', padding: '40px', borderRadius: '28px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  // Modern Card with Watermark
  card: { background: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', opacity: 0.03, width: '400px', pointerEvents: 'none', zIndex: 0 },
  // Input UI Improvements
  label: { fontSize: '11px', color: '#94a3b8', marginBottom: '8px', display: 'block', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', width: '100%', marginBottom: '18px', outline: 'none', fontSize: '14px', appearance: 'none' },
  timeGrid: { display: 'flex', gap: '15px', marginBottom: '20px' },
  btnPrimary: { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', padding: '16px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' },
  statsBar: { background: 'rgba(15, 23, 42, 0.5)', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-around', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }
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
        <img src="/logo.png" style={{ width: '60px', marginBottom: '15px' }} alt="Logo" />
        <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800', margin: 0 }}>AMRIT ERP</h2>
        <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '30px' }}>Department of Computer Engineering</p>
        <div style={{ textAlign: 'left' }}>
          <label style={{...styles.label, color: '#64748b'}}>Faculty ID</label>
          <input id="u" style={styles.input} placeholder="Enter ID" />
          <label style={{...styles.label, color: '#64748b'}}>Password</label>
          <input id="p" type="password" style={styles.input} placeholder="••••••••" />
        </div>
        <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>ACCESS DASHBOARD</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e293b', padding: '15px 6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div><small style={{ color: '#94a3b8' }}>Welcome back,</small><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}><LogOut size={16}/></button>
      </nav>
      <div style={{ padding: '25px', maxWidth: '800px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (Updated UI) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture', startTime: '', endTime: '' });
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(({ data }) => setMyAssigns(data || []));
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

  if (!sel.sub) return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} alt="watermark" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}><Clock size={22} color="#3b82f6"/> Configuration</h3>
        
        <label style={styles.label}>Select Class</label>
        <select style={styles.input} onChange={e => setSel({...sel, class: e.target.value})}>
          <option value="">Choose Class</option>
          {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={styles.label}>Select Subject</label>
        <select style={styles.input} onChange={e => setSel({...sel, sub: e.target.value})}>
          <option value="">Choose Subject</option>
          {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
        </select>

        <label style={styles.label}>Session Type</label>
        <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}>
          <option value="Theory Lecture">Theory Lecture</option>
          <option value="Practical / Lab">Practical / Lab</option>
        </select>

        <div style={styles.timeGrid}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Lecture Start Time</label>
            <input type="time" style={{...styles.input, marginBottom: 0}} onChange={e => setSel({...sel, startTime: e.target.value})} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Lecture End Time</label>
            <input type="time" style={{...styles.input, marginBottom: 0}} onChange={e => setSel({...sel, endTime: e.target.value})} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => setSel({...sel, sub: ''})} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ArrowLeft/></button>
          <div style={{ textAlign: 'right' }}><b>{sel.class} | {sel.sub}</b></div>
        </div>
        
        <div style={styles.statsBar}>
          <div style={{ textAlign: 'center' }}><small style={{color:'#94a3b8'}}>PRESENT</small><br/><b style={{ color: '#10b981', fontSize: '24px' }}>{present.length}</b></div>
          <div style={{ textAlign: 'center' }}><small style={{color:'#94a3b8'}}>TOTAL</small><br/><b style={{ fontSize: '24px' }}>{students.length}</b></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '10px' }}>
          {students.map(s => (
            <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
              style={{ padding: '15px 0', background: present.includes(s.id) ? '#10b981' : '#0f172a', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.05)' }}>
              {s.id}
            </div>
          ))}
        </div>
        <button style={{ ...styles.btnPrimary, marginTop: '30px' }}><Download size={18}/> SUBMIT ATTENDANCE</button>
      </div>
    </div>
  );
}

// --- HOD Panel (Master Sheet) ---
function HODPanel({ excelClasses }) {
  const [data, setData] = useState([]);
  useEffect(() => { supabase.from('attendance').select('*').order('created_at', {ascending: false}).then(res => setData(res.data || [])); }, []);

  return (
    <div style={styles.card}>
      <img src="/logo.png" style={styles.watermark} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Admin Logs</h3>
          <button onClick={() => {
             const ws = XLSX.utils.json_to_sheet(data);
             const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Master");
             XLSX.writeFile(wb, "Master_Report.xlsx");
          }} style={{...styles.btnPrimary, width: 'auto', padding: '10px 15px', background: '#10b981'}}><FileSpreadsheet size={18}/> MASTER SHEET</button>
        </div>
        {data.map(r => (
           <div key={r.id} style={{ background: 'rgba(15,23,42,0.6)', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <b>{r.class} - {r.sub}</b><br/><small>{r.faculty} | {r.time_str}</small>
           </div>
        ))}
      </div>
    </div>
  );
}
