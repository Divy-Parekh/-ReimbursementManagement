import { useState, useEffect, useCallback } from 'react';
import approvalService from '../services/approvalService';

export function useApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await approvalService.getPending();
      setPendingApprovals(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return {
    pendingApprovals,
    loading,
    error,
    fetchPending,
    setPendingApprovals,
  };
}
