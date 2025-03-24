import axios from 'axios';
import { getToken } from '../utils/auth';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor do dodawania tokenu do każdego zapytania
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor do obsługi błędów (zmodyfikowany)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Wyloguj tylko gdy backend wyraźnie zwraca 401 i nie jest to 
    // problem z siecią lub inny błąd techniczny
    if (
      error.response && 
      error.response.status === 401 && 
      error.response.data && 
      error.response.data.message === 'Unauthorized: Invalid token'
    ) {
      // Wyloguj tylko jeśli token jest nieprawidłowy,
      // nie przy każdym błędzie 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;