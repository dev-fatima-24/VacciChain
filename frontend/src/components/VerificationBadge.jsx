export default function VerificationBadge({ vaccinated, recordCount }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1.25rem',
      borderRadius: 999,
      background: vaccinated ? '#14532d' : '#450a0a',
      border: `1px solid ${vaccinated ? '#16a34a' : '#dc2626'}`,
      color: vaccinated ? '#4ade80' : '#f87171',
      fontWeight: 600,
    }}>
      {vaccinated ? `✅ Vaccinated (${recordCount} record${recordCount !== 1 ? 's' : ''})` : '❌ No vaccination records found'}
    </div>
  );
}
