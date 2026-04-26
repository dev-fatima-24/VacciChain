import CopyButton from './CopyButton';

const STELLAR_EXPERT_BASE = 'https://stellar.expert/explorer/testnet/tx';

const overlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modal = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 16,
  padding: '2rem',
  width: '100%',
  maxWidth: 520,
  color: '#e2e8f0',
  position: 'relative',
};

const row = { marginBottom: '1rem' };
const label = { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' };
const value = { fontSize: '0.95rem', color: '#e2e8f0', wordBreak: 'break-all' };
const closeBtn = {
  position: 'absolute', top: '1rem', right: '1rem',
  background: 'none', border: 'none', color: '#94a3b8',
  fontSize: '1.25rem', cursor: 'pointer', lineHeight: 1,
};

export default function RecordDetailModal({ record, onClose }) {
  if (!record) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  const explorerUrl = record.tx_hash
    ? `${STELLAR_EXPERT_BASE}/${record.tx_hash}`
    : null;

  return (
    <div
      style={overlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Vaccination record details"
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <div style={modal}>
        <button style={closeBtn} onClick={onClose} aria-label="Close modal">✕</button>

        <h2 style={{ marginBottom: '1.5rem', color: '#38bdf8', fontSize: '1.2rem' }}>
          💉 Vaccination Record
        </h2>

        <div style={row}>
          <p style={label}>Vaccine Name</p>
          <p style={value}>{record.vaccine_name}</p>
        </div>

        <div style={row}>
          <p style={label}>Date Administered</p>
          <p style={value}>{record.date_administered}</p>
        </div>

        <div style={row}>
          <p style={label}>Token ID</p>
          <p style={value}>
            #{record.token_id}
            <CopyButton text={String(record.token_id)} label="token ID" />
          </p>
        </div>

        <div style={row}>
          <p style={label}>Issuer Address</p>
          <p style={value}>
            {record.issuer}
            <CopyButton text={record.issuer} label="issuer address" />
          </p>
        </div>

        {record.tx_hash && (
          <div style={row}>
            <p style={label}>Transaction Hash</p>
            <p style={value}>
              {record.tx_hash}
              <CopyButton text={record.tx_hash} label="transaction hash" />
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          {explorerUrl ? (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.25rem',
                background: '#0ea5e9',
                color: '#fff',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              View on Stellar Explorer ↗
            </a>
          ) : (
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>
              Transaction hash not available for this record.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
