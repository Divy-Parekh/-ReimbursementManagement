import api from './api';

const userService = {
  async getAll(params = {}) {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async create(data) {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async sendPassword(id) {
    const response = await api.post(`/users/${id}/send-password`);
    return response.data;
  },
};

export default userService;
