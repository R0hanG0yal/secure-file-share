import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { detectOrGenerateUUID, persistFullIdentity } from '../services/identity';
import api from '../services/api';
import PasscodeInput from '../components/PasscodeInput';
import { RefreshCw, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ResetPin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [uuid, setUuid] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    detectOrGenerateUUID().then(r => r?.uuid && setUuid(r.uuid));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!username.trim()) { setError('Enter your username.'); return; }
    if (!/^\d{6}$/.test(newPin)) { setError('New passcode must be 6 digits.'); return; }
    if (!uuid) { setError('Device verification unavailable.'); return; }

    setLoading(true);
    try {
      const res = await api.post('/reset-pin', { username: username.trim(), newPin, uuid });
      setSuccess('Passcode updated successfully.');
      await persistFullIdentity(res.data.token, res.data.username, uuid);
      setTimeout(() => {
        onLoginSuccess(res.data.username, uuid);
        navigate('/send');
      }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Reset is allowed only from your registered device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md anim-fade">
        <div className="app-glass-strong rounded-3xl p-5 sm:p-8 relative overflow-hidden glass-rim-highlight">

          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight theme-text-heading">Reset Passcode</h2>
              <p className="text-[11px] sm:text-xs opacity-75 mt-0.5 theme-text-body">Device security verification</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 sm:p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-75 mb-1.5 theme-text-heading">Username</label>
              <input
                type="text"
                required
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full theme-input px-3.5 sm:px-4 py-3 rounded-2xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider opacity-75 mb-1.5 text-center theme-text-heading">New 6-Digit Passcode</label>
              <PasscodeInput value={newPin} onChange={setNewPin} />
            </div>

            <button
              type="submit"
              disabled={loading || !uuid}
              className="w-full py-3.5 sm:py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              <span>{loading ? 'Updating...' : 'Update Passcode'}</span>
            </button>
          </form>

          <div className="mt-5 sm:mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold theme-text-muted hover:theme-text-heading">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
