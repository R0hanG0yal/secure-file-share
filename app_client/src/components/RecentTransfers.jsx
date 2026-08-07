import React, { useEffect, useState, useCallback } from 'react';
import { Download, Lock } from 'lucide-react';
import api from '../services/api';
import io from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function RecentTransfers({ username, setUnreadCount }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await api.get('/inbox');
      setItems(res.data.files || []);
      if (setUnreadCount) setUnreadCount(res.data.unreadCount ?? 0);
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
    return () => socket.disconnect();
  }, [fetchInbox]);

  const getCardStyle = (filename, index) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || index === 0) return { label: 'PDF', class: 'card-mahogany' };
    if (['doc', 'docx'].includes(ext) || index === 1) return { label: 'DOCX', class: 'card-silver' };
    return { label: ext?.toUpperCase() || 'ZIP', class: 'card-gold' };
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${(s / 3600).toFixed(1)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  const demoItems = [
    { _id: 'demo1', originalName: 'Financial_Report.pdf', size: 1258291, sender: 'Anna Wang', createdAt: new Date(Date.now() - 5400000), fileUrl: '#' },
    { _id: 'demo2', originalName: 'Financial_Report.docx', size: 1258291, sender: 'Anna Wang', createdAt: new Date(Date.now() - 5400000), fileUrl: '#' },
    { _id: 'demo3', originalName: 'Financial_Report.zip', size: 1258291, sender: 'Anna Wang', createdAt: new Date(Date.now() - 5400000), fileUrl: '#' }
  ];

  const displayItems = items.length > 0 ? items : demoItems;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold uppercase tracking-widest theme-text-heading">RECENT TRANSFERS</h2>
      </div>

      {loading ? (
        <div className="app-glass-card rounded-2xl p-8 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin theme-text-heading" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayItems.map((item, idx) => {
            const cardStyle = getCardStyle(item.originalName, idx);
            const sizeMb = (item.size / (1024 * 1024)).toFixed(1);

            return (
              <div
                key={item._id}
                className={`rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xl transition-transform hover:-translate-y-1 ${cardStyle.class}`}
              >
                {/* Header: File Badge + Title + Size */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 font-black text-[11px] tracking-wider flex items-center justify-center shrink-0 shadow-md">
                    {cardStyle.label}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <p className="text-[10px] font-bold opacity-80 mt-0.5">
                      {sizeMb} MB
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold opacity-90">
                    <span>Transferring 68%</span>
                    <span>{timeAgo(item.createdAt)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#e6c594] to-[#c19a6b] rounded-full w-[68%]" />
                  </div>
                </div>

                {/* Footer: Recipient + E2EE Tag */}
                <div className="flex items-center justify-between pt-1 border-t border-white/15 text-[11px]">
                  <div className="font-bold truncate max-w-[120px] opacity-90">
                    Recipient <span className="font-black">{item.sender || 'Anna Wang'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-md bg-white/20 border border-white/30 text-[10px] font-black flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>E2EE</span>
                    </div>

                    {item.fileUrl && item.fileUrl !== '#' && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
