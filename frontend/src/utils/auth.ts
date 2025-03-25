import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  exp: number;
}

// Zapisywanie tokenu po zalogowaniu (tylko access token)
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

// Pobieranie tokenu do zapytań
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Sprawdzenie czy użytkownik jest zalogowany
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    
    // Token wygasł, ale nie usuwamy go od razu - pozwalamy interceptorowi próbować odświeżyć
    if (decoded.exp < currentTime) {
      // Jesteśmy w widoku statycznym, więc nie odświeżamy automatycznie
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

// Wylogowanie - teraz również czyści refresh token przez API
export const logout = async (): Promise<void> => {
  try {
    // Wywołanie endpointu logout, który usuwa refresh token cookie
    await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/auth/logout`, {
      method: 'POST',
      credentials: 'include',  // Ważne dla wysyłania cookies
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Zawsze usuwamy lokalne dane, niezależnie od wyniku zapytania
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Pobranie danych użytkownika z dodatkowym zabezpieczeniem
export const getCurrentUser = (): any => {
  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      return JSON.parse(userString);
    } catch (e) {
      console.error('Error parsing user data from localStorage:', e);
      localStorage.removeItem('user'); // Usuń uszkodzone dane
      return null;
    }
  }
  return null;
};

// Zapisanie danych użytkownika
export const setCurrentUser = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
};