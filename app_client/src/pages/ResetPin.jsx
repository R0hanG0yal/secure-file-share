import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { detectOrGenerateUUID } from '../services/identity';
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
      setSuccess('Passcode updated.');
      localStorage.setItem('identishare_token', res.data.token);
      localStorage.setItem('identishare_user', res.data.username);
      setTimeout(() => { onLoginSuccess(res.data.username, uuid); navigate('/dashboard'); }, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Use your original device.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md anim-fade">
        <div className="glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden glass-shimmer">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">Reset Passcode</h2>
          </div>

          {error && (
            <div className="mb-6 p-3 glass rounded-2xl text-rose-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 glass rounded-2xl text-emerald-600 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-2">Username</label>
              <input
                type="text" required placeholder="Your username" value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input px-4 py-3.5 rounded-2xl text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-2 text-center">New Passcode</label>
              <PasscodeInput value={newPin} onChange={setNewPin} />
            </div>
            <button type="submit" disabled={loading || !uuid}
              className="w-full py-4 rounded-2xl btn-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 relative">
              <span className="relative z-10">{loading ? 'Updating...' : 'Update Passcode'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#86868b] hover:text-[#1d1d1f]">
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
