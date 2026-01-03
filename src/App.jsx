import React, { useEffect, useState } from 'react';
import { 
  LogOut, ArrowLeft, Trash2, Search, BookOpen, Layers, 
  FileSpreadsheet, ChevronRight, LayoutGrid, Users, 
  Download, PlusCircle, TrendingUp, Zap, MapPin, FlaskConical, GraduationCap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from "./supabaseClient";

// ... (Keeping your injectStyles and handleLogin logic the same) ...

// --- UPDATED FACULTY PANEL WITH TYPE FEATURES ---
function FacultyPanel({ user, setView }) {
  const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', start: '', end: '' });
  const [active, setActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [marked, setMarked] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    supabase.from('assignments').select('*').eq('fac_id', user.id).then(res => setMyJobs(res.data || [])); 
  }, [user.id]);

  const launch = () => {
    if(!setup.cl || !setup.sub || !setup.start) return alert("Please select Class, Subject and Time");
    fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
      const wb = XLSX.read(ab, { type: 'array' });
      const sh = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames.find(s=>s.toLowerCase()===setup.cl.toLowerCase())]);
      setStudents(sh.map(s => ({ id: String(s['ROLL NO'] || s['Roll No']) })).filter(s => s.id));
      setActive(true);
    });
  };

  const submit = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      // GPS Distance Logic
      const dist = Math.sqrt(Math.pow(pos.coords.latitude-19.7042,2)+Math.pow(pos.coords.longitude-72.7645,2));
      if(dist > 0.0008) { setLoading(false); return alert("❌ ACCESS DENIED: Move inside Campus Boundary"); }
      
      const { data: att } = await supabase.from('attendance').insert([{ 
        faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
        duration: `${setup.start}-${setup.end}`, present: marked.length, 
        total: students.length, time_str: new Date().toLocaleDateString('en-GB') 
      }]).select().single();
      
      // Sync Absentee Records
      const abs = students.filter(s => !marked.includes(s.id)).map(s => ({ 
        attendance_id: att.id, student_roll: s.id, class_name: setup.cl 
      }));
      if(abs.length > 0) await supabase.from('absentee_records').insert(abs);
      
      alert(`✅ ${setup.ty} Attendance Synced!`);
      setLoading(false); setActive(false); setMarked([]);
    }, () => { setLoading(false); alert("GPS Permission Denied!"); });
  };

  if (!active) return (
    <div style={ui.mobileWrap}>
      <div style={ui.header}>
        <div><h3>Prof. {user.name}</h3><small>Active Session Setup</small></div>
        <button onClick={()=>setView('login')} style={ui.exitBtn}><LogOut size={20}/></button>
      </div>

      {/* --- CLASS TYPE SELECTOR --- */}
      <div style={ui.typeSelectorRow}>
        <button 
          onClick={() => setSetup({...setup, ty: 'Theory'})}
          style={{...ui.typeBtn, background: setup.ty === 'Theory' ? '#0891b2' : '#1e293b'}}
        >
          <GraduationCap size={18}/> Theory
        </button>
        <button 
          onClick={() => setSetup({...setup, ty: 'Practical'})}
          style={{...ui.typeBtn, background: setup.ty === 'Practical' ? '#10b981' : '#1e293b'}}
        >
          <FlaskConical size={18}/> Practical
        </button>
      </div>

      <div style={ui.sectionLabel}>SELECT CLASS</div>
      <div style={ui.tileGrid}>
        {[...new Set(myJobs.map(j=>j.class_name))].map(c => (
          <div key={c} onClick={()=>setSetup({...setup, cl:c})} style={{...ui.tile, border: setup.cl===c?'2px solid #06b6d4':'2px solid transparent'}}>{c}</div>
        ))}
      </div>

      {setup.cl && (
        <div style={{marginTop: '20px', animation: 'fadeIn 0.3s'}}>
          <div style={ui.sectionLabel}>SELECT SUBJECT</div>
          <div style={ui.subList}>
            {myJobs.filter(j=>j.class_name===setup.cl).map(j => (
              <div key={j.id} onClick={()=>setSetup({...setup, sub:j.subject_name})} 
                style={{...ui.subRow, background: setup.sub===j.subject_name?'rgba(8, 145, 178, 0.2)':'#1e293b', border: setup.sub===j.subject_name?'1px solid #0891b2':'1px solid transparent'}}>
                {j.subject_name}
              </div>
            ))}
          </div>
          
          <div style={ui.sectionLabel}>SESSION TIME</div>
          <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
            <input type="time" onChange={e=>setSetup({...setup, start:e.target.value})} style={ui.input}/>
            <input type="time" onChange={e=>setSetup({...setup, end:e.target.value})} style={ui.input}/>
          </div>
          
          <button onClick={launch} style={{...ui.primaryBtn, background: setup.ty === 'Theory' ? '#0891b2' : '#10b981'}}>
            START {setup.ty.toUpperCase()} CALL
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={ui.mobileWrap}>
      <div style={{...ui.stickyHeader, borderBottom: `4px solid ${setup.ty === 'Theory' ? '#0891b2' : '#10b981'}`}}>
        <button onClick={()=>setActive(false)} style={ui.circleBtn}><ArrowLeft/></button>
        <div style={{textAlign: 'center'}}>
          <h3 style={{margin:0}}>{setup.cl}</h3>
          <small style={{color: setup.ty === 'Theory' ? '#06b6d4' : '#10b981'}}>{setup.ty} Session</small>
        </div>
        <div style={{...ui.badge, background: setup.ty === 'Theory' ? '#0891b2' : '#10b981'}}>{marked.length}/{students.length}</div>
      </div>
      
      <div style={ui.rollArea}>
        {students.map(s => (
          <div key={s.id} 
            onClick={() => setMarked(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p, s.id])} 
            style={{...ui.rollChip, background: marked.includes(s.id)?'#10b981':'#1e293b', transform: marked.includes(s.id)?'scale(0.95)':'scale(1)'}}>
            {s.id}
          </div>
        ))}
      </div>
      
      <button disabled={loading} onClick={submit} style={{...ui.submitBtn, background: setup.ty === 'Theory' ? '#0891b2' : '#10b981'}}>
        {loading ? "VERIFYING LOCATION..." : `SYNC ${setup.ty.toUpperCase()} DATA`}
      </button>
    </div>
  );
}

