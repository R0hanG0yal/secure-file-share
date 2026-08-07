import React from 'react';
import LiquidDropzone from '../components/LiquidDropzone';
import InboxScreen from './InboxScreen';

export default function SendScreen({ username }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-8 anim-fade">
      
      {/* Hero Liquid Dropzone */}
      <LiquidDropzone onSendSuccess={() => {}} />

      {/* Live Received Files Inbox */}
      <div className="pt-4">
        <InboxScreen username={username} hideHeader={true} />
      </div>

    </div>
  );
}
