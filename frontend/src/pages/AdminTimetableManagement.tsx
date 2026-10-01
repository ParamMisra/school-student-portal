import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TimetableGrid, SlotData } from '../components/TimetableGrid';
import { useNavigate } from 'react-router-dom';
import { exportToPDF } from '../utils/exportHelpers';

export const AdminTimetableManagement: React.FC = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<SlotData[]>([]);

  // Slot Edit Modal
  const [activeSlot, setActiveSlot] = useState<{ day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'; period: number } | null>(null);
  const [subject, setSubject] = useState('');
  const [teacherUserId, setTeacherUserId] = useState('');
  const [substituteUserId, setSubstituteUserId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchClasses(selectedSchool);
      fetchTeachers(selectedSchool);
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable(selectedClass);
      updateClassSubjects(selectedClass);
    } else {
      setTimetable([]);
    }
  }, [selectedClass]);

  const initData = async () => {
    try {
      const schoolRes = await api.get('/admin/classes/schools');
      const sList = schoolRes.data.data || [];
      setSchools(sList);
      if (sList.length > 0) {
        setSelectedSchool(sList[0].school_id);
      }
    } catch (err: any) {
      console.error('Failed to initialize timetable data', err);
      setMsg(`❌ Error loading metadata: ${err.response?.data?.error || err.message}`);
    }
  };

  const fetchTeachers = async (schoolId: string) => {
    try {
      const res = await api.get(`/timetable/admin/teachers-list?school_id=${schoolId}`);
      const tList = res.data.data || [];
      setTeachers(tList);
      if (tList.length > 0) {
        setTeacherUserId(tList[0].user_id);
      } else {
        setTeacherUserId('');
      }
    } catch (err) {
      console.error('Failed to fetch teachers', err);
      setTeachers([]);
      setTeacherUserId('');
    }
  };

  const fetchClasses = async (schoolId: string) => {
    try {
      const res = await api.get(`/admin/classes?school_id=${schoolId}`);
      const cList = res.data.data || [];
      setClasses(cList);
      if (cList.length > 0) {
        setSelectedClass(cList[0].class_id);
      } else {
        setSelectedClass('');
      }
    } catch (err: any) {
      console.error('Failed to fetch classes', err);
    }
  };

  const updateClassSubjects = (classId: string) => {
    const cls = classes.find((c) => c.class_id === classId);
    const subList = cls?.subjects || ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Biology'];
    setAvailableSubjects(subList);
    if (subList.length > 0) setSubject(subList[0]);
  };

  const fetchTimetable = async (classId: string) => {
    try {
      const res = await api.get(`/timetable/class/${classId}`);
      setTimetable(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch timetable', err);
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlot || !selectedClass) return;

    try {
      await api.post('/timetable/admin/slot', {
        class_id: selectedClass,
        school_id: selectedSchool,
        day: activeSlot.day,
        period: activeSlot.period,
        subject,
        teacher_user_id: teacherUserId,
        substitute_user_id: substituteUserId || undefined,
      });
      setMsg(`✅ Slot updated for ${activeSlot.day} Period ${activeSlot.period}`);
      setActiveSlot(null);
      setSubstituteUserId('');
      fetchTimetable(selectedClass);
    } catch (err: any) {
      setMsg(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>ADMIN SCHEDULING & TIMETABLE</h1>
          <button onClick={() => navigate('/admin-dashboard')} style={styles.navBtn}>← Back to Admin Dashboard</button>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => exportToPDF(`Master Timetable - Class ${selectedClass}`, 'timetable-matrix')} className="btn-primary" style={{ backgroundColor: '#1e293b' }}>
            📥 Download PDF
          </button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">Logout</button>
        </div>
      </header>

      {msg && <div className="font-mono" style={styles.msgBox}>{msg}</div>}

      {/* Selectors Bar */}
      <div style={styles.card}>
        <div style={styles.flexRow}>
          <div>
            <label style={styles.label}>Select School</label>
            <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="input-field">
              {schools.length === 0 ? (
                <option value="">No Schools Found</option>
              ) : (
                schools.map((s) => (
                  <option key={s.school_id} value={s.school_id}>
                    {s.school_name} ({s.school_id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label style={styles.label}>Select Class ID</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="input-field">
              {classes.length === 0 ? (
                <option value="">No Classes Found</option>
              ) : (
                classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>Class {c.class_id}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div id="timetable-matrix" style={{ ...styles.card, marginTop: '1.5rem' }}>
        <h3 style={styles.cardTitle}>Master Timetable Matrix for Class {selectedClass || 'N/A'}</h3>
        <TimetableGrid
          timetableEntries={timetable}
          isEditable={true}
          showClassId={false}
          onSlotClick={(day, period, current) => {
            setActiveSlot({ day, period });
            if (current) {
              setSubject(current.subject);
              if (current.teacher_id?.user_id) setTeacherUserId(current.teacher_id.user_id);
              if (current.substitute_id?.user_id) setSubstituteUserId(current.substitute_id.user_id);
            }
          }}
        />
      </div>

      {/* Edit Slot Modal */}
      {activeSlot && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Set Slot: {activeSlot.day} Period {activeSlot.period}
            </h3>
            <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={styles.label}>Subject Name</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="input-field">
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Primary Teacher</label>
                <select value={teacherUserId} onChange={(e) => setTeacherUserId(e.target.value)} required className="input-field">
                  {teachers.map((t) => (
                    <option key={t.user_id} value={t.user_id}>{t.name} ({t.user_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Substitute Teacher (Optional)</label>
                <select value={substituteUserId} onChange={(e) => setSubstituteUserId(e.target.value)} className="input-field">
                  <option value="">-- None --</option>
                  {teachers.map((t) => (
                    <option key={t.user_id} value={t.user_id}>{t.name} ({t.user_id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Slot</button>
                <button type="button" onClick={() => setActiveSlot(null)} className="btn-primary" style={{ flex: 1, backgroundColor: '#333' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' },
  navBtn: { border: 'none', background: 'none', color: '#a3a3a3', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.25rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem' },
  cardTitle: { fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem' },
  flexRow: { display: 'flex', gap: '2rem' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#a3a3a3' },
  msgBox: { border: '1px solid #fff', padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#121212' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { width: '100%', maxWidth: '400px', border: '2px solid #fff', backgroundColor: '#0a0a0a', padding: '2rem' },
};