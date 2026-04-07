import { createContext, useContext, useState, useCallback } from 'react';
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

  const connect = useCallback(async () => {
    const connected = await isConnected();
    if (!connected) throw new Error('Freighter wallet not found. Please install it.');

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

    setPublicKey(pk);
    setToken(data.token);
    setRole(data.role);
    return data;
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ publicKey, token, role, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
