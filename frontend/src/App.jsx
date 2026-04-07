import { Routes, Route, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifyPage from './pages/VerifyPage';
import { AuthProvider } from './hooks/useFreighter';

export default function App() {
  return (
    <AuthProvider>
      <nav style={{ padding: '1rem 2rem', background: '#1e293b', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <strong style={{ color: '#38bdf8', fontSize: '1.2rem' }}>💉 VacciChain</strong>
        <Link to="/">Home</Link>
        <Link to="/patient">My Records</Link>
        <Link to="/issuer">Issue</Link>
        <Link to="/verify">Verify</Link>
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