// --- UPDATED UI OBJECT WITH NEW STYLES ---
const ui = {
  // ... (keeping previous ui styles) ...
  mobileWrap: { padding: '20px', maxWidth: '500px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  sectionLabel: { fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '1.5px', margin: '15px 0 8px 5px' },
  typeSelectorRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  typeBtn: { flex: 1, padding: '15px', borderRadius: '15px', border: 'none', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' },
  tileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  tile: { padding: '25px 10px', borderRadius: '15px', background: '#1e293b', textAlign: 'center', fontWeight: 'bold', transition: '0.2s' },
  subList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  subRow: { padding: '16px', borderRadius: '12px', textAlign: 'center', fontWeight: '600' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', background: '#1e293b', border: '1px solid #334155', color: '#fff' },
  primaryBtn: { width: '100%', padding: '18px', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '800', fontSize: '14px', letterSpacing: '1px' },
  stickyHeader: { position: 'sticky', top: 0, background: '#020617', padding: '15px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 },
  rollArea: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '20px', paddingBottom: '120px' },
  rollChip: { padding: '20px 5px', borderRadius: '12px', textAlign: 'center', fontWeight: '800', fontSize: '16px', transition: '0.2s' },
  submitBtn: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '460px', margin: '0 auto', padding: '20px', borderRadius: '18px', color: '#fff', border: 'none', fontWeight: '800', boxShadow: '0 10px 20px rgba(0,0,0,0.4)' },
  circleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge: { padding: '6px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px' },
  exitBtn: { background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', padding: '10px', borderRadius: '12px' },
};
