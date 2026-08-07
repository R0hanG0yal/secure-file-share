import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import io from 'socket.io-client';
import { Inbox, Download, File, User, Clock, ChevronDown, Eye, ShieldCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InboxScreen({ username, setUnreadCount, hideHeader }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.get('/inbox');
      const filesList = res.data.messages || res.data.files || [];
      setItems(filesList);

      // Auto-clear unread badge once inbox is viewed
      await api.post('/mark-read').catch(() => {});
      if (setUnreadCount) setUnreadCount(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchInbox();
    const socket = io(API, { auth: { token: localStorage.getItem('identishare_token') } });
    socket.on('new_file', () => fetchInbox());
    socket.on('new_file_received', () => fetchInbox());
    return () => socket.disconnect();
  }, [fetchInbox]);

  const timeAgo = (date) => {
    if (!date) return 'Just now';
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className={`space-y-4 ${hideHeader ? '' : 'max-w-4xl mx-auto px-4 py-8'}`}>
      
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
            <h2 className="text-base font-extrabold uppercase tracking-wider theme-text-heading">Inbox — Received Transfers</h2>
          </div>
          {items.length > 0 && (
            <span className="text-xs font-black px-3.5 py-1 rounded-full bg-white/20 border border-white/30 theme-text-heading">
              {items.length} Files
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="app-glass-card rounded-2xl p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin theme-text-heading" />
        </div>
      ) : items.length === 0 ? (
        <div className="app-glass-card rounded-3xl p-10 flex flex-col items-center justify-center text-center glass-rim-highlight">
          <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-white/20 border border-white/40 flex items-center justify-center mb-3 shadow-md">
            <Inbox className="w-7 h-7" style={{ color: 'var(--accent-color)' }} />
          </div>
          <h3 className="text-sm font-black theme-text-heading">No files in your inbox yet</h3>
          <p className="text-xs font-bold theme-text-body mt-1 max-w-sm">
            Files sent to your username <span className="font-extrabold underline theme-text-heading">{username}</span> will automatically appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider theme-text-heading mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Received Transfers ({items.length})</span>
          </h3>

          {items.map((item) => {
            const isExpanded = expandedId === item._id;
            const displayName = item.fileName || item.originalName || 'Received_File.txt';
            const isTxt = displayName.endsWith('.txt') || item.isText;

            return (
              <div
                key={item._id}
                className="app-glass-card rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div
                  className="p-4 flex items-center gap-3.5 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/30 dark:bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
                    <File className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold theme-text-heading truncate">{displayName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] theme-text-body font-bold">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>From: {item.sender}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(item.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  <ChevronDown className={`w-4 h-4 theme-text-heading transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-white/20">
                    <div className="flex gap-3 pt-3">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="flex-1 py-2.5 rounded-xl btn-primary-theme text-xs font-bold flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download File</span>
                      </a>
                      {isTxt && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 rounded-xl btn-glass-subtle text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Text</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
