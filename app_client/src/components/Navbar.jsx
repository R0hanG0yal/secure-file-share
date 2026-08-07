import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Send, Inbox, Zap, LogOut } from 'lucide-react';
import LogoIcon from './LogoIcon';

export default function Navbar({ username, unreadCount, onLogout, isDarkMode, onToggleTheme }) {
  const location = useLocation();

  const initials = username
    ? username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  // Environment-aware URL for Classic P2P Site (Localhost or Production Domain)
  const classicP2pUrl = import.meta.env.VITE_CLASSIC_P2P_URL || 'http://localhost:8000/p2p';

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-4 mt-3">
        <nav className="app-glass-strong rounded-2xl px-5 py-3.5 flex items-center justify-between max-w-6xl mx-auto glass-rim-highlight">

          {/* Logo — DoShare DDA Metallic Logo */}
          <Link to="/" className="flex items-center group">
            <LogoIcon />
          </Link>

          {/* Direct Navigation Links */}
          {username && (
            <div className="flex items-center gap-2">
              <Link
                to="/send"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  location.pathname === '/send' || location.pathname === '/'
                    ? 'btn-primary-theme shadow-md'
                    : 'btn-glass-subtle'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Link>

              <Link
                to="/inbox"
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  location.pathname === '/inbox'
                    ? 'btn-primary-theme shadow-md'
                    : 'btn-glass-subtle'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Inbox</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm ml-0.5">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Environment-Aware Direct Switch to Classic P2P Site */}
              <a
                href={classicP2pUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl btn-glass-subtle text-xs font-extrabold transition-all hover:scale-105"
                title="Open Classic P2P Direct Website"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Classic P2P Site</span>
              </a>
            </div>
          )}

          {/* Right Actions: Theme Toggle + User Badge + Logout */}
          <div className="flex items-center gap-3">
            
            {/* Theme Switcher Button */}
            <button
              onClick={onToggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl btn-glass-subtle text-xs font-extrabold transition-all"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {username ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl btn-glass-subtle text-xs font-extrabold">
                  <div className="w-5 h-5 rounded-full bg-[#C19A6B] text-white font-black text-[10px] flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="theme-text-heading">{username}</span>
                </div>

                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-2.5 rounded-xl btn-glass-subtle hover:text-rose-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3.5 py-2 text-xs font-extrabold hover:underline theme-text-heading">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 text-xs font-extrabold btn-primary-theme rounded-xl">
                  Get Started
                </Link>
              </div>
            )}

          </div>

        </nav>
      </div>
    </header>
  );
}
