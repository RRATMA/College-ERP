import { ArrowLeft, BookOpen, CheckCircle, GraduationCap, ListChecks, LogOut, MapPin, PlusCircle, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0b1120', color: 'white', fontFamily: '"Inter", sans-serif' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' },
  loginCard: { background: 'white', padding: '40px', borderRadius: '24px', width: '380px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
  input: { padding: '12px', borderRadius: '8px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', width: '100%', marginBottom: '10px', boxSizing: 'border-box', outline: 'none' },
  btn: (bg) => ({ backgroundColor: bg, color: 'white', padding: '10px 18px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }),
  nav: { background: '#1e293b', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '20px', marginTop: '20px', border: '1px solid #334155' },
  tabBtn: (active) => ({ padding: '10px 20px', cursor: 'pointer', border: 'none', backgroundColor: active ? '#2563eb' : '#0f172a', color: 'white', borderRadius: '8px', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }),
  rollGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '12px', marginTop: '20px' },
  rollBtn: (active) => ({ padding: '18px 0', background: active ? '#10b981' : '#1e293b', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', border: active ? '2px solid #34d399' : '1px solid #334155' })
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [faculties, setFaculties] = useState([]);
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('faculties').select('*');
      setFaculties(data || []);
      const res = await fetch('/students_list.xlsx');
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      }
    };
    init();
  }, []);

  const handleLogin = (u, p) => {
    if (u.trim() === "HODCOM" && p.trim() === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod', id: 'HOD' }); setView('hod');
    } else {
      const f = faculties.find(x => x.id === u.trim() && x.password === p.trim());
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); }
      else alert("Login Failed!");
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, ...styles.centered }}>
      <div style={styles.loginCard}>
        <div style={{ marginBottom: '15px', color: '#2563eb' }}><GraduationCap size={64} style={{ margin: '0 auto' }} /></div>
        <h1 style={{ color: '#1e293b', fontSize: '26px', fontWeight: '900', margin: '0' }}>College ERP</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>AMRIT System</p>
        <input id="u" style={styles.input} placeholder="ID" />
        <input id="p" type="password" style={styles.input} placeholder="Password" />
        <button style={{ ...styles.btn('#2563eb'), width: '100%', marginTop: '10px' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>DEPARTMENT OF COMPUTER</span><br /><b>{user.name}</b></div>
        <button onClick={() => setView('login')} style={{ ...styles.btn('#ef4444'), padding: '8px 16px' }}><LogOut size={16} /> Logout</button>
      </nav>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
      </div>
    </div>
  );
}

