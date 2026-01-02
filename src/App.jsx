import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, Clock, Trash2, Edit3, UserPlus, Database, Phone, MapPin, Globe, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Configuration ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

const styles = {
  container: { width: '100%', minHeight: '100vh', backgroundColor: '#f4f7fe', fontFamily: "'Segoe UI', Roboto, sans-serif" },
  brandHeader: {
    background: '#1e3a8a',
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderBottom: '4px solid #3b82f6'
  },
  loginBox: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '30px',
    width: '90%',
    maxWidth: '400px',
    margin: '40px auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  },
  inputField: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    fontSize: '16px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc'
  },
  btnAction: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    background: '#1e3a8a',
    color: '#ffffff',
    fontWeight: '700',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer'
  },
  tabNav: {
    display: 'flex',
    background: '#e2e8f0',
    padding: '4px',
    borderRadius: '14px',
    marginBottom: '20px'
  },
  tabBtn: (active) => ({
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '12px',
    background: active ? '#ffffff' : 'transparent',
    color: active ? '#1e3a8a' : '#64748b',
    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
    transition: '0.3s'
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
      else alert("Credentials चुकीचे आहेत!");
    }
  };

  if (view === 'login') return (
    <div style={styles.container}>
      <header style={styles.brandHeader}>
        <img src="/logo.png" style={{ width: '55px', height: '55px', borderRadius: '50%', border: '2px solid white', background: 'white' }} alt="logo" />
        <div>
          <h1 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>ATMA MALIK IOTR</h1>
          <p style={{ color: '#93c5fd', margin: 0, fontSize: '10px', fontWeight: 'bold' }}>ATTENDANCE SYSTEM</p>
        </div>
      </header>
      
      <div style={styles.loginBox}>
        <div style={{textAlign: 'center', marginBottom: '25px'}}>
          <h2 style={{margin: 0, color: '#1e3a8a', fontSize: '22px'}}>AMRIT ERP</h2>
          <p style={{fontSize: '13px', color: '#64748b'}}>कृपया तुमचे लॉगिन डिटेल्स भरा</p>
        </div>
        
        <label style={{fontSize: '12px', fontWeight: '800', color: '#1e3a8a', display: 'block', marginBottom: '6px'}}>FACULTY ID</label>
        <input id="u" style={styles.inputField} placeholder="Enter ID" />
        
        <label style={{fontSize: '12px', fontWeight: '800', color: '#1e3a8a', display: 'block', marginBottom: '6px'}}>PASSWORD</label>
        <input id="p" type="password" style={styles.inputField} placeholder="••••••••" />
        
        <button style={styles.btnAction} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={{ ...styles.brandHeader, padding: '10px 20px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" style={{ width: '35px', borderRadius: '50%', background: 'white' }} alt="logo" />
          <b style={{ color: 'white', fontSize: '14px' }}>{user.name}</b>
        </div>
        <button onClick={() => setView('login')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' }}>LOGOUT</button>
      </nav>
      
      <div style={{ padding: '20px' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs'); 
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
      <div style={styles.tabNav}>
        {['logs', 'list', 'manage'].map(t => (
          <button key={t} onClick={() => {setTab(t); setEditMode(false);}} style={styles.tabBtn(tab === t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        {tab === 'logs' && (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
              <h3 style={{margin:0, fontSize: '18px'}}>Live Logs</h3>
              <button onClick={() => {
                const ws = XLSX.utils.json_to_sheet(list.attendance);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Attendance");
                XLSX.writeFile(wb, "Master_Sheet.xlsx");
              }} style={{background:'#10b981', color:'white', border:'none', padding:'8px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:'700'}}><Download size={14}/> EXCEL</button>
            </div>
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{fontWeight: '800', fontSize: '15px'}}>{r.class} - {r.sub}</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>{r.faculty} | {r.time_str}</div>
                </div>
                <div style={{ color: '#10b981', fontWeight: '900', fontSize: '18px' }}>{r.present}/{r.total}</div>
              </div>
            ))}
          </>
        )}

        {tab === 'list' && (
          <>
            <h3 style={{fontSize: '18px', marginBottom: '15px'}}>शिक्षक यादी व अहवाल</h3>
            {list.faculties.map(fac => {
              const s = list.stats.find(st => st.faculty === fac.name) || { theory_count: 0, practical_count: 0 };
              return (
                <div key={fac.id} style={{ padding: '15px', borderRadius: '12px', border: '1.5px solid #f1f5f9', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{fontWeight: '700'}}>{fac.name}</div>
                    <div style={{fontSize: '11px', color: '#1e3a8a'}}>ID: {fac.id} | Theory: {s.theory_count} | Practical: {s.practical_count}</div>
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={() => {setF(fac); setEditMode(true); setTab('manage');}} style={{background: '#eff6ff', color: '#1e3a8a', border: 'none', padding: '10px', borderRadius: '10px'}}><Edit3 size={16}/></button>
                    <button onClick={async () => {if(window.confirm("Delete?")){await supabase.from('faculties').delete().eq('id', fac.id); refresh();}}} style={{background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '10px'}}><Trash2 size={16}/></button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === 'manage' && (
          <div>
            <h3 style={{marginTop: 0}}>{editMode ? 'माहिती सुधारा' : 'नवीन शिक्षक जोडा'}</h3>
            <input style={styles.inputField} value={f.name} placeholder="पूर्ण नाव" onChange={e => setF({...f, name: e.target.value})} />
            <input style={styles.inputField} value={f.id} placeholder="Faculty ID" disabled={editMode} onChange={e => setF({...f, id: e.target.value})} />
            <input style={styles.inputField} value={f.pass} placeholder="पासवर्ड" onChange={e => setF({...f, pass: e.target.value})} />
            <button style={styles.btnAction} onClick={async () => {
              if(editMode) await supabase.from('faculties').update({name: f.name, password: f.pass}).eq('id', f.id);
              else await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]);
              setF({name:'', id:'', pass:''}); setEditMode(false); refresh(); alert("सेव्ह झाले!"); setTab('list');
            }}>{editMode ? 'UPDATE' : 'SAVE'}</button>
            
            <hr style={{margin: '30px 0', border: '1px dotted #cbd5e1'}} />
            
            <h3 style={{marginTop: 0}}>विषय आणि क्लास लिंक करा</h3>
            <select style={styles.inputField} onChange={e => setF({...f, sFac: e.target.value})}><option value="">शिक्षक निवडा</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={styles.inputField} onChange={e => setF({...f, sClass: e.target.value})}><option value="">क्लास निवडा</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.inputField} placeholder="विषयाचे नाव (उदा. MQC)" onChange={e => setF({...f, sSub: e.target.value})} />
            <button style={{...styles.btnAction, background: '#10b981'}} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("लिंक झाले!"); }}>LINK SUBJECT</button>
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
      const Δφ = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180; const Δλ = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 150) { setLoading(false); return alert("तुम्ही कॅम्पसच्या बाहेर आहात!"); }
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, start_time: sel.startTime, end_time: sel.endTime, present: present.length, total: students.length, time_str: new Date().toLocaleDateString('en-GB') }]);
      setLoading(false); alert("हजेरी सबमिट झाली!"); setIsReady(false);
    }, () => { setLoading(false); alert("GPS परमिशन द्या!"); });
  };

  if (!isReady) return (
    <div style={{background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
      <h3 style={{marginTop: 0, color: '#1e3a8a'}}><Clock size={20}/> नवीन हजेरी सत्र</h3>
      <label style={{fontSize: '11px', fontWeight: '800', color: '#64748b'}}>क्लास</label>
      <select style={styles.inputField} value={sel.class} onChange={e => setSel({...sel, class: e.target.value})}><option value="">क्लास निवडा</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <label style={{fontSize: '11px', fontWeight: '800', color: '#64748b'}}>विषय</label>
      <select style={styles.inputField} value={sel.sub} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">विषय निवडा</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <label style={{fontSize: '11px', fontWeight: '800', color: '#64748b'}}>प्रकार</label>
      <select style={styles.inputField} value={sel.type} onChange={e => setSel({...sel, type: e.target.value})}><option>Theory Lecture</option><option>Practical</option></select>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="time" style={styles.inputField} onChange={e => setSel({...sel, startTime: e.target.value})} />
        <input type="time" style={styles.inputField} onChange={e => setSel({...sel, endTime: e.target.value})} />
      </div>
      <button style={styles.btnAction} onClick={() => (sel.class && sel.sub) ? setIsReady(true) : alert("पूर्ण फॉर्म भरा")}>सुरू करा</button>
    </div>
  );

  return (
    <div style={{background: 'white', padding: '15px', borderRadius: '20px'}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <button onClick={() => setIsReady(false)} style={{ border: 'none', background: '#f1f5f9', padding: '10px', borderRadius: '50%' }}><ArrowLeft/></button>
        <div style={{textAlign: 'right'}}><b style={{fontSize: '16px'}}>{sel.class}</b><br/><small style={{color: '#3b82f6', fontWeight: 'bold'}}>{sel.sub}</small></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ 
                 padding: '18px 0', background: present.includes(s.id) ? '#1e3a8a' : '#f8fafc', 
                 color: present.includes(s.id) ? 'white' : '#1e3a8a', borderRadius: '15px', 
                 textAlign: 'center', fontWeight: '900', border: '1.5px solid #e2e8f0',
                 boxShadow: present.includes(s.id) ? '0 5px 15px rgba(30,58,138,0.2)' : 'none'
               }}>{s.id}</div>
        ))}
      </div>
      <button disabled={loading} style={{ ...styles.btnAction, marginTop: '25px', background: '#10b981' }} onClick={submitAtt}>{loading ? "Verifying..." : `सबमिट करा (${present.length})`}</button>
    </div>
  );
    }
