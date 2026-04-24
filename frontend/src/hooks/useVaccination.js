import { useState, useCallback } from 'react';
import { useAuth } from './useFreighter';

export function useVaccination() {
  const { apiFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async (wallet) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/vaccination/${wallet}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const issueVaccination = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/vaccination/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  return { fetchRecords, issueVaccination, loading, error };
}
