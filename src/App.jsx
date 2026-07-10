// // import React, { useEffect, useState } from 'react';
// // import { 
// //   LogOut, ArrowLeft, Trash2, Users, Database, TrendingUp, 
// //   BookOpen, CheckCircle, Download, Calendar, ShieldCheck, BarChart3, FileSpreadsheet, PlusCircle, Link as LinkIcon, Activity
// // } from 'lucide-react';
// // import * as XLSX from 'xlsx';
// // import ExcelJS from 'exceljs';
// // import { supabase } from "./supabaseClient";

// // const CAMPUS_LAT = 19.555009; 
// // const CAMPUS_LON = 73.249081;
// // const RADIUS_LIMIT = 0.0020; 
// // const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

// // const injectStyles = () => {
// //   if (typeof document === 'undefined' || document.getElementById('amrit-ultimate-vfinal')) return;
// //   const s = document.createElement("style");
// //   s.id = 'amrit-ultimate-vfinal';
// //   s.innerHTML = `
// //     * { box-sizing: border-box; }
// //     body { 
// //       font-family: 'Plus Jakarta Sans', sans-serif; 
// //       background: #020617; 
// //       color: #f1f5f9; 
// //       margin: 0; 
// //       padding: 0;
// //       overflow-x: hidden;
// //     }
// //     .container { padding: 15px; max-width: 1200px; margin: 0 auto; }
// //     .glass { 
// //       background: rgba(30, 41, 59, 0.4); 
// //       backdrop-filter: blur(12px); 
// //       border: 1px solid rgba(255, 255, 255, 0.1); 
// //       border-radius: 16px; 
// //       padding: 15px; 
// //       transition: 0.3s;
// //       width: 100%;
// //       margin-bottom: 15px;
// //     }
// //     .logo-circle { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #06b6d4; background: #fff; object-fit: contain; }
    
// //     .stat-grid { 
// //       display: grid; 
// //       grid-template-columns: repeat(2, 1fr); 
// //       gap: 10px; 
// //       margin-bottom: 20px; 
// //     }
// //     @media (min-width: 768px) {
// //       .stat-grid { grid-template-columns: repeat(3, 1fr); }
// //     }

// //     .stat-card { border-left: 3px solid #06b6d4; padding: 12px; position: relative; }
// //     .stat-card h3 { font-size: 20px; margin: 5px 0; font-weight: 800; color: #fff; }
// //     .stat-card p { font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 0; }

// //     input, select { 
// //       background: #0f172a; 
// //       border: 1px solid #1e293b; 
// //       color: #fff; 
// //       padding: 12px; 
// //       border-radius: 10px; 
// //       width: 100%; 
// //       margin-bottom: 10px; 
// //       font-size: 14px;
// //       outline: none;
// //     }

// //     .btn-cyan { 
// //       background: #0891b2; 
// //       color: #fff; 
// //       border: none; 
// //       padding: 14px; 
// //       border-radius: 12px; 
// //       font-weight: 700; 
// //       width: 100%; 
// //       cursor: pointer;
// //     }
    
// //     .tab-nav { 
// //       display: flex; 
// //       gap: 15px; 
// //       margin-bottom: 20px; 
// //       border-bottom: 1px solid #1e293b; 
// //       overflow-x: auto; 
// //       padding-bottom: 5px;
// //     }
// //     .tab-link { cursor: pointer; padding: 8px 5px; color: #64748b; font-weight: 700; font-size: 12px; white-space: nowrap; }
// //     .tab-link.active { color: #06b6d4; border-bottom: 2px solid #06b6d4; }
    
// //     .roll-grid {
// //       display: grid;
// //       grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
// //       gap: 10px;
// //       margin-bottom: 100px;
// //     }

// //     .roll-btn { 
// //       padding: 15px 0; 
// //       border-radius: 10px; 
// //       text-align: center; 
// //       font-weight: 800; 
// //       background: #1e293b; 
// //       color: #94a3b8; 
// //       font-size: 15px;
// //       border: 1px solid rgba(255,255,255,0.05);
// //       cursor: pointer;
// //     }
// //     .roll-btn.active { 
// //       background: #10b981 !important; 
// //       color: white !important; 
// //     }

// //     .type-chip { flex: 1; padding: 12px; border-radius: 10px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; font-size: 14px; }
// //     .type-chip.active { background: #06b6d4; color: white; }
// //   `;
// //   document.head.appendChild(s);
// // };

// // export default function AmritApp() {
// //   const [user, setUser] = useState(null);
// //   const [view, setView] = useState('login');
// //   const [sheets, setSheets] = useState([]);

// //   useEffect(() => {
// //     injectStyles();
// //     fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
// //       setSheets(XLSX.read(ab, { type: 'array' }).SheetNames);
// //     });
// //   }, []);

// //   const handleLogin = async (u, p) => {
// //     if (u === "HODCOM" && p === "COMP1578") { 
// //       setUser({ name: "HOD Admin", role: 'hod' }); setView('hod'); 
// //     } else {
// //       const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
// //       if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); } 
// //       else { alert("Login Failed!"); }
// //     }
// //   };

// //   if (view === 'login') return (
// //     <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
// //       <div className="glass" style={{ maxWidth: '340px', textAlign: 'center' }}>
// //         <img src="/logo.png" className="logo-circle" style={{width:'80px', height:'80px', marginBottom:'15px'}} alt="Logo" />
// //         <h2 style={{color: '#06b6d4', margin: 0, fontWeight: 900}}>AMRIT ERP</h2>
// //         <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
// //         <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div className="container">
// //       {view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
// //     </div>
// //   );
// // }

// // function HODPanel({ sheets, setView }) {
// //   const [tab, setTab] = useState('dash');
// //   const [db, setDb] = useState({ f: [], l: [], m: [] });

// //   const refresh = async () => {
// //     const { data: f } = await supabase.from('faculties').select('*');
// //     const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
// //     const { data: m } = await supabase.from('assignments').select('*');
// //     setDb({ f: f || [], l: l || [], m: m || [] });
// //   };
// //   useEffect(() => { refresh(); }, []);

// //   const today = new Date().toLocaleDateString('en-GB');
// //   const tLogs = db.l.filter(l => l.time_str === today);

// //   const exportReport = async (cls, isDef) => {
// //     try {
// //       const { data: logs } = await supabase.from('attendance').select('id, time_str, sub').eq('class', cls);
// //       const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', cls);
// //       const students = XLSX.utils.sheet_to_json(XLSX.read(await (await fetch('/students_list.xlsx')).arrayBuffer(), { type: 'array' }).Sheets[cls]);
// //       const wb = new ExcelJS.Workbook();
// //       const ws = wb.addWorksheet('Report');
// //       ws.addRow([INSTITUTE_NAME]);
// //       ws.addRow([`${isDef ? 'DEFAULTER' : 'MASTER'} - ${cls}`]);
// //       const headers = ["ROLL NO", "NAME", ...logs.map(l => `${l.time_str}\n(${l.sub})`), "TOTAL", "%"];
// //       const hRow = ws.addRow(headers);
// //       hRow.eachCell(c => { c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0891B2'}}; c.font={color:{argb:'FFFFFFFF'},bold:true}; });

// //       students.forEach(s => {
// //         const roll = String(s['ROLL NO'] || s['ID']);
// //         let p = 0;
// //         const row = [roll, s['STUDENT NAME']];
// //         logs.forEach(l => {
// //           if(!abs.find(a => a.attendance_id === l.id && String(a.student_roll) === roll)) { row.push("P"); p++; } else row.push("A");
// //         });
// //         const pct = (p / (logs.length || 1)) * 100;
// //         if (!isDef || pct < 75) { row.push(p, pct.toFixed(2) + "%"); ws.addRow(row); }
// //       });
// //       const buffer = await wb.xlsx.writeBuffer();
// //       const link = document.createElement('a');
// //       link.href = window.URL.createObjectURL(new Blob([buffer]));
// //       link.download = `${isDef ? 'Defaulter' : 'Master'}_${cls}.xlsx`;
// //       link.click();
// //     } catch(e) { alert("Download error!"); }
// //   };

// //   return (
// //     <>
// //       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
// //         <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
// //           <img src="/logo.png" className="logo-circle" alt="Logo" />
// //           <h3 style={{color:'#06b6d4', margin:0, fontWeight: 800}}>HOD ADMIN</h3>
// //         </div>
// //         <LogOut onClick={() => setView('login')} color="#f43f5e" size={20} />
// //       </div>

// //       {tab === 'dash' && (
// //         <div className="stat-grid">
// //           <div className="glass stat-card"><h3>{db.l.length}</h3><p>Total Lec</p></div>
// //           <div className="glass stat-card"><h3>{tLogs.length}</h3><p>Today Lec</p></div>
// //           <div className="glass stat-card"><h3>{tLogs.reduce((a,c)=>a+c.present,0)}</h3><p>Present</p></div>
// //           <div className="glass stat-card"><h3>{sheets.length}</h3><p>Classes</p></div>
// //           <div className="glass stat-card"><h3>{db.f.length}</h3><p>Staff</p></div>
// //           <div className="glass stat-card" style={{borderLeftColor:'#f43f5e'}}>
// //              <select id="dc" style={{fontSize:'10px', padding:'5px', marginBottom:'5px'}}>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
// //              <button onClick={()=>exportReport(document.getElementById('dc').value, true)} style={{padding:'5px', fontSize:'9px', background:'#f43f5e', color:'#fff', border:'none', borderRadius:'5px', width:'100%'}}>DEFAULTER</button>
// //           </div>
// //         </div>
// //       )}

// //       <div className="tab-nav">
// //         {['dash', 'staff', 'mapping', 'records'].map(t => (
// //           <div key={t} onClick={()=>setTab(t)} className={`tab-link ${tab===t?'active':''}`}>{t.toUpperCase()}</div>
// //         ))}
// //       </div>

// //       {tab === 'staff' && (
// //         <div className="glass">
// //           <input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/>
// //           <button className="btn-cyan" onClick={async()=>{
// //             await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
// //             refresh(); alert("Staff Added!");
// //           }}>SAVE STAFF</button>
// //         </div>
// //       )}

// //       {tab === 'mapping' && (
// //         <div className="glass">
// //           <select id="sf"><option>Select Faculty</option>{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
// //           <select id="sc"><option>Select Class</option>{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
// //           <input id="ss" placeholder="Subject"/>
// //           <button className="btn-cyan" onClick={async()=>{
// //             await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
// //             refresh(); alert("Mapped!");
// //           }}>CONFIRM MAPPING</button>
// //         </div>
// //       )}

// //       {tab === 'records' && (
// //         <div>
// //           {sheets.map(s => (
// //             <div key={s} className="glass" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 15px'}}>
// //               <span style={{fontSize:'13px', fontWeight:700}}>{s} Register</span>
// //               <button onClick={()=>exportReport(s, false)} className="btn-cyan" style={{width:'80px', padding:'6px', fontSize:'10px'}}>GET XLSX</button>
// //             </div>
// //           ))}
// //         </div>
// //       )}
// //     </>
// //   );
// // }

// // function FacultyPanel({ user, setView }) {
// //   const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
// //   const [active, setActive] = useState(false);
// //   const [list, setList] = useState([]);
// //   const [marked, setMarked] = useState([]);
// //   const [jobs, setJobs] = useState([]);

