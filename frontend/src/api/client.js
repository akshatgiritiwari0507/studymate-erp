import axios from 'axios';

// Prefer explicit env override; otherwise force localhost to avoid hostname mismatches (e.g., opening UI via LAN IP)
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;