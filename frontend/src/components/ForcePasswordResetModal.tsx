import React, { useState } from 'react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ForcePasswordResetModal: React.FC<Props> = ({ isOpen, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    try {
      setLoading(true);
      setError('');
      await api.post('/auth/change-password', { newPassword });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <h2 style={modalStyles.title}>SECURITY NOTICE</h2>
        <p style={modalStyles.desc}>
          You are using a default password. Please choose a new password before proceeding.
        </p>

        {error && <div className="font-mono" style={modalStyles.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={modalStyles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label style={modalStyles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#000000',
    border: '2px solid #ffffff',
    padding: '1.5rem',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    borderBottom: '1px solid #333333',
    paddingBottom: '0.5rem',
    marginBottom: '0.5rem',
  },
  desc: {
    fontSize: '0.85rem',
    color: '#a3a3a3',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
  },
  error: {
    border: '1px solid #ffffff',
    padding: '0.5rem',
    fontSize: '0.75rem',
    marginBottom: '1rem',
  },
};