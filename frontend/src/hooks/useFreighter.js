import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'vaccichain_wallet';

export function AuthProvider({ children }) {
  const [publicKey, setPublicKey] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [freighterInstalled, setFreighterInstalled] = useState(true);

  const connect = useCallback(async () => {
    const connected = await isConnected();
    if (!connected) {
      setFreighterInstalled(false);
      throw new Error('Freighter wallet not found. Please install it.');
    }

    const pk = await getPublicKey();

    // SEP-10 flow
    const challengeRes = await fetch('/auth/sep10', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_key: pk }),
    });
    const { transaction, nonce } = await challengeRes.json();
    const signedXDR = await signTransaction(transaction, { network: 'TESTNET' });
    const verifyRes = await fetch('/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction: signedXDR, nonce }),
    });
    const data = await verifyRes.json();
    if (!verifyRes.ok) throw new Error(data.error);
    return data;
  }, []);

  const connect = useCallback(async () => {
    const connected = await isConnected();
    if (!connected) throw new Error('Freighter wallet not found. Please install it.');
    const pk = await getPublicKey();
    const data = await runSep10(pk);
    setPublicKey(pk);
    setToken(data.token);
    tokenRef.current = data.token;
    setRole(data.role);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ publicKey: pk, token: data.token, role: data.role }));
    return data;
  }, [runSep10]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    tokenRef.current = null;
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Auto-reconnect on mount if previously connected
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const { publicKey: savedKey, token: savedToken, role: savedRole } = JSON.parse(saved);

    isConnected().then((connected) => {
      if (!connected) {
        setFreighterInstalled(false);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      setPublicKey(savedKey);
      setToken(savedToken);
      setRole(savedRole);
    }).catch(() => localStorage.removeItem(STORAGE_KEY));
  }, []);

  // Fetch wrapper: on 401, re-runs SEP-10 silently and retries once
  const apiFetch = useCallback(async (url, options = {}) => {
    const doFetch = (t) => fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

    let res = await doFetch(tokenRef.current);

    if (res.status === 401) {
      const pk = await getPublicKey();
      const data = await runSep10(pk);
      setToken(data.token);
      tokenRef.current = data.token;
      setRole(data.role);
      res = await doFetch(data.token);
    }

    return res;
  }, [runSep10]);

  return (
    <AuthContext.Provider value={{ publicKey, token, role, freighterInstalled, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
