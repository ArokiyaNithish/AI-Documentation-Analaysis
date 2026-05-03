// components/DocumentAnalysis.jsx — Renders analysis results panel
import EntityCard from './EntityCard';

const SENTIMENT_BADGE = {
  POSITIVE: 'badge-positive',
  NEGATIVE: 'badge-negative',
  NEUTRAL:  'badge-neutral',
};

export default function DocumentAnalysis({ result }) {
  if (!result) return null;

  const { fileName, summary, entities, sentiment, metadata } = result;
  const sentimentClass = SENTIMENT_BADGE[sentiment?.label] || 'badge-neutral';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
      {/* Doc Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📄</span>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {fileName}
            </h3>
          </div>
          {metadata && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {metadata.chunks_indexed} chunks indexed · Ready for chat
            </p>
          )}
        </div>
        {sentiment && (
          <span className={`badge ${sentimentClass}`}>
            {sentiment.friendly_label || sentiment.label}
            {sentiment.confidence && ` · ${sentiment.confidence}`}
          </span>
        )}
      </div>

      <div className="divider" />

      {/* Summary */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(20,184,166,0.2))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '13px' }}>✨</span>
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            AI Summary
          </h4>
        </div>
        <div style={{
          background: 'rgba(99,102,241,0.04)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '12px',
          padding: '14px 16px',
          fontSize: '13px',
          lineHeight: '1.7',
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
        }}>
          {summary}
        </div>
      </div>

      <div className="divider" />

      {/* Entities */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px',
        }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(245,158,11,0.2))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '13px' }}>🏷️</span>
          </div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Named Entities
          </h4>
        </div>
        <EntityCard entities={entities || {}} />
      </div>
    </div>
  );
}
