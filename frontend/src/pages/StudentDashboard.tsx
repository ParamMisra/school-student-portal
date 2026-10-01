import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { TimetableGrid, SlotData } from '../components/TimetableGrid';
import { exportToCSV, exportToPDF } from '../utils/exportHelpers';

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marks' | 'timetable'>('marks');
  const [cgpa, setCgpa] = useState<number>(0);
  const [marksList, setMarksList] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<SlotData[]>([]);
  const [studentClassId, setStudentClassId] = useState<string>('');

  const fetchStudentData = async () => {
    try {
      const marksRes = await api.get('/marks/student/marks');
      setMarksList(marksRes.data.data || []);

      const cgpaRes = await api.get('/marks/student/cgpa');
      setCgpa(cgpaRes.data.cgpa || 0);

      const ttRes = await api.get('/timetable/student/my-timetable');
      setTimetable(ttRes.data.data || []);
      setStudentClassId(ttRes.data.class_id || '');
    } catch (err) {
      console.error('Failed to fetch student data', err);
    }
  };

  useEffect(() => {
    fetchStudentData();

    socket.on('MARK_ADDED', () => fetchStudentData());
    socket.on('MARK_UPDATED', () => fetchStudentData());
    socket.on('TIMETABLE_UPDATED', () => fetchStudentData());

    return () => {
      socket.off('MARK_ADDED');
      socket.off('MARK_UPDATED');
      socket.off('TIMETABLE_UPDATED');
    };
  }, []);

  const handleExportMarksCSV = () => {
    const formatted = marksList.map((m) => ({
      Subject: m.subject,
      Score: m.marks_obtained,
      Total: m.total_marks,
    }));
    exportToCSV('My_Academic_Marks', formatted);
  };

  return (
    <div style={studentStyles.container}>
      <header style={studentStyles.header}>
        <div>
          <h1>STUDENT PORTAL</h1>
          <div style={studentStyles.navTabs}>
            <button
              onClick={() => setActiveTab('marks')}
              style={{ ...studentStyles.tabBtn, backgroundColor: activeTab === 'marks' ? '#fff' : '#000', color: activeTab === 'marks' ? '#000' : '#fff' }}
            >
              Academic Mark Sheet
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              style={{ ...studentStyles.tabBtn, backgroundColor: activeTab === 'timetable' ? '#fff' : '#000', color: activeTab === 'timetable' ? '#000' : '#fff' }}
            >
              Class Timetable ({studentClassId ? `Class ${studentClassId}` : 'Unassigned'})
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab === 'marks' ? (
            <>
              <button onClick={handleExportMarksCSV} className="btn-primary" style={{ backgroundColor: '#16a34a' }}>
                📊 Export CSV
              </button>
              <button onClick={() => exportToPDF('Academic Mark Sheet', 'student-marks-sheet')} className="btn-primary" style={{ backgroundColor: '#2563eb' }}>
                📄 Download PDF
              </button>
            </>
          ) : (
            <button onClick={() => exportToPDF(`Class ${studentClassId} Weekly Schedule`, 'student-timetable')} className="btn-primary" style={{ backgroundColor: '#2563eb' }}>
              📥 Download Timetable PDF
            </button>
          )}
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">Logout</button>
        </div>
      </header>

      {activeTab === 'marks' ? (
        <div id="student-marks-sheet">
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
      ) : (
        <div id="student-timetable" style={studentStyles.card}>
          <h3 style={studentStyles.cardTitle}>Class {studentClassId} Weekly Schedule</h3>
          <TimetableGrid timetableEntries={timetable} isEditable={false} showClassId={false} />
        </div>
      )}
    </div>
  );
};

const studentStyles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' },
  navTabs: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' },
  tabBtn: { border: '1px solid #fff', padding: '0.4rem 0.8rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' },
  cgpaCard: { border: '2px solid #fff', backgroundColor: '#0a0a0a', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' },
  cgpaLabel: { fontSize: '0.75rem', letterSpacing: '2px', color: '#a3a3a3' },
  cgpaVal: { fontSize: '3rem', fontWeight: 900, marginTop: '0.5rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem' },
  cardTitle: { fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  th: { borderBottom: '1px solid #ffffff', backgroundColor: '#121212' },
  cell: { padding: '0.75rem', borderBottom: '1px solid #262626' },
};