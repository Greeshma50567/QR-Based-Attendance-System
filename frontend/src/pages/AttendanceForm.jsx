import { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:8080/api';

export default function AttendanceForm() {
  const { token } = useParams();
  const [form, setForm] = useState({
    studentName: '',
    registerNumber: ''
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.registerNumber.trim()) {
      setError("Please fill in both fields");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const request = {
        studentName: form.studentName.trim(),
        registerNumber: form.registerNumber.trim(),
        token: token,
        present: true
      };
      
      const response = await axios.post(`${API_URL}/attendance/mark`, request);
      if (response.data.success) {
        setStatus("Successfully submitted attendance!");
      } else {
        setError(response.data.message || "Attendance failed. Make sure your details match what your teacher registered.");
      }
    } catch (err) {
      setError("Error marking attendance. The session might have expired or you already submitted.");
    } finally {
      setLoading(false);
    }
  };

  if (status) {
    return (
      <div className="landing-page" style={{ justifyContent: 'center' }}>
        <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '400px', maxWidth: '90%' }}>
          <CheckCircle size={64} color="var(--success-color)" />
          <h2 style={{ color: 'var(--success-color)', textAlign: 'center' }}>{status}</h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>You can close this tab now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page" style={{ justifyContent: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '400px', maxWidth: '90%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Class Attendance Form</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Please enter your exact Name and Roll No (Register Number) as provided by your teacher.
        </p>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <AlertCircle color="var(--danger-color)" size={20} style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Student Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Carolin" 
              value={form.studentName} 
              onChange={(e) => setForm({...form, studentName: e.target.value})}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Roll No (Register Number)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. 01" 
              value={form.registerNumber} 
              onChange={(e) => setForm({...form, registerNumber: e.target.value})}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
}
