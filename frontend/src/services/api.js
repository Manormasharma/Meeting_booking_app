import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001/api';

export const api = axios.create({ baseURL: API_BASE });

const getStoredToken = () => {
  try {
    const stored = window.localStorage.getItem('user');
    return stored ? JSON.parse(stored).token : null;
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

setAuthToken(getStoredToken());

api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = getStoredToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
