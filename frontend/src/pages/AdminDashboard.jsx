import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useFreighter';

const s = {
  page:    { maxWidth: 700, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
  th:      { textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '1px solid #334155', color: '#94a3b8' },
  td:      { padding: '0.5rem 0.75rem', borderBottom: '1px solid #1e293b', color: '#e2e8f0', wordBreak: 'break-all' },
  btn:     { padding: '0.45rem 1rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' },
  btnDanger: { padding: '0.45rem 0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' },
  input:   { padding: '0.5rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0', fontSize: '0.9rem', flex: 1 },
  row:     { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' },
  keyBox:  { marginTop: '1rem', padding: '0.75rem 1rem', background: '#0f172a', borderRadius: 8, color: '#4ade80', fontSize: '0.85rem', wordBreak: 'break-all' },
  badge:   (revoked) => ({ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', background: revoked ? '#7f1d1d' : '#14532d', color: revoked ? '#fca5a5' : '#86efac' }),
};

export default function AdminDashboard() {
  const { publicKey, role, connect, apiFetch } = useAuth();
  const [keys, setKeys]       = useState([]);
  const [label, setLabel]     = useState('');
  const [newKey, setNewKey]   = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    const res = await apiFetch('/admin/api-keys');
    if (res.ok) setKeys(await res.json());
  }, [apiFetch]);

  useEffect(() => {
    if (publicKey && role === 'issuer') fetchKeys();
  }, [publicKey, role, fetchKeys]);

  if (!publicKey) {
    return (
      <div style={s.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your admin wallet to manage API keys.</p>
        <button style={s.btn} onClick={connect}>Connect Wallet</button>
      </div>
    );
  }

  if (role !== 'issuer') {
    return <div style={s.page}><p style={{ color: '#f87171' }}>Access denied: admin role required.</p></div>;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    setError(null);
    setNewKey(null);
    try {
      const res = await apiFetch('/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewKey(data.key);
      setLabel('');
      await fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this API key? This cannot be undone.')) return;
    await apiFetch(`/admin/api-keys/${id}`, { method: 'DELETE' });
    await fetchKeys();
  };

  return (
    <div style={s.page}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>API Key Management</h2>

      <form style={s.row} onSubmit={handleCreate}>
        <input
          style={s.input}
          placeholder="Label (e.g. School District A)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-label="API key label"
          required
        />
        <button style={s.btn} type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? 'Creating…' : 'Create Key'}
        </button>
      </form>

      {error && <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>}

      {newKey && (
        <div style={s.keyBox} role="alert">
          <strong>New API key (copy now — shown once):</strong>
          <br />
          <code>{newKey}</code>
        </div>
      )}

      {keys.length === 0 ? (
        <p style={{ color: '#64748b' }}>No API keys yet.</p>
      ) : (
        <table style={s.table} aria-label="API keys">
          <thead>
            <tr>
              <th style={s.th}>Label</th>
              <th style={s.th}>Created</th>
              <th style={s.th}>Status</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td style={s.td}>{k.label}</td>
                <td style={s.td}>{new Date(k.created_at).toLocaleDateString()}</td>
                <td style={s.td}><span style={s.badge(k.revoked)}>{k.revoked ? 'Revoked' : 'Active'}</span></td>
                <td style={s.td}>
                  {!k.revoked && (
                    <button style={s.btnDanger} onClick={() => handleRevoke(k.id)} aria-label={`Revoke ${k.label}`}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
