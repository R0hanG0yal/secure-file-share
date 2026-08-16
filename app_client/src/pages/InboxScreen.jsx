import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import io from 'socket.io-client';
import { Inbox, Download, File, User, Clock, ChevronDown, Eye, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function InboxScreen({ username, setUnreadCount, hideHeader }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionNotice, setActionNotice] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

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
    const socket = io(API, { auth: { token: localStorage.getItem('doshare_token') || localStorage.getItem('identishare_token') } });
    socket.on('new_file', () => fetchInbox());
    socket.on('new_file_received', () => fetchInbox());
    socket.on('file_deleted', ({ messageId }) => {
      setItems(prev => prev.filter(i => i._id !== messageId));
    });
    return () => socket.disconnect();
  }, [fetchInbox]);

  const showNotification = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 4000);
  };

  // Delete message manually or after download
  const handleDelete = async (id, fileName) => {
    try {
      await api.delete(`/messages/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
      showNotification(`"${fileName}" deleted from transfer history.`);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Download file and automatically delete it from history for security & privacy
  const handleDownloadAndDelete = async (item) => {
    setDownloadingId(item._id);
    const displayName = item.fileName || item.originalName || 'Received_File';

    try {
      // 1. Download file via Blob to ensure direct download on mobile and desktop
      const response = await fetch(item.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = displayName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 2. Automatically delete from server history after download
      await api.delete(`/messages/${item._id}`);
      setItems(prev => prev.filter(i => i._id !== item._id));

      showNotification(`"${displayName}" downloaded & removed from history.`);
    } catch (err) {
      console.warn('Direct blob download fallback to link:', err);
      // Fallback: trigger standard link download
      const a = document.createElement('a');
      a.href = item.fileUrl;
      a.download = displayName;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Delete from history
      await api.delete(`/messages/${item._id}`).catch(() => {});
      setItems(prev => prev.filter(i => i._id !== item._id));
      showNotification(`"${displayName}" downloaded & removed from history.`);
    } finally {
      setDownloadingId(null);
    }
  };

  const timeAgo = (date) => {
    if (!date) return 'Just now';
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className={`space-y-4 ${hideHeader ? '' : 'max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8'}`}>

      {/* Header (when not embedded inside SendScreen) */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-color)' }} />
            <h2 className="text-xs sm:text-base font-extrabold uppercase tracking-wider theme-text-heading">
              Inbox — Received Transfers
            </h2>
          </div>
          {items.length > 0 && (
            <span className="text-[11px] sm:text-xs font-black px-2.5 sm:px-3.5 py-1 rounded-full bg-white/20 border border-white/30 theme-text-heading">
              {items.length} Files
            </span>
          )}
        </div>
      )}

      {/* Action Toast Notice */}
      {actionNotice && (
        <div
          className="p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 anim-fade"
          style={{
            background: 'rgba(193, 154, 107, 0.15)',
            borderColor: 'rgba(193, 154, 107, 0.4)',
            color: 'var(--text-heading)'
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
          <span>{actionNotice}</span>
        </div>
      )}

      {loading ? (
        <div className="app-glass-card rounded-2xl p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin theme-text-heading" />
        </div>
      ) : items.length === 0 ? (
        <div className="app-glass-card rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center glass-rim-highlight">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/30 dark:bg-white/20 border border-white/40 flex items-center justify-center mb-3 shadow-md">
            <Inbox className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: 'var(--accent-color)' }} />
          </div>
          <h3 className="text-xs sm:text-sm font-black theme-text-heading">No files in your inbox</h3>
          <p className="text-[11px] sm:text-xs font-bold theme-text-body mt-1 max-w-sm">
            Files sent to <span className="font-extrabold underline theme-text-heading">{username}</span> will appear here in real-time and will automatically delete after download.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider theme-text-heading flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
              <span>Received Transfers ({items.length})</span>
            </h3>
            <span className="text-[10px] theme-text-muted font-bold">
              Auto-deletes on download
            </span>
          </div>

          {items.map((item) => {
            const isExpanded = expandedId === item._id;
            const displayName = item.fileName || item.originalName || 'Received_File.txt';
            const isTxt = displayName.endsWith('.txt') || item.isText;
            const isDownloading = downloadingId === item._id;

            return (
              <div
                key={item._id}
                className="app-glass-card rounded-2xl overflow-hidden transition-all duration-300"
              >
                <div
                  className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/30 dark:bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
                    <File className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-color)' }} />
                  </div>

                  <div className="flex-1 min-w-0 mr-1">
                    <p className="text-xs font-bold theme-text-heading truncate">{displayName}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-[11px] theme-text-body font-bold">
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">From: {item.sender}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(item.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quick Action: Trash button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item._id, displayName);
                    }}
                    title="Delete from history"
                    className="p-1.5 rounded-lg theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronDown className={`w-4 h-4 theme-text-heading transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3.5 sm:pb-4 pt-0 border-t border-white/20 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3">

                      {/* Download & Auto-Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadAndDelete(item)}
                        disabled={isDownloading}
                        className="flex-1 py-2.5 rounded-xl btn-primary-theme text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                      </button>

                      {isTxt && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-4 rounded-xl btn-glass-subtle text-xs font-bold flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview Text</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(item._id, displayName)}
                        className="py-2.5 px-4 rounded-xl btn-glass-subtle text-xs font-bold text-rose-500 hover:bg-rose-500/15 flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>

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
