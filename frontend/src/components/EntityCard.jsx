// components/EntityCard.jsx — Display NER entities by category
const CATEGORIES = [
  { key: 'names',         label: 'People',        icon: '👤', chip: 'chip-person'   },
  { key: 'organizations', label: 'Organizations',  icon: '🏢', chip: 'chip-org'      },
  { key: 'dates',         label: 'Dates & Times',  icon: '📅', chip: 'chip-date'     },
  { key: 'amounts',       label: 'Amounts',        icon: '💰', chip: 'chip-amount'   },
  { key: 'locations',     label: 'Locations',      icon: '📍', chip: 'chip-location' },
];

export default function EntityCard({ entities }) {
  const hasAny = Object.values(entities).some(v => v?.length > 0);

  if (!hasAny) {
    return (
      <div style={{
        textAlign: 'center', padding: '32px',
        color: 'var(--text-muted)', fontSize: '13px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
        No named entities detected in this document.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {CATEGORIES.map(({ key, label, icon, chip }) => {
        const items = entities[key];
        if (!items || items.length === 0) return null;
        return (
          <div key={key} className="animate-fade-in">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </span>
              <span style={{
                fontSize: '11px', background: 'var(--bg-secondary)',
                color: 'var(--text-muted)', padding: '1px 7px', borderRadius: '10px',
                border: '1px solid var(--border)',
              }}>
                {items.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {items.map((item, i) => (
                <span key={i} className={`entity-chip ${chip}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
