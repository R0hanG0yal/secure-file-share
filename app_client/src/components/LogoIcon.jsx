import React from 'react';

export function DSEmblem({ className = "w-9 h-9" }) {
  return (
    <svg className={`${className} filter drop-shadow-md`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Light Mode High Contrast Gradient */}
        <linearGradient id="ds-light-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A0F07" />
          <stop offset="50%" stopColor="#3D2413" />
          <stop offset="100%" stopColor="#8B5A2B" />
        </linearGradient>

        <linearGradient id="ds-light-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#8B5A2B" />
        </linearGradient>

        {/* Dark Mode Platinum Silver Gradient */}
        <linearGradient id="ds-dark-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E5E7EB" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>

        <linearGradient id="ds-dark-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6C594" />
          <stop offset="100%" stopColor="#C19A6B" />
        </linearGradient>
      </defs>

      {/* D Letterform */}
      <path
        d="M20 18 H45 C65 18 80 30 80 50 C80 70 65 82 45 82 H20 V18 Z M32 30 V70 H45 C58 70 67 62 67 50 C67 38 58 30 45 30 H32 Z"
        style={{ fill: 'var(--logo-d-fill, #1A0F07)' }}
      />

      {/* S Letterform */}
      <path
        d="M30 42 H65 C72 42 76 46 76 50 C76 54 72 58 65 58 H45 C35 58 25 50 25 38 C25 26 35 18 50 18 H70 V30 H50 C43 30 38 34 38 38 C38 42 43 45 50 45 H70 C80 45 88 53 88 63 C88 73 80 82 65 82 H35 V70 H65 C72 70 76 66 76 62 C76 58 72 55 65 55 H45 C35 55 30 48 30 42 Z"
        style={{ fill: 'var(--logo-s-fill, #B8860B)' }}
      />
    </svg>
  );
}

export default function LogoIcon({ className = "h-9" }) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      
      {/* Luxury Badge Container */}
      <div className="w-11 h-11 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 flex items-center justify-center p-1 shadow-sm backdrop-blur-md">
        <DSEmblem className="w-8 h-8" />
      </div>

      {/* Vertical Separator Line */}
      <div className="w-[2px] h-8 bg-[#1A0F07] dark:bg-white opacity-40 dark:opacity-70" />

      {/* Brand Text: DOSHARE SECURE FILE SHARING */}
      <div className="flex flex-col">
        <span className="font-black text-lg tracking-[0.15em] theme-text-heading uppercase leading-none font-sans drop-shadow-sm">
          DO<span style={{ color: 'var(--accent-color, #B8860B)' }}>SHARE</span>
        </span>
        <span className="text-[9px] font-black tracking-[0.25em] theme-text-body uppercase leading-tight mt-1 opacity-90">
          SECURE FILE SHARING
        </span>
      </div>

    </div>
  );
}
