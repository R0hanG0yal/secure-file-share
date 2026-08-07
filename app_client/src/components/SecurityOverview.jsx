import React from 'react';
import { MoreHorizontal, ShieldCheck } from 'lucide-react';
import { DSEmblem } from './LogoIcon';

export default function SecurityOverview() {
  return (
    <div className="app-glass-panel rounded-3xl p-6 glass-rim-highlight flex flex-col justify-between h-full">
      
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest theme-text-heading">SECURITY OVERVIEW</h2>
        <button className="theme-text-muted hover:theme-text-heading p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Official DS Emblem Pedestal (Replaces Lock Icon) */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#e6c594]/40 to-[#8b5a2b]/60 border-2 border-[#c19a6b] flex items-center justify-center shadow-[0_10px_25px_rgba(139,90,43,0.3)] relative mb-3">
          <DSEmblem className="w-14 h-14" />
        </div>

        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#8b5a2b] to-[#c19a6b] text-[#f5e6d3] text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse" />
          <span>E2EE ACTIVE</span>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-3.5 text-xs">
        
        {/* Metric 1 */}
        <div className="flex items-center justify-between">
          <span className="theme-text-muted font-bold">Encryption Status</span>
          <span className="theme-text-heading font-extrabold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c19a6b]" />
            <span>Verified (Zero Knowledge)</span>
          </span>
        </div>

        {/* Metric 2 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="theme-text-muted font-bold">File Expiry</span>
            <span className="theme-text-heading font-extrabold">24h (Self-Destruct)</span>
          </div>
          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#e6c594] to-[#8b5a2b] rounded-full w-[75%]" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center justify-between pt-1">
          <span className="theme-text-muted font-bold">Access Controls</span>
          <span className="theme-text-heading font-extrabold px-2.5 py-0.5 rounded-md bg-white/20 dark:bg-white/10 border border-white/25 text-[11px]">
            Strict
          </span>
        </div>

      </div>

    </div>
  );
}