// //   useEffect(() => { 
// //     supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || [])); 
// //   }, [user.id]);

// //   // --- RESTORED FEATURE: MASTER SHEET DOWNLOAD ---
// //   const exportFacultyMaster = async () => {
// //     if (!setup.cl || !setup.sub) return alert("Select Class and Subject!");
// //     try {
// //       const { data: logs } = await supabase.from('attendance').select('id, time_str').eq('class', setup.cl).eq('sub', setup.sub).order('time_str', { ascending: true });
// //       const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', setup.cl);
// //       const res = await fetch('/students_list.xlsx');
// //       const students = XLSX.utils.sheet_to_json(XLSX.read(await res.arrayBuffer(), { type: 'array' }).Sheets[setup.cl]);
      
// //       const wb = new ExcelJS.Workbook();
// //       const ws = wb.addWorksheet('My Master');
// //       ws.addRow([INSTITUTE_NAME]);
// //       ws.addRow([`SUBJECT: ${setup.sub} | CLASS: ${setup.cl}`]);
// //       ws.addRow(["ROLL NO", "NAME", ...logs.map(l => l.time_str), "TOTAL", "%"]);
      
// //       students.forEach(s => {
// //         const roll = String(s['ROLL NO'] || s['ID']);
// //         let p = 0;
// //         const row = [roll, s['STUDENT NAME']];
// //         logs.forEach(l => {
// //           if(!abs.find(a => a.attendance_id === l.id && String(a.student_roll) === roll)) { row.push("P"); p++; } else row.push("A");
// //         });
// //         row.push(p, ((p/(logs.length || 1))*100).toFixed(2) + "%");
// //         ws.addRow(row);
// //       });
// //       const buffer = await wb.xlsx.writeBuffer();
// //       const link = document.createElement('a');
// //       link.href = window.URL.createObjectURL(new Blob([buffer]));
// //       link.download = `Master_${setup.cl}_${setup.sub}.xlsx`;
// //       link.click();
// //     } catch(e) { alert("Download Error!"); }
// //   };

// //   const generateCurrentSheet = async () => {
// //     const wb = new ExcelJS.Workbook();
// //     const ws = wb.addWorksheet('Attendance');
// //     ws.addRow([INSTITUTE_NAME]);
// //     ws.addRow([`CLASS: ${setup.cl}`, `SUBJECT: ${setup.sub}`]);
// //     ws.addRow([`DATE: ${new Date().toLocaleDateString('en-GB')}`, `FACULTY: ${user.name}`]);
// //     ws.addRow([]);
// //     ws.addRow(["ROLL NO", "STUDENT NAME", "STATUS"]);
// //     list.forEach(s => ws.addRow([s.id, s.name, marked.includes(s.id) ? "PRESENT" : "ABSENT"]));
// //     const buffer = await wb.xlsx.writeBuffer();
// //     const link = document.createElement('a');
// //     link.href = window.URL.createObjectURL(new Blob([buffer]));
// //     link.download = `Attendance_${setup.cl}_${setup.sub}.xlsx`;
// //     link.click();
// //   };

// //   const start = () => {
// //     if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
// //     fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
// //       const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
// //       setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'] })));
// //       setMarked([]); setActive(true);
// //     });
// //   };

// //   const submit = () => {
// //     navigator.geolocation.getCurrentPosition(async (pos) => {
// //       const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
// //       if (dist > RADIUS_LIMIT) return alert("Outside campus!");
// //       const dt = new Date().toLocaleDateString('en-GB');
// //       const { data: at } = await supabase.from('attendance').insert([{ 
// //         faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
// //         start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
// //       }]).select().single();
// //       const abs = list.filter(s => !marked.includes(s.id)).map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt }));
// //       if (abs.length > 0) await supabase.from('absentee_records').insert(abs);
// //       await generateCurrentSheet();
// //       alert("Saved & Downloaded!"); setView('login');
// //     }, () => alert("GPS Error!"));
// //   };

// //   if (!active) return (
// //     <>
// //       <div className="glass" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
// //         <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
// //           <img src="/logo.png" className="logo-circle" alt="Logo" />
// //           <span style={{fontWeight:800}}>{user.name}</span>
// //         </div>
// //         <LogOut onClick={()=>setView('login')} color="#f43f5e" size={20} />
// //       </div>
// //       <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
// //         {['Theory', 'Practical'].map(t => <div key={t} onClick={()=>setSetup({...setup, ty:t})} className={`type-chip ${setup.ty===t?'active':''}`}>{t}</div>)}
// //       </div>
// //       <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
// //         {[...new Set(jobs.map(j => j.class_name))].map(c => <div key={c} onClick={() => setSetup({ ...setup, cl: c })} className="glass" style={{ textAlign: 'center', background: setup.cl === c ? '#0891B2' : '', fontWeight:800, margin:0 }}>{c}</div>)}
// //       </div>
// //       {setup.cl && (
// //         <div className="glass">
// //           {jobs.filter(j => j.class_name === setup.cl).map(j => <div key={j.id} onClick={() => setSetup({ ...setup, sub: j.subject_name })} className="glass" style={{ marginBottom: '10px', padding:'12px', background: setup.sub === j.subject_name ? '#0891B2' : '', fontSize:'13px' }}>{j.subject_name}</div>)}
// //           <div style={{display:'flex', gap:'10px'}}><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
// //           <button className="btn-cyan" onClick={start} style={{marginTop:'10px'}}>START ATTENDANCE</button>
// //           {/* Master Sheet Button Restored */}
// //           <button className="btn-cyan" onClick={exportFacultyMaster} style={{marginTop:'10px', background:'#1e293b', border:'1px solid #06b6d4'}}>DOWNLOAD MY MASTER</button>
// //         </div>
// //       )}
// //     </>
// //   );

// //   return (
// //     <div style={{position:'relative'}}>
// //       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' }}>
// //         <ArrowLeft onClick={() => setActive(false)} />
// //         <div style={{textAlign:'center'}}><b style={{color:'#06b6d4'}}>{setup.cl}</b><br/><small>{setup.sub}</small></div>
// //         <div style={{background:'#10b981', padding:'5px 12px', borderRadius:'8px', fontWeight:800}}>{marked.length}/{list.length}</div>
// //       </div>
// //       <div className="roll-grid">
// //         {list.map(s => <div key={s.id} onClick={() => setMarked(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])} className={`roll-btn ${marked.includes(s.id) ? 'active' : ''}`}>{s.id}</div>)}
// //       </div>
// //       <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '15px', background: '#020617', borderTop:'1px solid #1e293b' }}>
// //         <button onClick={submit} className="btn-cyan" style={{ background: '#10b981' }}>SUBMIT & DOWNLOAD</button>
// //       </div>
// //     </div>
// //   );
// //       }








// // import React, { useEffect, useState } from 'react';
// // import { 
// //   LogOut, ArrowLeft, Users, Database, BookOpen, 
// //   CheckCircle, Download, ShieldCheck, Activity, Trash2 
// // } from 'lucide-react';
// // import * as XLSX from 'xlsx';
// // import ExcelJS from 'exceljs';
// // import { supabase } from "./supabaseClient";

// // // --- CONFIGURATION ---
// // const CAMPUS_LAT = 19.555009; 
// // const CAMPUS_LON = 73.249081;
// // const RADIUS_LIMIT = 0.0020; 
// // const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

// // // --- TWILIO CREDENTIALS 
// // const TWILIO_SID = "AC462cccc834de4d318114978af1fac1f6";
// // const TWILIO_AUTH_TOKEN = "bfdd83650a79eb7287a7c923a3bc3a78";
// // const TWILIO_PHONE = "whatsapp:+14155238886"; // Twilio Sandbox Number

// // const injectStyles = () => {
// //   if (typeof document === 'undefined' || document.getElementById('amrit-vfinal-style')) return;
// //   const s = document.createElement("style");
// //   s.id = 'amrit-vfinal-style';
// //   s.innerHTML = `
// //     * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; transition: 0.3s; }
// //     body { background: #020617; color: #f1f5f9; margin: 0; overflow-x: hidden; }
// //     .container { padding: 15px; max-width: 1200px; margin: 0 auto; }
// //     .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
// //     .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; background: #fff; object-fit: contain; }
// //     .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
// //     @media (min-width: 768px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }
// //     .stat-card { border-left: 4px solid #06b6d4; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 10px; }
// //     .stat-card h3 { font-size: 24px; margin: 5px 0; color: #fff; }
// //     .stat-card p { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 0; }
// //     input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 14px; border-radius: 12px; width: 100%; margin-bottom: 12px; outline: none; }
// //     .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 16px; border-radius: 12px; font-weight: 800; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
// //     .btn-cyan:hover { background: #0e7490; transform: translateY(-2px); }
// //     .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 12px; margin-bottom: 120px; }
// //     .roll-btn { padding: 18px 0; border-radius: 12px; text-align: center; font-weight: 800; background: #1e293b; color: #94a3b8; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); }
// //     .roll-btn.active { background: #10b981 !important; color: white !important; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
// //     .tab-nav { display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid #1e293b; overflow-x: auto; padding-bottom: 5px; }
// //     .tab-link { cursor: pointer; padding: 10px 5px; color: #64748b; font-weight: 700; font-size: 13px; white-space: nowrap; }
// //     .tab-link.active { color: #06b6d4; border-bottom: 3px solid #06b6d4; }
// //   `;
// //   document.head.appendChild(s);
// // };

// // export default function AmritApp() {
// //   const [user, setUser] = useState(null);
// //   const [view, setView] = useState('login');
// //   const [sheets, setSheets] = useState([]);

// //   useEffect(() => {
// //     injectStyles();
// //     fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
// //       const wb = XLSX.read(ab, { type: 'array' });
// //       setSheets(wb.SheetNames);
// //     }).catch(e => console.error("Excel Error:", e));
// //   }, []);

// //   const handleLogin = async (u, p) => {
// //     if (u === "HODCOM" && p === "COMP1578") {
// //       setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
// //     } else {
// //       const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
// //       if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
// //       else alert("Login Failed!");
// //     }
// //   };

// //   if (view === 'login') return (
// //     <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
// //       <div className="glass" style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
// //         <img src="/logo.png" className="logo-circle" style={{width:'90px', height:'90px', marginBottom:'20px'}} alt="Logo" />
// //         <h2 style={{color: '#06b6d4', margin: '0 0 10px 0', fontWeight: 900}}>AMRIT ERP</h2>
// //         <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
// //         <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div className="container">
// //       {view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
// //     </div>
// //   );
// // }

// // // --- HOD PANEL ---
// // function HODPanel({ sheets, setView }) {
// //   const [tab, setTab] = useState('dash');
// //   const [db, setDb] = useState({ f: [], l: [] });

// //   const refresh = async () => {
// //     const { data: f } = await supabase.from('faculties').select('*');
// //     const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
// //     setDb({ f: f || [], l: l || [] });
// //   };
// //   useEffect(() => { refresh(); }, []);

