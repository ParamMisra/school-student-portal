import React, { useState } from 'react';
import { api } from '../services/api';

export const TeacherDashboard: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Absent'>('Present');
  const [message, setMessage] = useState('');

  const handleAddMark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/marks/add', {
        mark_id: `MARK-${Date.now()}`,
        student_id: studentId,
        subject,
        marks_obtained: Number(marks),
        total_marks: 100,
        date: new Date().toISOString(),
      });
      setMessage(`✅ Mark recorded for Student: ${studentId}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/attendance/mark', {
        log_id: `LOG-${Date.now()}`,
        student_id: studentId,
        subject,
        date: new Date().toISOString(),
        status: attendanceStatus,
      });
      setMessage(`✅ Attendance recorded as ${attendanceStatus}`);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={dashStyles.container}>
      <header style={dashStyles.header}>
        <h1>TEACHER PORTAL</h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">Logout</button>
      </header>

      {message && <div className="font-mono" style={dashStyles.msgBox}>{message}</div>}

      <div style={dashStyles.grid}>
        {/* Record Marks Form */}
        <form onSubmit={handleAddMark} style={dashStyles.card}>
          <h2 style={dashStyles.cardTitle}>Submit Student Marks</h2>
          <label style={dashStyles.label}>Student ID</label>
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="input-field" placeholder="STD1001" />

          <label style={dashStyles.label}>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="input-field" placeholder="Mathematics" />

          <label style={dashStyles.label}>Marks Obtained (/100)</label>
          <input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} required className="input-field" placeholder="85" />

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Broadcast Marks</button>
        </form>

        {/* Record Attendance Form */}
        <form onSubmit={handleMarkAttendance} style={dashStyles.card}>
          <h2 style={dashStyles.cardTitle}>Mark Daily Attendance</h2>
          <label style={dashStyles.label}>Student ID</label>
          <input value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="input-field" placeholder="STD1001" />

          <label style={dashStyles.label}>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="input-field" placeholder="Mathematics" />

          <label style={dashStyles.label}>Status</label>
          <select value={attendanceStatus} onChange={(e: any) => setAttendanceStatus(e.target.value)} className="input-field">
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Log Attendance</button>
        </form>
      </div>
    </div>
  );
};

const dashStyles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  cardTitle: { fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '0.5rem' },
  label: { fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
  msgBox: { border: '1px solid #fff', padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#121212', fontSize: '0.85rem' },
};