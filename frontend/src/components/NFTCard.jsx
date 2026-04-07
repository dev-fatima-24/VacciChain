export default function NFTCard({ record }) {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 12,
      padding: '1.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#38bdf8' }}>
          💉 {record.vaccine_name}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>#{record.token_id}</span>
      </div>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9rem' }}>
        Date: {record.date_administered}
      </p>
      <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
        Issuer: {record.issuer?.slice(0, 8)}…{record.issuer?.slice(-4)}
      </p>
    </div>
  );
}
