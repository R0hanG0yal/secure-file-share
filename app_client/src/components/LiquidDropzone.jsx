import React, { useState } from 'react';
import { Upload, File, FileText, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function LiquidDropzone({ onSendSuccess }) {
  const [receiver, setReceiver] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSend = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!receiver.trim()) { setError('Enter recipient username.'); return; }
    if (activeTab === 'file' && selectedFiles.length === 0) { setError('Select at least one file.'); return; }
    if (activeTab === 'text' && !textContent.trim()) { setError('Enter text content.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('receiver', receiver.trim());
      if (activeTab === 'text') {
        formData.append('isText', 'true');
        formData.append('textContent', textContent.trim());
      } else {
        selectedFiles.forEach(file => formData.append('files', file));
      }

      const res = await api.post('/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(res.data.message || 'File sent successfully!');
      setSelectedFiles([]); setTextContent('');
      if (onSendSuccess) onSendSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-glass-strong rounded-3xl p-6 sm:p-8 space-y-6 glass-rim-highlight">
      
      {/* Title & Mode Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
          <h2 className="text-sm font-extrabold uppercase tracking-wider theme-text-heading">DIRECT SECURE TRANSFER</h2>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'file' ? 'btn-primary-theme shadow-md' : 'btn-glass-subtle'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'text' ? 'btn-primary-theme shadow-md' : 'btn-glass-subtle'
            }`}
          >
            Text Message
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-600 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-5">
        {/* Recipient Field */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider theme-text-heading mb-2">
            RECIPIENT USERNAME
          </label>
          <input
            type="text"
            required
            placeholder="Enter username (e.g. Alex)"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full theme-input px-4 py-3.5 rounded-2xl text-xs font-bold"
          />
        </div>

        {/* Liquid Mercury Dropzone Box */}
        {activeTab === 'file' ? (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length > 0) {
                  setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                }
              }}
              onClick={() => document.getElementById('theme-file-input').click()}
              className={`liquid-dropzone-box rounded-2xl py-10 px-6 text-center cursor-pointer ${
                isDragging ? 'drag-active' : ''
              }`}
            >
              <div className="flex flex-col items-center relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-white/20 border border-white/40 flex items-center justify-center mb-3.5 shadow-lg backdrop-blur-md">
                  <Upload className="w-7 h-7 stroke-[2.5]" style={{ color: 'var(--accent-color)' }} />
                </div>
                <h3 className="text-sm font-black tracking-wide uppercase theme-text-heading drop-shadow-sm">
                  DRAG & DROP FILES OR TAP TO BROWSE
                </h3>
                <p className="text-xs font-bold theme-text-body mt-1.5 drop-shadow-sm">
                  Supports any file type & size • Unlimited transfers
                </p>
                <input id="theme-file-input" type="file" multiple onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/20 border border-white/30 text-xs font-bold theme-text-heading">
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
                      <span className="truncate">{file.name}</span>
                      <span className="text-[10px] theme-text-muted">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="theme-text-muted hover:text-rose-500 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              rows={5}
              required
              placeholder="Type message here... (will be automatically converted to .txt file before sending)"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full theme-input p-4 rounded-2xl text-xs font-bold resize-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
        >
          <span>{loading ? 'Transmitting...' : 'Send File Now'}</span>
        </button>
      </form>

    </div>
  );
}
