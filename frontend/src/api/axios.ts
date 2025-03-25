import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, setToken } from '../utils/auth';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Ważne dla obsługi cookies
});

// Flaga wskazująca, czy aktualnie odświeżamy token
let isRefreshing = false;
// Tablica oczekujących żądań do ponowienia po odświeżeniu tokenu
let refreshSubscribers: ((token: string) => void)[] = [];

// Funkcja dodająca subskrybentów oczekujących na nowy token
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Funkcja powiadamiająca wszystkich subskrybentów o nowym tokenie
const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

// Funkcja do odświeżania tokenu
const refreshToken = async (): Promise<string> => {
  try {
    const response = await axios.post<{status: string, data: {token: string}}>(
      `${baseURL}/auth/refresh-token`, 
      {}, 
      { withCredentials: true } // To pozwala na wysyłanie cookies
    );
    
    const newToken = response.data.data.token;
    setToken(newToken);
    return newToken;
  } catch (error) {
    // Jeśli nie można odświeżyć tokenu, wyloguj użytkownika
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw error;
  }
};

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

// Interceptor do obsługi błędów i odświeżania tokenu
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Sprawdź czy błąd to wygaśnięcie tokenu i czy to jest pierwsze podejście
    if (
      error.response?.status === 401 && 
      error.response?.data && 
      (error.response?.data as any).code === 'TOKEN_EXPIRED' && 
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Jeśli już odświeżamy token, dodaj to żądanie do oczekujących
        return new Promise<AxiosResponse>((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      // Oznacz, że rozpoczynamy odświeżanie tokenu
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Odśwież token
        const newToken = await refreshToken();
        // Powiadom subskrybentów o nowym tokenie
        onTokenRefreshed(newToken);
        // Ustaw nowy token w oryginalnym żądaniu
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        // Zakończ odświeżanie
        isRefreshing = false;
        // Ponów oryginalne żądanie
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // Wyloguj tylko gdy backend wyraźnie zwraca błąd INVALID_TOKEN
    if (
      error.response?.status === 401 && 
      error.response?.data && 
      (error.response?.data as any).code === 'INVALID_TOKEN'
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;