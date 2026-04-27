import { useState, useEffect } from 'react';
import VerificationBadge from '../components/VerificationBadge';
import NFTCard from '../components/NFTCard';
import { useToast } from '../hooks/useToast';

const styles = {
  page: { maxWidth: 600, margin: '2rem auto', padding: '0 1rem' },
  input: { padding: '0.6rem 0.75rem', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '1rem', width: '100%' },
  btn: { padding: '0.6rem 1.5rem', background: 'var(--btn-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', marginTop: '0.75rem' },
};

export default function VerifyPage() {
  const toast = useToast();
  const [wallet, setWallet] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verify = async (address) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/verify/${address.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      toast(e.message || 'Verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get('wallet');
    if (w) {
      setWallet(w);
      verify(w);
    }
  }, []);

  const handleVerify = (e) => {
    e.preventDefault();
    const trimmed = wallet.trim();
    const url = new URL(window.location);
    url.searchParams.set('wallet', trimmed);
    window.history.pushState({}, '', url);
    verify(trimmed);
  };

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Verify Vaccination Status</h2>
      <form onSubmit={handleVerify}>
        <label htmlFor="wallet-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
          Stellar wallet address
        </label>
        <input
          id="wallet-input"
          style={styles.input}
          placeholder={t('verify.placeholder')}
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          aria-label="Stellar wallet address to verify"
          required
        />
        <button style={styles.btn} type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? 'Checking…' : 'Verify'}
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {error && <p style={{ color: '#f87171', marginTop: '1rem' }} role="alert">Error: {error}</p>}
      </div>

      {result && (
        <div style={{ marginTop: '1.5rem' }} aria-live="polite">
          <VerificationBadge vaccinated={result.vaccinated} recordCount={result.record_count} />
          <div style={{ marginTop: '1.5rem' }}>
            {result.records?.map((r) => <NFTCard key={r.token_id} record={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
