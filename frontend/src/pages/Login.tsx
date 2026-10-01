import React, { useState, useEffect } from 'react';
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

  // ⚡ Handle OAuth Callback Token & Error Query Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const userParam = params.get('user');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    } else if (tokenParam && userParam) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('token', tokenParam);
        localStorage.setItem('user', JSON.stringify(parsedUser));
        connectSocket(tokenParam);

        const targetRole = parsedUser.role?.toLowerCase() || 'student';
        window.location.href = `/${targetRole}-dashboard`;
      } catch (err) {
        setError('Failed to process Google authentication session');
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
    window.location.href = `${backendUrl}/auth/google`;
  };

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

              <div style={styles.divider}>
                <span style={styles.dividerText}>OR</span>
              </div>

              {/* ⚡ Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                style={styles.googleBtn}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '8px' }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.617z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Sign in with Google
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
  divider: { display: 'flex', alignItems: 'center', textAlign: 'center', margin: '0.5rem 0', borderBottom: '1px solid #333' },
  dividerText: { backgroundColor: '#0a0a0a', padding: '0 0.5rem', color: '#666', fontSize: '0.7rem', fontWeight: 'bold' },
  googleBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ffffff', backgroundColor: '#000000', color: '#ffffff', padding: '0.6rem', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' },
};