// //   return (
// //     <>
// //       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
// //         <h3 style={{color:'#06b6d4', margin:0, fontWeight: 800}}>HOD ADMIN</h3>
// //         <LogOut onClick={() => setView('login')} color="#f43f5e" size={24} style={{cursor:'pointer'}} />
// //       </div>
// //       <div className="tab-nav">
// //         {['dash', 'staff', 'mapping'].map(t => <div key={t} onClick={()=>setTab(t)} className={`tab-link ${tab===t?'active':''}`}>{t.toUpperCase()}</div>)}
// //       </div>
// //       {tab === 'dash' && <div className="stat-grid">
// //         <div className="glass stat-card"><h3>{db.l.length}</h3><p>Total Lec</p></div>
// //         <div className="glass stat-card"><h3>{db.f.length}</h3><p>Staff</p></div>
// //       </div>}
// //       {tab === 'staff' && <div className="glass">
// //         <input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/>
// //         <button className="btn-cyan" onClick={async()=>{
// //           await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
// //           refresh(); alert("Staff Saved!");
// //         }}>SAVE STAFF</button>
// //       </div>}
// //       {tab === 'mapping' && <div className="glass">
// //           <select id="sf">{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
// //           <select id="sc">{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
// //           <input id="ss" placeholder="Subject Name"/>
// //           <button className="btn-cyan" onClick={async()=>{
// //              await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
// //              alert("Mapped!");
// //           }}>CONFIRM MAPPING</button>
// //       </div>}
// //     </>
// //   );
// // }

// // // --- FACULTY PANEL ---
// // function FacultyPanel({ user, setView }) {
// //   const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
// //   const [active, setActive] = useState(false);
// //   const [list, setList] = useState([]);
// //   const [marked, setMarked] = useState([]);
// //   const [jobs, setJobs] = useState([]);

// //   useEffect(() => {
// //     supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || []));
// //   }, [user.id]);

// //   const startSession = () => {
// //     if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
// //     fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
// //       const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
// //       setList(data.map(s => ({ id: String(s['ROLL NO'] || s['ID']), name: s['STUDENT NAME'], phone: s['PARENT_MOBILE'] })));
// //       setMarked([]); setActive(true);
// //     });
// //   };

// //   const submitAttendance = () => {
// //     navigator.geolocation.getCurrentPosition(async (pos) => {
// //       const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
// //       if (dist > RADIUS_LIMIT) return alert("Outside Campus Boundary!");

// //       const dt = new Date().toLocaleDateString('en-GB');
// //       const { data: at } = await supabase.from('attendance').insert([{ 
// //         faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
// //         start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
// //       }]).select().single();

// //       const absentees = list.filter(s => !marked.includes(s.id));
// //       if (absentees.length > 0) {
// //         await supabase.from('absentee_records').insert(absentees.map(s => ({ attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt })));

// //         // --- FULLY AUTOMATIC TWILIO WHATSAPP LOGIC ---
// //         for (const student of absentees) {
// //           if (student.phone) {
// //             const body = `Dear Parent, your ward ${student.name} (Roll: ${student.id}) was ABSENT for ${setup.sub} lecture today at ${INSTITUTE_NAME}.`;
// //             fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
// //               method: 'POST',
// //               headers: {
// //                 'Content-Type': 'application/x-www-form-urlencoded',
// //                 'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)
// //               },
// //               body: new URLSearchParams({ 'From': TWILIO_PHONE, 'To': `whatsapp:+91${student.phone}`, 'Body': body })
// //             });
// //           }
// //         }
// //       }
// //       alert("Attendance Saved & WhatsApp Alerts Sent!");
// //       setView('login');
// //     }, () => alert("GPS Error!"));
// //   };

// //   if (!active) return (
// //     <div className="glass">
// //       <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
// //         <span style={{fontWeight:800}}>{user.name}</span>
// //         <LogOut onClick={()=>setView('login')} size={20} />
// //       </div>
// //       <select onChange={e=>setSetup({...setup, cl: e.target.value})}><option>Select Class</option>{[...new Set(jobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}</select>
// //       <select onChange={e=>setSetup({...setup, sub: e.target.value})}><option>Select Subject</option>{jobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}</select>
// //       <div style={{display:'flex', gap:10}}><input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/><input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/></div>
// //       <button className="btn-cyan" onClick={startSession}>START ATTENDANCE</button>
// //     </div>
// //   );

// //   return (
// //     <div>
// //       <div className="glass" style={{display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:10}}>
// //         <ArrowLeft onClick={()=>setActive(false)} />
// //         <div style={{textAlign:'center'}}><b>{setup.cl}</b><br/><small>{setup.sub}</small></div>
// //         <div style={{background:'#10b981', padding:'5px 12px', borderRadius:10}}>{marked.length}/{list.length}</div>
// //       </div>
// //       <div className="roll-grid">
// //         {list.map(s => <div key={s.id} onClick={() => setMarked(prev => prev.includes(s.id)?prev.filter(x=>x!==s.id):[...prev, s.id])} className={`roll-btn ${marked.includes(s.id)?'active':''}`}>{s.id}</div>)}
// //       </div>
// //       <div style={{position:'fixed', bottom:0, left:0, right:0, padding:20, background:'#020617', borderTop:'1px solid #1e293b'}}>
// //         <button className="btn-cyan" style={{background:'#10b981'}} onClick={submitAttendance}>SUBMIT & SEND ALERTS</button>
// //       </div>
// //     </div>
// //   );
// // }




// // import React, { useEffect, useState } from 'react';
// // import { 
// //   LogOut, ArrowLeft, Users, Database, BookOpen, 
// //   CheckCircle, Download, ShieldCheck, Activity, Trash2 
// // } from 'lucide-react';
// // import * as XLSX from 'xlsx';
// // import ExcelJS from 'exceljs';
// // import { supabase } from "./supabaseClient";

// // // --- CONFIGURATION ---
// // const CAMPUS_LAT = 19.555009; 
// // const CAMPUS_LON = 73.249081;
// // const RADIUS_LIMIT = 0.0020; 
// // const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

// // // --- TWILIO CREDENTIALS ---
// // const TWILIO_SID = "AC462cccc834de4d318114978af1fac1f6";
// // const TWILIO_AUTH_TOKEN = "bfdd83650a79eb7287a7c923a3bc3a78";
// // const TWILIO_PHONE = "whatsapp:+14155238886"; 

// // const injectStyles = () => {
// //   if (typeof document === 'undefined' || document.getElementById('amrit-vfinal-style')) return;
// //   const s = document.createElement("style");
// //   s.id = 'amrit-vfinal-style';
// //   s.innerHTML = `
// //     * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; transition: 0.3s; }
// //     body { background: #020617; color: #f1f5f9; margin: 0; overflow-x: hidden; }
// //     .container { padding: 15px; max-width: 1200px; margin: 0 auto; }
// //     .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
// //     .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; background: #fff; object-fit: contain; }
// //     .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
// //     @media (min-width: 768px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }
// //     .stat-card { border-left: 4px solid #06b6d4; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 10px; }
// //     .stat-card h3 { font-size: 24px; margin: 5px 0; color: #fff; }
// //     .stat-card p { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 0; }
// //     input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 14px; border-radius: 12px; width: 100%; margin-bottom: 12px; outline: none; }
// //     .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 16px; border-radius: 12px; font-weight: 800; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
// //     .btn-cyan:hover { background: #0e7490; transform: translateY(-2px); }
// //     .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 12px; margin-bottom: 120px; }
// //     .roll-btn { padding: 18px 0; border-radius: 12px; text-align: center; font-weight: 800; background: #1e293b; color: #94a3b8; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); }
// //     .roll-btn.active { background: #10b981 !important; color: white !important; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
// //     .tab-nav { display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid #1e293b; overflow-x: auto; padding-bottom: 5px; }
// //     .tab-link { cursor: pointer; padding: 10px 5px; color: #64748b; font-weight: 700; font-size: 13px; white-space: nowrap; }
// //     .tab-link.active { color: #06b6d4; border-bottom: 3px solid #06b6d4; }
// //   `;
// //   document.head.appendChild(s);
// // };

// // export default function AmritApp() {
// //   const [user, setUser] = useState(null);
// //   const [view, setView] = useState('login');
// //   const [sheets, setSheets] = useState([]);

// //   useEffect(() => {
// //     injectStyles();
// //     fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
// //       const wb = XLSX.read(ab, { type: 'array' });
// //       setSheets(wb.SheetNames);
// //     }).catch(e => console.error("Excel Error:", e));
// //   }, []);

// //   const handleLogin = async (u, p) => {
// //     if (u === "HODCOM" && p === "COMP1578") {
// //       setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
// //     } else {
// //       const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
// //       if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
// //       else alert("Login Failed!");
// //     }
// //   };

// //   if (view === 'login') return (
// //     <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
// //       <div className="glass" style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
// //         <img src="/logo.png" className="logo-circle" style={{width:'90px', height:'90px', marginBottom:'20px'}} alt="Logo" />
// //         <h2 style={{color: '#06b6d4', margin: '0 0 10px 0', fontWeight: 900}}>AMRIT ERP</h2>
// //         <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
// //         <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
// //       </div>
// //     </div>
// //   );

// //   return (
// //     <div className="container">
// //       {view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
// //     </div>
// //   );
// // }

// // // --- HOD PANEL ---
// // function HODPanel({ sheets, setView }) {
// //   const [tab, setTab] = useState('dash');
// //   const [db, setDb] = useState({ f: [], l: [] });

// //   const refresh = async () => {
// //     const { data: f } = await supabase.from('faculties').select('*');
// //     const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
// //     setDb({ f: f || [], l: l || [] });
// //   };
// //   useEffect(() => { refresh(); }, []);

// //   return (
// //     <>
// //       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
// //         <h3 style={{color:'#06b6d4', margin:0, fontWeight: 800}}>HOD ADMIN</h3>
// //         <LogOut onClick={() => setView('login')} color="#f43f5e" size={24} style={{cursor:'pointer'}} />
// //       </div>
// //       <div className="tab-nav">
// //         {['dash', 'staff', 'mapping'].map(t => <div key={t} onClick={()=>setTab(t)} className={`tab-link ${tab===t?'active':''}`}>{t.toUpperCase()}</div>)}
// //       </div>
// //       {tab === 'dash' && <div className="stat-grid">
// //         <div className="glass stat-card"><h3>{db.l.length}</h3><p>Total Lec</p></div>
// //         <div className="glass stat-card"><h3>{db.f.length}</h3><p>Staff</p></div>
// //       </div>}
// //       {tab === 'staff' && <div className="glass">
// //         <input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/>
// //         <button className="btn-cyan" onClick={async()=>{
// //           await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
// //           refresh(); alert("Staff Saved!");
// //         }}>SAVE STAFF</button>
// //       </div>}
// //       {tab === 'mapping' && <div className="glass">
// //           <select id="sf">{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
// //           <select id="sc">{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
// //           <input id="ss" placeholder="Subject Name"/>
// //           <button className="btn-cyan" onClick={async()=>{
// //              await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
// //              alert("Mapped!");
// //           }}>CONFIRM MAPPING</button>
// //       </div>}
// //     </>
// //   );
// // }

// // // --- FACULTY PANEL ---
// // function FacultyPanel({ user, setView }) {
// //   const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
// //   const [active, setActive] = useState(false);
// //   const [list, setList] = useState([]);
// //   const [marked, setMarked] = useState([]);
// //   const [jobs, setJobs] = useState([]);

// //   useEffect(() => {
// //     supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || []));
// //   }, [user.id]);

