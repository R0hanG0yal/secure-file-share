import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Send, Inbox, Zap, LogOut, User } from 'lucide-react';
import LogoIcon from './LogoIcon';

export default function Navbar({ username, unreadCount, onLogout, isDarkMode, onToggleTheme }) {
  const location = useLocation();

  const initials = username
    ? username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  // Environment-aware URL for Classic P2P Site (Localhost or Production Domain)
  const classicP2pUrl = import.meta.env.VITE_CLASSIC_P2P_URL || 'http://localhost:8000/p2p';

  return (
    <>
      {/* ── Top Header Navigation ── */}
      <header className="sticky top-0 z-50">
        <div className="mx-2.5 sm:mx-4 mt-2 sm:mt-3">
          <nav className="app-glass-strong rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between max-w-6xl mx-auto glass-rim-highlight">

            {/* Logo — Responsive DDA Metallic Logo */}
            <Link to="/" className="flex items-center group shrink-0">
              <LogoIcon />
            </Link>

            {/* Desktop Navigation Links (Hidden on mobile, shown on md+) */}
            {username && (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/send"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    location.pathname === '/send' || location.pathname === '/'
                      ? 'btn-primary-theme shadow-md scale-[1.02]'
                      : 'btn-glass-subtle hover:scale-[1.02]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </Link>

                <Link
                  to="/inbox"
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    location.pathname === '/inbox'
                      ? 'btn-primary-theme shadow-md scale-[1.02]'
                      : 'btn-glass-subtle hover:scale-[1.02]'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Inbox</span>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm ml-0.5 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Classic P2P Site Link */}
                <a
                  href={classicP2pUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-glass-subtle text-xs font-extrabold transition-all hover:scale-105"
                  title="Open Classic P2P Direct Website"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Classic P2P</span>
                </a>
              </div>
            )}

            {/* Right Actions: Theme Toggle + User Badge + Logout */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

              {/* Theme Switcher Button (Icon on mobile, icon+label on desktop) */}
              <button
                onClick={onToggleTheme}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl btn-glass-subtle text-xs font-extrabold transition-all"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-slate-700 shrink-0" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              {username ? (
                <>
                  {/* User Profile Badge — ALWAYS VISIBLE ON MOBILE & DESKTOP */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl btn-glass-subtle text-xs font-extrabold max-w-[130px] sm:max-w-[180px]"
                    title={`Logged in as ${username}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#C19A6B] text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <span className="theme-text-heading truncate text-[11px] sm:text-xs">
                      {username}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    title="Log Out"
                    className="p-2 sm:p-2.5 rounded-xl btn-glass-subtle hover:text-rose-500 transition-colors"
                    aria-label="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Link
                    to="/login"
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-extrabold hover:underline theme-text-heading"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-extrabold btn-primary-theme rounded-xl shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}

            </div>

          </nav>
        </div>
      </header>

      {/* ── Mobile Floating Glass Bottom Navigation Bar (Visible only on mobile when logged in) ── */}
      {username && (
        <div className="fixed bottom-3 inset-x-0 z-50 md:hidden px-4 pointer-events-none">
          <div className="max-w-md mx-auto app-glass-strong rounded-2xl p-1.5 flex items-center justify-around shadow-2xl border border-white/20 dark:border-white/10 glass-rim-highlight pointer-events-auto backdrop-blur-xl">

            {/* Send Tab */}
            <Link
              to="/send"
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                location.pathname === '/send' || location.pathname === '/'
                  ? 'btn-primary-theme shadow-md'
                  : 'theme-text-body hover:bg-white/10'
              }`}
            >
              <Send className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-tight">Send</span>
            </Link>

            {/* Inbox Tab with Glowing Badge */}
            <Link
              to="/inbox"
              className={`flex-1 relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
                location.pathname === '/inbox'
                  ? 'btn-primary-theme shadow-md'
                  : 'theme-text-body hover:bg-white/10'
              }`}
            >
              <div className="relative">
                <Inbox className="w-4 h-4 mb-0.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-black min-w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-tight">Inbox</span>
            </Link>

            {/* Classic P2P Web Tab */}
            <a
              href={classicP2pUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl theme-text-body hover:bg-white/10 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-500 mb-0.5" />
              <span className="text-[10px] font-extrabold uppercase tracking-tight">Classic P2P</span>
            </a>

          </div>
        </div>
      )}
    </>
  );
}
