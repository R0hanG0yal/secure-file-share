import React, { useState, useEffect, useRef } from 'react';
import { Radio, Share2, Copy, Check, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

export default function P2PMode() {
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [p2pStatus, setP2pStatus] = useState('Idle');
  const [p2pProgress, setP2pProgress] = useState(0);

  const generateRoom = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setIsHost(true);
    setP2pStatus('Waiting for peer to join room...');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* VisionOS Rose Gold / Bronze Brushed Frame */}
      <div className="app-glass-strong vision-gold-frame rounded-[32px] p-6 sm:p-8 space-y-8 glass-rim-highlight">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#e6c594] via-[#c19a6b] to-[#8b5a2b] flex items-center justify-center text-black shadow-lg">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wider uppercase theme-text-heading">
                DOSHARE CLASSIC P2P DIRECT MODE
              </h2>
              <p className="text-xs font-bold theme-text-body mt-0.5">
                Zero-Server Browser-to-Browser WebRTC Peer Transfer
              </p>
            </div>
          </div>

          <a
            href="http://localhost:8000/p2p"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl btn-glass-subtle text-xs font-extrabold flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            <span>Open Classic Flask Portal (Port 8000)</span>
          </a>
        </div>

        {/* P2P Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Host Room Card */}
          <div className="app-glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#C19A6B]" />
              <h3 className="text-sm font-extrabold uppercase theme-text-heading">Create Direct P2P Room</h3>
            </div>
            <p className="text-xs font-bold theme-text-body">
              Generate a 6-digit WebRTC session code to send files directly from device to device without uploading to any cloud server.
            </p>

            {roomCode ? (
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-white/20 border border-white/30 flex items-center justify-between">
                  <span className="font-mono text-xl font-black tracking-widest theme-text-heading">{roomCode}</span>
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-lg btn-glass-subtle text-xs font-bold flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{p2pStatus}</span>
                </p>
              </div>
            ) : (
              <button
                onClick={generateRoom}
                className="w-full py-3.5 rounded-xl btn-primary-theme text-xs uppercase tracking-wider font-extrabold flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Generate P2P Code</span>
              </button>
            )}
          </div>

          {/* Join Room Card */}
          <div className="app-glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-[#C19A6B]" />
              <h3 className="text-sm font-extrabold uppercase theme-text-heading">Join Direct P2P Room</h3>
            </div>
            <p className="text-xs font-bold theme-text-body">
              Enter the 6-digit room code shared by the sender to connect directly and start receiving files.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit room code"
                className="w-full theme-input px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-widest uppercase"
              />
              <button
                onClick={() => setP2pStatus('Connecting to peer WebRTC...')}
                className="w-full py-3.5 rounded-xl btn-glass-subtle text-xs uppercase tracking-wider font-extrabold"
              >
                Connect to P2P Peer
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
