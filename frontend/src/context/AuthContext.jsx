import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getCurrentUserProfile } from '../api/authService';
import { 
  isAuthenticated, 
  getToken, 
  getCurrentUser, 
  setCurrentUser,
  logout as logoutUtil 
} from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getCurrentUser()); // Inicjalizacja ze stanu lokalnego
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Sprawdź, czy użytkownik jest zalogowany przy starcie aplikacji
    const checkAuth = async () => {
      if (isAuthenticated()) {
        // Najpierw przyjmij dane z localStorage
        const localUser = getCurrentUser();
        if (localUser && !user) {
          setUser(localUser);
        }
        
        // Następnie spróbuj pobrać świeże dane z API, ale nie wylogowuj jeśli się nie uda
        try {
          const response = await getCurrentUserProfile();
          if (response.status === 'success') {
            setUser(response.data.user);
            setCurrentUser(response.data.user); // Aktualizuj dane w localStorage
          }
        } catch (err) {
          console.error('Authentication check failed:', err);
          // Nie wylogowujemy użytkownika automatycznie w przypadku błędu API
          // Zostawiamy dane z localStorage
        }
      } else {
        // Token wygasł lub jest nieprawidłowy
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await loginUser({ email, password });
      
      if (response.status === 'success') {
        setUser(response.data.user);
        return true;
      } else {
        throw new Error(response.message || 'Błąd logowania');
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || err.message || 'Logowanie nie powiodło się');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    logoutUtil();
    setUser(null);
  };
  
  const authContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: isAuthenticated(), // Używaj funkcji z auth.ts zamiast stanu komponentu
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  
  return context;
};