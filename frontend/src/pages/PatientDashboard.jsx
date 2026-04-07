import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';
import NFTCard from '../components/NFTCard';

const styles = {
  page: { maxWidth: 700, margin: '2rem auto', padding: '0 1rem' },
  btn: { padding: '0.6rem 1.5rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8 },
};

export default function PatientDashboard() {
  const { publicKey, connect } = useAuth();
  const { fetchRecords, loading, error } = useVaccination();
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (publicKey) {
      fetchRecords(publicKey).then((data) => {
        if (data) setRecords(data.records || []);
      });
    }
  }, [publicKey, fetchRecords]);

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your wallet to view records.</p>
        <button style={styles.btn} onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>My Vaccination Records</h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Wallet: {publicKey}
      </p>
      {loading && <p style={{ color: '#94a3b8' }}>Loading…</p>}
      {error && <p style={{ color: '#f87171' }}>Error: {error}</p>}
      {!loading && records.length === 0 && (
        <p style={{ color: '#94a3b8' }}>No vaccination records found.</p>
      )}
      {records.map((r) => <NFTCard key={r.token_id} record={r} />)}
    </div>
  );
}
