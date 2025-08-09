import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333',
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Get groupId from localStorage
    const groupId = localStorage.getItem('groupId');
    if (groupId) {
      config.headers['x-group-id'] = groupId;
    }

    // Get 2FA token from localStorage
    const twoFactorToken = localStorage.getItem('2fa_token');
    if (twoFactorToken) {
      config.headers['token'] = twoFactorToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Transform the response data structure
    if (response.data?.error === null) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 