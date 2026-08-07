import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function IdentityStatus() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
      <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping" />
      <ShieldCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
      <span>Device Verified</span>
    </div>
  );
}