// //   // --- EXCEL GENERATION LOGIC ---
// //   const downloadSheet = async () => {
// //     const workbook = new ExcelJS.Workbook();
// //     const ws = workbook.addWorksheet('Attendance');
// //     ws.columns = [
// //       { header: 'Roll No', key: 'id', width: 10 },
// //       { header: 'Student Name', key: 'name', width: 30 },
// //       { header: 'Status', key: 'status', width: 10 }
// //     ];

// //     list.forEach(s => {
// //       ws.addRow({ 
// //         id: s.id, 
// //         name: s.name, 
// //         status: marked.includes(s.id) ? 'PRESENT' : 'ABSENT' 
// //       });
// //     });

// //     // Simple Header Styling
// //     ws.getRow(1).font = { bold: true };
// //     ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };

// //     const buffer = await workbook.xlsx.writeBuffer();
// //     const link = document.createElement('a');
// //     link.href = URL.createObjectURL(new Blob([buffer]));
// //     link.download = `Attendance_${setup.cl}_${setup.sub}_${new Date().toLocaleDateString()}.xlsx`;
// //     link.click();
// //   };

// //   const startSession = () => {
// //     if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
// //     fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
// //       const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
// //       setList(data.map(s => ({ 
// //         id: String(s['ROLL NO'] || s['ID']), 
// //         name: s['STUDENT NAME'], 
// //         phone: s['PARENT_MOBILE'] 
// //       })));
// //       setMarked([]); setActive(true);
// //     });
// //   };

// //   const submitAttendance = () => {
// //     navigator.geolocation.getCurrentPosition(async (pos) => {
// //       const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
// //       if (dist > RADIUS_LIMIT) return alert("Outside Campus Boundary!");

// //       const dt = new Date().toLocaleDateString('en-GB');
      
// //       // 1. Save to Attendance Table
// //       const { data: at } = await supabase.from('attendance').insert([{ 
// //         faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
// //         start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
// //       }]).select().single();

// //       // 2. Filter Absentees
// //       const absentees = list.filter(s => !marked.includes(s.id));
      
// //       if (absentees.length > 0) {
// //         // 3. Save to Absentee Records
// //         await supabase.from('absentee_records').insert(absentees.map(s => ({ 
// //           attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt 
// //         })));

// //         // 4. Send Automatic WhatsApp via Twilio
// //         for (const student of absentees) {
// //           if (student.phone) {
// //             const body = `Dear Parent, your ward ${student.name} (Roll: ${student.id}) was ABSENT for ${setup.sub} lecture today at ${INSTITUTE_NAME}.`;
// //             fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
// //               method: 'POST',
// //               headers: {
// //                 'Content-Type': 'application/x-www-form-urlencoded',
// //                 'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)
// //               },
// //               body: new URLSearchParams({ 
// //                 'From': TWILIO_PHONE, 
// //                 'To': `whatsapp:+91${student.phone}`, 
// //                 'Body': body 
// //               })
// //             });
// //           }
// //         }
// //       }

// //       // 5. Download Excel & Exit
// //       await downloadSheet();
// //       alert("Attendance Saved, WhatsApp Alerts Sent & Excel Downloaded!");
// //       setView('login');
// //     }, () => alert("GPS Error! Check Location Settings."));
// //   };

// //   if (!active) return (
// //     <div className="glass">
// //       <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
// //         <span style={{fontWeight:800, color:'#06b6d4'}}>{user.name}</span>
// //         <LogOut onClick={()=>setView('login')} size={20} style={{cursor:'pointer'}} />
// //       </div>
// //       <p style={{fontSize: '12px', color: '#94a3b8'}}>Class & Subject Selection</p>
// //       <select onChange={e=>setSetup({...setup, cl: e.target.value})}>
// //         <option>Select Class</option>
// //         {[...new Set(jobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}
// //       </select>
// //       <select onChange={e=>setSetup({...setup, sub: e.target.value})}>
// //         <option>Select Subject</option>
// //         {jobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}
// //       </select>
// //       <div style={{display:'flex', gap:10}}>
// //         <input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/>
// //         <input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/>
// //       </div>
// //       <button className="btn-cyan" onClick={startSession}>START ATTENDANCE</button>
// //     </div>
// //   );

// //   return (
// //     <div>
// //       <div className="glass" style={{display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, alignItems:'center'}}>
// //         <ArrowLeft onClick={()=>setActive(false)} style={{cursor:'pointer'}} />
// //         <div style={{textAlign:'center'}}>
// //           <b style={{color:'#06b6d4'}}>{setup.cl}</b><br/>
// //           <small>{setup.sub}</small>
// //         </div>
// //         <div style={{background:'#10b981', padding:'5px 12px', borderRadius:10, fontWeight:800}}>{marked.length}/{list.length}</div>
// //       </div>

// //       <div className="roll-grid">
// //         {list.map(s => (
// //           <div 
// //             key={s.id} 
// //             onClick={() => setMarked(prev => prev.includes(s.id) ? prev.filter(x=>x!==s.id) : [...prev, s.id])} 
// //             className={`roll-btn ${marked.includes(s.id)?'active':''}`}
// //           >
// //             {s.id}
// //           </div>
// //         ))}
// //       </div>

// //       <div style={{position:'fixed', bottom:0, left:0, right:0, padding:20, background:'#020617', borderTop:'1px solid #1e293b'}}>
// //         <button className="btn-cyan" style={{background:'#10b981'}} onClick={submitAttendance}>
// //           <ShieldCheck size={18} /> SUBMIT & AUTO-NOTIFY
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }





// import React, { useEffect, useState } from 'react';
// import { 
//   LogOut, ArrowLeft, Users, Database, BookOpen, 
//   CheckCircle, Download, ShieldCheck, Activity, Trash2 
// } from 'lucide-react';
// import * as XLSX from 'xlsx';
// import ExcelJS from 'exceljs';
// import { supabase } from "./supabaseClient";

// // --- CONFIGURATION ---
// const CAMPUS_LAT = 19.555009; 
// const CAMPUS_LON = 73.249081;
// const RADIUS_LIMIT = 0.0020; 
// const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";

// // --- TWILIO CREDENTIALS (REPLACE WITH YOUR LIVE ONES) ---
// const TWILIO_SID = "AC462cccc834de4d318114978af1fac1f6";
// const TWILIO_AUTH_TOKEN = "bfdd83650a79eb7287a7c923a3bc3a78";
// const TWILIO_PHONE = "whatsapp:+14155238886"; 

// const injectStyles = () => {
//   if (typeof document === 'undefined' || document.getElementById('amrit-vfinal-style')) return;
//   const s = document.createElement("style");
//   s.id = 'amrit-vfinal-style';
//   s.innerHTML = `
//     * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; transition: 0.3s; }
//     body { background: #020617; color: #f1f5f9; margin: 0; overflow-x: hidden; }
//     .container { padding: 15px; max-width: 1200px; margin: 0 auto; }
//     .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 20px; margin-bottom: 20px; }
//     .logo-circle { width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06b6d4; background: #fff; object-fit: contain; }
//     .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
//     @media (min-width: 768px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }
//     .stat-card { border-left: 4px solid #06b6d4; padding: 15px; background: rgba(15, 23, 42, 0.5); border-radius: 10px; }
//     .stat-card h3 { font-size: 24px; margin: 5px 0; color: #fff; }
//     .stat-card p { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin: 0; }
//     input, select { background: #0f172a; border: 1px solid #1e293b; color: #fff; padding: 14px; border-radius: 12px; width: 100%; margin-bottom: 12px; outline: none; }
//     .btn-cyan { background: #0891b2; color: #fff; border: none; padding: 16px; border-radius: 12px; font-weight: 800; width: 100%; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
//     .btn-cyan:hover { background: #0e7490; transform: translateY(-2px); }
//     .roll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 12px; margin-bottom: 120px; }
//     .roll-btn { padding: 18px 0; border-radius: 12px; text-align: center; font-weight: 800; background: #1e293b; color: #94a3b8; cursor: pointer; border: 1px solid rgba(255,255,255,0.05); }
//     .roll-btn.active { background: #10b981 !important; color: white !important; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); }
//     .tab-nav { display: flex; gap: 20px; margin-bottom: 25px; border-bottom: 1px solid #1e293b; overflow-x: auto; padding-bottom: 5px; }
//     .tab-link { cursor: pointer; padding: 10px 5px; color: #64748b; font-weight: 700; font-size: 13px; white-space: nowrap; }
//     .tab-link.active { color: #06b6d4; border-bottom: 3px solid #06b6d4; }
//   `;
//   document.head.appendChild(s);
// };

// export default function AmritApp() {
//   const [user, setUser] = useState(null);
//   const [view, setView] = useState('login');
//   const [sheets, setSheets] = useState([]);

//   useEffect(() => {
//     injectStyles();
//     fetch('/students_list.xlsx').then(res => res.arrayBuffer()).then(ab => {
//       const wb = XLSX.read(ab, { type: 'array' });
//       setSheets(wb.SheetNames);
//     }).catch(e => console.error("Excel Error:", e));
//   }, []);

//   const handleLogin = async (u, p) => {
//     if (u === "HODCOM" && p === "COMP1578") {
//       setUser({ name: "HOD Admin", role: 'hod' }); setView('hod');
//     } else {
//       const { data } = await supabase.from('faculties').select('*').eq('id', u).eq('password', p).single();
//       if (data) { setUser({ ...data, role: 'faculty' }); setView('faculty'); }
//       else alert("Login Failed!");
//     }
//   };

//   if (view === 'login') return (
//     <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
//       <div className="glass" style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
//         <img src="/logo.png" className="logo-circle" style={{width:'90px', height:'90px', marginBottom:'20px'}} alt="Logo" />
//         <h2 style={{color: '#06b6d4', margin: '0 0 10px 0', fontWeight: 900}}>AMRIT ERP</h2>
//         <input id="u" placeholder="Employee ID" /><input id="p" type="password" placeholder="Password" />
//         <button className="btn-cyan" onClick={() => handleLogin(document.getElementById('u').value, document.getElementById('p').value)}>SIGN IN</button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="container">
//       {view === 'hod' ? <HODPanel sheets={sheets} setView={setView} /> : <FacultyPanel user={user} setView={setView} />}
//     </div>
//   );
// }

// // --- HOD PANEL ---
// function HODPanel({ sheets, setView }) {
//   const [tab, setTab] = useState('dash');
//   const [db, setDb] = useState({ f: [], l: [] });

//   const refresh = async () => {
//     const { data: f } = await supabase.from('faculties').select('*');
//     const { data: l } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
//     setDb({ f: f || [], l: l || [] });
//   };
//   useEffect(() => { refresh(); }, []);

