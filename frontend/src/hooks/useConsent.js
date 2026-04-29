import { useState, useCallback } from 'react';
import { useAuth } from './useFreighter';

/**
 * useConsent — manages patient consent state.
 *
 * Returns:
 *   consented      — null (unknown), true, or false
 *   checkConsent() — fetch consent status for the connected wallet
 *   giveConsent()  — POST consent and update state
 *   loading        — true while a request is in flight
 */
export function useConsent() {
  const { publicKey, apiFetch } = useAuth();
  const [consented, setConsented] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkConsent = useCallback(async (wallet) => {
    if (!wallet) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/v1/patient/consent/${wallet}`);
      const data = await res.json();
      setConsented(data.consented);
      return data.consented;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const giveConsent = useCallback(async () => {
    if (!publicKey) return false;
    setLoading(true);
    try {
      const res = await apiFetch('/v1/patient/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey }),
      });
      if (res.ok) {
        setConsented(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, apiFetch]);

  return { consented, checkConsent, giveConsent, loading };
}
