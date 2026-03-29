import api from './api';

const expenseService = {
  async getMyExpenses(params = {}) {
    const response = await api.get('/expenses/my', { params });
    return response.data;
  },

  async getAll(params = {}) {
    const response = await api.get('/expenses/all', { params });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  async submit(id) {
    const response = await api.post(`/expenses/${id}/submit`);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  async uploadAttachment(id, file) {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await api.post(`/expenses/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getSummary() {
    const response = await api.get('/expenses/summary');
    return response.data;
  },
};

export default expenseService;
