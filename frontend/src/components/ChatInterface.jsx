// components/ChatInterface.jsx — Multi-turn RAG chat with document
import { useState, useRef, useEffect, useCallback } from 'react';
import { chatWithDocument } from '../api/client';

const SUGGESTED = [
  'Summarize the main points',
  'What are the key findings?',
  'Who are the main people mentioned?',
  'What dates are referenced?',
];

export default function ChatInterface({ documentId, fileName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reset when new document is loaded
  useEffect(() => {
    setMessages([]);
    setError(null);
    if (documentId) {
      setMessages([{
        role: 'assistant',
        content: `✅ Document **"${fileName}"** is ready. Ask me anything about it!`,
        timestamp: new Date(),
      }]);
    }
  }, [documentId, fileName]);

  const sendMessage = useCallback(async (questionText) => {
    const q = questionText?.trim() || input.trim();
    if (!q || isTyping || !documentId) return;
    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Build history for context (exclude the welcome message)
      const history = messages
        .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.content.startsWith('✅')))
        .map(m => ({ role: m.role, content: m.content }));

      const { answer, sources_used } = await chatWithDocument({
        question: q,
        documentId,
        history,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer,
        sources: sources_used,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message}`,
        isError: true,
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, messages, isTyping, documentId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) =>
    date?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!documentId) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: '16px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: '48px', opacity: 0.3 }} className="animate-float">💬</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            No document loaded
          </p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>
            Upload and analyse a document to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--teal)', boxShadow: '0 0 8px var(--teal)',
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {fileName}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {messages.length - 1} message{messages.length !== 2 ? 's' : ''}
        </span>
      </div>

      {/* Messages */}
      <div className="chat-scroll" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '8px', alignItems: 'flex-end',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #14b8a6)'
                : 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
            }}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '80%' }}>
              <div
                className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}
                style={{
                  padding: '10px 14px',
                  fontSize: '13px',
                  lineHeight: '1.65',
                  color: msg.isError ? '#fda4af' : 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                marginTop: '4px',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {formatTime(msg.timestamp)}
                </span>
                {msg.sources > 0 && (
                  <span style={{
                    fontSize: '10px', color: 'var(--teal)',
                    background: 'var(--teal-glow)', padding: '1px 6px',
                    borderRadius: '6px', border: '1px solid rgba(20,184,166,0.2)',
                  }}>
                    {msg.sources} sources
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)',
            }}>🤖</div>
            <div className="chat-bubble-assistant" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SUGGESTED.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              style={{
                padding: '5px 11px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent-light)'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-secondary)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '8px', alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about the document..."
          className="input-field"
          style={{
            padding: '10px 14px',
            fontSize: '13px',
            resize: 'none',
            minHeight: '42px',
            maxHeight: '120px',
            lineHeight: '1.5',
          }}
          rows={1}
          disabled={isTyping}
        />
        <button
          className="btn-primary"
          style={{
            padding: '10px 16px',
            fontSize: '16px',
            flexShrink: 0,
            height: '42px',
          }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || isTyping}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
