import axios from 'axios';

// Cambia esta URL por la del servidor de MoldSchedule
export const API_BASE_URL = 'http://192.168.0.100:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export default api;