// --- HOD PANEL (RE-ADDED ALL FEATURES) ---
function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('report');
  const [data, setData] = useState({ faculties: [], assigns: [], attendance: [] });
  const [form, setForm] = useState({ facName: '', facId: '', facPass: '', selFac: '', selClass: '', selSub: '' });

  const loadData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: a } = await supabase.from('assignments').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setData({ faculties: f || [], assigns: a || [], attendance: att || [] });
  };

  useEffect(() => { loadData(); }, []);

  const addFaculty = async () => {
    if(!form.facId || !form.facName) return alert("Fill all details!");
    await supabase.from('faculties').insert([{ id: form.facId, name: form.facName, password: form.facPass }]);
    alert("Faculty Registered!"); loadData();
  };

  const assignSubject = async () => {
    if(!form.selFac || !form.selClass) return alert("Select Faculty & Class!");
    await supabase.from('assignments').insert([{ fac_id: form.selFac, class_name: form.selClass, subject_name: form.selSub }]);
    alert("Subject Assigned!"); loadData();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button style={styles.tabBtn(tab==='report')} onClick={()=>setTab('report')}><ListChecks size={18}/> Reports</button>
        <button style={styles.tabBtn(tab==='fac')} onClick={()=>setTab('fac')}><UserPlus size={18}/> Add Faculty</button>
        <button style={styles.tabBtn(tab==='assign')} onClick={()=>setTab('assign')}><PlusCircle size={18}/> Assign Sub</button>
      </div>

      {tab === 'fac' && (
        <div style={styles.card}>
          <h3>Register New Faculty</h3>
          <input style={styles.input} placeholder="Faculty Name" onChange={e=>setForm({...form, facName: e.target.value})} />
          <input style={styles.input} placeholder="Faculty ID" onChange={e=>setForm({...form, facId: e.target.value})} />
          <input style={styles.input} placeholder="Set Password" onChange={e=>setForm({...form, facPass: e.target.value})} />
          <button style={styles.btn('#10b981')} onClick={addFaculty}>Register Faculty</button>
        </div>
      )}

      {tab === 'assign' && (
        <div style={styles.card}>
          <h3>Assign Subject to Faculty</h3>
          <select style={styles.input} onChange={e=>setForm({...form, selFac: e.target.value})}>
            <option value="">-- Select Faculty --</option>
            {data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select style={styles.input} onChange={e=>setForm({...form, selClass: e.target.value})}>
            <option value="">-- Select Class --</option>
            {excelClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input style={styles.input} placeholder="Subject Name (e.g. React JS)" onChange={e=>setForm({...form, selSub: e.target.value})} />
          <button style={styles.btn('#2563eb')} onClick={assignSubject}>Assign Now</button>
        </div>
      )}

      {tab === 'report' && (
        <div style={styles.card}>
          <h3>Attendance History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#94a3b8', borderBottom: '2px solid #334155' }}>
                <th style={{ padding: '10px' }}>Date</th><th>Class</th><th>Subject</th><th>Faculty</th><th>Count</th>
              </tr>
            </thead>
            <tbody>
              {data.attendance.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '10px' }}>{r.time_str}</td><td>{r.class}</td><td>{r.sub}</td><td>{r.faculty}</td><td>{r.present}/{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- FACULTY PANEL ---
function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '' });
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
        const sheet = wb.Sheets[sel.class];
        if (sheet) {
          const data = XLSX.utils.sheet_to_json(sheet);
          setStudents(data.map(s => ({ id: String(s['ROLL NO'] || s['Roll No'] || ''), name: s['STUDENT NAME'], email: s['EMAIL'] })).filter(s => s.id));
        }
      });
    }
  }, [sel.class]);

  const submitAtt = async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const timeStr = new Date().toLocaleString('en-GB');
      await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, present: present.length, total: students.length, time_str: timeStr }]);
      
      const logs = students.map(s => ({ student_id: s.id, class_name: sel.class, subject_name: sel.sub, status: present.includes(s.id) ? 'P' : 'A' }));
      await supabase.from('attendance_logs').insert(logs);

      const excelData = students.map(s => ({ "ROLL NO": s.id, "NAME": s.name, "SUBJECT": sel.sub, "DATETIME": timeStr, "STATUS": present.includes(s.id) ? "P" : "A" }));
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `${sel.class}_Report.xlsx`);

      alert("✅ Success!");
      setSel({ class: '', sub: '' }); setPresent([]);
    }, () => alert("Enable GPS!"));
  };

  if (!sel.sub) return (
    <div style={styles.card}>
      <h3><BookOpen /> Select Lecture</h3>
      <select style={styles.input} onChange={e => setSel({ ...sel, class: e.target.value })}>
        <option value="">-- Select Class --</option>
        {[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select style={styles.input} onChange={e => setSel({ ...sel, sub: e.target.value })}>
        <option value="">-- Select Subject --</option>
        {myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}
      </select>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => setSel({ class: '', sub: '' })} style={styles.btn('#475569')}><ArrowLeft size={18} /> Back</button>
        <div style={{ color: '#10b981', fontWeight: 'bold' }}><MapPin size={18} /> GPS Active</div>
      </div>
      <div style={styles.rollGrid}>
        {students.map(s => (
          <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={styles.rollBtn(present.includes(s.id))}>
            {s.id}
          </div>
        ))}
      </div>
      <button style={{ ...styles.btn('#10b981'), width: '100%', marginTop: '30px', padding: '18px' }} onClick={submitAtt}><CheckCircle /> SUBMIT</button>
    </div>
  );
}