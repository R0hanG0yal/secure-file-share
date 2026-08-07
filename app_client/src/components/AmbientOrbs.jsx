import React from 'react';

/**
 * AmbientOrbs renders:
 * - HTML5 background video (3129671-uhd_2560_1440_30fps.mp4) running in BOTH Light and Dark modes
 * - Mode-specific glass tint overlay
 * - 4 Morphing Liquid Water Bubbles drifting dynamically in the stage
 */
export default function AmbientOrbs({ isDarkMode }) {
  return (
    <>
      {/* ── Running Background Video (Both Light & Dark Modes) ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="app-video-bg"
        src="/3129671-uhd_2560_1440_30fps.mp4"
        style={{ opacity: isDarkMode ? 0.45 : 0.38 }}
        onError={(e) => {
          console.warn('Video load fallback:', e);
        }}
      />

      {/* ── Glass Tint Overlay ── */}
      <div className={isDarkMode ? 'dark-video-overlay' : 'light-video-overlay'} />

      {/* ── Morphing Liquid Water Bubbles & Orbs ── */}
      <div className="ambient-orb-layer">
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="liquid-bubble-1" />
        <div className="liquid-bubble-2" />
        <div className="liquid-bubble-3" />
      </div>
    </>
  );
}
