import { Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifyPage from './pages/VerifyPage';
import { AuthProvider } from './hooks/useFreighter';

const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || 'testnet';

export default function App() {
  const isTestnet = NETWORK === 'testnet';

  return (
    <AuthProvider>
      {isTestnet && (
        <div style={{
          background: '#f59e0b',
          color: '#000',
          textAlign: 'center',
          padding: '0.5rem',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          ⚠️ Running on Stellar TESTNET. Tokens are for testing purposes only.
        </div>
      )}
      <nav style={{ padding: '1rem 2rem', background: '#1e293b', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <strong style={{ color: '#38bdf8', fontSize: '1.2rem' }}>💉 VacciChain</strong>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Home</Link>
        <Link to="/patient" style={{ color: '#fff', textDecoration: 'none' }}>My Records</Link>
        <Link to="/issuer" style={{ color: '#fff', textDecoration: 'none' }}>Issue</Link>
        <Link to="/verify" style={{ color: '#fff', textDecoration: 'none' }}>Verify</Link>
        <div style={{
          marginLeft: 'auto',
          padding: '0.2rem 0.6rem',
          borderRadius: '1rem',
          fontSize: '0.8rem',
          background: isTestnet ? '#334155' : '#059669',
          color: '#fff',
          textTransform: 'uppercase',
          fontWeight: 'bold'
        }}>
          {NETWORK}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/issuer" element={<IssuerDashboard />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
    </AuthProvider>
  );
}
