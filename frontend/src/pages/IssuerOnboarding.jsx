import { useState } from 'react';
import { useAuth } from '../hooks/useFreighter';

const s = {
  page:   { maxWidth: 520, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  field:  { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' },
  label:  { color: '#94a3b8', fontSize: '0.85rem' },
  input:  { padding: '0.5rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: '0.9rem' },
  btn:    { padding: '0.55rem 1.25rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' },
  success:{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#14532d', borderRadius: 8, color: '#86efac', fontSize: '0.9rem' },
  error:  { marginTop: '0.5rem', color: '#f87171', fontSize: '0.9rem' },
};

export default function IssuerOnboarding() {
  const { publicKey, connect, apiFetch } = useAuth();
  const [form, setForm] = useState({ name: '', license_number: '', country: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  if (!publicKey) {
    return (
      <div style={s.page}>
        <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Apply for Issuer Status</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
          Connect your wallet to submit an onboarding request.
        </p>
        <button style={s.btn} onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch('/v1/onboarding/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, wallet: publicKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSuccess(data.message);
      setForm({ name: '', license_number: '', country: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Apply for Issuer Status</h2>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Submit your details below. An admin will review your application and add you to the
        contract allowlist upon approval.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={s.field}>
          <label style={s.label} htmlFor="name">Organization / Provider Name</label>
          <input
            id="name" name="name" style={s.input} required
            value={form.name} onChange={handleChange}
            placeholder="City General Hospital"
          />
        </div>
        <div style={s.field}>
          <label style={s.label} htmlFor="license_number">License Number</label>
          <input
            id="license_number" name="license_number" style={s.input} required
            value={form.license_number} onChange={handleChange}
            placeholder="MED-12345"
          />
        </div>
        <div style={s.field}>
          <label style={s.label} htmlFor="country">Country</label>
          <input
            id="country" name="country" style={s.input} required
            value={form.country} onChange={handleChange}
            placeholder="Nigeria"
          />
        </div>
        <div style={s.field}>
          <label style={s.label}>Wallet Address</label>
          <input style={{ ...s.input, color: '#64748b' }} value={publicKey} readOnly aria-readonly="true" />
        </div>

        <button style={s.btn} type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>

      {error   && <p style={s.error} role="alert">{error}</p>}
      {success && <div style={s.success} role="status">{success}</div>}
    </div>
  );
}
