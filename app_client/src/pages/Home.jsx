import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { detectStoredIdentity, persistFullIdentity } from '../services/identity';
import api from '../services/api';
import { UserPlus, KeyRound, ShieldCheck, Zap } from 'lucide-react';
import { DSEmblem } from '../components/LogoIcon';

export default function Home({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyExistingSession() {
      try {
        const stored = await detectStoredIdentity();
        if (stored?.token) {
          // Verify with backend that token is still valid
          const res = await api.get('/me');
          if (res.data?.authenticated && res.data?.username) {
            await persistFullIdentity(stored.token, res.data.username, res.data.uuid || stored.uuid);
            onLoginSuccess(res.data.username, res.data.uuid || stored.uuid);
            navigate('/send');
            return;
          }
        }
      } catch (err) {
        // Token invalid or expired, continue to login screen
      } finally {
        setLoading(false);
      }
    }

    verifyExistingSession();
  }, [navigate, onLoginSuccess]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl app-glass-strong flex items-center justify-center anim-fade">
          <DSEmblem className="w-10 h-10 animate-pulse" />
        </div>
        <div className="w-10 h-0.5 rounded-full animate-pulse" style={{ background: 'var(--accent-color)' }} />
      </div>
    );
  }

  const classicP2pUrl = import.meta.env.VITE_CLASSIC_P2P_URL || 'http://localhost:8000/p2p';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm space-y-6 sm:space-y-8 anim-fade">

        {/* Logo Monogram */}
        <div className="text-center space-y-3.5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl app-glass-strong mx-auto flex items-center justify-center relative shadow-2xl p-3 sm:p-4">
            <DSEmblem className="w-12 h-12 sm:w-14 sm:h-14" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider theme-text-heading">
              DO<span style={{ color: 'var(--accent-color)' }}>SHARE</span>
            </h1>
            <p className="text-[11px] sm:text-xs opacity-80 mt-1 font-bold tracking-wide theme-text-muted">
              Secure Direct File & Message Transfer
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 anim-fade">
          <Link
            to="/register"
            className="w-full py-3.5 sm:py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2.5 shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Account</span>
          </Link>

          <Link
            to="/login"
            className="w-full py-3.5 sm:py-4 rounded-2xl app-glass-card text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2.5"
          >
            <KeyRound className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <span>Sign In with Passcode</span>
          </Link>

          <a
            href={classicP2pUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 rounded-2xl btn-glass-subtle text-[11px] font-bold tracking-wider flex items-center justify-center gap-2 mt-2 opacity-85 hover:opacity-100"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Direct P2P Portal (No Login)</span>
          </a>
        </div>

        {/* Privacy Note */}
        <div className="text-center flex items-center justify-center gap-1.5 text-[11px] theme-text-muted font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Multi-layer device binding • Auto-delete history</span>
        </div>

      </div>
    </div>
  );
}
