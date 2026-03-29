import { useState, useEffect, useCallback } from 'react';
import expenseService from '../services/expenseService';

export function useExpenses(autoFetch = true) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyExpenses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getMyExpenses(params);
      setExpenses(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllExpenses = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseService.getAll(params);
      setExpenses(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await expenseService.getSummary();
      setSummary(response.data);
      return response;
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchMyExpenses();
      fetchSummary();
    }
  }, [autoFetch, fetchMyExpenses, fetchSummary]);

  return {
    expenses,
    summary,
    loading,
    error,
    fetchMyExpenses,
    fetchAllExpenses,
    fetchSummary,
    setExpenses,
  };
}
