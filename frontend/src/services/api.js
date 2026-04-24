import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const AI_BASE = process.env.REACT_APP_AI_BASE || 'http://localhost:6000/api';

export const api = axios.create({ baseURL: API_BASE });
export const aiApi = axios.create({ baseURL: AI_BASE });

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};
