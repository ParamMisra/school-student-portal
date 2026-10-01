import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<{ processed: number; total: number; percentage: number } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Single User Form State
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [classId, setClassId] = useState('');
  const [singleMessage, setSingleMessage] = useState('');

  useEffect(() => {
    socket.on('BULK_UPLOAD_PROGRESS', (data) => {
      setUploadProgress(data);
      addLog(`[WS] Uploading: ${data.processed}/${data.total} (${data.percentage}%)`);
    });

    socket.on('BULK_UPLOAD_COMPLETED', (data) => {
      setUploadProgress(null);
      addLog(`[WS] Bulk upload job ${data.jobId} completed. Total: ${data.totalRecords}`);
    });

    socket.on('MARK_ADDED', (data) => addLog(`[WS] Mark Added: ${data.subject} -> Score: ${data.marks_obtained}`));
    socket.on('ATTENDANCE_MARKED', (data) => addLog(`[WS] Attendance Logged for Student: ${data.log.student_id}`));

    return () => {
      socket.off('BULK_UPLOAD_PROGRESS');
      socket.off('BULK_UPLOAD_COMPLETED');
      socket.off('MARK_ADDED');
      socket.off('ATTENDANCE_MARKED');
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await api.post('/admin/bulk-upload', formData);
      addLog(`[API] Bulk Upload Queued. Job ID: ${res.data.jobId}`);
    } catch (err: any) {
      const backendError = err.response?.data?.message || err.response?.data?.error || err.message;
      addLog(`[API Error] Upload Failed: ${backendError}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users/create', {
        user_id: userId,
        name,
        email,
        role,
        class_id: classId || undefined,
      });
      setSingleMessage(`✅ User ${name} (${userId}) created!`);
      setUserId('');
      setName('');
      setEmail('');
      setClassId('');
    } catch (err: any) {
      setSingleMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ADMIN DASHBOARD</h1>
          <button onClick={() => navigate('/admin/timetable')} style={styles.navTabBtn}>
            📅 Manage Timetables & Classes →
          </button>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="btn-primary">
          Logout
        </button>
      </header>

      {singleMessage && <div className="font-mono" style={styles.msgBox}>{singleMessage}</div>}

      <div style={styles.grid}>
        {/* Single User Creation Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Single User Creation</h2>
          <form onSubmit={handleCreateSingleUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={styles.label}>User ID</label>
            <input value={userId} onChange={(e) => setUserId(e.target.value)} required className="input-field" placeholder="u005" />

            <label style={styles.label}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field" placeholder="John Doe" />

            <label style={styles.label}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" placeholder="john@school.com" />

            <label style={styles.label}>Role</label>
            <select value={role} onChange={(e: any) => setRole(e.target.value)} className="input-field">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>

            {role === 'student' && (
              <>
                <label style={styles.label}>Class ID (Optional)</label>
                <input value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field" placeholder="201" />
              </>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Create User</button>
          </form>
        </div>

        {/* Upload & Socket Log Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>CSV Bulk User Upload</h2>
            <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input-field" />
              <button type="submit" disabled={uploading || !file} className="btn-primary">
                {uploading ? 'Processing CSV...' : 'Start Import'}
              </button>
            </form>

            {uploadProgress && (
              <div style={styles.progressContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Processing...</span>
                  <span>{uploadProgress.percentage}%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${uploadProgress.percentage}%` }} />
                </div>
              </div>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Live System Log Stream</h2>
            <div className="font-mono" style={styles.logBox}>
              {logs.length === 0 ? (
                <p style={{ color: '#737373' }}>Listening for site-wide WebSocket broadcasts...</p>
              ) : (
                logs.map((log, i) => <div key={i} style={styles.logItem}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: 900 },
  navTabBtn: { border: '1px solid #fff', backgroundColor: '#fff', color: '#000', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  label: { fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#d4d4d4' },
  msgBox: { border: '1px solid #fff', padding: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#121212', fontSize: '0.85rem' },
  progressContainer: { marginTop: '1.5rem', border: '1px solid #333', padding: '0.75rem' },
  progressBarBg: { width: '100%', height: '8px', backgroundColor: '#262626', marginTop: '0.5rem' },
  progressBarFill: { height: '100%', backgroundColor: '#ffffff', transition: 'width 0.3s ease' },
  logBox: { height: '220px', overflowY: 'auto', backgroundColor: '#000', border: '1px solid #262626', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' },
  logItem: { borderBottom: '1px solid #171717', paddingBottom: '0.25rem', color: '#d4d4d4' },
};