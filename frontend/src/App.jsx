// App.jsx — Main application shell
import { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import DocumentAnalysis from './components/DocumentAnalysis';
import ChatInterface from './components/ChatInterface';
import { analyzeDocument, checkHealth } from './api/client';
import './index.css';

export default function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // 'ok' | 'error' | 'checking'
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'chat'

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then(() => setServerStatus('ok'))
      .catch(() => setServerStatus('error'));
  }, []);

  const handleAnalyze = async ({ fileName, fileType, fileBase64 }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setActiveTab('analysis');
    try {
      const data = await analyzeDocument({ fileName, fileType, fileBase64 });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-grid" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background blobs */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,8,22,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--gradient-primary)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
          }}>
            🧠
          </div>
          <div>
            <h1 className="glow-text" style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              DocAnalyse AI
            </h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Powered by Gemini · RAG · spaCy
            </p>
          </div>
        </div>

        {/* Server status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px',
            background: serverStatus === 'ok'
              ? 'rgba(34,197,94,0.1)'
              : serverStatus === 'error'
              ? 'rgba(244,63,94,0.1)'
              : 'rgba(148,163,184,0.1)',
            border: `1px solid ${serverStatus === 'ok' ? 'rgba(34,197,94,0.3)' : serverStatus === 'error' ? 'rgba(244,63,94,0.3)' : 'var(--border)'}`,
            borderRadius: '20px',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: serverStatus === 'ok' ? '#22c55e' : serverStatus === 'error' ? '#f43f5e' : '#94a3b8',
              boxShadow: serverStatus === 'ok' ? '0 0 6px #22c55e' : 'none',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: serverStatus === 'ok' ? '#86efac' : serverStatus === 'error' ? '#fda4af' : 'var(--text-muted)' }}>
              {serverStatus === 'ok' ? 'Backend Online' : serverStatus === 'error' ? 'Backend Offline' : 'Checking...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '340px 1fr 380px',
        gap: '20px',
        padding: '20px 24px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
      }}>

        {/* LEFT: Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FileUploader onAnalyze={handleAnalyze} isLoading={isLoading} />

          {/* Error alert */}
          {error && (
            <div className="animate-fade-in" style={{
              background: 'rgba(244,63,94,0.1)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#fda4af' }}>Analysis Failed</p>
                <p style={{ fontSize: '12px', color: '#fda4af', opacity: 0.8, marginTop: '4px' }}>{error}</p>
              </div>
            </div>
          )}

          {/* API Key reminder */}
          {serverStatus === 'error' && (
            <div className="animate-fade-in" style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px',
              padding: '14px 16px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#fcd34d', marginBottom: '6px' }}>
                🔌 Backend Not Running
              </p>
              <p style={{ fontSize: '11px', color: '#fcd34d', opacity: 0.8, lineHeight: 1.5 }}>
                Start the backend:<br />
                <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>
                  cd backend && python main.py
                </code>
              </p>
            </div>
          )}

          {/* Stats */}
          {result && (
            <div className="glass-card animate-fade-in" style={{ padding: '16px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                Document Stats
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Chunks Indexed', value: result.metadata?.chunks_indexed, icon: '🗂️' },
                  { label: 'Entities Found', value: Object.values(result.entities || {}).flat().length, icon: '🏷️' },
                  { label: 'Sentiment', value: result.sentiment?.friendly_label || '—', icon: '💡' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{icon}</span> {label}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {value ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Analysis Results */}
        <div className="glass-card" style={{ padding: '20px', overflow: 'auto' }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: '4px',
            background: 'rgba(255,255,255,0.04)',
            padding: '4px', borderRadius: '10px',
            marginBottom: '20px',
          }}>
            {[
              { key: 'analysis', label: '📊 Analysis', disabled: !result },
              { key: 'chat',     label: '💬 Chat',     disabled: !result },
            ].map(({ key, label, disabled }) => (
              <button
                key={key}
                onClick={() => !disabled && setActiveTab(key)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s ease',
                  background: activeTab === key
                    ? 'var(--gradient-primary)'
                    : 'transparent',
                  color: activeTab === key ? 'white' : 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {!result && !isLoading && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: 'calc(100% - 60px)',
              gap: '16px', color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '60px', opacity: 0.2 }} className="animate-float">🧠</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Ready to Analyse
                </p>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>
                  Upload a document to see AI-powered insights
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="animate-fade-in" style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: 'calc(100% - 60px)', gap: '20px',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Processing document...
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Extracting · Summarising · Embedding
                </p>
              </div>
            </div>
          )}

          {result && activeTab === 'analysis' && (
            <DocumentAnalysis result={result} />
          )}

          {result && activeTab === 'chat' && (
            <div style={{ height: 'calc(100vh - 180px)' }}>
              <ChatInterface
                documentId={result.document_id}
                fileName={result.fileName}
              />
            </div>
          )}
        </div>

        {/* RIGHT: Chat Panel (always visible when doc loaded) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 28, height: 28,
                background: 'var(--teal-glow)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(20,184,166,0.3)',
              }}>
                <span style={{ fontSize: '14px' }}>💬</span>
              </div>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Document Chat</h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RAG-powered Q&A</p>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatInterface
              documentId={result?.document_id}
              fileName={result?.fileName}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '16px',
        borderTop: '1px solid var(--border)',
        position: 'relative', zIndex: 1,
      }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          DocAnalyse AI · Gemini 1.5 Flash · FAISS · spaCy · HuggingFace
        </p>
      </footer>
    </div>
  );
}
