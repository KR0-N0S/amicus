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
  const [lastProfileFetch, setLastProfileFetch] = useState(0);
  
  useEffect(() => {
    // Sprawdź, czy użytkownik jest zalogowany przy starcie aplikacji
    const checkAuth = async () => {
      if (isAuthenticated()) {
        // Najpierw przyjmij dane z localStorage
        const localUser = getCurrentUser();
        if (localUser) {
          console.log("Dane użytkownika z localStorage:", localUser);
          console.log("Organizacje użytkownika z localStorage:", localUser.organizations);
          setUser(localUser);
        }
        
        // Następnie spróbuj pobrać świeże dane z API, ale nie wylogowuj jeśli się nie uda
        try {
          // Pobieraj profil tylko jeśli minęły co najmniej 2 minuty od ostatniego pobrania
          // lub jeśli nie ma danych o organizacjach
          const now = Date.now();
          if (now - lastProfileFetch > 2 * 60 * 1000 || !localUser?.organizations) {
            setLastProfileFetch(now);
            const response = await getCurrentUserProfile();
            if (response.status === 'success') {
              console.log("Pobrano świeże dane użytkownika z API:", response.data.user);
              
              // Log dla debugowania - porównujemy dane
              if (localUser && JSON.stringify(localUser) !== JSON.stringify(response.data.user)) {
                console.log("Różnica między danymi z localStorage a API!");
                console.log("Dane z localStorage:", localUser);
                console.log("Dane z API:", response.data.user);
              }
              
              setUser(response.data.user);
              setCurrentUser(response.data.user); // Aktualizuj dane w localStorage
            }
          }
        } catch (err) {
          console.error('Authentication check failed:', err);
          // Sprawdź, czy błąd jest związany z brakiem internetu lub problemem CORS
          if (err.message.includes('Network Error') || err.message.includes('CORS')) {
            console.warn('Używamy danych z localStorage ze względu na problemy z siecią');
          } else if (err.response?.status === 429) {
            console.warn('Zbyt wiele zapytań, używamy danych z localStorage');
          } else if (err.response?.status === 401) {
            // Token wygasł lub jest nieprawidłowy
            logoutUtil();
            setUser(null);
            return;
          }
          // W innych przypadkach zachowujemy dane z localStorage
        }
      } else {
        // Token wygasł lub jest nieprawidłowy
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []); // Usunięto lastProfileFetch z zależności, aby uniknąć zapętlenia
  
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await loginUser({ email, password });
      
      if (response.status === 'success') {
        // Dodatkowy log dla debugowania
        console.log("Zalogowano pomyślnie, dane użytkownika:", response.data.user);
        console.log("Organizacje użytkownika po zalogowaniu:", response.data.user.organizations);
        
        setUser(response.data.user);
        setLastProfileFetch(Date.now());
        return true;
      } else {
        throw new Error(response.message || 'Błąd logowania');
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Specjalna obsługa błędu 429 - Too Many Requests
      if (err.response?.status === 429) {
        setError('Wykonano zbyt wiele prób logowania. Proszę odczekać kilka minut i spróbować ponownie.');
      } else {
        setError(err.response?.data?.message || err.message || 'Logowanie nie powiodło się');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    logoutUtil();
    setUser(null);
  };
  
  const refreshUserData = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const response = await getCurrentUserProfile();
      if (response.status === 'success') {
        setUser(response.data.user);
        setCurrentUser(response.data.user);
        setLastProfileFetch(Date.now());
        return response.data.user;
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      return null;
    }
  };
  
  const authContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUserData,
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