import { useState, useCallback } from 'react';
import { useAuth } from './useFreighter';
import { useToast } from './useToast';

export function useVaccination() {
  const { apiFetch } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async (wallet, { page = 1, limit = 20 } = {}) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/v1/vaccination/${wallet}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    } catch (e) {
      toast(e.message || 'Failed to fetch records.', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch, toast]);

  const issueVaccination = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await apiFetch('/v1/vaccination/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${data.transactionHash}`;
      toast(`Vaccination NFT minted! Token ID: ${data.tokenId} — View on Explorer: ${explorerUrl}`, 'success');
      return data;
    } catch (e) {
      toast(e.message || 'Failed to issue vaccination.', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFetch, toast]);

  return { fetchRecords, issueVaccination, loading };
}