//   return (
//     <>
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
//         <h3 style={{color:'#06b6d4', margin:0, fontWeight: 800}}>HOD ADMIN</h3>
//         <LogOut onClick={() => setView('login')} color="#f43f5e" size={24} style={{cursor:'pointer'}} />
//       </div>
//       <div className="tab-nav">
//         {['dash', 'staff', 'mapping'].map(t => <div key={t} onClick={()=>setTab(t)} className={`tab-link ${tab===t?'active':''}`}>{t.toUpperCase()}</div>)}
//       </div>
//       {tab === 'dash' && <div className="stat-grid">
//         <div className="glass stat-card"><h3>{db.l.length}</h3><p>Total Lec</p></div>
//         <div className="glass stat-card"><h3>{db.f.length}</h3><p>Staff</p></div>
//       </div>}
//       {tab === 'staff' && <div className="glass">
//         <input id="fi" placeholder="Emp ID"/><input id="fn" placeholder="Name"/><input id="fp" placeholder="Password"/>
//         <button className="btn-cyan" onClick={async()=>{
//           await supabase.from('faculties').insert([{id:document.getElementById('fi').value, name:document.getElementById('fn').value, password:document.getElementById('fp').value}]);
//           refresh(); alert("Staff Saved!");
//         }}>SAVE STAFF</button>
//       </div>}
//       {tab === 'mapping' && <div className="glass">
//           <select id="sf">{db.f.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
//           <select id="sc">{sheets.map(s=><option key={s} value={s}>{s}</option>)}</select>
//           <input id="ss" placeholder="Subject Name"/>
//           <button className="btn-cyan" onClick={async()=>{
//              await supabase.from('assignments').insert([{fac_id:document.getElementById('sf').value, class_name:document.getElementById('sc').value, subject_name:document.getElementById('ss').value}]);
//              alert("Mapped!");
//           }}>CONFIRM MAPPING</button>
//       </div>}
//     </>
//   );
// }

// // --- FACULTY PANEL ---
// function FacultyPanel({ user, setView }) {
//   const [setup, setSetup] = useState({ cl: '', sub: '', ty: 'Theory', s: '', e: '' });
//   const [active, setActive] = useState(false);
//   const [list, setList] = useState([]);
//   const [marked, setMarked] = useState([]);
//   const [jobs, setJobs] = useState([]);

//   useEffect(() => {
//     supabase.from('assignments').select('*').eq('fac_id', user.id).then(r => setJobs(r.data || []));
//   }, [user.id]);

//   const downloadSheet = async () => {
//     const workbook = new ExcelJS.Workbook();
//     const ws = workbook.addWorksheet('Attendance');
//     ws.columns = [
//       { header: 'Roll No', key: 'id', width: 10 },
//       { header: 'Student Name', key: 'name', width: 30 },
//       { header: 'Status', key: 'status', width: 10 }
//     ];

//     list.forEach(s => {
//       ws.addRow({ 
//         id: s.id, 
//         name: s.name, 
//         status: marked.includes(s.id) ? 'PRESENT' : 'ABSENT' 
//       });
//     });

//     ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
//     ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0891B2' } };

//     const buffer = await workbook.xlsx.writeBuffer();
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(new Blob([buffer]));
//     link.download = `Attendance_${setup.cl}_${setup.sub}_${new Date().toLocaleDateString()}.xlsx`;
//     link.click();
//   };

//   const startSession = () => {
//     if(!setup.cl || !setup.sub || !setup.s || !setup.e) return alert("Fill all details!");
//     fetch('/students_list.xlsx').then(r => r.arrayBuffer()).then(ab => {
//       const data = XLSX.utils.sheet_to_json(XLSX.read(ab, { type: 'array' }).Sheets[setup.cl]);
//       setList(data.map(s => ({ 
//         id: String(s['ROLL NO'] || s['ID']), 
//         name: s['STUDENT NAME'], 
//         phone: s['PARENT_MOBILE'] 
//       })));
//       setMarked([]); setActive(true);
//     });
//   };

//   const submitAttendance = () => {
//     navigator.geolocation.getCurrentPosition(async (pos) => {
//       const dist = Math.sqrt(Math.pow(pos.coords.latitude - CAMPUS_LAT, 2) + Math.pow(pos.coords.longitude - CAMPUS_LON, 2));
//       if (dist > RADIUS_LIMIT) return alert("Outside Campus Boundary!");

//       const dt = new Date().toLocaleDateString('en-GB');
      
//       const { data: at } = await supabase.from('attendance').insert([{ 
//         faculty: user.name, sub: setup.sub, class: setup.cl, type: setup.ty, 
//         start_time: setup.s, end_time: setup.e, present: marked.length, total: list.length, time_str: dt 
//       }]).select().single();

//       const absentees = list.filter(s => !marked.includes(s.id));
      
//       if (absentees.length > 0) {
//         await supabase.from('absentee_records').insert(absentees.map(s => ({ 
//           attendance_id: at.id, student_roll: s.id, class_name: setup.cl, date: dt 
//         })));

//         for (const student of absentees) {
//           if (student.phone) {
//             const body = `Dear Parent, your ward ${student.name} (Roll: ${student.id}) was ABSENT for ${setup.sub} lecture today at ${INSTITUTE_NAME}.`;
//             fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`)
//               },
//               body: new URLSearchParams({ 
//                 'From': TWILIO_PHONE, 
//                 'To': `whatsapp:+91${student.phone}`, 
//                 'Body': body 
//               })
//             });
//           }
//         }
//       }

//       await downloadSheet();
//       alert("Attendance Saved, WhatsApp Alerts Sent & Excel Downloaded!");
//       setView('login');
//     }, () => alert("GPS Error! Please Enable Location."));
//   };

//   if (!active) return (
//     <div className="glass">
//       <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
//         <span style={{fontWeight:800, color:'#06b6d4'}}>{user.name}</span>
//         <LogOut onClick={()=>setView('login')} size={20} style={{cursor:'pointer'}} />
//       </div>
//       <select onChange={e=>setSetup({...setup, cl: e.target.value})}>
//         <option>Select Class</option>
//         {[...new Set(jobs.map(j=>j.class_name))].map(c=><option key={c} value={c}>{c}</option>)}
//       </select>
//       <select onChange={e=>setSetup({...setup, sub: e.target.value})}>
//         <option>Select Subject</option>
//         {jobs.filter(j=>j.class_name===setup.cl).map(j=><option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}
//       </select>
//       <div style={{display:'flex', gap:10}}>
//         <input type="time" onChange={e=>setSetup({...setup, s:e.target.value})}/>
//         <input type="time" onChange={e=>setSetup({...setup, e:e.target.value})}/>
//       </div>
//       <button className="btn-cyan" onClick={startSession}>START ATTENDANCE</button>
//     </div>
//   );

//   return (
//     <div>
//       <div className="glass" style={{display:'flex', justifyContent:'space-between', position:'sticky', top:0, zIndex:10, alignItems:'center'}}>
//         <ArrowLeft onClick={()=>setActive(false)} style={{cursor:'pointer'}} />
//         <div style={{textAlign:'center'}}>
//           <b style={{color:'#06b6d4'}}>{setup.cl}</b><br/>
//           <small>{setup.sub}</small>
//         </div>
//         <div style={{background:'#10b981', padding:'5px 12px', borderRadius:10, fontWeight:800}}>{marked.length}/{list.length}</div>
//       </div>

//       <div className="roll-grid">
//         {list.map(s => (
//           <div 
//             key={s.id} 
//             onClick={() => setMarked(prev => prev.includes(s.id) ? prev.filter(x=>x!==s.id) : [...prev, s.id])} 
//             className={`roll-btn ${marked.includes(s.id)?'active':''}`}
//           >
//             {s.id}
//           </div>
//         ))}
//       </div>

//       <div style={{position:'fixed', bottom:0, left:0, right:0, padding:20, background:'#020617', borderTop:'1px solid #1e293b'}}>
//         <button className="btn-cyan" style={{background:'#10b981'}} onClick={submitAttendance}>
//           <ShieldCheck size={18} /> SUBMIT & DOWNLOAD
//         </button>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from 'react';
import { 
  LogOut, Trash2, Users, FileSpreadsheet, LayoutDashboard, 
  LogIn, CheckCircle, School, Edit2, Save, X, PlusCircle, GitBranch
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { supabase } from "./supabaseClient";

// --- CONFIGURATION PERIMETERS ---
const CAMPUS_LAT = 19.555009; 
const CAMPUS_LON = 73.249081;
const RADIUS_LIMIT_MATH = 0.0020; 
const INSTITUTE_NAME = "ATMA MALIK INSTITUTE OF TECHNOLOGY AND RESEARCH";
const LOGO_URL = "/logo.png"; 

const injectStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('amrit-vfinal-matrix')) return;
  const s = document.createElement("style");
  s.id = 'amrit-vfinal-matrix';
  s.innerHTML = `
    * { box-sizing: border-box; transition: 0.22s ease; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: #f1f5f9; overflow-x: hidden; }
    .container { padding: 12px; max-width: 1400px; margin: 0 auto; min-height: 100vh; }
    
    .glass { 
      background: rgba(30, 41, 59, 0.4); 
      backdrop-filter: blur(12px); 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      border-radius: 24px; padding: 20px; margin-bottom: 16px; 
    }
    
    .logo-circle { 
      width: 110px; height: 110px; border-radius: 50%; 
      object-fit: cover; border: 4px solid #f59e0b; 
      padding: 5px; background: #0f172a; margin: 0 auto 15px;
      box-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
    }

    .stat-card { border-left: 4px solid #f59e0b; background: linear-gradient(145deg, rgba(30,41,59,0.4), rgba(15,23,42,0.4)); position: relative; overflow: hidden; }
    .stat-card h3 { font-size: 28px; color: #fff; font-weight: 800; margin-top: 5px; }
    .stat-card p { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    
    input, select { 
      background: #0f172a; border: 1px solid #334155; color: #fff; 
      padding: 14px; border-radius: 16px; width: 100%; margin-bottom: 12px; 
      outline: none; font-size: 15px;
    }
    input:focus { border-color: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.15); }

    .btn-primary { 
      background: #f59e0b; color: #000; border: none; padding: 16px; 
      border-radius: 16px; font-weight: 800; cursor: pointer; 
      display: flex; align-items: center; justify-content: center; 
      gap: 10px; width: 100%; font-size: 15px;
    }
    .btn-primary:active { transform: scale(0.96); }

    .tab-nav { display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: none; }
    .tab-nav::-webkit-scrollbar { display: none; }
    .tab-link { 
      cursor: pointer; padding: 12px 18px; color: #94a3b8; font-weight: 700; 
      font-size: 13px; white-space: nowrap; border-radius: 14px; 
      background: #1e293b; display: flex; align-items: center; gap: 8px;
    }
    .tab-link.active { background: #f59e0b; color: #000; }

    .scroll-box { overflow-x: auto; border-radius: 16px; background: rgba(15, 23, 42, 0.2); }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    th { text-align: left; color: #64748b; font-size: 11px; padding: 16px; text-transform: uppercase; border-bottom: 1px solid #1e293b; }
    td { padding: 16px; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.02); color: #e2e8f0; }

    .roll-grid { 
      display: grid; grid-template-columns: repeat(auto-fill, minmax(68px, 1fr)); 
      gap: 12px; padding: 10px 5px 160px; 
    }
    .roll-btn { 
      padding: 20px 0; border-radius: 18px; text-align: center; 
      font-weight: 800; background: #1e293b; color: #94a3b8; 
      cursor: pointer; border: 2px solid #334155; font-size: 17px; 
    }
    .roll-btn.active { 
      background: #10b981 !important; color: white !important; 
      border-color: #34d399; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      transform: scale(1.05) translateY(-2px);
    }
    
    .type-chip { flex: 1; padding: 14px; border-radius: 16px; text-align: center; cursor: pointer; background: #1e293b; font-weight: 800; font-size: 14px; }
    .type-chip.active { background: #f59e0b; color: #000; }
    
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .global-spinner { position: fixed; inset:0; background: rgba(2,6,23,0.8); z-index:99999; display:flex; justify-content:center; align-items:center; color:#f59e0b; font-weight:700; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease-out forwards; }
  `;
  document.head.appendChild(s);
};

