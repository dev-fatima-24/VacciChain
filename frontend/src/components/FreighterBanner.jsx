import { useState } from 'react';
import { useAuth } from '../hooks/useFreighter';

const INSTALL_URL = 'https://www.freighter.app/';

export default function FreighterBanner() {
  const { freighterInstalled } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (freighterInstalled || dismissed) return null;

  return (
    <div style={{
      background: '#7c3aed', color: '#fff', padding: '0.6rem 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
    }}>
      <span>
        🦊 Freighter wallet not detected.{' '}
        <a href={INSTALL_URL} target="_blank" rel="noreferrer" style={{ color: '#e9d5ff', fontWeight: 600 }}>
          Install Freighter
        </a>{' '}
        to connect your wallet and issue or view records.
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  );
}
