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
import api from './services/api';

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem('doshare_user') || localStorage.getItem('identishare_user') || '');
  const [uuid, setUuid] = useState(localStorage.getItem('doshare_device_uuid') || localStorage.getItem('identishare_device_uuid') || '');
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

  const handleLogout = () => {
    localStorage.removeItem('doshare_token');
    localStorage.removeItem('doshare_user');
    localStorage.removeItem('identishare_token');
    localStorage.removeItem('identishare_user');
    setUsername('');
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

        <main className="flex-1 z-10">
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

        <footer className="z-10 py-6 text-center text-xs font-semibold theme-text-muted tracking-wider">
          <p>DoShare — Dageroz Digital Agency</p>
        </footer>
      </div>
    </Router>
  );
}