export default function AmritApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState(["AIML", "COMP", "IF", "MECH", "CIVIL", "FYMIX"]);

  const loadDynamicWorkbookAssets = async () => {
    try {
      const res = await fetch('/students_list.xlsx');
      if (res.ok) {
        const payloadBuffer = await res.arrayBuffer();
        const wb = XLSX.read(payloadBuffer, { type: 'array' });
        setSheets(wb.SheetNames);
      } else {
        setSheets(["AIML", "COMP", "IF", "MECH", "CIVIL", "FYMIX"]);
      }
    } catch(err) {
      setSheets(["AIML", "COMP", "IF", "MECH", "CIVIL", "FYMIX"]);
    }
  };

  useEffect(() => {
    injectStyles();
    loadDynamicWorkbookAssets();
  }, []);

  const handleLogin = async (u, p) => {
    if (!u || !p) return alert("Credentials fields are empty!");
    const username = u.toUpperCase().trim();
    setLoading(true);

    try {
      if ((username === "ADMIN" && p === "SUPER123") || (username === "HODCOM" && p === "COMP1578")) {
        setUser({ name: username === "HODCOM" ? "HOD Admin" : "Super Admin", role: 'admin', id: username, branch: 'COMP' });
        setView('admin'); 
        return;
      }
      
      const { data } = await supabase
        .from('faculties')
        .select('*')
        .eq('id', username)
        .eq('password', p)
        .maybeSingle();

      if (data) {
        const isHOD = username.includes('HOD') || username === 'ADMIN';
        setUser({ ...data, role: isHOD ? 'admin' : 'faculty' });
        setView(isHOD ? 'admin' : 'faculty');
      } else { 
        alert("Invalid ID or Password Entry!"); 
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-in">
      {loading && <div className="global-spinner">Synchronizing...</div>}
      {view === 'login' && <LoginScreen onLogin={handleLogin} />}
      {view === 'admin' && (
        <SuperAdminPanel 
          user={user} 
          setView={setView} 
          branches={branches} 
          setBranches={setBranches} 
          sheets={sheets} 
        />
      )}
      {view === 'faculty' && <FacultyPanel user={user} setView={setView} />}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [uInput, setUInput] = useState('');
  const [pInput, setPInput] = useState('');

  return (
    <div style={{ height: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding:'10px' }}>
      <div className="glass" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '45px 30px' }}>
        <img src={LOGO_URL} alt="Logo" className="logo-circle" onError={(e) => e.target.src = "https://cdn-icons-png.flaticon.com/512/2991/2991148.png"} />
        <h1 style={{fontSize: '28px', fontWeight: 900, letterSpacing: '-1px'}}>AMRIT ERP</h1>
        <p style={{fontSize: '12px', color: '#64748b', marginBottom: '35px', fontWeight: 600}}>ATTENDANCE SYSTEM</p>
        <div>
          <input id="u" value={uInput} onChange={e=>setUInput(e.target.value)} placeholder="EMPLOYEE ID" />
          <input id="p" type="password" value={pInput} onChange={e=>setPInput(e.target.value)} placeholder="PASSWORD" />
        </div>
        <button className="btn-primary" onClick={() => onLogin(uInput, pInput)}>
          LOGIN <LogIn size={18} />
        </button>
      </div>
    </div>
  );
}

