import React, { useState } from 'react';
import { api } from '../services/api';
import { connectSocket } from '../services/socket';
import { ForcePasswordResetModal } from '../components/ForcePasswordResetModal';

export const Login: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustResetPassword, setMustResetPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpointMap = {
      admin: '/auth/login-admin',
      teacher: '/auth/login-teacher',
      student: '/auth/login-student',
    };

    try {
      const response = await api.post(endpointMap[role], { email, password });
      const { token, user, mustChangePassword } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      connectSocket(token);

      if (mustChangePassword) {
        setMustResetPassword(true);
      } else {
        window.location.href = `/${role}-dashboard`;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>SCHOOL MANAGEMENT</h1>
        </div>

        {/* Role Switcher */}
        <div style={styles.roleContainer}>
          {(['student', 'teacher', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                ...styles.roleBtn,
                backgroundColor: role === r ? '#ffffff' : '#000000',
                color: role === r ? '#000000' : '#a3a3a3',
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {error && <div className="font-mono" style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="user@school.com"
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1rem' }}>
            {loading ? 'Logging in...' : `Login as ${role}`}
          </button>
        </form>
      </div>

      <ForcePasswordResetModal
        isOpen={mustResetPassword}
        onSuccess={() => {
          setMustResetPassword(false);
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          window.location.href = `/${savedUser.role?.toLowerCase()}-dashboard`;
        }}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    backgroundColor: '#000000',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    border: '2px solid #ffffff',
    backgroundColor: '#0a0a0a',
    padding: '2rem',
    boxShadow: '8px 8px 0px 0px #ffffff',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #333333',
    paddingBottom: '1rem',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 900,
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#a3a3a3',
    marginTop: '0.25rem',
  },
  roleContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.25rem',
    border: '1px solid #333333',
    padding: '0.25rem',
    marginBottom: '1.5rem',
    backgroundColor: '#000000',
  },
  roleBtn: {
    border: 'none',
    padding: '0.5rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  errorBox: {
    border: '1px solid #ffffff',
    backgroundColor: '#171717',
    padding: '0.75rem',
    fontSize: '0.75rem',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
    color: '#d4d4d4',
  },
};