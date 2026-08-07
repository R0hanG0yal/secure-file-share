import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { detectStoredIdentity, generateHardwareFingerprint, persistFullIdentity } from '../services/identity';
import api from '../services/api';
import { Shield, UserPlus, KeyRound } from 'lucide-react';

export default function Home({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function autoRecognize() {
      try {
        const stored = await detectStoredIdentity();
        if (stored?.token && stored?.username) {
          await persistFullIdentity(stored.token, stored.username, stored.uuid);
          onLoginSuccess(stored.username, stored.uuid);
          navigate('/send');
          return;
        }

        const fp = await generateHardwareFingerprint();
        if (fp) {
          const res = await api.get(`/check-fingerprint/${fp}`);
          if (res.data?.found && res.data?.token) {
            await persistFullIdentity(res.data.token, res.data.username, res.data.uuid);
            onLoginSuccess(res.data.username, res.data.uuid);
            navigate('/send');
            return;
          }
        }

        if (stored?.uuid) {
          const resUuid = await api.get(`/check-uuid/${stored.uuid}`);
          if (resUuid.data?.found && resUuid.data?.token) {
            await persistFullIdentity(resUuid.data.token, resUuid.data.username, stored.uuid);
            onLoginSuccess(resUuid.data.username, stored.uuid);
            navigate('/send');
            return;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    autoRecognize();
  }, [navigate, onLoginSuccess]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl app-glass-strong flex items-center justify-center anim-fade">
          <Shield className="w-8 h-8 animate-pulse" style={{ color: 'var(--accent-color)' }} />
        </div>
        <div className="w-10 h-0.5 rounded-full animate-pulse" style={{ background: 'var(--accent-color)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8 anim-fade">

        {/* Logo Shield */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-3xl app-glass-strong mx-auto flex items-center justify-center relative shadow-2xl">
            <Shield className="w-12 h-12 stroke-[1.5]" style={{ color: 'var(--accent-color)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider">
              SECURE<span style={{ color: 'var(--accent-color)' }}>SHARE</span>
            </h1>
            <p className="text-xs opacity-70 mt-1 font-medium tracking-wide">
              Multi-layer identity & encrypted file transfer
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3.5 anim-fade">
          <Link
            to="/register"
            className="w-full py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider flex items-center justify-center gap-2.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </Link>

          <Link
            to="/login"
            className="w-full py-4 rounded-2xl app-glass-card text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5"
          >
            <KeyRound className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <span>Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
