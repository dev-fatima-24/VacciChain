import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useFreighter';
import { useVaccination } from '../hooks/useVaccination';
import ConfirmMintDialog from '../components/ConfirmMintDialog';

const styles = {
  page: { maxWidth: 500, width: '100%', margin: '2rem auto', padding: '0 1rem', boxSizing: 'border-box' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  input: { padding: '0.6rem 0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  inputError: { padding: '0.6rem 0.75rem', background: '#1e293b', border: '1px solid #f87171', borderRadius: 8, color: '#e2e8f0', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '0.7rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontSize: '1rem', width: '100%', touchAction: 'manipulation' },
  btnDisabled: { padding: '0.7rem', background: '#334155', color: '#64748b', border: 'none', borderRadius: 8, fontSize: '1rem', cursor: 'not-allowed', width: '100%' },
  label: { color: '#94a3b8', fontSize: '0.85rem', marginBottom: '0.25rem' },
  fieldError: { color: '#f87171', fontSize: '0.78rem', marginTop: '0.25rem' },
};

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;
const today = () => new Date().toISOString().split('T')[0];
const FORM_KEY = 'issuer_form_draft';
const EMPTY_FORM = { patient_address: '', vaccine_name: '', date_administered: '' };

export default function IssuerDashboard() {
  const { t } = useTranslation();
  const { publicKey, role, connect } = useAuth();
  const { issueVaccination, loading } = useVaccination();

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem(FORM_KEY);
      return saved ? JSON.parse(saved) : EMPTY_FORM;
    } catch {
      return EMPTY_FORM;
    }
  });
  const [touched, setTouched] = useState({});
  const [mintResult, setMintResult] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const validate = (f) => {
    const errors = {};
    if (!STELLAR_ADDRESS_RE.test(f.patient_address))
      errors.patient_address = t('issuer.validation.invalidAddress');
    if (!f.vaccine_name.trim())
      errors.vaccine_name = t('issuer.validation.vaccineRequired');
    if (!f.date_administered)
      errors.date_administered = t('issuer.validation.dateRequired');
    else if (f.date_administered > today())
      errors.date_administered = t('issuer.validation.dateFuture');
    return errors;
  };

  const errors = validate(form);
  const isValid = Object.keys(errors).length === 0;

  useEffect(() => {
    sessionStorage.setItem(FORM_KEY, JSON.stringify(form));
  }, [form]);

  if (!publicKey) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>Connect your issuer wallet.</p>
        <button style={styles.btn} onClick={connect} aria-label="Connect issuer wallet">Connect Wallet</button>
      </div>
    );
  }

  if (role !== 'issuer') {
    return <div style={styles.page}><p style={{ color: '#f87171' }}>{t('issuer.accessDenied')}</p></div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await issueVaccination(form);
    if (result) {
      setMintResult(result);
      setForm(EMPTY_FORM);
      sessionStorage.removeItem(FORM_KEY);
    }
  };

  const fields = [
    { key: 'patient_address', label: t('issuer.patientAddress'), placeholder: 'G...', type: 'text' },
    { key: 'vaccine_name', label: t('issuer.vaccineName'), placeholder: t('issuer.vaccineNamePlaceholder'), type: 'text' },
    { key: 'date_administered', label: t('issuer.dateAdministered'), placeholder: '', type: 'date' },
  ];

  return (
    <div style={styles.page}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text)' }}>Issue Vaccination NFT</h2>
      <form style={styles.form} onSubmit={handleSubmit}>
        {[
          { key: 'patient_address', label: 'Patient Stellar Address', placeholder: 'G...' },
          { key: 'vaccine_name', label: 'Vaccine Name', placeholder: 'e.g. COVID-19' },
          { key: 'date_administered', label: 'Date Administered', placeholder: 'YYYY-MM-DD' },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label htmlFor={key} style={styles.label}>{label}</label>
            <input
              id={key}
              style={styles.input}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              required
            />
          </div>
        ))}
        <button style={styles.btn} type="submit" disabled={loading} aria-disabled={loading}>
          {loading ? 'Minting…' : 'Issue Vaccination NFT'}
        </button>
      </form>
      <div aria-live="polite" aria-atomic="true">
        {mintResult && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#0f172a', borderRadius: 8, color: '#4ade80' }}>
            <p>✅ Vaccination NFT minted!</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>Token ID: {mintResult.tokenId}</p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${mintResult.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.85rem', color: '#0ea5e9' }}
            >
              View on Stellar Explorer ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
