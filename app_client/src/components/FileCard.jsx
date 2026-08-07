import React from 'react';
import { Download, FileText, File, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';

export default function FileCard({ msg, onDownloadSuccess }) {
  const isTxtFile = msg.isText || msg.fileName.endsWith('.txt');

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = msg.fileUrl;
      link.download = msg.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (!msg.delivered) {
        await api.post(`/mark-delivered/${msg._id}`);
        if (onDownloadSuccess) onDownloadSuccess(msg._id);
      }
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const formattedDate = new Date(msg.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="apple-glass rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${isTxtFile ? 'bg-amber-500/15 text-amber-700' : 'bg-blue-500/15 text-blue-700'}`}>
          {isTxtFile ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-[#1d1d1f] truncate max-w-[220px] sm:max-w-md" title={msg.fileName}>
              {msg.fileName}
            </h4>
            {msg.delivered ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Received
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                <Clock className="w-3 h-3 text-amber-600" /> New
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#86868b] mt-1 font-medium">
            <span>From: <strong className="text-[#1d1d1f] font-bold">@{msg.sender}</strong></span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="px-5 py-2.5 apple-btn-primary rounded-full font-bold text-xs flex items-center justify-center gap-2 shadow-sm shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download</span>
      </button>
    </div>
  );
}
