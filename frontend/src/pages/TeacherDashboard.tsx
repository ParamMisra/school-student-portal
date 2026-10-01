import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DEFAULT_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [marks, setMarks] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'Present' | 'Absent'>('Present');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/marks/teacher/students');
      const studentList = res.data.data || [];
      setStudents(studentList);
      if (studentList.length > 0) {
        setStudentId(studentList[0].user_id);
      }
    } catch (err) {
      console.error('Failed to load students list', err);
    }
  };

  const handleAddMark = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/marks/teacher/marks/add', {
        mark_id: `MARK-${Date.now()}`,
        student_id: studentId,
        subject,
        marks_obtained: Number(marks),
        total_marks: 100,
        date: new Date().toISOString(),
      });
      setMessage(`✅ Mark recorded for Student: ${studentId}`);
      setMarks('');
    } catch (err: any) {
      setMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/attendance/teacher/attendance/mark', {
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
        <div>
          <h1>TEACHER PORTAL</h1>
          <div style={dashStyles.navTabs}>
            <button style={{ ...dashStyles.tabBtn, backgroundColor: '#fff', color: '#000' }}>Create / Log Entry</button>
            <button onClick={() => navigate('/teacher/marks/view')} style={dashStyles.tabBtn}>View All Records Table</button>
            <button onClick={() => navigate('/teacher/timetable')} style={dashStyles.tabBtn}>My Assigned Timetable</button>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">Logout</button>
      </header>

      {message && <div className="font-mono" style={dashStyles.msgBox}>{message}</div>}

      <div style={dashStyles.grid}>
        {/* Record Marks Form */}
        <form onSubmit={handleAddMark} style={dashStyles.card}>
          <h2 style={dashStyles.cardTitle}>Submit Student Marks</h2>
          <label style={dashStyles.label}>Select Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="input-field">
            {students.length === 0 ? (
              <option value="">No Students Found</option>
            ) : (
              students.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.name} ({s.user_id}) {s.class_id ? `- Class ${s.class_id}` : ''}
                </option>
              ))
            )}
          </select>

          <label style={dashStyles.label}>Select Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="input-field">
            {DEFAULT_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <label style={dashStyles.label}>Marks Obtained (/100)</label>
          <input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} required className="input-field" placeholder="85" />

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Broadcast Marks</button>
        </form>

        {/* Record Attendance Form */}
        <form onSubmit={handleMarkAttendance} style={dashStyles.card}>
          <h2 style={dashStyles.cardTitle}>Mark Daily Attendance</h2>
          <label style={dashStyles.label}>Select Student</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="input-field">
            {students.length === 0 ? (
              <option value="">No Students Found</option>
            ) : (
              students.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.name} ({s.user_id}) {s.class_id ? `- Class ${s.class_id}` : ''}
                </option>
              ))
            )}
          </select>

          <label style={dashStyles.label}>Select Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="input-field">
            {DEFAULT_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

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
  navTabs: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },
  tabBtn: { border: '1px solid #fff', backgroundColor: '#000', color: '#fff', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  cardTitle: { fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '0.5rem' },
  label: { fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' },
  msgBox: { border: '1px solid #fff', padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#121212', fontSize: '0.85rem' },
};