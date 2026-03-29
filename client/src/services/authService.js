import api from './api';

const authService = {
  async signup(data) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async changePassword(data) {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },
};

export default authService;
