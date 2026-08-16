import React, { useState, useEffect } from 'react';
import { Upload, File, FileText, X, CheckCircle2, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import api from '../services/api';

export default function LiquidDropzone({ onSendSuccess }) {
  const [receiver, setReceiver] = useState('');
  const [activeTab, setActiveTab] = useState('file');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Anti-spam cooldown timer countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      const incoming = Array.from(e.target.files);
      // Limit to max 10 files
      setSelectedFiles(prev => {
        const combined = [...prev, ...incoming];
        if (combined.length > 10) {
          setError('Maximum 10 files allowed per transfer.');
          return combined.slice(0, 10);
        }
        return combined;
      });
    }
  };

  const removeFile = (idx) => setSelectedFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (cooldown > 0) {
      setError(`Anti-spam protection: Please wait ${cooldown}s before sending again.`);
      return;
    }

    if (!receiver.trim()) {
      setError('Please enter the recipient username.');
      return;
    }

    if (activeTab === 'file' && selectedFiles.length === 0) {
      setError('Please select at least one file to transmit.');
      return;
    }

    if (activeTab === 'text' && !textContent.trim()) {
      setError('Please enter message text content.');
      return;
    }

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

      const res = await api.post('/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(res.data.message || 'File(s) transmitted securely!');
      setSelectedFiles([]);
      setTextContent('');
      // Set 3-second cooldown to prevent spamming
      setCooldown(3);

      if (onSendSuccess) onSendSuccess();
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response?.data?.retryAfter || 5;
        setCooldown(retryAfter);
        setError(err.response?.data?.error || `Too many requests. Please wait ${retryAfter}s.`);
      } else {
        setError(err.response?.data?.error || 'Transmission failed. Please check recipient.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-glass-strong rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6 glass-rim-highlight">

      {/* Header: Title & Mode Segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-color)' }} />
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider theme-text-heading">
            DIRECT SECURE TRANSFER
          </h2>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/5 dark:bg-white/5 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all ${
              activeTab === 'file' ? 'btn-primary-theme shadow-sm' : 'theme-text-body hover:bg-white/10'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition-all ${
              activeTab === 'text' ? 'btn-primary-theme shadow-sm' : 'theme-text-body hover:bg-white/10'
            }`}
          >
            Text Message
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 sm:p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2"
          style={{
            background: 'rgba(225, 29, 72, 0.1)',
            borderColor: 'rgba(225, 29, 72, 0.3)',
            color: 'var(--text-heading)'
          }}>
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="p-3 sm:p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2"
          style={{
            background: 'rgba(193, 154, 107, 0.15)',
            borderColor: 'rgba(193, 154, 107, 0.4)',
            color: 'var(--text-heading)'
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4 sm:space-y-5">
        {/* Recipient Field */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider theme-text-heading mb-1.5">
            RECIPIENT USERNAME
          </label>
          <input
            type="text"
            required
            placeholder="Enter destination username (e.g. Alex)"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            className="w-full theme-input px-3.5 sm:px-4 py-3 rounded-2xl text-xs font-bold"
          />
        </div>

        {/* Dropzone Box */}
        {activeTab === 'file' ? (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.length > 0) {
                  const incoming = Array.from(e.dataTransfer.files);
                  setSelectedFiles(prev => [...prev, ...incoming].slice(0, 10));
                }
              }}
              onClick={() => document.getElementById('theme-file-input').click()}
              className={`liquid-dropzone-box rounded-2xl py-8 sm:py-10 px-4 sm:px-6 text-center cursor-pointer ${
                isDragging ? 'drag-active' : ''
              }`}
            >
              <div className="flex flex-col items-center relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/30 dark:bg-white/20 border border-white/40 flex items-center justify-center mb-3 shadow-lg backdrop-blur-md">
                  <Upload className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" style={{ color: 'var(--accent-color)' }} />
                </div>
                <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase theme-text-heading drop-shadow-sm">
                  DRAG & DROP OR TAP TO BROWSE
                </h3>
                <p className="text-[11px] sm:text-xs font-bold theme-text-body mt-1 drop-shadow-sm">
                  All file formats supported • Max 100MB per file
                </p>
                <input id="theme-file-input" type="file" multiple onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/20 border border-white/30 text-xs font-bold theme-text-heading">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <File className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-color)' }} />
                      <span className="truncate">{file.name}</span>
                      <span className="text-[10px] theme-text-muted shrink-0">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="theme-text-muted hover:text-rose-500 p-1 shrink-0"
                      aria-label="Remove file"
                    >
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
              rows={4}
              required
              placeholder="Type message here... (will be automatically converted to .txt file before transmitting)"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full theme-input p-3.5 sm:p-4 rounded-2xl text-xs font-bold resize-none"
            />
          </div>
        )}

        {/* Submit Button with anti-spam cooldown indicator */}
        <button
          type="submit"
          disabled={loading || cooldown > 0}
          className="w-full py-3.5 sm:py-4 rounded-2xl btn-primary-theme text-xs uppercase tracking-wider font-black flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <span>Transmitting...</span>
          ) : cooldown > 0 ? (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Cooldown ({cooldown}s)
            </span>
          ) : (
            <span>Send File Now</span>
          )}
        </button>
      </form>

    </div>
  );
}
