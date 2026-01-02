import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Clock, Trash2, Edit3, 
  Download, ShieldCheck, User, Search,
  LayoutDashboard, BookOpen, Fingerprint, GraduationCap, Settings, 
  MapPin, CheckCircle, ChevronRight, Users, Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- Config ---
const CAMPUS_LAT = 19.7042; 
const CAMPUS_LON = 72.7645;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [excelClasses, setExcelClasses] = useState([]);

  // 1. मिस झालेली गोष्ट: सुरुवातीलाच Excel मधून क्लासेसची नावे लोड करणे
  useEffect(() => {
    fetch('/students_list.xlsx')
      .then(res => res.arrayBuffer())
      .then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      }).catch(err => console.error("Excel load error:", err));
  }, []);

  const handleLogin = async (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' });
      setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("ID किंवा पासवर्ड चुकीचा आहे!");
    }
  };

  // --- UI STYLES ---
  const glass = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px'
  };

  if (view === 'login') return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', padding: '20px' }}>
      <div style={{ ...glass, maxWidth: '400px', width: '100%', padding: '30px', textAlign: 'center' }}>
        <div style={{ background: 'white', display: 'inline-block', padding: '15px', borderRadius: '20px', marginBottom: '15px' }}>
          <img src="/logo.png" style={{ width: '60px' }} alt="logo" />
        </div>
        <h1 style={{ color: 'white', margin: '0 0 5px 0' }}>AMRIT</h1>
        <p style={{ color: '#6366f1', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '30px' }}>ATTENDANCE SYSTEM</p>
        <input id="u" placeholder="Faculty ID" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #334155', background: '#1e293b', color: 'white', marginBottom: '15px' }} />
        <input id="p" type="password" placeholder="Password" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #334155', background: '#1e293b', color: 'white', marginBottom: '20px' }} />
        <button onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          LOGIN <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginLeft: '8px' }}/>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      {/* NAVBAR */}
      <nav style={{ padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', background: 'rgba(15, 23, 42, 0.9)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#6366f1', padding: '8px', borderRadius: '10px' }}><User size={20}/></div>
          <div className="hide-mobile"><b>{user.name}</b><br/><small style={{color:'#a855f7'}}>{user.role.toUpperCase()}</small></div>
        </div>
        <button onClick={() => setView('login')} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          <LogOut size={18}/>
        </button>
      </nav>

      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </main>

      <style>{`
        @media (max-width: 600px) { .hide-mobile { display: none; } }
        button:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}

// --- HOD PANEL (ALL MISSING FEATURES ADDED BACK) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('logs');
  const [list, setList] = useState({ faculties: [], attendance: [], assignments: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });
  const [search, setSearch] = useState('');

  const refresh = async () => {
    const { data: facs } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: asgn } = await supabase.from('assignments').select('*');
    setList({ faculties: facs || [], attendance: att || [], assignments: asgn || [] });
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <Users color="#6366f1"/> <div style={{marginTop: '10px'}}><small>Faculty</small><br/><b>{list.faculties.length}</b></div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <BarChart3 color="#10b981"/> <div style={{marginTop: '10px'}}><small>Sessions</small><br/><b>{list.attendance.length}</b></div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        {['logs', 'faculties', 'manage'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: tab === t ? '#6366f1' : '#1e293b', color: 'white', fontWeight: 'bold', minWidth: '100px' }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TAB: Attendance Logs */}
      {tab === 'logs' && (
        <>
          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: '#94a3b8' }} />
            <input style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '15px', background: '#1e293b', border: '1px solid #334155', color: 'white' }} placeholder="Search class or faculty..." onChange={e => setSearch(e.target.value)} />
          </div>
          {list.attendance.filter(l => l.faculty.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase())).map(log => (
            <div key={log.id} style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><b>{log.class}</b><br/><small style={{color: '#94a3b8'}}>{log.sub} • {log.faculty}</small></div>
              <div style={{ textAlign: 'right' }}><b style={{ color: '#10b981' }}>{log.present}/{log.total}</b><br/><small style={{fontSize: '10px'}}>{log.time_str}</small></div>
            </div>
          ))}
        </>
      )}

      {/* TAB: Faculty Stats */}
      {tab === 'faculties' && (
        list.faculties.map(fac => {
          const tCount = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Theory Lecture').length;
          const pCount = list.attendance.filter(a => a.faculty === fac.name && a.type === 'Practical').length;
          return (
            <div key={fac.id} style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><b>{fac.name}</b><br/><small style={{color:'#94a3b8'}}>ID: {fac.id}</small></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ textAlign: 'center', background: '#1e293b', padding: '5px 10px', borderRadius: '10px' }}><small>T</small><br/><b>{tCount}</b></div>
                <div style={{ textAlign: 'center', background: '#1e293b', padding: '5px 10px', borderRadius: '10px' }}><small>P</small><br/><b>{pCount}</b></div>
              </div>
            </div>
          );
        })
      )}

      {/* TAB: Manage (Add Faculty & Link Workload) */}
      {tab === 'manage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '20px' }}>
            <h3>Register Faculty</h3>
            <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Name" onChange={e => setF({...f, name: e.target.value})} />
            <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Faculty ID" onChange={e => setF({...f, id: e.target.value})} />
            <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Password" onChange={e => setF({...f, pass: e.target.value})} />
            <button onClick={async () => { await supabase.from('faculties').insert([{id: f.id, name: f.name, password: f.pass}]); refresh(); alert("Saved!"); }} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 'bold' }}>SAVE FACULTY</button>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '20px', borderRadius: '20px' }}>
            <h3>Link Subject</h3>
            <select style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} onChange={e => setF({...f, sFac: e.target.value})}><option>Select Faculty</option>{list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <select style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} onChange={e => setF({...f, sClass: e.target.value})}><option>Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: 'white' }} placeholder="Subject Name" onChange={e => setF({...f, sSub: e.target.value})} />
            <button onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); refresh(); }} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}>LINK WORKLOAD</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL (INTERACTIVE GRID & GPS) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Theory Lecture' });
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

  const submitAttendance = async () => {
    if(present.length === 0) return alert("विद्यार्थी निवडा!");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const R = 6371e3; 
      const dLat = (CAMPUS_LAT - pos.coords.latitude) * Math.PI/180;
      const dLon = (CAMPUS_LON - pos.coords.longitude) * Math.PI/180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(CAMPUS_LAT * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      if ((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) > 200) { setLoading(false); return alert("तुम्ही कॅम्पसच्या बाहेर आहात!"); }
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type, 
        present: present.length, total: students.length, 
        time_str: new Date().toLocaleDateString('en-GB') 
      }]);
      alert("Attendance Saved!"); setIsReady(false); setPresent([]); setLoading(false);
    }, () => { setLoading(false); alert("GPS Error!"); });
  };

  if (!isReady) return (
    <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '30px', borderRadius: '25px', maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ textAlign: 'center' }}><Clock size={24} style={{verticalAlign:'middle', marginRight:'10px'}}/> Setup Session</h3>
      <select style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', marginBottom: '15px' }} onChange={e => setSel({...sel, class: e.target.value})}><option value="">Select Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
      <select style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: 'white', marginBottom: '15px' }} onChange={e => setSel({...sel, sub: e.target.value})}><option value="">Select Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
      <button onClick={() => sel.class && sel.sub ? setIsReady(true) : alert("माहिती भरा!")} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 'bold' }}>START ROLL CALL</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setIsReady(false)} style={{ background: 'none', border: 'none', color: 'white' }}><ArrowLeft/></button>
        <div style={{ textAlign: 'right' }}><b>{sel.class}</b><br/><small>{sel.sub}</small></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '10px', paddingBottom: '100px' }}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} 
               style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: present.includes(s.id) ? '#6366f1' : '#1e293b', borderRadius: '15px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.2s' }}>
            {s.id}
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center' }}>
        <button disabled={loading} onClick={submitAttendance} style={{ maxWidth: '600px', width: '100%', padding: '18px', borderRadius: '15px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '16px' }}>
          {loading ? "SAVING..." : `SUBMIT (${present.length})`}
        </button>
      </div>
    </div>
  );
      }
