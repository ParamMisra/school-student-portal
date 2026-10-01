import React, { useState } from 'react';
import { api } from '../services/api';
import { connectSocket } from '../services/socket';
import { ForcePasswordResetModal } from '../components/ForcePasswordResetModal';

export const Login: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustResetPassword, setMustResetPassword] = useState(false);

  // Forgot password flow state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
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

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/request-reset-otp', { email: resetEmail });
      setMessage(res.data.message);
      setResetStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password-otp', { email: resetEmail, otp, newPassword });
      setMessage(res.data.message);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetStep(1);
        setMessage('Password reset successful. Please log in.');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
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

        {!showForgotPassword ? (
          <>
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
            {message && <div className="font-mono" style={styles.msgBox}>✅ {message}</div>}

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

              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                {loading ? 'Logging in...' : `Login as ${role}`}
              </button>

              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); setMessage(''); }}
                style={styles.forgotBtn}
              >
                Forgot Password?
              </button>
            </form>
          </>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', textAlign: 'center' }}>RESET PASSWORD</h2>
            {error && <div className="font-mono" style={styles.errorBox}>⚠️ {error}</div>}
            {message && <div className="font-mono" style={styles.msgBox}>✅ {message}</div>}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestOTP} style={styles.form}>
                <label style={styles.label}>Registered Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="user@school.com"
                />
                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                  {loading ? 'Sending Code...' : 'Send Verification OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={styles.form}>
                <label style={styles.label}>6-Digit OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="input-field"
                  placeholder="123456"
                />
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="••••••••"
                />
                <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setResetStep(1); setError(''); setMessage(''); }}
              style={styles.forgotBtn}
            >
              ← Back to Login
            </button>
          </div>
        )}
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
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: '#000000' },
  card: { width: '100%', maxWidth: '420px', border: '2px solid #ffffff', backgroundColor: '#0a0a0a', padding: '2rem', boxShadow: '8px 8px 0px 0px #ffffff' },
  header: { textAlign: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333333', paddingBottom: '1rem' },
  title: { fontSize: '1.4rem', fontWeight: 900, letterSpacing: '2px' },
  roleContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem', border: '1px solid #333333', padding: '0.25rem', marginBottom: '1.5rem', backgroundColor: '#000000' },
  roleBtn: { border: 'none', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer' },
  errorBox: { border: '1px solid #ffffff', backgroundColor: '#171717', padding: '0.75rem', fontSize: '0.75rem', marginBottom: '1rem' },
  msgBox: { border: '1px solid #ffffff', backgroundColor: '#0d2818', padding: '0.75rem', fontSize: '0.75rem', marginBottom: '1rem', color: '#4ade80' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem', color: '#d4d4d4' },
  forgotBtn: { background: 'none', border: 'none', color: '#a3a3a3', textDecoration: 'underline', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', textAlign: 'center' },
};