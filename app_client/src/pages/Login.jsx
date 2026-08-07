import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { detectOrGenerateUUID, generateHardwareFingerprint, persistFullIdentity } from '../services/identity';
import api from '../services/api';
import PasscodeInput from '../components/PasscodeInput';
import { KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) { setError('Enter your username.'); return; }
    if (!/^\d{6}$/.test(pin)) { setError('Passcode must be 6 digits.'); return; }

    setLoading(true);
    try {
      const { uuid } = await detectOrGenerateUUID();
      const fingerprint = await generateHardwareFingerprint();

      const res = await api.post('/login', {
        username: username.trim(), pin, uuid, fingerprint
      });

      await persistFullIdentity(res.data.token, res.data.username, uuid);
      onLoginSuccess(res.data.username, uuid);
      navigate('/send');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md anim-fade">
        <div className="app-glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden">

          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <KeyRound className="w-6 h-6" style={{ color: 'var(--accent-color)' }} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Sign In</h2>
              <p className="text-xs opacity-70 mt-0.5">Welcome back to SecureShare</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-2">Username</label>
              <input
                type="text"
                required
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full theme-input px-4 py-3.5 rounded-2xl text-xs font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider opacity-70">Passcode</label>
                <Link to="/reset-pin" className="text-[11px] font-bold hover:underline" style={{ color: 'var(--accent-color)' }}>Forgot?</Link>
              </div>
              <PasscodeInput value={pin} onChange={setPin} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs opacity-70 mt-6">
            New here?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: 'var(--accent-color)' }}>Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
