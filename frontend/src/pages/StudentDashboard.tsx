import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const StudentDashboard: React.FC = () => {
  const [cgpa, setCgpa] = useState<number>(0);
  const [marksList, setMarksList] = useState<any[]>([]);

  const fetchStudentData = async () => {
    try {
      const marksRes = await api.get('/marks/my-marks');
      setMarksList(marksRes.data.data || []);

      const cgpaRes = await api.get('/marks/cgpa');
      setCgpa(cgpaRes.data.cgpa || 0);
    } catch (err) {
      console.error('Failed to fetch student data', err);
    }
  };

  useEffect(() => {
    fetchStudentData();

    // Re-fetch automatically when a teacher submits a mark
    socket.on('MARK_ADDED', () => fetchStudentData());
    socket.on('MARK_UPDATED', () => fetchStudentData());

    return () => {
      socket.off('MARK_ADDED');
      socket.off('MARK_UPDATED');
    };
  }, []);

  return (
    <div style={studentStyles.container}>
      <header style={studentStyles.header}>
        <h1>STUDENT PORTAL</h1>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">Logout</button>
      </header>

      <div style={studentStyles.cgpaCard}>
        <span style={studentStyles.cgpaLabel}>CALCULATED CGPA</span>
        <h2 style={studentStyles.cgpaVal}>{cgpa.toFixed(2)} / 10.0</h2>
      </div>

      <div style={studentStyles.card}>
        <h3 style={studentStyles.cardTitle}>Academic Mark Sheet</h3>
        <table style={studentStyles.table}>
          <thead>
            <tr style={studentStyles.th}>
              <th style={studentStyles.cell}>Subject</th>
              <th style={studentStyles.cell}>Score</th>
              <th style={studentStyles.cell}>Total</th>
            </tr>
          </thead>
          <tbody>
            {marksList.length === 0 ? (
              <tr><td colSpan={3} style={studentStyles.cell}>No mark entries found.</td></tr>
            ) : (
              marksList.map((m, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #262626' }}>
                  <td style={studentStyles.cell}>{m.subject}</td>
                  <td style={studentStyles.cell}>{m.marks_obtained}</td>
                  <td style={studentStyles.cell}>{m.total_marks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const studentStyles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' },
  cgpaCard: { border: '2px solid #fff', backgroundColor: '#0a0a0a', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' },
  cgpaLabel: { fontSize: '0.75rem', letterSpacing: '2px', color: '#a3a3a3' },
  cgpaVal: { fontSize: '3rem', fontWeight: 900, marginTop: '0.5rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem' },
  cardTitle: { fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  th: { borderBottom: '1px solid #ffffff', backgroundColor: '#121212' },
  cell: { padding: '0.75rem', borderBottom: '1px solid #262626' },
};