// --- IMAGE-BASED EXCEL CORE GENERATION ENGINE ---
const executeFormattedSheetExport = async (cls, isDefaulterFilterActive, facultyFilterId = null) => {
  try {
    let query = supabase.from('attendance').select('id, time_str, sub').eq('class', cls);
    if (facultyFilterId) {
      query = query.eq('faculty_id', facultyFilterId);
    }
    const { data: logs } = await query;
    const { data: abs } = await supabase.from('absentee_records').select('*').eq('class_name', cls);
    
    let targetBuffer = null;
    const filePaths = ['/students_list.xlsx', '/Student_Master_List.xlsx'];
    for(const p of filePaths) {
       try { const r = await fetch(p); if(r.ok) { targetBuffer = await r.arrayBuffer(); break; } } catch(e){}
    }
    if (!targetBuffer) return alert("Template sheets reference not found.");

    const rawWorkbook = XLSX.read(targetBuffer, { type: 'array' });
    const targetSheet = rawWorkbook.Sheets[cls];
    if (!targetSheet) return alert(`No sheet allocated for class naming ${cls}`);
    
    const students = XLSX.utils.sheet_to_json(targetSheet);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Attendance Report');
    ws.views = [{ showGridLines: true }];

    try {
      const logoResponse = await fetch('/logo.png');
      if (logoResponse.ok) {
        const logoBlob = await logoResponse.blob();
        const reader = new FileReader();
        const base64Data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(logoBlob);
        });
        const imageId = wb.addImage({ base64: base64Data, extension: 'png' });
        ws.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 85, height: 85 } });
      }
    } catch (imageErr) {
      console.error("Logo insertion skipped:", imageErr);
    }

    const thinBorder = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const fontBold = { name: 'Arial', size: 11, bold: true };
    const fontNormal = { name: 'Arial', size: 11 };
    const alignCenter = { vertical: 'middle', horizontal: 'center', wrapText: true };

    ws.mergeCells('A1:C1');
    ws.getCell('A1').value = "               !! Sabka Malik Atma !!\n               Vishwatmak Jangli Maharaj Ashram Trust's";
    ws.getCell('A1').font = { name: 'Arial', size: 12, bold: true };
    ws.getCell('A1').alignment = alignCenter;
    ws.getRow(1).height = 40;

    ws.mergeCells('A2:C2');
    ws.getCell('A2').value = `               ${INSTITUTE_NAME}\n               Department of Computer Engineering (Diploma)`;
    ws.getCell('A2').font = { name: 'Arial', size: 12, bold: true };
    ws.getCell('A2').alignment = alignCenter;
    ws.getRow(2).height = 40;

    ws.getCell('A3').value = "ACAD-DI-16";
    ws.mergeCells('B3:B5');
    ws.getCell('B3').value = `${isDefaulterFilterActive ? 'DEFAULTER REPORT' : 'ATTENDANCE REPORT'} - ${cls}`;
    ws.getCell('C3').value = "Academic Year:\n2025-26";
    
    ws.getCell('A4').value = "Rev : 00";
    ws.getCell('C4').value = "Semester: ODD";
    ws.getCell('A5').value = "Date: 11-7-2022";
    ws.getCell('C5').value = ""; 
    ws.getCell('A6').value = "REVISE:0";
    ws.getCell('B6').value = `SUB : ${logs.length > 0 ? logs[0].sub : '-'}`;
    ws.getCell('C6').value = `DATE :- ${new Date().toLocaleDateString('en-GB')}`;

    for (let r = 3; r <= 6; r++) {
      ws.getRow(r).height = 25;
      for (let c = 1; c <= 3; c++) {
        const cell = ws.getCell(r, c);
        cell.font = fontBold;
        cell.alignment = alignCenter;
        cell.border = thinBorder;
      }
    }
    ws.getCell('B3').font = { name: 'Arial', size: 14, bold: true };

    const headers = ["ROLL NO", "STUDENT NAME"];
    logs.forEach(l => { headers.push(`${l.time_str.split(' ')[0]}\n(${l.sub})`); });
    headers.push("TOTAL LECTURES", "PERCENTAGE STATUS");

    const headerRow = ws.addRow(headers);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = fontBold;
      cell.alignment = alignCenter;
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } }; 
    });

    students.forEach(s => {
      const roll = String(s['ROLL NO'] || s['RollNo'] || s['ID'] || '');
      const name = String(s['STUDENT NAME'] || s['StudentName'] || 'N/A');
      if (!roll) return;

      let presenceCounter = 0;
      const rowData = [roll, name];
      
      logs.forEach(l => {
        const isAbsent = abs.find(a => a.attendance_id === l.id && String(a.student_roll) === roll);
        if (!isAbsent) { rowData.push("P"); presenceCounter++; } else { rowData.push("A"); }
      });

      const performancePercentage = (presenceCounter / (logs.length || 1)) * 100;
      
      if (!isDefaulterFilterActive || performancePercentage < 75) {
        rowData.push(presenceCounter, `${performancePercentage.toFixed(2)}%`);
        const r = ws.addRow(rowData);
        r.height = 22;
        r.eachCell((cell, colNumber) => {
          cell.font = fontNormal;
          cell.border = thinBorder;
          cell.alignment = colNumber === 2 ? { vertical: 'middle', horizontal: 'left' } : alignCenter;
          if (cell.value === "A") {
            cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFF0000' } };
          }
        });
      }
    });

    ws.columns.forEach((column, index) => {
      if (index === 0) column.width = 18;  
      else if (index === 1) column.width = 35;  
      else column.width = 18;  
    });

    const processedBuffer = await wb.xlsx.writeBuffer();
    const linkContainer = document.createElement('a');
    linkContainer.href = window.URL.createObjectURL(new Blob([processedBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    linkContainer.download = `${isDefaulterFilterActive ? 'Defaulter' : 'Official'}_Attendance_Report_${cls}.xlsx`;
    linkContainer.click();
  } catch(e) {
    console.error(e);
    alert("Error matrix file generator pipeline breakdown.");
  }
};

function SuperAdminPanel({ user, setView, branches, setBranches, sheets }) {
  const [tab, setTab] = useState('dash');
  const [selBranch, setSelBranch] = useState(user.id === 'HODCOM' ? 'COMP' : 'ALL');
  const [targetDefaulterClass, setTargetDefaulterClass] = useState(sheets[0] || 'Comp-TY');
  const [db, setDb] = useState({ staff: [], attendance: [], assignments: [] });

  const [regId, setRegId] = useState('');
  const [regName, setRegName] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regBranch, setRegBranch] = useState(branches[0] || 'COMP');

  const [newBranchName, setNewBranchName] = useState('');
  const [editingBranchIdx, setEditingBranchIdx] = useState(null);
  const [editBranchName, setEditBranchName] = useState('');

  const [mapFacultyId, setMapFacultyId] = useState('');
  const [mapClassName, setMapClassName] = useState('');
  const [mapSubjectName, setMapSubjectName] = useState('');

  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editBranch, setEditBranch] = useState('COMP');

  const [editingLogId, setEditingLogId] = useState(null);
  const [editPresentCount, setEditPresentCount] = useState(0);
  const [editTotalCount, setEditTotalCount] = useState(0);

  const loadAllData = async () => {
    const { data: f } = await supabase.from('faculties').select('*');
    const { data: a } = await supabase.from('attendance').select('*').order('created_at', { ascending: false });
    const { data: m } = await supabase.from('assignments').select('*');
    setDb({ staff: f || [], attendance: a || [], assignments: m || [] });
  };

  useEffect(() => { loadAllData(); }, []);

  const todayStr = new Date().toLocaleDateString('en-GB');
  const filteredLogs = db.attendance.filter(r => selBranch === 'ALL' || r.branch === selBranch);
  const todayLogs = filteredLogs.filter(l => l.time_str && l.time_str.includes(todayStr));
  
  const totalPresent = filteredLogs.reduce((acc, curr) => acc + curr.present, 0);
  const totalStudents = filteredLogs.reduce((acc, curr) => acc + curr.total, 0);
  const avgAttendance = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : 0;

  const chartData = [...filteredLogs].reverse().slice(-10).map(r => ({
    date: r.time_str ? r.time_str.split(' ')[0] : 'N/A',
    present: r.present
  }));

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return alert("Please Enter Branch Name!");
    const formatName = newBranchName.toUpperCase().trim();
    if (branches.includes(formatName)) return alert("Branch tracking token already exists!");
    setBranches([...branches, formatName]);
    setNewBranchName('');
  };

  const handleUpdateBranch = (index) => {
    if (!editBranchName.trim()) return alert("Name field is empty.");
    const updated = [...branches];
    updated[index] = editBranchName.toUpperCase().trim();
    setBranches(updated);
    setEditingBranchIdx(null);
  };

  const handleDeleteBranch = (targetName) => {
    if (branches.length <= 1) return alert("System requires at least one tracking operational branch.");
    if (window.confirm(`Purge ${targetName} layer completely?`)) {
      setBranches(branches.filter(b => b !== targetName));
      if (selBranch === targetName) setSelBranch('ALL');
    }
  };

  const handleCreateFaculty = async () => {
    if(!regId || !regName || !regPass) return alert("Fill all operational lines!");
    const finalID = regId.toUpperCase().trim();
    const { error } = await supabase.from('faculties').insert([{ id: finalID, name: regName, password: regPass, branch: regBranch }]);
    if(!error) {
      alert("Faculty saved successfully.");
      setRegId(''); setRegName(''); setRegPass(''); loadAllData();
    } else { alert("Operational database error or duplicate ID."); }
  };

  const handleUpdateFaculty = async (id) => {
    const { error } = await supabase.from('faculties').update({ name: editName, password: editPass, branch: editBranch }).eq('id', id);
    if(!error) { alert("Modifications saved."); setEditingFacultyId(null); loadAllData(); }
  };

  const handleDeleteFaculty = async (id, name) => {
    if(window.confirm(`Wipe credentials index for ${name}?`)) {
      const { error } = await supabase.from('faculties').delete().eq('id', id);
      if(!error) { alert("Faculty removed."); loadAllData(); }
    }
  };

  const handleCommitMapping = async () => {
    if(!mapFacultyId || !mapClassName || !mapSubjectName) return alert("Provide mapping vectors!");
    const { error } = await supabase.from('assignments').insert([{ fac_id: mapFacultyId, class_name: mapClassName, subject_name: mapSubjectName }]);
    if(!error) { alert("Mapping locked."); setMapSubjectName(''); loadAllData(); }
  };

  const handleUpdateLog = async (id) => {
    if(Number(editPresentCount) > Number(editTotalCount)) return alert("Mismatch count logic bounds.");
    const { error } = await supabase.from('attendance').update({ present: Number(editPresentCount), total: Number(editTotalCount) }).eq('id', id);
    if(!error) { setEditingLogId(null); loadAllData(); }
  };

  return (
    <>
      <div className="glass flex-between" style={{borderLeft: '6px solid #f59e0b', padding:'15px 20px'}}>
        <div>
          <h2 style={{fontSize: '18px', fontWeight: 800, color: '#fff'}}>{user.id === 'ADMIN' ? 'ADMIN DASHBOARD' : `${user.branch} HOD PANEL`}</h2>
          <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#94a3b8'}}>
            <School size={12} /> <small style={{fontSize: '10px'}}>{INSTITUTE_NAME}</small>
          </div>
        </div>
        <div style={{background: 'rgba(244,63,94,0.1)', padding:'10px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setView('login')}>
            <LogOut color="#f43f5e" size={20} />
        </div>
      </div>

      <div className="tab-nav">
        <div onClick={()=>setTab('dash')} className={`tab-link ${tab==='dash'?'active':''}`}><LayoutDashboard size={16}/> Status Terminal</div>
        <div onClick={()=>setTab('branches')} className={`tab-link ${tab==='branches'?'active':''}`}><GitBranch size={16}/> Branches ({branches.length})</div>
        <div onClick={()=>setTab('records')} className={`tab-link ${tab==='records'?'active':''}`}><FileSpreadsheet size={16}/> Attendance Logs</div>
        <div onClick={()=>setTab('staff')} className={`tab-link ${tab==='staff'?'active':''}`}><Users size={16}/> Faculty Register</div>
        <div onClick={()=>setTab('mapping')} className={`tab-link ${tab==='mapping'?'active':''}`}><PlusCircle size={16}/> Subjects Mapping</div>
      </div>

      {tab === 'dash' && (
        <div className="animate-in">
          <div style={{display:'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap:'12px'}}>
            <div className="glass stat-card">
               <p>General Performance</p>
               <h3>{avgAttendance}%</h3>
            </div>
            <div className="glass stat-card" style={{borderColor:'#10b981'}}>
               <p>Active Log Records</p>
               <h3>{db.attendance.length}</h3>
            </div>
            <div className="glass stat-card" style={{borderColor:'#06b6d4'}}>
               <p>Sessions Executed Today</p>
               <h3>{todayLogs.length}</h3>
            </div>
            <div className="glass stat-card" style={{borderColor:'#e11d48'}}>
               <p>Defaulter Sheets Output</p>
               <select value={targetDefaulterClass} onChange={e=>setTargetDefaulterClass(e.target.value)} style={{fontSize:'11px', padding:'4px', margin:0, background:'#020617', borderRadius:'6px'}}>
                  {sheets.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <button onClick={()=>executeFormattedSheetExport(targetDefaulterClass, true)} style={{padding:'6px', background:'#e11d48', border:'none', color:'#fff', cursor:'pointer', fontWeight:800, width:'100%', fontSize:'10px', borderRadius:'6px', marginTop:'6px'}}>DOWNLOAD DEFAULTERS</button>
            </div>
          </div>
          
          <div className="glass" style={{height:'300px', marginTop:'15px', padding:'25px 15px 5px 0'}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length ? chartData : [{date:'System Node', present:0}]}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{background:'#0f172a', border:'1px solid #334155'}} />
                <Area type="monotone" dataKey="present" stroke="#f59e0b" strokeWidth={3} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'branches' && (
        <div className="animate-in">
          <div className="glass" style={{borderTop: '4px solid #f59e0b'}}>
            <h4 style={{marginBottom:'12px'}}>Add New Branch</h4>
            <div style={{display:'flex', gap:'10px'}}>
              <input value={newBranchName} onChange={e=>setNewBranchName(e.target.value)} placeholder="ENTER BRANCH CODE STRINGS" style={{margin:0}} />
              <button className="btn-primary" onClick={handleCreateBranch} style={{width:'180px'}}>ADD BRANCH</button>
            </div>
          </div>

          <div className="glass">
            <h4 style={{marginBottom:'15px'}}>Departments Branch Registry</h4>
            <div className="scroll-box">
              <table>
                <thead>
                  <tr><th>BRANCH ID</th><th>BRANCHES</th><th>Control Operations</th></tr>
                </thead>
                <tbody>
                  {branches.map((bName, index) => (
                    <tr key={index}>
                      <td><code>[M_LAYER_0{index + 1}]</code></td>
                      <td>
                        {editingBranchIdx === index ? (
                          <input value={editBranchName} onChange={e=>setEditBranchName(e.target.value)} style={{padding:'6px', margin:0, maxWidth:'250px'}} />
                        ) : (
                          <span style={{fontWeight:800, color:'#f59e0b', letterSpacing:'0.5px'}}>{bName}</span>
                        )}
                      </td>
                      <td>
                        {editingBranchIdx === index ? (
                          <div style={{display:'flex', gap:'12px'}}>
                            <Save size={18} color="#10b981" style={{cursor:'pointer'}} onClick={()=>handleUpdateBranch(index)}/>
                            <X size={18} color="#f43f5e" style={{cursor:'pointer'}} onClick={()=>setEditingBranchIdx(null)}/>
                          </div>
                        ) : (
                          <div style={{display:'flex', gap:'16px'}}>
                            <Edit2 size={16} color="#38bdf8" style={{cursor:'pointer'}} onClick={()=>{ setEditingBranchIdx(index); setEditBranchName(bName); }} />
                            <Trash2 size={16} color="#f43f5e" style={{cursor:'pointer'}} onClick={()=>handleDeleteBranch(bName)} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'records' && (
        <div className="glass animate-in">
          <div style={{marginBottom:'15px'}}>
            <label style={{fontSize:'12px', color:'#64748b'}}>DEPARTMENTS FILTER</label>
            <select onChange={(e)=>setSelBranch(e.target.value)} value={selBranch}>
              <option value="ALL">All Departments Logs</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="scroll-box">
            <table>
              <thead>
                <tr><th>Timestamp</th><th>Faculty</th><th>Class Identifier</th><th>Result Count</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map((r) => (
                  <tr key={r.id}>
                    <td><small>{r.time_str || 'N/A'}</small></td>
                    <td style={{fontWeight:700}}>{r.faculty}</td>
                    <td><span style={{background:'rgba(245,158,11,0.1)', color:'#f59e0b', padding:'4px 8px', borderRadius:'6px', fontSize:'11px'}}>{r.class}</span></td>
                    <td>
                      {editingLogId === r.id ? (
                        <div style={{display:'flex', gap:'4px', maxWidth:'120px'}}>
                          <input type="number" style={{padding:'4px', margin:0}} value={editPresentCount} onChange={e=>setEditPresentCount(e.target.value)}/>
                          <input type="number" style={{padding:'4px', margin:0}} value={editTotalCount} onChange={e=>setEditTotalCount(e.target.value)}/>
                        </div>
                      ) : (<span style={{color:'#10b981', fontWeight:800}}>{r.present} / {r.total}</span>)}
                    </td>
                    <td>
                      {editingLogId === r.id ? (
                        <div style={{display:'flex', gap:'8px'}}><Save size={16} color="#10b981" onClick={()=>handleUpdateLog(r.id)}/><X size={16} color="#f43f5e" onClick={()=>setEditingLogId(null)}/></div>
                      ) : (
                        <div style={{display:'flex', gap:12}}>
                          <Edit2 size={16} color="#38bdf8" onClick={()=>{ setEditingLogId(r.id); setEditPresentCount(r.present); setEditTotalCount(r.total); }}/>
                          <Trash2 size={16} color="#f43f5e" onClick={async()=>{ if(window.confirm("Delete entry row?")) { await supabase.from('attendance').delete().eq('id', r.id); loadAllData(); } }}/>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'staff' && (
        <div className="animate-in">
          <div className="glass">
            <h4 style={{marginBottom:'12px'}}><Users size={18}/> Assign Faculty Register</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
               <select value={regBranch} onChange={e=>setRegBranch(e.target.value)}>
                 {branches.map(b=><option key={b} value={b}>{b}</option>)}
               </select>
               <input value={regId} onChange={e=>setRegId(e.target.value)} placeholder="EMPLOYEE ID" />
            </div>
            <input value={regName} onChange={e=>setRegName(e.target.value)} placeholder="FULL NAME" />
            <input type="password" value={regPass} onChange={e=>setRegPass(e.target.value)} placeholder="PASSWORD CODE SYSTEM" />
            <button className="btn-primary" onClick={handleCreateFaculty}>ADD FACULTY</button>
          </div>

          <div className="glass">
             <div className="scroll-box">
                <table>
                  <thead><tr><th>Faculty Names</th><th>Departments</th><th>Passwords</th><th>Action</th></tr></thead>
                  <tbody>
                    {db.staff.filter(s => selBranch === 'ALL' || s.branch === selBranch).map(f => (
                      <tr key={f.id}>
                        <td>
                          {editingFacultyId === f.id ? (
                            <input value={editName} onChange={e=>setEditName(e.target.value)} style={{padding:'6px', margin:0}} />
                          ) : (<div><b>{f.name}</b><br/><small style={{color:'#64748b'}}>{f.id}</small></div>)}
                        </td>
                        <td>
                          {editingFacultyId === f.id ? (
                            <select value={editBranch} onChange={e=>setEditBranch(e.target.value)} style={{padding:'6px', margin:0}}>
                              {branches.map(b=><option key={b} value={b}>{b}</option>)}
                            </select>
                          ) : (<code>{f.branch || 'COMP'}</code>)}
                        </td>
                        <td><code>••••••••</code></td>
                        <td>
                          {editingFacultyId === f.id ? (
                            <div style={{display:'flex', gap:'10px'}}><Save size={18} color="#10b981" onClick={()=>handleUpdateFaculty(f.id)}/><X size={18} color="#f43f5e" onClick={()=>setEditingFacultyId(null)}/></div>
                          ) : (
                            <div style={{display:'flex', gap:'14px'}}><Edit2 size={16} color="#38bdf8" onClick={()=>{setEditingFacultyId(f.id); setEditName(f.name); setEditPass(f.password); setEditBranch(f.branch || 'COMP');}}/><Trash2 size={16} color="#f43f5e" onClick={()=>handleDeleteFaculty(f.id, f.name)}/></div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {tab === 'mapping' && (
        <div className="animate-in">
          <div className="glass">
            <h4 style={{marginBottom:'12px'}}>Subjects Mapping</h4>
            <select value={mapFacultyId} onChange={e=>setMapFacultyId(e.target.value)}>
               <option value="">Select Faculty</option>
               {db.staff.map(f => <option key={f.id} value={f.id}>{f.name} ({f.id})</option>)}
            </select>
            <select value={mapClassName} onChange={e=>setMapClassName(e.target.value)}>
               <option value="">Select Class</option>
               {sheets.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={mapSubjectName} onChange={e=>setMapSubjectName(e.target.value)} placeholder="Subject Title" />
            <button className="btn-primary" onClick={handleCommitMapping}>BIND MAPPING LOG ROUTE</button>
          </div>

          <div className="glass">
             <div className="scroll-box">
                <table>
                  <thead><tr><th>Faculty ID</th><th>Branch</th><th>Subject Name</th><th>Delete Control</th></tr></thead>
                  <tbody>
                    {db.assignments.map(a => (
                      <tr key={a.id}>
                        <td><b>{a.fac_id}</b></td>
                        <td><span style={{color:'#f59e0b'}}>{a.class_name}</span></td>
                        <td>{a.subject_name}</td>
                        <td><Trash2 size={16} color="#f43f5e" style={{cursor:'pointer'}} onClick={async()=>{ if(window.confirm("Delete allocation map link?")) { await supabase.from('assignments').delete().eq('id', a.id); loadAllData(); } }}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </>
  );
}

function FacultyPanel({ user, setView }) {
  const [active, setActive] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [setup, setSetup] = useState({ ty: 'Theory', cl: '', sub: '', s: '', e: '' });
  const [absentRolls, setAbsentRolls] = useState([]);
  const [currentAttendanceId, setCurrentAttendanceId] = useState(null);

  const fetchFacultyMappings = async () => {
    const { data } = await supabase.from('assignments').select('*').eq('fac_id', user.id);
    setJobs(data || []);
  };

  useEffect(() => { fetchFacultyMappings(); }, [user.id]);

  const syncStudentsFromClassTemplate = async (className) => {
    try {
      const res = await fetch('/students_list.xlsx');
      if (!res.ok) return;
      const buffer = await res.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const targetSheet = wb.Sheets[className];
      if (targetSheet) {
        const rawJson = XLSX.utils.sheet_to_json(targetSheet);
        setStudents(rawJson);
      }
    } catch (e) { console.error("Template parse error:", e); }
  };

  useEffect(() => {
    if (setup.cl) { syncStudentsFromClassTemplate(setup.cl); }
  }, [setup.cl]);

  const startAttendance = async () => {
    if (!setup.cl || !setup.sub || !setup.s || !setup.e) {
      return alert("Complete all lecture parameters fields before starting!");
    }

    if (!navigator.geolocation) {
      return alert("Geofencing restriction: Geolocation capability missing.");
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const uLat = pos.coords.latitude;
      const uLon = pos.coords.longitude;
      const dLat = Math.abs(uLat - CAMPUS_LAT);
      const dLon = Math.abs(uLon - CAMPUS_LON);

      if (dLat > RADIUS_LIMIT_MATH || dLon > RADIUS_LIMIT_MATH) {
        return alert(`GEOFENCE ERROR: Outside secured perimeter bounds.\nYour: ${uLat.toFixed(4)}, ${uLon.toFixed(4)}`);
      }

      const stampStr = `${new Date().toLocaleDateString('en-GB')} ${setup.s}-${setup.e}`;
      
      // OPTIMIZED ACTION: Safe & Bulletproof State Generation Sequence
      const { data, error } = await supabase.from('attendance').insert([{
        faculty: user.name,
        faculty_id: user.id,
        class: setup.cl,
        sub: `${setup.sub} (${setup.ty})`,
        time_str: stampStr,
        present: students.length,
        total: students.length,
        branch: user.branch || 'COMP'
      }]).select();

      if (!error && data && data.length > 0) {
        setCurrentAttendanceId(data[0].id);
        setAbsentRolls([]);
        setActive(true);
      } else {
        // Fallback fetch logic if select() block is intercepted by RLS policy
        const { data: fallbackFetch } = await supabase
          .from('attendance')
          .select('id')
          .eq('faculty_id', user.id)
          .eq('time_str', stampStr)
          .order('id', { ascending: false })
          .limit(1);

        if (fallbackFetch && fallbackFetch.length > 0) {
          setCurrentAttendanceId(fallbackFetch[0].id);
          setAbsentRolls([]);
          setActive(true);
        } else {
          alert("Failed to initialize remote transactional matrix sequence. Please check Supabase Connection.");
        }
      }
    }, () => alert("Unable to authenticate hardware location coordinates. Access denied."));
  };

  const toggleRoll = (roll) => {
    if (absentRolls.includes(roll)) {
      setAbsentRolls(absentRolls.filter(r => r !== roll));
    } else {
      setAbsentRolls([...absentRolls, roll]);
    }
  };

  const finalizeAttendanceSession = async () => {
    const presentCount = students.length - absentRolls.length;
    
    await supabase.from('attendance')
      .update({ present: presentCount, total: students.length })
      .eq('id', currentAttendanceId);

    if (absentRolls.length > 0) {
      const inserts = absentRolls.map(roll => ({
        attendance_id: currentAttendanceId,
        student_roll: roll,
        class_name: setup.cl
      }));
      await supabase.from('absentee_records').insert(inserts);
    }

    alert("Attendance session saved completely into cloud server.");
    setActive(false);
    setCurrentAttendanceId(null);
  };

  const handleExportFacultyMasterSheet = () => {
    if(!setup.cl) return alert("Select a specific target Class first.");
    executeFormattedSheetExport(setup.cl, false, user.id);
  };

  if (!active) return (
    <div className="glass animate-in" style={{maxWidth:'480px', margin:'60px auto', borderTop:'5px solid #f59e0b', position: 'relative'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
        <div style={{textAlign:'left'}}>
          <h3 style={{fontSize:'22px', fontWeight:900}}>Prof. {user.name}</h3>
          <p style={{color:'#64748b', fontSize: '12px'}}>Departmental Lecturer Node Portal</p>
        </div>
        <div style={{background: 'rgba(244,63,94,0.1)', padding:'10px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setView('login')}>
          <LogOut color="#f43f5e" size={20} />
        </div>
      </div>

      <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
        {['Theory', 'Practical'].map(t => (
          <div key={t} onClick={()=>setSetup({...setup, ty: t})} className={`type-chip ${setup.ty===t?'active':''}`}>
            {t}
          </div>
        ))}
      </div>

      <select value={setup.cl} onChange={e=>setSetup({...setup, cl: e.target.value, sub: ''})}>
         <option value="">Select Class</option>
         {[...new Set(jobs.map(j => j.class_name))].map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={setup.sub} onChange={e=>setSetup({...setup, sub: e.target.value})}>
         <option value="">Select Subject</option>
         {jobs.filter(j => j.class_name === setup.cl).map(j => <option key={j.id} value={j.subject_name}>{j.subject_name}</option>)}
      </select>

      <div style={{display:'flex', gap:'10px'}}>
        <input type="time" value={setup.s} onChange={e=>setSetup({...setup, s:e.target.value})}/>
        <input type="time" value={setup.e} onChange={e=>setSetup({...setup, e:e.target.value})}/>
      </div>

      <button className="btn-primary" onClick={startAttendance}>TAKE ATTENDANCE</button>
      <button className="btn-primary" onClick={handleExportFacultyMasterSheet} style={{marginTop:'10px', background:'#1e293b', color:'#fff', border:'1px solid #334155'}}>DOWNLOAD MY MASTER</button>
    </div>
  );

  return (
    <div className="animate-in">
      <div className="glass flex-between" style={{borderColor: '#10b981', background: 'rgba(16,185,129,0.04)'}}>
        <div>
          <h2 style={{color: '#10b981', fontWeight: 900}}>{setup.cl} • {setup.sub}</h2>
          <p style={{fontSize:'12px', color:'#64748b'}}>Tap numbers to mark absolute absentees</p>
        </div>
        <div style={{textAlign: 'right'}}>
          <h2 style={{fontWeight: 900}}>{students.length - absentRolls.length} / {students.length}</h2>
          <small style={{fontSize: '10px', color: '#64748b', textTransform:'uppercase'}}>Present Matrix</small>
        </div>
      </div>

      <div className="roll-grid">
        {students.map((st, i) => {
          const currentRoll = String(st['ROLL NO'] || st['RollNo'] || st['ID'] || (i + 1));
          const isMarkedAbsent = absentRolls.includes(currentRoll);
          return (
            <div 
              key={i} 
              onClick={() => toggleRoll(currentRoll)} 
              className={`roll-btn ${!isMarkedAbsent ? 'active' : ''}`}
              style={isMarkedAbsent ? { background: '#ef4444', borderColor: '#f87171', color: '#fff', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)' } : {}}
            >
              {currentRoll}
            </div>
          );
        })}
      </div>

      <div style={{position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: '#020617', borderTop: '1px solid #1e293b', zIndex: 100}}>
        <div style={{maxWidth: '600px', margin: '0 auto', display:'flex', gap:'10px'}}>
          <button className="btn-primary" style={{background: '#10b981', color: '#fff'}} onClick={finalizeAttendanceSession}>
            <CheckCircle size={18} /> SUBMIT ATTENDANCE LOG
          </button>
          <button className="btn-primary" style={{background: '#1e293b', color: '#fff', width: '140px', border: '1px solid #334155'} } onClick={() => { if(window.confirm("Abort current session? Data will be destroyed.")) setActive(false); }}>
            ABORT
          </button>
        </div>
      </div>
    </div>
  );
}
