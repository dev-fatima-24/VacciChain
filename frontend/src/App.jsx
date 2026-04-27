import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifyPage from './pages/VerifyPage';
import { AuthProvider } from './hooks/useFreighter';
import { useDarkMode } from './hooks/useDarkMode';
import FreighterBanner from './components/FreighterBanner';
import NetworkIndicator, { NetworkPill } from './components/NetworkIndicator';

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to} aria-current={active ? 'page' : undefined}>
      {children}
    </Link>
  );
}

export default function App() {
  const [dark, setDark] = useDarkMode();

  return (
    <AuthProvider>
      <NetworkIndicator />
      <nav aria-label="Main navigation" style={{ padding: '1rem 2rem', background: '#1e293b', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <strong style={{ color: '#38bdf8', fontSize: '1.2rem' }}>💉 VacciChain</strong>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/patient">My Records</NavLink>
        <NavLink to="/issuer">Issue</NavLink>
        <NavLink to="/verify">Verify</NavLink>
        <div style={{ flex: 1 }} />
        <NetworkPill />
      </nav>
      <FreighterBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/issuer" element={<IssuerDashboard />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
    </AuthProvider>
  );
}
