import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { exportToCSV, exportToPDF } from '../utils/exportHelpers';

export const TeacherMarksView: React.FC = () => {
  const navigate = useNavigate();
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const res = await api.get('/marks/teacher/marks-list');
      setMarks(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch marks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const formattedData = marks.map((m) => ({
      StudentID: m.student_id?.user_id || 'N/A',
      StudentName: m.student_id?.name || 'N/A',
      Subject: m.subject,
      MarksObtained: m.marks_obtained,
      TotalMarks: m.total_marks,
      Date: new Date(m.date).toLocaleDateString(),
    }));
    exportToCSV('Student_Marks_Registry', formattedData);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>TEACHER PORTAL - ACADEMIC RECORDS</h1>
          <div style={styles.navTabs}>
            <button onClick={() => navigate('/teacher/marks/add')} style={styles.tabBtn}>
              Create / Log Entry
            </button>
            <button style={{ ...styles.tabBtn, backgroundColor: '#fff', color: '#000' }}>
              View All Records Table
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} className="btn-primary" style={{ backgroundColor: '#16a34a' }}>
            📊 Export CSV
          </button>
          <button onClick={() => exportToPDF('Student Marks Registry', 'marks-table')} className="btn-primary" style={{ backgroundColor: '#2563eb' }}>
            📄 Export PDF
          </button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">
            Logout
          </button>
        </div>
      </header>

      <div id="marks-table" style={styles.card}>
        <h2 style={styles.cardTitle}>Student Marks Registry</h2>
        <table style={styles.table}>
          <thead>
            <tr style={styles.th}>
              <th style={styles.cell}>Student ID</th>
              <th style={styles.cell}>Student Name</th>
              <th style={styles.cell}>Subject</th>
              <th style={styles.cell}>Marks Obtained</th>
              <th style={styles.cell}>Total Marks</th>
              <th style={styles.cell}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={styles.cell}>
                  Loading academic records...
                </td>
              </tr>
            ) : marks.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.cell}>
                  No records logged yet.
                </td>
              </tr>
            ) : (
              marks.map((m) => (
                <tr key={m._id} style={{ borderBottom: '1px solid #262626' }}>
                  <td style={styles.cell}>{m.student_id?.user_id || 'N/A'}</td>
                  <td style={styles.cell}>{m.student_id?.name || 'N/A'}</td>
                  <td style={styles.cell}>{m.subject}</td>
                  <td style={styles.cell}>{m.marks_obtained}</td>
                  <td style={styles.cell}>{m.total_marks}</td>
                  <td style={styles.cell}>{new Date(m.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' },
  navTabs: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },
  tabBtn: { border: '1px solid #fff', backgroundColor: '#000', color: '#fff', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem' },
  cardTitle: { fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  th: { borderBottom: '1px solid #ffffff', backgroundColor: '#121212' },
  cell: { padding: '0.75rem', borderBottom: '1px solid #262626' },
};