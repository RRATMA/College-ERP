import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Search, Layers, FileSpreadsheet, LayoutGrid, 
  Users, Download, PlusCircle, TrendingUp, Zap, Shield, Database, 
  Activity, Clock, CheckCircle, XCircle, UserCheck, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// --- DESIGNER OVERRIDE: THE CYBER-GLASS UI ---
const injectStyles = () => {
  if (document.getElementById('amrit-master-styles')) return;
  const styleTag = document.createElement("style");
  styleTag.id = 'amrit-master-styles';
  styleTag.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
    :root { --cyan: #06b6d4; --bg: #030712; --glass: rgba(15, 23, 42, 0.7); }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: #f1f5f9; margin: 0; overflow-x: hidden; }
    .glass { background: var(--glass); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; }
    .nav-pill { background: rgba(255,255,255,0.05); padding: 12px 24px; border-radius: 100px; cursor: pointer; transition: 0.3s; color: #94a3b8; font-weight: 700; display: flex; align-items: center; gap: 10px; border: 1px solid transparent; }
    .nav-pill.active { background: var(--cyan); color: white; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
    .stat-card { padding: 25px; border-radius: 24px; position: relative; overflow: hidden; }
    .stat-card h2 { font-size: 38px; margin: 0; font-weight: 800; color: white; }
    .action-btn { background: var(--cyan); color: white; border: none; padding: 14px 28px; border-radius: 14px; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .action-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(6, 182, 212, 0.4); }
    input, select { background: rgba(0,0,0,0.3) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; padding: 15px !important; border-radius: 12px !important; margin-bottom: 15px; width: 100%; }
    .feed-row { display: flex; align-items: center; padding: 18px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
    .feed-row:hover { background: rgba(255,255,255,0.03); }
  `;
  document.head.appendChild(styleTag);
};

export default function AmritFullSystem() {
  const [view, setView] = useState('login'); 
  const [user, setUser] = useState(null);
  const [excelSheets, setExcelSheets] = useState([]);

  useEffect(() => {
    injectStyles();
    fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      setExcelSheets(wb.SheetNames);
    }).catch(e => console.error("Excel Missing"));
  }, []);

  const handleLogin = async (id, pass) => {
    if (id === "HODCOM" && pass === "COMP1578") {
      setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
    } else {
      const { data } = await supabase.from('faculties').select('*').eq('id', id).eq('password', pass).single();
      if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
      else alert("Invalid Credentials");
    }
  };

  if (view === 'login') return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at center, #111827 0%, #030712 100%)' }}>
      <div className="glass" style={{ padding: '60px', width: '360px', textAlign: 'center', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
        <div style={{ width: '100px', height: '100px', margin: '0 auto 25px', borderRadius: '50%', background: '#000', border: '2px solid var(--cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)' }}>
          <img src="/logo.png" alt="AMRIT Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: 800, margin: 0, letterSpacing: '-1.5px' }}>AMRIT</h1>
        <p style={{ color: 'var(--cyan)', fontSize: '11px', fontWeight: 800, letterSpacing: '4px', marginBottom: '40px' }}>SECURED TERMINAL</p>
        <input id="u" placeholder="System ID" />
        <input id="p" type="password" placeholder="Passphrase" />
        <button className="action-btn" style={{ width: '100%' }} onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>ENTER SYSTEM</button>
      </div>
    </div>
  );

  return view === 'hod' ? <HODPanel excelSheets={excelSheets} logout={() => setView('login')} /> : <FacultyPanel user={user} logout={() => setView('login')} />;
}

// --- FEATURE: HOD CONTROL PANEL (All Features) ---
function HODPanel({ excelSheets, logout }) {
  const [tab, setTab] = useState('dashboard');
  const [db, setDb] = useState({ staff: [], logs: [], maps: [] });
  const [form, setForm] = useState({ sName: '', sId: '', sPass: '', mFac: '', mClass: '', mSub: '' });

  const sync = async () => {
    const { data: f } = await supabase.from('faculties').select('*').order('name');
    const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ staff: f || [], logs: l || [], maps: m || [] });
  };

  useEffect(() => { sync(); }, [tab]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="glass" style={{ padding: '10px', borderColor: 'var(--cyan)' }}><Shield color="var(--cyan)" /></div>
          <h2 style={{ margin: 0 }}>HOD Control <span style={{ opacity: 0.5, fontWeight: 300 }}>Console</span></h2>
        </div>
        <button onClick={logout} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>LOGOUT</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <div onClick={() => setTab('dashboard')} className={`nav-pill ${tab === 'dashboard' ? 'active' : ''}`}><LayoutGrid size={18} /> DASHBOARD</div>
        <div onClick={() => setTab('staff')} className={`nav-pill ${tab === 'staff' ? 'active' : ''}`}><Users size={18} /> STAFF</div>
        <div onClick={() => setTab('mapping')} className={`nav-pill ${tab === 'mapping' ? 'active' : ''}`}><PlusCircle size={18} /> MAPPING</div>
        <div onClick={() => setTab('logs')} className={`nav-pill ${tab === 'logs' ? 'active' : ''}`}><FileSpreadsheet size={18} /> LOGS</div>
      </div>

      {tab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.5s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
            <div className="glass stat-card"><h3>{db.logs.length}</h3><p>Today Sessions</p></div>
            <div className="glass stat-card"><h3>{db.staff.length}</h3><p>Total Faculties</p></div>
            <div className="glass stat-card"><h3>{excelSheets.length}</h3><p>Active Classes</p></div>
            <div className="glass stat-card" style={{ background: 'linear-gradient(135deg, #083344, #030712)' }}><h3>LIVE</h3><p>Server Status</p></div>
          </div>
          <div className="glass" style={{ padding: '30px' }}>
            <h4 style={{ margin: '0 0 20px', opacity: 0.6 }}>RECENT ACTIVITY FEED</h4>
            {db.logs.slice(0, 5).map((l, i) => (
              <div key={i} className="feed-row">
                <div style={{ flex: 1 }}><b>{l.class} — {l.sub}</b><br/><small style={{ opacity: 0.5 }}>{l.faculty} • {l.time_str}</small></div>
                <div style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: '20px' }}>{l.present}/{l.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="glass" style={{ padding: '30px' }}>
          <h3>Staff Directory</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', marginBottom: '30px' }}>
            <input placeholder="Name" value={form.sName} onChange={e => setForm({ ...form, sName: e.target.value })} />
            <input placeholder="Staff ID" value={form.sId} onChange={e => setForm({ ...form, sId: e.target.value })} />
            <input placeholder="Pass" type="password" value={form.sPass} onChange={e => setForm({ ...form, sPass: e.target.value })} />
            <button className="action-btn" onClick={async () => { await supabase.from('faculties').insert([{ id: form.sId, name: form.sName, password: form.sPass }]); sync(); }}>ADD</button>
          </div>
          {db.staff.map(f => (
            <div key={f.id} className="feed-row">
              <div style={{ flex: 1 }}><b>{f.name}</b><br/><small style={{ opacity: 0.5 }}>ID: {f.id}</small></div>
              <button onClick={async () => { await supabase.from('faculties').delete().eq('id', f.id); sync(); }} style={{ color: '#ef4444', background: 'none', border: 'none' }}><Trash2 /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'mapping' && (
        <div className="glass" style={{ padding: '30px' }}>
          <h3>Allocate Subject Mapping</h3>
          <select value={form.mFac} onChange={e => setForm({ ...form, mFac: e.target.value })}>
            <option value="">Select Faculty</option>
            {db.staff.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={form.mClass} onChange={e => setForm({ ...form, mClass: e.target.value })}>
            <option value="">Select Class (from Excel)</option>
            {excelSheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="Subject Name" value={form.mSub} onChange={e => setForm({ ...form, mSub: e.target.value })} />
          <button className="action-btn" style={{ width: '100%' }} onClick={async () => { await supabase.from('assignments').insert([{ fac_id: form.mFac, class_name: form.mClass, subject_name: form.mSub }]); sync(); }}>CONFIRM MAPPING</button>
        </div>
      )}

      {tab === 'logs' && (
        <div className="glass" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Attendance Records</h3>
            <button className="action-btn" onClick={() => {
              const ws = XLSX.utils.json_to_sheet(db.logs);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Attendance");
              XLSX.writeFile(wb, "Amrit_Attendance_Export.xlsx");
            }}><Download size={18} /> EXCEL</button>
          </div>
          {db.logs.map((l, i) => (
            <div key={i} className="feed-row">
              <div style={{ flex: 1 }}><b>{l.class} — {l.sub}</b><br/><small>{l.faculty} • {l.time_str}</small></div>
              <b style={{ color: 'var(--cyan)' }}>{l.present}/{l.total}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- FEATURE: FACULTY ATTENDANCE TERMINAL ---
function FacultyPanel({ user, logout }) {
  const [step, setStep] = useState(1); // 1: Select Map, 2: Mark Attendance
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(({ data }) => setMaps(data || []));
  }, []);

  const loadStudents = async (className) => {
    const res = await fetch('/students_list.xlsx');
    const ab = await res.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const data = XLSX.utils.sheet_to_json(wb.Sheets[className]);
    setStudents(data.map(s => ({ ...s, present: true })));
    setStep(2);
  };

  const submitAttendance = async () => {
    const presentCount = students.filter(s => s.present).length;
    await supabase.from('attendance').insert([{
      faculty: user.name,
      fac_id: user.id,
      class: selectedMap.class_name,
      sub: selectedMap.subject_name,
      present: presentCount,
      total: students.length,
      time_str: new Date().toLocaleString(),
      type: 'Theory'
    }]);
    alert("Attendance Synced to Supabase!");
    setStep(1);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
        <h2>Welcome, Prof. {user.name}</h2>
        <button onClick={logout} className="glass" style={{ color: '#ef4444', padding: '10px 20px' }}>LOGOUT</button>
      </div>

      {step === 1 ? (
        <div className="glass" style={{ padding: '30px' }}>
          <h3>Select Your Class</h3>
          {maps.length > 0 ? maps.map(m => (
            <div key={m.id} className="feed-row" style={{ cursor: 'pointer' }} onClick={() => { setSelectedMap(m); loadStudents(m.class_name); }}>
              <div style={{ flex: 1 }}><b>{m.class_name}</b> — {m.subject_name}</div>
              <ChevronRight color="var(--cyan)" />
            </div>
          )) : <p>No assignments found. Contact HOD.</p>}
        </div>
      ) : (
        <div className="glass" style={{ padding: '30px' }}>
          <h3>Marking: {selectedMap.class_name}</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
            {students.map((s, i) => (
              <div key={i} className="feed-row">
                <div style={{ flex: 1 }}>{s.Roll_No} — {s.Name}</div>
                <input type="checkbox" checked={s.present} style={{ width: '25px', height: '25px' }} onChange={() => {
                  const copy = [...students];
                  copy[i].present = !copy[i].present;
                  setStudents(copy);
                }} />
              </div>
            ))}
          </div>
          <button className="action-btn" style={{ width: '100%' }} onClick={submitAttendance}>SUBMIT TO CLOUD</button>
        </div>
      )}
    </div>
  );
          }
