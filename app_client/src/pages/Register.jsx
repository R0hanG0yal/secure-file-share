import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { detectOrGenerateUUID, persistFullIdentity } from '../services/identity';
import api from '../services/api';
import PasscodeInput from '../components/PasscodeInput';
import { UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

export default function Register({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || username.trim().length < 3 || username.trim().length > 20) {
      setError('Username must be 3–20 characters.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('Enter a 6-digit passcode.');
      return;
    }

    setLoading(true);
    try {
      const { uuid } = await detectOrGenerateUUID();

      const res = await api.post('/register', {
        username: username.trim(), pin, uuid
      });

      await persistFullIdentity(res.data.token, res.data.username, uuid);
      onLoginSuccess(res.data.username, uuid);
      navigate('/send');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md anim-fade">
        <div className="app-glass-strong rounded-3xl p-5 sm:p-8 relative overflow-hidden glass-rim-highlight">

          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--accent-color)' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight theme-text-heading">Create Account</h2>
              <p className="text-[11px] sm:text-xs opacity-75 mt-0.5 theme-text-body">Instant device binding</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-75 mb-1.5 theme-text-heading">Choose Username</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={20}
                placeholder="Choose a unique username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full theme-input px-3.5 sm:px-4 py-3 rounded-2xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-75 mb-1.5 text-center theme-text-heading">Set 6-Digit Passcode</label>
              <PasscodeInput value={pin} onChange={setPin} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <span>{loading ? 'Creating...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs opacity-75 mt-5 sm:mt-6 theme-text-body">
            Already registered?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: 'var(--accent-color)' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
