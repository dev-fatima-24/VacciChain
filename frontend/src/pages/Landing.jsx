import { useAuth } from '../hooks/useFreighter';

const styles = {
  page: { maxWidth: 700, margin: '4rem auto', padding: '0 1rem', textAlign: 'center' },
  title: { fontSize: '3rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem' },
  sub: { color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' },
  btn: { padding: '0.75rem 2rem', background: 'var(--btn-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem' },
  info: { marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' },
};

export default function Landing() {
  const { publicKey, connect, disconnect } = useAuth();

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>💉 VacciChain</h1>
      <p style={styles.sub}>
        Blockchain-based vaccination records on Stellar — soulbound, verifiable, tamper-proof.
      </p>
      {publicKey ? (
        <>
          <p style={{ color: '#4ade80', marginBottom: '1rem' }}>
            ✅ Connected: {publicKey.slice(0, 8)}…{publicKey.slice(-4)}
          </p>
          <button style={{ ...styles.btn, background: '#475569' }} onClick={disconnect} aria-label="Disconnect Freighter wallet">
            Disconnect
          </button>
        </>
      ) : (
        <button style={styles.btn} onClick={connect} aria-label="Connect Freighter wallet">
          Connect Freighter Wallet
        </button>
      )}
      <p style={styles.info}>Requires Freighter browser extension on Stellar Testnet.</p>
    </div>
  );
}
