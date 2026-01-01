import { Bell, BookOpen, CheckCircle, FileText, Mail, Save, Users, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

// --- 1. LOGIN PAGE ---
const Login = () => {
  const [role, setRole] = useState('Admin');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'Admin') navigate('/admin');
    else if (role === 'Faculty') navigate('/faculty');
    else navigate('/student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6">
      <div className="bg-[#1e293b] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-700">
        <h2 className="text-3xl font-black text-center mb-8 text-white tracking-tight">Portal Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <select 
            value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option>Admin</option>
            <option>Faculty</option>
            <option>Student</option>
          </select>
          <input type="email" placeholder="Email" className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl p-4 text-white outline-none" required />
          <input type="password" placeholder="Password" className="w-full bg-[#0f172a] border border-slate-600 rounded-2xl p-4 text-white outline-none" required />
          <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95">Login</button>
        </form>
      </div>
    </div>
  );
};

// --- 2. ADMIN DASHBOARD (With Classwise Sheet Selection & Email Sync) ---
const AdminDashboard = () => {
  const [selectedSheet, setSelectedSheet] = useState('');
  const [subjects, setSubjects] = useState('');
  const classSheets = ["TY-COM", "SY-COM", "SY-IT", "SY-AIML"];

  const handleSync = () => {
    if(!selectedSheet || !subjects) return alert("Fill Class and Subjects!");
    alert(`Data Synced for ${selectedSheet}! Email notification sent to Dept & Faculty.`);
    setSubjects('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <nav className="bg-[#1e293b] p-4 flex justify-center gap-6 border-b border-slate-700 sticky top-0 shadow-xl">
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 rounded-xl font-bold"><BookOpen size={18}/> Subjects</button>
        <button className="flex items-center gap-2 px-6 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"><Users size={18}/> Faculty</button>
        <button className="flex items-center gap-2 px-6 py-2 text-slate-400 hover:bg-slate-800 rounded-xl"><FileText size={18}/> Reports</button>
      </nav>

      <div className="p-10 max-w-4xl mx-auto">
        <div className="bg-[#1e293b] rounded-[2.5rem] p-10 border border-slate-700 shadow-2xl relative overflow-hidden">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3"><Save className="text-emerald-500"/> Link Master Sheet</h2>
          <div className="space-y-6">
            <div>
              <label className="text-slate-400 text-sm mb-2 block font-bold">Select Class Registry (Excel Sheet)</label>
              <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Choose TY-COM, SY-IT etc. --</option>
                {classSheets.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-2 block font-bold">Subjects to Link</label>
              <textarea value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="Enter subjects (e.g. React, Java, SQL)" className="w-full bg-[#0f172a] border border-slate-600 rounded-xl p-4 outline-none h-32"></textarea>
            </div>
            <div className="flex gap-4">
              <button onClick={handleSync} className="flex-1 bg-emerald-500 py-4 rounded-xl font-black text-white hover:bg-emerald-600 transition shadow-lg">SYNC & NOTIFY EMAIL</button>
              <button className="bg-slate-700 px-6 rounded-xl hover:bg-slate-600 transition"><Mail size={22}/></button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800"><div className="h-full bg-blue-500 w-1/4 rounded-full shadow-[0_0_15px_cyan]"></div></div>
        </div>
      </div>
    </div>
  );
};

// --- 3. FACULTY DASHBOARD (Attendance & Absentee Email Alert) ---
const FacultyDashboard = () => {
  const [isLive, setIsLive] = useState(false);
  const students = [{ roll: 1, name: "Arjun S." }, { roll: 2, name: "Sneha M." }, { roll: 3, name: "Rahul P." }];

  const markAbsent = (name) => {
    alert(`Alert: Marked Absent! Automated Email sent to ${name}'s parents.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Attendance: TY-COM</h2>
          <button onClick={() => setIsLive(!isLive)} className={`px-8 py-3 rounded-2xl font-black transition-all shadow-lg ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white'}`}>
            {isLive ? 'LIVE NOW' : 'GO LIVE'}
          </button>
        </header>

        <div className="space-y-4">
          {students.map(s => (
            <div key={s.roll} className="bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100 hover:shadow-md transition">
              <div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Roll {s.roll}</span>
                <p className="text-lg font-bold text-slate-800 mt-1">{s.name}</p>
              </div>
              <div className="flex gap-3">
                <button className="bg-green-500 text-white p-3 rounded-2xl shadow-md"><CheckCircle size={20}/></button>
                <button onClick={() => markAbsent(s.name)} className="bg-red-100 text-red-600 p-3 rounded-2xl border border-red-200"><XCircle size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN APP ROUTING ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/student" element={
          <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-8">
            <div className="bg-[#1e293b] p-10 rounded-[3rem] text-center border border-slate-700 shadow-2xl max-w-sm w-full">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_#2563eb]"><Bell size={32}/></div>
              <h2 className="text-2xl font-black mb-2">Student View</h2>
              <p className="text-slate-400 mb-6">Attendance: <span className="text-emerald-400 font-black">92%</span></p>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl font-bold animate-pulse">LIVE: React JS - Room 102</div>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}