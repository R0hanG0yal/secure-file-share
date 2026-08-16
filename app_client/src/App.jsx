import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AmbientOrbs from './components/AmbientOrbs';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPin from './pages/ResetPin';
import SendScreen from './pages/SendScreen';
import InboxScreen from './pages/InboxScreen';
import { initSocket, disconnectSocket } from './services/socket';
import { detectStoredIdentity, clearStoredIdentity, persistFullIdentity } from './services/identity';
import api from './services/api';

export default function App() {
  const [username, setUsername] = useState(
    localStorage.getItem('doshare_user') || localStorage.getItem('identishare_user') || ''
  );
  const [uuid, setUuid] = useState(
    localStorage.getItem('doshare_device_uuid') || localStorage.getItem('identishare_device_uuid') || ''
  );
  const [unreadCount, setUnreadCount] = useState(0);

  // Theme Management: Light Mode vs Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('doshare_theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark', 'dark-theme');
      root.classList.remove('light-theme');
      localStorage.setItem('doshare_theme', 'dark');
    } else {
      root.classList.remove('dark', 'dark-theme');
      root.classList.add('light-theme');
      localStorage.setItem('doshare_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Auto-restore & verify username session on boot/deploy
  useEffect(() => {
    async function verifyUserSession() {
      try {
        const stored = await detectStoredIdentity();
        if (stored?.token) {
          const res = await api.get('/me');
          if (res.data?.authenticated && res.data?.username) {
            setUsername(res.data.username);
            if (res.data.uuid) setUuid(res.data.uuid);
            await persistFullIdentity(stored.token, res.data.username, res.data.uuid || stored.uuid);
          }
        }
      } catch (err) {
        // Token invalid, clear stale credentials
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      }
    }

    verifyUserSession();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('Service Worker registration failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (username) {
      const socket = initSocket(username);

      socket.on('new_file_received', (data) => {
        setUnreadCount(prev => prev + (data.messages ? data.messages.length : 1));
      });

      socket.on('file_deleted', () => {
        // Refresh unread count on deletion
        api.get('/inbox').then(res => {
          if (res.data && res.data.unreadCount !== undefined) {
            setUnreadCount(res.data.unreadCount);
          }
        }).catch(() => {});
      });

      api.get('/inbox').then(res => {
        if (res.data && res.data.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      }).catch(() => {});
    } else {
      disconnectSocket();
    }
  }, [username]);

  const handleLoginSuccess = (user, deviceUuid) => {
    setUsername(user);
    if (deviceUuid) setUuid(deviceUuid);
  };

  const handleLogout = async () => {
    await clearStoredIdentity();
    setUsername('');
    setUuid('');
    setUnreadCount(0);
    disconnectSocket();
  };

  return (
    <Router>
      <div className="min-h-screen relative flex flex-col font-sans">
        <AmbientOrbs isDarkMode={isDarkMode} />

        <Navbar
          username={username}
          unreadCount={unreadCount}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />

        {/* Main Content Area with mobile safe padding for bottom bar */}
        <main className={`flex-1 z-10 ${username ? 'pb-24 md:pb-8' : 'pb-8'}`}>
          <Routes>
            <Route path="/" element={<Home onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/reset-pin" element={<ResetPin onLoginSuccess={handleLoginSuccess} />} />

            <Route
              path="/send"
              element={
                username ? (
                  <SendScreen username={username} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route
              path="/inbox"
              element={
                username ? (
                  <InboxScreen
                    username={username}
                    setUnreadCount={setUnreadCount}
                  />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            <Route path="/dashboard" element={<Navigate to={username ? "/send" : "/login"} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="z-10 py-4 text-center text-[11px] font-bold theme-text-muted tracking-wider hidden md:block">
          <p>DoShare — Secure File & Message Transfer</p>
        </footer>
      </div>
    </Router>
  );
}
