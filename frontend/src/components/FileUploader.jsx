// components/FileUploader.jsx
import { useState, useRef, useCallback } from 'react';

const SUPPORTED = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/tiff': 'image',
  'image/bmp': 'image',
};

const FILE_ICONS = { pdf: '📄', docx: '📝', image: '🖼️' };

export default function FileUploader({ onAnalyze, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    const type = SUPPORTED[file.type];
    if (!type) {
      alert('Unsupported file type. Please upload PDF, DOCX, or an image.');
      return;
    }
    setSelectedFile({ file, type });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async () => {
    if (!selectedFile || isLoading) return;
    try {
      setProgress(10);
      const fileBase64 = await toBase64(selectedFile.file);
      setProgress(30);
      await onAnalyze({
        fileName: selectedFile.file.name,
        fileType: selectedFile.type,
        fileBase64,
      });
      setProgress(100);
    } catch (err) {
      setProgress(0);
      console.error(err);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div style={{
          width: 40, height: 40,
          background: 'var(--accent-glow)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '18px' }}>📂</span>
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Upload Document
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PDF · DOCX · Images</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'active' : ''}`}
        style={{ padding: '32px 24px', textAlign: 'center', cursor: 'pointer' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.tiff,.bmp"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {selectedFile ? (
          <div className="animate-fade-in space-y-2">
            <div style={{ fontSize: '40px' }} className="animate-float">
              {FILE_ICONS[selectedFile.type]}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
              {selectedFile.file.name}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {formatSize(selectedFile.file.size)} · {selectedFile.type.toUpperCase()}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setProgress(0); }}
              style={{
                marginTop: '8px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: '8px', color: '#fda4af', padding: '4px 12px', fontSize: '12px', cursor: 'pointer'
              }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div style={{ fontSize: '40px', opacity: 0.5 }}>☁️</div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
                Drop your document here
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                or <span style={{ color: 'var(--accent-light)' }}>browse to upload</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['PDF', 'DOCX', 'JPG', 'PNG'].map(ext => (
                <span key={ext} style={{
                  padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                  background: 'var(--accent-glow)', color: 'var(--accent-light)',
                  border: '1px solid var(--border)',
                }}>{ext}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isLoading && progress > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Analysing with AI...</span>
            <span style={{ fontSize: '12px', color: 'var(--accent-light)' }}>{progress}%</span>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '4px', height: '4px' }}>
            <div className="progress-bar animate-pulse-glow" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        className="btn-primary"
        style={{ width: '100%', padding: '12px', fontSize: '14px' }}
        onClick={handleSubmit}
        disabled={!selectedFile || isLoading}
      >
        {isLoading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="animate-spin" style={{
              width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white', borderRadius: '50%', display: 'inline-block'
            }} />
            Processing...
          </span>
        ) : '🚀 Analyse Document'}
      </button>
    </div>
  );
}
