import React, { useEffect, useState } from 'react';
import { LogOut, ArrowLeft, CheckCircle, MapPin, GraduationCap, BookOpen, ListChecks, PlusCircle, UserPlus, Users, Link as LinkIcon, Clock, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: '"Poppins", sans-serif', overflowX: 'hidden' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  
  // Login Card with Glassmorphism
  loginCard: { 
    background: 'rgba(255, 255, 255, 0.95)', 
    padding: '50px 40px', 
    borderRadius: '40px', 
    width: '450px', 
    textAlign: 'center', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)', 
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },

  input: { 
    padding: '15px', 
    borderRadius: '15px', 
    backgroundColor: '#f1f5f9', 
    color: '#1e293b', 
    border: '2px solid #e2e8f0', 
    width: '100%', 
    marginBottom: '15px', 
    outline: 'none',
    fontSize: '16px',
    transition: '0.3s'
  },

  // Gradient Buttons
  btnPrimary: { 
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
    color: 'white', 
    padding: '15px 25px', 
    border: 'none', 
    borderRadius: '15px', 
    cursor: 'pointer', 
    fontWeight: '700', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
  },

  btnSuccess: { 
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
    color: 'white', 
    padding: '15px 25px', 
    border: 'none', 
    borderRadius: '15px', 
    cursor: 'pointer', 
    fontWeight: '700', 
    width: '100%',
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)'
  },

  nav: { 
    background: 'rgba(30, 41, 59, 0.7)', 
    backdropFilter: 'blur(10px)',
    padding: '20px 8%', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottom: '1px solid #334155',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },

  card: { 
    background: '#1e293b', 
    padding: '30px', 
    borderRadius: '30px', 
    marginTop: '25px', 
    border: '1px solid #334155',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
  },

  tabBtn: (active) => ({ 
    padding: '15px', 
    cursor: 'pointer', 
    backgroundColor: active ? '#2563eb' : 'transparent', 
    color: 'white', 
    borderRadius: '15px', 
    border: active ? 'none' : '1px solid #334155', 
    flex: 1, 
    fontWeight: '600', 
    display: 'flex', 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '8px', 
    transition: '0.3s'
  }),

  rollGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
    gap: '15px', 
    marginTop: '25px' 
  },

  rollBtn: (active) => ({ 
    padding: '25px 0', 
    background: active ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#334155', 
    borderRadius: '20px', 
    textAlign: 'center', 
    cursor: 'pointer', 
    fontWeight: '800', 
    fontSize: '18px',
    border: 'none',
    boxShadow: active ? '0 10px 15px -3px rgba(16, 185, 129, 0.4)' : 'none',
    transition: '0.2s transform active'
  })
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
    const uid = u.trim();
    const pass = p.trim();
    if (uid === "HODCOM" && pass === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod');
    } else {
      const f = faculties.find(x => x.id === uid && x.password === pass);
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Wrong Credentials!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, ...styles.centered, backgroundImage: 'url("/logo.png")', backgroundSize: '600px', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundBlendMode: 'overlay' }}>
      <div style={styles.loginCard}>
        <img src="/logo.png" alt="Logo" style={{ width: '100px', marginBottom: '15px' }} />
        <h1 style={{ color: '#0f172a', fontSize: '22px', fontWeight: '900', lineHeight: '1.2' }}>ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH</h1>
        <div style={{ height: '4px', width: '60px', background: '#2563eb', margin: '15px auto', borderRadius: '2px' }}></div>
        <p style={{ color: '#64748b', fontWeight: '600', marginBottom: '30px', letterSpacing: '1px' }}>AMRIT ERP PORTAL</p>
        
        <input id="u" style={styles.input} placeholder="User ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        
        <button style={{ ...styles.btnPrimary, width: '100%', marginTop: '10px' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>
          LOGIN TO DASHBOARD
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>COMPUTER ENGINEERING DEPT</span>
          <br /><b style={{ fontSize: '20px' }}>{user.name}</b>
        </div>
        <button onClick={() => setView('login')} style={{ ...styles.btnPrimary, background: '#ef4444', padding: '10px 20px', boxShadow: 'none' }}>
          <LogOut size={18} /> Logout
        </button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (ATTRACTIVE) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('1'); 
  const [list, setList] = useState({ faculties: [], attendance: [], assigns: [] });
  const [f, setF] = useState({ name: '', id: '', pass: '', sFac: '', sClass: '', sSub: '' });

  const refresh = async () => {
    const { data: fac } = await supabase.from('faculties').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: ass } = await supabase.from('assignments').select('*');
    setList({ faculties: fac || [], attendance: att || [], assigns: ass || [] });
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button style={styles.tabBtn(tab === '1')} onClick={() => setTab('1')}><ListChecks size={24} /> Reports</button>
        <button style={styles.tabBtn(tab === '2')} onClick={() => setTab('2')}><UserPlus size={24} /> Faculty</button>
        <button style={styles.tabBtn(tab === '3')} onClick={() => setTab('3')}><LinkIcon size={24} /> Link Sub</button>
        <button style={styles.tabBtn(tab === '4')} onClick={() => setTab('4')}><Users size={24} /> Stats</button>
      </div>

      <div style={styles.card}>
        {tab === '1' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Attendance Logs</h3>
            {list.attendance.map(r => (
              <div key={r.id} style={{ padding: '20px', background: '#0f172a', borderRadius: '20px', marginBottom: '10px', display:'flex', justifyContent:'space-between', alignItems:'center', border: '1px solid #334155' }}>
                <div>
                  <b style={{ color: '#2563eb', fontSize: '18px' }}>{r.class}</b> - {r.sub} <span style={{fontSize:'12px', background:'#334155', padding:'2px 8px', borderRadius:'5px'}}>{r.type}</span>
                  <br/><small style={{ color: '#94a3b8' }}>{r.faculty} | {r.time_str} | {r.start_time}-{r.end_time}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#10b981', fontWeight: '900', fontSize: '20px' }}>{r.present}/{r.total}</div>
                  <small style={{ color: '#64748b' }}>Present</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === '2' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Register New Faculty</h3>
            <input style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} placeholder="Full Name" onChange={e => setF({ ...f, name: e.target.value })} />
            <input style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} placeholder="Faculty ID" onChange={e => setF({ ...f, id: e.target.value })} />
            <input style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} type="password" placeholder="Password" onChange={e => setF({ ...f, pass: e.target.value })} />
            <button style={styles.btnSuccess} onClick={async () => { await supabase.from('faculties').insert([{ id: f.id, name: f.name, password: f.pass }]); alert("Faculty Registered!"); refresh(); }}>
              SAVE FACULTY DATA
            </button>
          </div>
        )}

        {tab === '3' && (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Link Subject to Class</h3>
            <select style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} onChange={e => setF({ ...f, sFac: e.target.value })}>
              <option value="">-- Select Faculty --</option>
              {list.faculties.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <select style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} onChange={e => setF({ ...f, sClass: e.target.value })}>
              <option value="">-- Select Class --</option>
              {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} placeholder="Subject Name" onChange={e => setF({ ...f, sSub: e.target.value })} />
            <button style={{ ...styles.btnPrimary, width: '100%' }} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: f.sFac, class_name: f.sClass, subject_name: f.sSub }]); alert("Linked!"); refresh(); }}>
              CONFIRM LINKING
            </button>
          </div>
        )}

        {tab === '4' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '40px', borderRadius: '30px', textAlign: 'center', border: '1px solid #334155' }}>
              <Users size={48} color="#2563eb" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ fontSize: '40px', margin: 0 }}>{list.faculties.length}</h2>
              <p style={{ color: '#94a3b8', fontWeight: 'bold' }}>Total Faculties</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '40px', borderRadius: '30px', textAlign: 'center', border: '1px solid #334155' }}>
              <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ fontSize: '40px', margin: 0 }}>{list.attendance.length}</h2>
              <p style={{ color: '#94a3b8', fontWeight: 'bold' }}>Records Tracked</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- FACULTY PANEL (ULTRA MODERN) ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '', type: 'Lecture', startTime: '', endTime: '' });
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

  const submitAtt = async () => {
    if(!sel.startTime || !sel.endTime) return alert("Please fill Start & End Time!");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const timeStr = new Date().toLocaleDateString('en-GB');
      
      await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: sel.sub, class: sel.class, type: sel.type,
        start_time: sel.startTime, end_time: sel.endTime,
        present: present.length, total: students.length, time_str: timeStr 
      }]);

      const excelData = students.map(s => ({ 
        "ROLL NO": s.id, "NAME": s.name, "SUBJECT": sel.sub, "TYPE": sel.type,
        "START": sel.startTime, "END": sel.endTime, "DATE": timeStr,
        "STATUS": present.includes(s.id) ? "P" : "A" 
      }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `${sel.class}_${sel.type}_${sel.sub}.xlsx`);

      alert("✅ Attendance Saved & Excel Downloaded!");
      setSel({ class: '', sub: '', type: 'Lecture', startTime: '', endTime: '' }); setPresent([]);
    }, () => alert("Enable GPS Access!"));
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}><Clock color="#2563eb" /> Setup Your Session</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '13px' }}>Choose Class</label>
          <select style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} onChange={e => setSel({ ...sel, class: e.target.value })}>
            <option value="">Select Class</option>
            {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '13px' }}>Choose Subject</label>
          <select style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} onChange={e => setSel({ ...sel, sub: e.target.value })}>
            <option value="">Select Subject</option>
            {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
          </select>
        </div>
      </div>

      <label style={{ color: '#94a3b8', fontSize: '13px' }}>Session Type</label>
      <select style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} value={sel.type} onChange={e => setSel({ ...sel, type: e.target.value })}>
        <option value="Lecture">Theory Lecture (1 or 2 Hrs)</option>
        <option value="Practical">Practical Session (2 Hrs)</option>
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div><label style={{ color: '#94a3b8', fontSize: '13px' }}>Start Time</label><input type="time" style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} onChange={e=>setSel({...sel, startTime:e.target.value})} /></div>
        <div><label style={{ color: '#94a3b8', fontSize: '13px' }}>End Time</label><input type="time" style={{ ...styles.input, backgroundColor: '#0f172a', color: 'white' }} onChange={e=>setSel({...sel, endTime:e.target.value})} /></div>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => setSel({ ...sel, sub: '' })} style={{ ...styles.btnPrimary, background: '#475569', boxShadow: 'none' }}><ArrowLeft size={20} /> Change Settings</button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: '#065f46', color: '#34d399', padding: '5px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>GEOLOCATION ACTIVE</div>
          <b style={{ fontSize: '20px' }}>{sel.class} | {sel.sub}</b>
        </div>
      </div>

      <div style={{ background: '#0f172a', padding: '30px', borderRadius: '30px', textAlign: 'center', border: '1px solid #334155' }}>
        <span style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '2px' }}>STUDENTS PRESENT</span>
        <h1 style={{ fontSize: '60px', margin: '10px 0', color: '#10b981' }}>{present.length} <span style={{fontSize:'25px', color:'#334155'}}>/ {students.length}</span></h1>
      </div>

      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>
            {s.id}
          </div>
        ))}
      </div>

      <button style={{ ...styles.btnSuccess, marginTop: '40px', padding: '25px', fontSize: '20px' }} onClick={submitAtt}>
        <CheckCircle size={24} /> SUBMIT & DOWNLOAD EXCEL
      </button>
    </div>
  );
            }
        
