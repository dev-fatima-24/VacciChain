import { useState } from 'react';

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modal: {
    background: '#1e293b', borderRadius: 12, padding: '2rem',
    maxWidth: 520, width: '100%', color: '#e2e8f0',
  },
  title: { fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#38bdf8' },
  body: { fontSize: '0.9rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1.25rem' },
  list: { paddingLeft: '1.25rem', marginBottom: '1.25rem', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.8 },
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' },
  checkLabel: { fontSize: '0.9rem', color: '#e2e8f0', cursor: 'pointer' },
  btnRow: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  btnAccept: { padding: '0.6rem 1.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnDecline: { padding: '0.6rem 1.5rem', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer' },
};

/**
 * ConsentScreen — shown to first-time patients before their wallet is associated
 * with on-chain vaccination records.
 *
 * Props:
 *   onAccept()  — called when patient accepts; caller should POST /v1/patient/consent
 *   onDecline() — called when patient declines
 *   loading     — disables the accept button while the consent POST is in flight
 */
export default function ConsentScreen({ onAccept, onDecline, loading = false }) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={s.overlay} role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div style={s.modal}>
        <h2 id="consent-title" style={s.title}>💉 Data Consent</h2>
        <p style={s.body}>
          Before your vaccination records can be issued, you must understand what data is stored
          and who can access it.
        </p>
        <ul style={s.list}>
          <li>Your <strong>Stellar wallet address</strong> is stored on a public blockchain.</li>
          <li>Vaccination records (vaccine name, date, issuer) are <strong>publicly visible</strong> to anyone who queries the contract.</li>
          <li>Records are <strong>permanent and cannot be deleted</strong> — only revoked by an authorized issuer.</li>
          <li>Your consent timestamp and wallet address are stored off-chain by VacciChain.</li>
        </ul>
        <div style={s.checkRow}>
          <input
            id="consent-check"
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            aria-required="true"
          />
          <label htmlFor="consent-check" style={s.checkLabel}>
            I understand and consent to my vaccination data being stored on the Stellar blockchain.
          </label>
        </div>
        <div style={s.btnRow}>
          <button style={s.btnDecline} onClick={onDecline} type="button">
            Decline
          </button>
          <button
            style={{ ...s.btnAccept, opacity: (!checked || loading) ? 0.5 : 1 }}
            onClick={onAccept}
            disabled={!checked || loading}
            aria-disabled={!checked || loading}
            type="button"
          >
            {loading ? 'Recording…' : 'I Consent'}
          </button>
        </div>
      </div>
    </div>
  );
}
