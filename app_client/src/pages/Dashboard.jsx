import React, { useRef } from 'react';
import LiquidDropzone from '../components/LiquidDropzone';
import SecurityOverview from '../components/SecurityOverview';
import RecentTransfers from '../components/RecentTransfers';

export default function Dashboard({ username, uuid, unreadCount, setUnreadCount }) {
  const windowRef = useRef(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      
      {/* VisionOS Rose Gold / Bronze Brushed Outer Frame Window */}
      <div
        ref={windowRef}
        className="app-glass-strong vision-gold-frame rounded-[32px] p-6 sm:p-8 space-y-8 relative"
      >
        
        {/* Top Grid: Liquid Dropzone (2 cols) & Security Overview (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2">
            <LiquidDropzone onSendSuccess={() => {}} />
          </div>
          <div className="lg:col-span-1">
            <SecurityOverview />
          </div>
        </div>

        {/* Bottom Section: Recent Transfers Textured Cards Grid */}
        <RecentTransfers username={username} setUnreadCount={setUnreadCount} />

      </div>

    </div>
  );
}
