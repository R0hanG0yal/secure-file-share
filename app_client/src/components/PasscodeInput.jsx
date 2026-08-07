import React, { useRef } from 'react';

export default function PasscodeInput({ value, onChange }) {
  const inputRef = useRef(null);
  const digits = value.split('');
  const slots = Array(6).fill('').map((_, i) => digits[i] || '');

  return (
    <div className="cursor-pointer py-2" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="sr-only"
        autoComplete="off"
      />

      <div className="flex items-center justify-center gap-2.5">
        {slots.map((d, i) => {
          const filled = d !== '';
          const active = value.length === i;

          return (
            <div
              key={i}
              className={`
                w-12 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 font-mono text-lg font-bold
                ${active
                  ? 'bg-white dark:bg-[#181410] border-2 border-[#C19A6B] shadow-[0_0_15px_rgba(193,154,107,0.5)] scale-[1.06]'
                  : filled
                    ? 'bg-white dark:bg-[#1c1612] border-2 border-[#C19A6B]/80 text-[#2c1d11] dark:text-[#f5e6d3] shadow-sm'
                    : 'bg-white/90 dark:bg-white/10 border-2 border-[#C19A6B]/40 text-slate-400 shadow-sm'
                }
              `}
            >
              {filled ? (
                <div className="w-3.5 h-3.5 rounded-full bg-[#C19A6B] shadow-sm" />
              ) : active ? (
                <div className="w-0.5 h-6 bg-[#C19A6B] rounded-full animate-pulse shadow-sm" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
