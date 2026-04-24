import { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from '@stellar/freighter-api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [publicKey, setPublicKey] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  // Holds the current token without requiring it as a closure dep in apiFetch
  const tokenRef = useRef(null);

  const runSep10 = useCallback(async (pk) => {
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
    return data;
  }, [runSep10]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    tokenRef.current = null;
    setRole(null);
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
    <AuthContext.Provider value={{ publicKey, token, role, connect, disconnect, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
