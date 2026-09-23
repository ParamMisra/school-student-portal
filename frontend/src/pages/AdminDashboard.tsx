import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<{ processed: number; total: number; percentage: number } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
      
      //  Removed explicit headers so Axios auto-injects the multipart boundary
      const res = await api.post('/admin/bulk-upload', formData);
      
      addLog(`[API] Bulk Upload Queued. Job ID: ${res.data.jobId}`);
    } catch (err: any) {
      //  Properly extracts the backend error payload
      const backendError = err.response?.data?.message || err.response?.data?.error || err.message;
      addLog(`[API Error] Upload Failed: ${backendError}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>ADMIN DASHBOARD</h1>
          <p className="font-mono" style={styles.subtitle}>REALTIME SOCKET STREAM ACTIVE</p>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="btn-primary"
        >
          Logout
        </button>
      </header>

      <div style={styles.grid}>
        {/* Upload Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>CSV Bulk User Upload</h2>
          <p style={styles.cardDesc}>
            Upload records. Passwords default to <code style={{ color: '#fff' }}>emailPrefix123</code>.
          </p>

          <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
            />
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

        {/* Live Event Log */}
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
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', backgroundColor: '#000000', minHeight: '100vh', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' },
  title: { fontSize: '1.5rem', fontWeight: 900 },
  subtitle: { fontSize: '0.75rem', color: '#a3a3a3' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' },
  card: { border: '1px solid #333', backgroundColor: '#0a0a0a', padding: '1.5rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' },
  cardDesc: { fontSize: '0.8rem', color: '#a3a3a3', marginBottom: '1rem' },
  progressContainer: { marginTop: '1.5rem', border: '1px solid #333', padding: '0.75rem' },
  progressBarBg: { width: '100%', height: '8px', backgroundColor: '#262626', marginTop: '0.5rem' },
  progressBarFill: { height: '100%', backgroundColor: '#ffffff', transition: 'width 0.3s ease' },
  logBox: { height: '300px', overflowY: 'auto', backgroundColor: '#000', border: '1px solid #262626', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' },
  logItem: { borderBottom: '1px solid #171717', paddingBottom: '0.25rem', color: '#d4d4d4' },
};