import React, { useEffect, useState, useCallback } from 'react';
import { Download, Lock, Trash2 } from 'lucide-react';
import api from '../services/api';
import io from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RecentTransfers({ username, setUnreadCount }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.get('/inbox');
      setItems(res.data.messages || res.data.files || []);
      if (setUnreadCount) setUnreadCount(res.data.unreadCount ?? 0);
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

  const handleDownloadAndDelete = async (item) => {
    const displayName = item.fileName || item.originalName || 'File';
    try {
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

      await api.delete(`/messages/${item._id}`);
      setItems(prev => prev.filter(i => i._id !== item._id));
    } catch (err) {
      const a = document.createElement('a');
      a.href = item.fileUrl;
      a.download = displayName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await api.delete(`/messages/${item._id}`).catch(() => {});
      setItems(prev => prev.filter(i => i._id !== item._id));
    }
  };

  const getCardStyle = (filename, index) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || index === 0) return { label: 'PDF', class: 'card-mahogany' };
    if (['doc', 'docx'].includes(ext) || index === 1) return { label: 'DOCX', class: 'card-silver' };
    return { label: ext?.toUpperCase() || 'FILE', class: 'card-gold' };
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${(s / 3600).toFixed(1)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  if (loading || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest theme-text-heading">
          ACTIVE TRANSFERS
        </h2>
        <span className="text-[10px] theme-text-muted font-bold">Auto-deletes on download</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {items.map((item, idx) => {
          const cardStyle = getCardStyle(item.fileName || item.originalName, idx);
          const displayName = item.fileName || item.originalName || 'Received_File';

          return (
            <div
              key={item._id}
              className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3 shadow-xl transition-transform hover:-translate-y-1 ${cardStyle.class}`}
            >
              {/* Header: File Badge + Title */}
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 font-black text-[10px] tracking-wider flex items-center justify-center shrink-0 shadow-md">
                  {cardStyle.label}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" title={displayName}>
                    {displayName}
                  </p>
                  <p className="text-[10px] font-bold opacity-80 mt-0.5">
                    From: {item.sender}
                  </p>
                </div>
              </div>

              {/* Footer: Recipient + E2EE Tag + Download Button */}
              <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[11px]">
                <div className="flex items-center gap-1">
                  <div className="px-1.5 py-0.5 rounded-md bg-white/20 border border-white/30 text-[9px] font-black flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>E2EE</span>
                  </div>
                  <span className="text-[10px] opacity-80">{timeAgo(item.createdAt)}</span>
                </div>

                {item.fileUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownloadAndDelete(item)}
                    className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-[10px] font-bold flex items-center gap-1"
                    title="Download & remove from history"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
