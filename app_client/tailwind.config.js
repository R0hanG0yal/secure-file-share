/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#d1d8e0',
        card: '#ffffff',
        accent: {
          DEFAULT: '#C19A6B',
          light: '#d4af7e',
          dim: 'rgba(193, 154, 107, 0.15)',
          glow: 'rgba(193, 154, 107, 0.35)',
        },
        textPrimary: '#2d3748',
        textSecondary: '#4a5568',
        textMuted: '#718096',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        neomorphic: '-12px -12px 24px rgba(255, 255, 255, 0.9), 12px 12px 24px rgba(0, 0, 0, 0.05), inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(0, 0, 0, 0.01)',
        insetSoft: 'inset 4px 4px 8px rgba(0, 0, 0, 0.06), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
        btnSoft: '-4px -4px 10px rgba(255, 255, 255, 0.9), 4px 4px 10px rgba(193, 154, 107, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
