import api from './api';

const approvalRuleService = {
  async getAll() {
    const response = await api.get('/approval-rules');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/approval-rules/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/approval-rules', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/approval-rules/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/approval-rules/${id}`);
    return response.data;
  },
};

export default approvalRuleService;
