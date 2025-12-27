import { ArrowLeft, BookOpen, CheckCircle, Download, GraduationCap, ListChecks, LogOut, PlusCircle, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

const styles = {
  container: { width: '100vw', minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' },
  nav: { width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px 5%', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', boxSizing: 'border-box', alignItems: 'center' },
  card: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', width: '95%', maxWidth: '1100px', margin: '20px auto', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflowX: 'auto' },
  input: { padding: '12px', borderRadius: '6px', backgroundColor: '#334155', color: 'white', border: '1px solid #475569', width: '100%', marginBottom: '10px', outline: 'none' },
  select: { padding: '12px', borderRadius: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #3b82f6', width: '100%', marginBottom: '15px', cursor: 'pointer' },
  btn: (bg) => ({ backgroundColor: bg, color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }),
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '20px', minWidth: '700px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #334155', color: '#94a3b8', backgroundColor: '#1e293b' },
  td: { padding: '12px', borderBottom: '1px solid #334155' },
  tabBtn: (active) => ({ padding: '12px', cursor: 'pointer', border: 'none', backgroundColor: active ? '#3b82f6' : '#1e293b', color: 'white', borderRadius: '8px', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' })
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [faculties, setFaculties] = useState([]);
  const [excelClasses, setExcelClasses] = useState([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('faculties').select('*');
      if (data) setFaculties(data);
      try {
        const res = await fetch('/students_list.xlsx');
        const ab = await res.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        setExcelClasses(wb.SheetNames);
      } catch (e) { console.error("Excel Error: student_list.xlsx missing in public folder"); }
    };
    init();
  }, []);

  const handleLogin = (u, p) => {
    if (u === "HODCOM" && p === "COMP1578") { setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); }
    else {
      const f = faculties.find(x => x.id === u && x.password === p);
      if (f) { setUser({ ...f, role: 'faculty' }); setView('faculty'); } 
      else { alert("Login Failed!"); }
    }
  };

  if (view === 'login') return (
    <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '24px', width: '340px', textAlign: 'center', color: '#0f172a' }}>
        <GraduationCap size={60} color="#2563eb" style={{margin:'0 auto 20px'}} />
        <h2>College ERP</h2>
        <input id="u" style={{ ...styles.input, color: 'black' }} placeholder="ID" />
        <input id="p" type="password" style={{ ...styles.input, color: 'black' }} placeholder="Password" />
        <button style={{ ...styles.btn('#2563eb'), width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}><GraduationCap /> <b>{user.role.toUpperCase()} PANEL</b></div>
        <button onClick={() => {setUser(null); setView('login');}} style={{...styles.btn('#ef4444'), padding:'8px 15px'}}><LogOut size={16} /> Logout</button>
      </nav>
      {view === 'hod' ? <HODPanel excelClasses={excelClasses} /> : <FacultyPanel user={user} />}
    </div>
  );
}

function HODPanel({ excelClasses }) {
  const [tab, setTab] = useState('fac');
  const [data, setData] = useState({ subjects: [], faculties: [], assigns: [], attendance: [] });
  const [form, setForm] = useState({ subNames: '', selClass: '', selFac: '', selSub: '', facName: '', facId: '', facPass: '' });

  const load = async () => {
    const { data: s } = await supabase.from('subjects').select('*');
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: a } = await supabase.from('assignments').select('*');
    const { data: att } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    setData({ subjects: s || [], faculties: f || [], assigns: a || [], attendance: att || [] });
  };
  useEffect(() => { load(); }, []);

  const downloadMasterSheet = () => {
    if (data.attendance.length === 0) return alert("No Data!");
    const sheetData = data.attendance.map(r => ({
      "Date": r.time_str, "Faculty": r.faculty, "Class": r.class, "Subject": r.sub, "Present": r.present, "Total": r.total
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, "Master_Attendance_Report.xlsx");
  };

  const regFac = async () => {
    await supabase.from('faculties').insert([{ id: form.facId, name: form.facName, password: form.facPass }]);
    alert("Faculty Registered!"); setForm({...form, facName:'', facId:'', facPass:''}); load();
  };

  const linkSubs = async () => {
    const list = form.subNames.split(',').map(s => ({ class_name: form.selClass, subject_name: s.trim() }));
    await supabase.from('subjects').insert(list);
    alert("Linked!"); setForm({...form, subNames:''}); load();
  };

  const assign = async () => {
    const f = data.faculties.find(x => x.id === form.selFac);
    await supabase.from('assignments').insert([{ fac_id: form.selFac, fac_name: f.name, class_name: form.selClass, subject_name: form.selSub }]);
    alert("Assigned!"); load();
  };

  const del = async (table, id) => { if(confirm("Delete?")) { await supabase.from(table).delete().eq('id', id); load(); } };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap:'wrap' }}>
        <button style={styles.tabBtn(tab==='fac')} onClick={()=>setTab('fac')}><Users size={18}/> Faculty</button>
        <button style={styles.tabBtn(tab==='subs')} onClick={()=>setTab('subs')}><BookOpen size={18}/> Subjects</button>
        <button style={styles.tabBtn(tab==='assign')} onClick={()=>setTab('assign')}><PlusCircle size={18}/> Assign</button>
        <button style={styles.tabBtn(tab==='report')} onClick={()=>setTab('report')}><ListChecks size={18}/> Reports</button>
      </div>

      <div style={styles.card}>
        {tab === 'fac' && (
          <div>
            <h3>Register Faculty</h3>
            <input style={styles.input} placeholder="Name" value={form.facName} onChange={e=>setForm({...form, facName:e.target.value})} />
            <input style={styles.input} placeholder="ID" value={form.facId} onChange={e=>setForm({...form, facId:e.target.value})} />
            <input style={styles.input} placeholder="Password" value={form.facPass} onChange={e=>setForm({...form, facPass:e.target.value})} />
            <button style={styles.btn('#3b82f6')} onClick={regFac}>Register</button>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>ID</th><th style={styles.th}>Name</th><th style={styles.th}>Action</th></tr></thead>
              <tbody>{data.faculties.map(f => <tr key={f.id}><td style={styles.td}>{f.id}</td><td style={styles.td}>{f.name}</td><td style={styles.td}><Trash2 size={18} color="red" onClick={()=>del('faculties', f.id)}/></td></tr>)}</tbody>
            </table>
          </div>
        )}

        {tab === 'subs' && (
          <div>
            <h3>Link Subjects</h3>
            <select style={styles.select} value={form.selClass} onChange={e=>setForm({...form, selClass: e.target.value})}><option value="">Select Sheet</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={styles.input} placeholder="Subjects (Comma separated)" value={form.subNames} onChange={e=>setForm({...form, subNames: e.target.value})} />
            <button style={styles.btn('#10b981')} onClick={linkSubs}>Link</button>
          </div>
        )}

        {tab === 'assign' && (
          <div>
            <h3>Allocation</h3>
            <select style={styles.select} onChange={e=>setForm({...form, selFac: e.target.value})}><option value="">Select Faculty</option>{data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
            <select style={styles.select} value={form.selClass} onChange={e=>setForm({...form, selClass: e.target.value})}><option value="">Select Class</option>{excelClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select style={styles.select} onChange={e=>setForm({...form, selSub: e.target.value})}><option value="">Select Subject</option>{data.subjects.filter(s => s.class_name === form.selClass).map(s => <option key={s.id} value={s.subject_name}>{s.subject_name}</option>)}</select>
            <button style={styles.btn('#8b5cf6')} onClick={assign}>Assign</button>
          </div>
        )}

        {tab === 'report' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3>Attendance History</h3>
              <button style={styles.btn('#1e293b')} onClick={downloadMasterSheet}><Download size={18}/> Download Excel</button>
            </div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Faculty</th><th style={styles.th}>Class</th><th style={styles.th}>Sub</th><th style={styles.th}>Count</th></tr></thead>
              <tbody>{data.attendance.map(r => <tr key={r.id}><td style={styles.td}>{r.time_str}</td><td style={styles.td}>{r.faculty}</td><td style={styles.td}>{r.class}</td><td style={styles.td}>{r.sub}</td><td style={styles.td}>{r.present}/{r.total}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FacultyPanel({ user }) {
  const [sel, setSel] = useState({ class: '', sub: '' });
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState([]);
  const [myAssigns, setMyAssigns] = useState([]);

  useEffect(() => {
    const load = async () => { const { data } = await supabase.from('assignments').select('*').eq('fac_id', user.id); setMyAssigns(data || []); };
    load();
  }, [user.id]);

  useEffect(() => {
    if (sel.class) {
      fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
        const wb = XLSX.read(ab, { type: 'array' });
        const sheet = wb.SheetNames.find(n => n.trim().toUpperCase() === sel.class.trim().toUpperCase());
        if (sheet) {
          const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
          setStudents(data.map(r => ({ id: String(r['ROLL NO'] || r['Roll No'] || ''), name: String(r['STUDENT NAME'] || r['Student Name'] || '') })).filter(s => s.id !== ""));
        }
      });
    }
  }, [sel.class]);

  const submitAtt = async () => {
    const tStr = new Date().toLocaleString('en-GB');
    await supabase.from('attendance').insert([{ faculty: user.name, sub: sel.sub, class: sel.class, present: present.length, total: students.length, time_str: tStr }]);
    
    // Individual Excel download for Faculty
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({ "ROLL NO": s.id, "STUDENT NAME": s.name, "STATUS": present.includes(s.id) ? "PRESENT" : "ABSENT" })));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `${sel.class}_${sel.sub}_Attendance.xlsx`);
    
    alert("Submitted!"); setSel({class:'', sub:''}); setPresent([]);
  };

  return (
    <div style={styles.card}>
      {!sel.sub ? (
        <div>
          <h3>Mark Attendance</h3>
          <select style={styles.select} value={sel.class} onChange={e=>setSel({...sel, class: e.target.value})}><option value="">Select Class</option>{[...new Set(myAssigns.map(a => a.class_name))].map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select style={styles.select} onChange={e=>setSel({...sel, sub: e.target.value})}><option value="">Select Subject</option>{myAssigns.filter(a => a.class_name === sel.class).map(a => <option key={a.id} value={a.subject_name}>{a.subject_name}</option>)}</select>
        </div>
      ) : (
        <div>
          <button onClick={()=>setSel({class:'', sub:''})} style={{...styles.btn('#475569'), marginBottom:'20px'}}><ArrowLeft size={16}/> Back</button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '8px' }}>
            {students.map(s => <div key={s.id} onClick={() => setPresent(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} style={{ padding: '15px 0', background: present.includes(s.id) ? '#22c55e' : '#334155', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>{s.id}</div>)}
          </div>
          <button style={{ ...styles.btn('#10b981'), width: '100%', marginTop: '20px' }} onClick={submitAtt}><CheckCircle size={18}/> Submit Attendance</button>
        </div>
      )}
    </div>
  );
}