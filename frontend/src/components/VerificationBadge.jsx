import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingSpinner = () => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'spin 1s linear infinite' }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

export default function VerificationBadge({ status, vaccinated, recordCount = 0 }) {
  const { t } = useTranslation();

  const configs = {
    verified: {
      bg: 'rgba(22, 163, 74, 0.1)', border: 'rgba(22, 163, 74, 0.2)', color: '#16a34a',
      label: t('badge.verified', { count: recordCount }),
      icon: '✓',
    },
    'not-found': {
      bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.2)', color: '#64748b',
      label: t('badge.notFound'),
      icon: '?',
    },
    revoked: {
      bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.2)', color: '#dc2626',
      label: t('badge.revoked'),
      icon: '✕',
    },
    loading: {
      bg: 'rgba(37, 99, 235, 0.1)', border: 'rgba(37, 99, 235, 0.2)', color: '#2563eb',
      label: t('badge.verifying'),
      icon: <LoadingSpinner />,
    },
  };

  let effectiveStatus = status;
  if (!effectiveStatus && typeof vaccinated !== 'undefined') {
    effectiveStatus = vaccinated ? 'verified' : 'not-found';
  }
  const config = configs[effectiveStatus] || configs['not-found'];

  return (
    <div
      data-testid="verification-badge"
      id="verification-badge"
      aria-label={config.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.5rem 1rem', borderRadius: '12px',
        backgroundColor: config.bg, border: `1px solid ${config.border}`,
        color: config.color, fontSize: '0.875rem', fontWeight: '600',
        transition: 'all 0.2s ease', cursor: 'default', backdropFilter: 'blur(4px)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', fontSize: '1rem' }}>
        {config.icon}
      </span>
      <span>{config.label}</span>
    </div>
  );
}
