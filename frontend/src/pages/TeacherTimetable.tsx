import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TimetableGrid, SlotData } from '../components/TimetableGrid';
import { useNavigate } from 'react-router-dom';

export const TeacherTimetable: React.FC = () => {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<SlotData[]>([]);

  useEffect(() => {
    fetchMySchedule();
  }, []);

  const fetchMySchedule = async () => {
    try {
      const res = await api.get('/timetable/teacher/my-timetable');
      setTimetable(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>TEACHER PORTAL - MY WEEKLY SCHEDULE</h1>
          <div style={styles.navTabs}>
            <button onClick={() => navigate('/teacher/marks/add')} style={styles.tabBtn}>Create / Log Entry</button>
            <button onClick={() => navigate('/teacher/marks/view')} style={styles.tabBtn}>View All Records Table</button>
            <button style={{ ...styles.tabBtn, backgroundColor: '#fff', color: '#000' }}>My Assigned Timetable</button>
          </div>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">Logout</button>
      </header>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Assigned Periods & Substitutions</h2>
        <TimetableGrid timetableEntries={timetable} isEditable={false} showClassId={true} />
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
};