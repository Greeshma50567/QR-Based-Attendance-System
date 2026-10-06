import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, LogOut, CheckCircle, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = 'http://localhost:8080/api';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [loginForm, setLoginForm] = useState({
    username: '',
    registerNumber: '',
    className: '',
    classPassword: ''
  });
  
  const [activeQr, setActiveQr] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`${API_URL}/classes`);
        setAvailableClasses(response.data);
        if (response.data.length > 0) {
          setLoginForm(prev => ({ ...prev, className: response.data[0] })); 
        }
      } catch (error) {
        console.error("Error fetching classes for student", error);
      }
    };
    fetchClasses();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.registerNumber.trim() || !loginForm.className || !loginForm.classPassword) {
      alert("Please enter your name, register number, select a class, and provide the class password.");
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/auth/student/login`, loginForm);
      if (response.data.success) {
        setStudent({
          id: response.data.id,
          name: response.data.name,
          className: response.data.className,
          registerNumber: response.data.registerNumber
        });
      } else {
        alert(response.data.message || "Invalid Class Password");
      }
    } catch (error) {
      alert("Error logging in");
    }
  };

  useEffect(() => {
    let interval = null;
    
    if (student && student.className) {
      const fetchActiveQr = async () => {
        try {
          const response = await axios.get(`${API_URL}/attendance/active-qr?className=${encodeURIComponent(student.className)}`);
          if (response.data.success) {
            setActiveQr(response.data);
          } else {
            setActiveQr(null);
            setAttendanceStatus('');
          }
        } catch (error) {
          console.error("Error fetching active QR");
        }
      };

      fetchActiveQr();
      interval = setInterval(fetchActiveQr, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [student]);

  const handleMarkAttendance = async (present) => {
    try {
      const request = {
        studentId: student.id,
        studentName: student.name,
        registerNumber: student.registerNumber,
        className: student.className,
        token: activeQr.token,
        present: present
      };
      
      const response = await axios.post(`${API_URL}/attendance/mark`, request);
      if (response.data.success) {
        setAttendanceStatus('Marked Successfully');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert("Error marking attendance. You might have already submitted or the session expired.");
    }
  };

  if (!student) {
    return (
      <div className="landing-page" style={{ justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '400px', maxWidth: '90%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Student Portal</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Enter your name and select your assigned class to join the session.
          </p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Your Full Name" 
              value={loginForm.username} 
              onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
              required 
            />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Register Number" 
              value={loginForm.registerNumber} 
              onChange={(e) => setLoginForm({...loginForm, registerNumber: e.target.value})}
              required 
            />
            <select 
              className="input-field"
              value={loginForm.className}
              onChange={(e) => setLoginForm({...loginForm, className: e.target.value})}
              required
            >
              <option value="" disabled>Select your class</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Class Password" 
              value={loginForm.classPassword} 
              onChange={(e) => setLoginForm({...loginForm, classPassword: e.target.value})}
              required 
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <User size={24} color="var(--accent-color)" />
          <h2>Welcome, {student.name}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Assigned Class: {student.className}</span>
          <button className="btn btn-danger" onClick={() => setStudent(null)}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '600px', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
          
          {!activeQr ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Clock size={64} color="var(--text-secondary)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ marginBottom: '1rem' }}>Waiting for Attendance Session</h2>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                Your teacher has not started an attendance session for <strong>{student.className}</strong> yet. <br/>
                This page will automatically update when a QR code is generated.
              </p>
              <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
                Refresh Page Manually
              </button>
            </div>
          ) : (
            <>
              {attendanceStatus ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <CheckCircle size={80} color="var(--success-color)" />
                  <h2 style={{ color: 'var(--success-color)' }}>{attendanceStatus}</h2>
                  <p style={{ color: 'var(--text-secondary)' }}>You can close this window.</p>
                </div>
              ) : (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Mark Your Attendance</h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <QRCodeSVG value="https://forms.gle/kBfbHvU9VwQoJiqL6" size={200} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1rem' }}>
                      Click the button below to submit your attendance for this active session.
                    </p>
                    <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} onClick={() => handleMarkAttendance(true)}>
                      <CheckCircle size={24} /> Submit Attendance
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
