import { useState } from 'react';
import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';

const styles = {
  page: { maxWidth: 500, margin: '2rem auto', padding: '0 1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.6rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: '1rem' },
  btn: { padding: '0.7rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem' },
  label: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' },
};

export default function IssuerDashboard() {
  const { publicKey, role, connect } = useAuth();
  const { issueVaccination, loading, error } = useVaccination();
  const [form, setForm] = useState({ patient_address: '', vaccine_name: '', date_administered: '' });
  const [success, setSuccess] = useState(null);

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your issuer wallet.</p>
        <button style={styles.btn} onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  if (role !== 'issuer') {
    return <div style={styles.page}><p style={{ color: '#f87171' }}>Access denied: issuer role required.</p></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    const result = await issueVaccination(form);
    if (result) {
      setSuccess(`Vaccination NFT minted! Token ID: ${result.token_id}`);
      setForm({ patient_address: '', vaccine_name: '', date_administered: '' });
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>Issue Vaccination NFT</h2>
      <form style={styles.form} onSubmit={handleSubmit}>
        {[
          { key: 'patient_address', label: 'Patient Stellar Address', placeholder: 'G...' },
          { key: 'vaccine_name', label: 'Vaccine Name', placeholder: 'e.g. COVID-19' },
          { key: 'date_administered', label: 'Date Administered', placeholder: 'YYYY-MM-DD' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <p style={styles.label}>{label}</p>
            <input
              style={styles.input}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required
            />
          </div>
        ))}
        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? 'Minting…' : 'Issue Vaccination NFT'}
        </button>
      </form>
      {error && <p style={{ color: '#f87171', marginTop: '1rem' }}>Error: {error}</p>}
      {success && <p style={{ color: '#4ade80', marginTop: '1rem' }}>✅ {success}</p>}
    </div>
  );
}
