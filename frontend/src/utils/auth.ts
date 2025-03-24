import { jwtDecode } from 'jwt-decode'; // Poprawny import

interface DecodedToken {
  userId: number;
  email: string;
  exp: number;
}

// Zapisywanie tokenu po zalogowaniu
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
    
    // Token wygasł
    if (decoded.exp < currentTime) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

// Wylogowanie
export const logout = (): void => {
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