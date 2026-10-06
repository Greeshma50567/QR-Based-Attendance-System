import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function LandingPage() {
  const [isTeacherHovered, setIsTeacherHovered] = useState(false);
  const [isStudentHovered, setIsStudentHovered] = useState(false);

  return (
    <div className="landing-page">
      <h1 className="landing-title animate-fade-in">QR Attendance System</h1>
      <p className="landing-subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
        A modern, fast, and secure way to manage classroom attendance.
        Please select your portal to continue.
      </p>

      <div className="landing-cards animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <Link 
          to="/teacher" 
          className="role-card"
          onMouseEnter={() => setIsTeacherHovered(true)}
          onMouseLeave={() => setIsTeacherHovered(false)}
        >
          <div style={{ width: '120px', height: '120px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)' }}>
            <img 
              src={isTeacherHovered ? "/teacher.gif.gif" : "/teacher.png.png"} 
              alt="Teacher" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <h3>Teacher Dashboard</h3>
          <p>Manage classes and generate QR</p>
        </Link>

        <Link 
          to="/student" 
          className="role-card"
          onMouseEnter={() => setIsStudentHovered(true)}
          onMouseLeave={() => setIsStudentHovered(false)}
        >
          <div style={{ width: '120px', height: '120px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-color)' }}>
            <img 
              src={isStudentHovered ? "/student.gif.gif" : "/student.png.png"} 
              alt="Student" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <h3>Student Dashboard</h3>
          <p>Scan QR and mark attendance</p>
        </Link>
      </div>
    </div>
  );
}
