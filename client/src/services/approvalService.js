import api from './api';

const approvalService = {
  async getPending() {
    const response = await api.get('/approvals/pending');
    return response.data;
  },

  async approve(expenseId, comments = '') {
    const response = await api.post(`/approvals/${expenseId}/approve`, { comments });
    return response.data;
  },

  async reject(expenseId, comments = '') {
    const response = await api.post(`/approvals/${expenseId}/reject`, { comments });
    return response.data;
  },

  async getLogs(expenseId) {
    const response = await api.get(`/approvals/${expenseId}/logs`);
    return response.data;
  },
};

export default approvalService;
