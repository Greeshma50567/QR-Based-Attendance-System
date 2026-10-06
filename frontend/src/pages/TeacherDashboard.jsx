import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Book, Plus, Trash2, Edit2, ChevronRight, LayoutDashboard, QrCode, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherAuth, setTeacherAuth] = useState(null);
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    className: '',
    classPassword: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_URL}/classes`);
      setClasses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching classes", error);
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password || !loginForm.className || !loginForm.classPassword) {
      alert("Please fill in all fields.");
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/auth/teacher/login`, loginForm);
      if (response.data.success) {
        setTeacherAuth({
          ...response.data,
          className: loginForm.className
        });
        navigate(`/teacher/class/${encodeURIComponent(loginForm.className)}`);
      } else {
        alert(response.data.message || "Login failed");
      }
    } catch (error) {
      alert("Error during login");
    }
  };

  if (!teacherAuth) {
    return (
      <div className="landing-page" style={{ justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '400px', maxWidth: '90%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Teacher Login</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Enter your credentials and the class you wish to access or create.
          </p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Teacher Name" 
              value={loginForm.username} 
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              required 
            />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Teacher Password" 
              value={loginForm.password} 
              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              required 
            />
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Class Name (e.g. Class A)" 
              value={loginForm.className} 
              onChange={(e) => setLoginForm({...loginForm, className: e.target.value})}
              required 
            />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Class Password" 
              value={loginForm.classPassword} 
              onChange={(e) => setLoginForm({...loginForm, classPassword: e.target.value})}
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Open Class
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <div className="main-content" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Class Dashboard: {teacherAuth.className}</h3>
          <button className="btn" onClick={() => { setTeacherAuth(null); navigate('/teacher'); }}>
            Logout Class
          </button>
        </div>
        <div style={{ padding: '2rem' }}>
          <Routes>
            <Route path="/" element={<Navigate to={`/teacher/class/${encodeURIComponent(teacherAuth.className)}`} replace />} />
            <Route path="/class/:className" element={<ClassDetails teacherAuth={teacherAuth} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function ClassDetails({ teacherAuth }) {
  const actualClassName = teacherAuth ? teacherAuth.className : decodeURIComponent(window.location.pathname.split('/').pop());
  const [qrToken, setQrToken] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [showTracker, setShowTracker] = useState(false);

  useEffect(() => {
    const checkActiveQr = async () => {
      try {
        const response = await axios.get(`${API_URL}/attendance/active-qr?className=${actualClassName}`);
        if (response.data.success) {
          setQrToken(response.data.token);
          const expiresAt = new Date(response.data.expiresAt).getTime();
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeLeft(remaining);
        } else {
          setQrToken(null);
          setTimeLeft(0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkActiveQr();
  }, [actualClassName]);

  useEffect(() => {
    let interval = null;
    let countInterval = null;

    if (qrToken && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      // Poll attendance count every 3 seconds
      countInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/attendance/session/${qrToken}/count`);
          setAttendanceCount(res.data);
        } catch (e) { console.error(e); }
      }, 3000);

    } else if (timeLeft <= 0) {
      if (interval) clearInterval(interval);
      if (countInterval) clearInterval(countInterval);
    }
    return () => { 
      if (interval) clearInterval(interval); 
      if (countInterval) clearInterval(countInterval); 
    };
  }, [qrToken, timeLeft]);

  const handleGenerateQR = async () => {
    setLoading(true);
    setAttendanceCount(0);
    try {
      const response = await axios.post(`${API_URL}/attendance/generate-qr`, {
        teacherId: teacherAuth.id,
        className: actualClassName
      });
      
      if (response.data.success) {
        setQrToken(response.data.token);
        const expiresAt = new Date(response.data.expiresAt).getTime();
        const now = new Date().getTime();
        setTimeLeft(Math.max(0, Math.floor((expiresAt - now) / 1000)));
      } else {
        alert(response.data.message);
      }
    } catch (err) {
      alert("Error generating QR");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '2rem', alignItems: 'stretch', height: 'calc(100vh - 200px)' }}>
      
      {/* Left Column: QR Code Section */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', alignSelf: 'flex-start' }}>
          <Book size={32} color="var(--accent-color)" />
          <h1 style={{ fontSize: '1.8rem' }}>{actualClassName} - QR</h1>
        </div>
        
        {qrToken && timeLeft > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '350px' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem' }}>
              <QRCodeSVG value="https://forms.gle/kBfbHvU9VwQoJiqL6" size={200} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'var(--success-color)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Status: ACTIVE</h3>
              <p style={{ fontSize: '1.1rem', fontFamily: 'monospace', marginBottom: '1rem' }}>Time Remaining: {formatTime(timeLeft)}</p>
              <div style={{ background: 'var(--bg-tertiary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Students Marked: </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{attendanceCount}</span>
              </div>
            </div>
            <button className="btn" onClick={() => setShowTracker(true)} style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Users size={20} /> Track Attendance
            </button>
            <button className="btn btn-primary" onClick={handleGenerateQR} disabled={loading} style={{ marginTop: '0.5rem', width: '100%' }}>
              Generate New QR
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem 0', justifyContent: 'center', flex: 1 }}>
            <QrCode size={100} color="var(--text-secondary)" opacity={0.5} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', textAlign: 'center', maxWidth: '300px' }}>
              No active QR session for this class. Generate a new one to start marking attendance.
            </p>
            {qrToken && timeLeft <= 0 && (
              <button className="btn" onClick={() => setShowTracker(true)} style={{ padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <Users size={20} /> View Last Session
              </button>
            )}
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={handleGenerateQR} disabled={loading}>
              <QrCode size={20} style={{ marginRight: '0.5rem' }} />
              Generate QR Code
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Student Management Section */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentManager className={actualClassName} />
      </div>

      {showTracker && qrToken && (
        <AttendanceTrackerModal token={qrToken} onClose={() => setShowTracker(false)} />
      )}
    </div>
  );
}

function StudentManager({ className }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', registerNumber: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [className]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/students?className=${encodeURIComponent(className)}`);
      setStudents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.registerNumber) return;

    try {
      if (editingId) {
        await axios.put(`${API_URL}/students/${editingId}`, { ...form, className });
      } else {
        await axios.post(`${API_URL}/students`, { ...form, className });
      }
      setForm({ name: '', registerNumber: '' });
      setEditingId(null);
      fetchStudents();
    } catch (e) {
      alert("Error saving student. Register number might already exist.");
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({ name: student.name, registerNumber: student.registerNumber });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await axios.delete(`${API_URL}/students/${id}`);
        fetchStudents();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <LayoutDashboard size={24} color="var(--accent-color)" /> Manage Students
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Student Name" 
          value={form.name} 
          onChange={e => setForm({...form, name: e.target.value})} 
          className="input-field"
          style={{ flex: 1, padding: '0.75rem' }}
          required
        />
        <input 
          type="text" 
          placeholder="Register No" 
          value={form.registerNumber} 
          onChange={e => setForm({...form, registerNumber: e.target.value})} 
          className="input-field"
          style={{ flex: 1, padding: '0.75rem' }}
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }}>
          {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
        </button>
        {editingId && (
          <button type="button" className="btn" onClick={() => { setEditingId(null); setForm({ name: '', registerNumber: '' }); }} style={{ padding: '0 1rem' }}>
            Cancel
          </button>
        )}
      </form>

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Loading students...</p>
        ) : students.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No students found in this class.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>Student Name</th>
                  <th style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>Register Number</th>
                  <th style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>Class</th>
                  <th style={{ padding: '1rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="animate-fade-in" style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{s.registerNumber}</td>
                    <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{s.className}</td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(s)} className="btn" style={{ padding: '0.5rem' }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="btn btn-danger" style={{ padding: '0.5rem' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceTrackerModal({ token, onClose }) {
  const [details, setDetails] = useState([]);
  
  useEffect(() => {
    if (!token) return;
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${API_URL}/attendance/session/${token}/details`);
        setDetails(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchDetails();
    const interval = setInterval(fetchDetails, 3000);
    return () => clearInterval(interval);
  }, [token]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Live Attendance Tracking</h2>
          <button className="btn" onClick={onClose} style={{ padding: '0.5rem' }}>
            <XCircle size={24} />
          </button>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>Student Name</th>
                <th style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>Register Number</th>
                <th style={{ padding: '1rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {details.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                  <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)' }}>{s.registerNumber}</td>
                  <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                    {s.status === 'Submitted' ? (
                      <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <CheckCircle size={18} /> Submitted
                      </span>
                    ) : s.status === 'Pending' ? (
                      <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <Clock size={18} /> Pending
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <XCircle size={18} /> Not Submitted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {details.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No students registered for this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
