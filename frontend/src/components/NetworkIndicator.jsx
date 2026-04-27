import React from 'react';
import { STELLAR_NETWORK, IS_TESTNET } from '../config';

const indicatorStyle = {
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  marginLeft: '1rem',
  background: IS_TESTNET ? '#f59e0b' : '#10b981',
  color: '#fff',
};

const bannerStyle = {
  background: '#fef3c7',
  color: '#92400e',
  padding: '0.5rem 1rem',
  textAlign: 'center',
  fontSize: '0.875rem',
  borderBottom: '1px solid #fde68a',
  fontWeight: '500',
};

export default function NetworkIndicator() {
  return (
    <>
      {IS_TESTNET && (
        <div style={bannerStyle} role="alert">
          ⚠️ <strong>Note:</strong> You are currently using the <strong>Stellar Testnet</strong>. This is for testing purposes only.
        </div>
      )}
    </>
  );
}

export function NetworkPill() {
  return (
    <span style={indicatorStyle} title={`Connected to ${STELLAR_NETWORK}`}>
      {STELLAR_NETWORK}
    </span>
  );
}
