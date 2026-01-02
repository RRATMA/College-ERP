import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  topBar: { background: '#1e3a8a', color: '#ffffff', padding: '6px 5%', display: 'flex', justifyContent: 'space-between', fontSize: '10px' },
  header: { 
    background: '#ffffff', 
    padding: '12px 5%', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '15px', 
    borderBottom: '4px solid #3b82f6', 
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
  },
  loginWrapper: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f172a' }, // Dark Blue Background like your image
  loginCard: { 
    background: '#ffffff', 
    width: '90%', 
    maxWidth: '400px', 
    borderRadius: '20px', 
    overflow: 'hidden', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
    margin: 'auto',
    zIndex: 10 
  },
  input: { 
    padding: '14px', 
    borderRadius: '10px', 
    border: '1px solid #cbd5e1', 
    width: '100%', 
    marginBottom: '15px', 
    fontSize: '16px', 
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc'
  },
  btnPrimary: { 
    background: '#2563eb', 
    color: 'white', 
    padding: '16px', 
    border: 'none', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    width: '100%', 
    fontSize: '16px' 
  },
  label: { fontSize: '11px', color: '#1e3a8a', marginBottom: '5px', display: 'block', fontWeight: 'bold', letterSpacing: '0.5px' },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.05, width: '350px', pointerEvents: 'none' },
  rollBtn: (active) => ({ padding: '15px 0', background: active ? '#10b981' : '#ffffff', color: active ? 'white' : '#1e3a8a', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', border: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '16px' })
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
      <header style={{...styles.header, background: 'transparent', border: 'none', boxShadow: 'none', justifyContent: 'center', paddingTop: '40px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px', borderLeft: '3px solid #3b82f6', paddingLeft: '15px'}}>
          <img src="/logo.png" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white' }} alt="logo" />
          <div>
            <h1 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '900' }}>ATMA MALIK</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: 'bold' }}>INSTITUTE OF TECHNOLOGY & RESEARCH</p>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div style={styles.loginCard}>
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>AMRIT ERP</h2>
            <p style={{ margin: '0 0 25px 0', fontSize: '12px', color: '#64748b' }}>Attendance Management System</p>
            
            <div style={{textAlign: 'left'}}>
              <label style={styles.label}>FACULTY ID</label>
              <input id="u" style={styles.input} placeholder="ID" />
              
              <label style={styles.label}>PASSWORD</label>
              <input id="p" type="password" style={styles.input} placeholder="••••••••" />
              
              <button style={styles.btnPrimary} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ background: '#1e3a8a', padding: '12px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" style={{ width: '30px', background: 'white', borderRadius: '50%' }} alt="logo" />
          <b style={{ fontSize: '14px' }}>{user.name}</b>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>LOGOUT</button>
      </nav>
      <div style={{ padding: '20px 5%' }}>
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

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(list.attendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Master_Attendance.xlsx");
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', overflowX: 'auto' }}>
        {['1', '3', '2'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px', background: tab === t ? '#1e3a8a' : '#fff', color: tab === t ? 'white' : '#444', border: '1px solid #ddd', borderRadius: '8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {t === '1' ? 'LOGS' : t === '3' ? 'FACULTY LIST' : 'MANAGE'}
          </button>
        ))}
      </div>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', position: 'relative' }}>
        <img src="/logo.png" style={styles.watermark} alt="bg" />
        
        {tab === '1' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
              <h3 style={{margin:0, color:'#1e3a8a'}}>Attendance</h3>
              <button onClick={downloadExcel} style={{background:'#10b981', color:'white', border:'none', padding:'8px 12px', borderRadius:'6px', fontWeight:'bold'}}><Download size={14}/> EXCEL</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{display:'flex', justifyContent:'space-between'}}><b>{r.class}</b> <span style={{color: '#10b981'}}>{r.present}/{r.total}</span></div>
                <div style={{fontSize: '12px', color: '#64748b'}}>{r.sub} • {r.faculty} • {r.time_str}</div>
              </div>
            ))}
          </div>
        )}

        {tab === '3' && (
          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr style={{textAlign:'left', background:'#f8fafc'}}><th style={{padding:'10px'}}>NAME</th><th style={{padding:'10px'}}>L/P</th><th style={{padding:'10px'}}>ACTION</th></tr></thead>
              <tbody>
                {list.faculties.map(fac => {
                  const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
                  return (
                    <tr key={fac.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                      <td style={{padding:'10px'}}>{fac.name}</td>
                      <td style={{padding:'10px'}}>{s.theory_count}/{s.practical_count}</td>
                      <td style={{padding:'10px', display:'flex', gap:'10px'}}>
                        <Edit3 size={16} color="#3b82f6" onClick={() => {setF(fac); setEditMode(true); setTab('2');}}/>
                        <Trash2 size={16} color="#ef4444" onClick={async () => {if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', fac.id); refresh();}}}/>
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
            <div style={{padding:'15px', background:'#f8fafc', borderRadius:'10px', marginBottom:'20px'}}>
              <h4>{editMode ? 'Update' : 'Add'} Faculty</h4>
              <input style={styles.input} value={f.name} placeholder="Full Name" onChange={e => setF({...f, name: e.target.value})} />
              <input style={styles.input} value={f.id} placeholder="ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
              <input style={styles.input} value={f.pass} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
              <button style={styles.btnPrimary} onClick={async () => {
                if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
                else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
                setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); alert("Success");
              }}>{editMode ? 'UPDATE' : 'SAVE'}</button>
            </div>
            <div style={{padding:'15px', background:'#f0fdf4', borderRadius:'10px'}}>
              <h4>Link Subject</h4>
              <select style={styles.input} onChange={e => setF({...f, sFac: e.target.value})}><option value="">Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              <select style={styles.input} onChange={e => setF({...f, sClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <input style={styles.input} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
              <button style={{...styles.btnPrimary, background:'#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); }}>LINK SUBJECT</button>
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
      
      if (d > 150) { setLoading(false); return alert("Outside Campus Range!"); }
      const dStr = new Date().toLocaleDateString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: dStr }]);
      setLoading(false); alert("Attendance Submitted!"); setIsReady(false); setPresent([]);
    }, () => { setLoading(false); alert("Enable GPS!"); }, { enableHighAccuracy: true });
  };

  if (!isReady) return (
    <div style={{background:'white', padding:'25px', borderRadius:'15px', border:'1px solid #e2e8f0'}}>
      <h3 style={{marginTop:0}}><Clock size={20}/> New Session</h3>
      <label style={styles.label}>SELECT CLASS</label>
      <select style={styles.input} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={styles.label}>SELECT SUBJECT</label>
      <select style={styles.input} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={styles.label}>SESSION TYPE</label>
      <select style={styles.input} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.input} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.input} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={styles.btnPrimary} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("Fill All")}>OPEN ROLL CALL</button>
    </div>
  );

  return (
    <div style={{background:'white', padding:'20px', borderRadius:'15px', border:'1px solid #e2e8f0'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '50%' }}><ArrowLeft/></button>
        <div style={{textAlign:'right'}}><b style={{fontSize:'14px'}}>{sel.class}</b><br/><small style={{color:'#64748b'}}>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px' }}>
        {students.map(s => (<div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>{s.id}</div>))}
      </div>
      <button disabled={loading} style={{ ...styles.btnPrimary, marginTop: '25px', background: '#10b981' }} onClick={submitAtt}>{loading ? "Checking GPS..." : `SUBMIT (${present.length} PRESENT)`}</button>
    </div>
  );
          }
