import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, getCurrentUserProfile } from '../api/authService';
import { 
  isAuthenticated, 
  getToken, 
  getCurrentUser, 
  setCurrentUser,
  logout as logoutUtil,
  verifyUserDataConsistency,
  getDecodedToken 
} from '../utils/auth';
import { User as BaseUser, Organization, Herd } from '../types/models'; // Zmieniono import User na BaseUser

// Rozszerzamy typ User o właściwości, których używamy w kontekście autoryzacji
interface User extends BaseUser {
  organizations?: Organization[];
  herds?: Herd[];
}

// Interfejs dla kontekstu autoryzacji
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUserData: () => Promise<User | null>;
  isAuthenticated: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Tworzymy kontekst z typem
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser() as User | null); // Konwersja typów
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastProfileFetch, setLastProfileFetch] = useState<number>(0);
  
  useEffect(() => {
    // Sprawdź, czy użytkownik jest zalogowany przy starcie aplikacji
    const checkAuth = async () => {
      if (isAuthenticated()) {
        // KLUCZOWA ZMIANA: Sprawdzenie spójności danych użytkownika z tokenem
        if (!verifyUserDataConsistency()) {
          console.error('Wykryto niespójność danych użytkownika z tokenem - wylogowuję...');
          logoutUtil();
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Najpierw przyjmij dane z localStorage
        const localUser = getCurrentUser() as User | null;
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
              console.log("Pobrano organizacje z API:", response.data.organizations);
              
              // KLUCZOWA ZMIANA: Weryfikacja zgodności ID użytkownika z tokenem
              const decodedToken = getDecodedToken();
              if (decodedToken && decodedToken.id.toString() !== response.data.user.id.toString()) {
                console.error('ID użytkownika z API nie zgadza się z tokenem JWT - wylogowuję...');
                logoutUtil();
                setUser(null);
                setLoading(false);
                return;
              }
              
              // Połącz dane użytkownika z organizacjami
              const userWithOrganizations: User = {
                ...response.data.user,
                organizations: response.data.organizations
              };
              
              // Log dla debugowania - porównujemy dane
              if (localUser && localUser.id !== userWithOrganizations.id) {
                console.error("ID użytkownika z localStorage nie zgadza się z ID z API - wylogowuję...");
                logoutUtil();
                setUser(null);
                setLoading(false);
                return;
              }
              
              // Aktualizuj stan i localStorage z połączonymi danymi
              setUser(userWithOrganizations);
              setCurrentUser(userWithOrganizations);
            }
          }
        } catch (err: unknown) {
          console.error('Authentication check failed:', err);
          // Sprawdź, czy błąd jest związany z brakiem internetu lub problemem CORS
          if (err instanceof Error) {
            if (err.message.includes('Network Error') || err.message.includes('CORS')) {
              console.warn('Używamy danych z localStorage ze względu na problemy z siecią');
            }
          }
          
          // Sprawdź czy err ma właściwość response
          const errorWithResponse = err as { response?: { status?: number } };
          if (errorWithResponse.response?.status === 429) {
            console.warn('Zbyt wiele zapytań, używamy danych z localStorage');
          } else if (errorWithResponse.response?.status === 401) {
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
  
  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await loginUser({ email, password });
      
      if (response.status === 'success') {
        // KLUCZOWA ZMIANA: Prawidłowe łączenie użytkownika z jego organizacjami
        const userWithOrganizations: User = {
          ...response.data.user,
          organizations: response.data.organizations || []
        };
        
        // Dodatkowy log dla debugowania
        console.log("Zalogowano pomyślnie, dane użytkownika:", userWithOrganizations);
        console.log("Organizacje użytkownika po zalogowaniu:", userWithOrganizations.organizations);
        
        // Zapisujemy połączone dane do stanu i localStorage
        setUser(userWithOrganizations);
        setCurrentUser(userWithOrganizations);
        setLastProfileFetch(Date.now());
        return true;
      } else {
        throw new Error((response as any).message || 'Błąd logowania');
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      
      // Specjalna obsługa błędu 429 - Too Many Requests
      const errorWithResponse = err as { 
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };
      
      if (errorWithResponse.response?.status === 429) {
        setError('Wykonano zbyt wiele prób logowania. Proszę odczekać kilka minut i spróbować ponownie.');
      } else {
        setError(
          errorWithResponse.response?.data?.message || 
          (err instanceof Error ? err.message : 'Logowanie nie powiodło się')
        );
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
  
  const refreshUserData = async (): Promise<User | null> => {
    if (!isAuthenticated()) return null;
    
    try {
      const response = await getCurrentUserProfile();
      if (response.status === 'success') {
        // KLUCZOWA ZMIANA: Weryfikacja zgodności ID użytkownika z tokenem
        const decodedToken = getDecodedToken();
        if (decodedToken && decodedToken.id.toString() !== response.data.user.id.toString()) {
          console.error('ID użytkownika z API nie zgadza się z tokenem JWT - wylogowuję...');
          logoutUtil();
          setUser(null);
          return null;
        }
        
        // Połącz dane użytkownika z organizacjami
        const userWithOrganizations: User = {
          ...response.data.user,
          organizations: response.data.organizations
        };
        
        setUser(userWithOrganizations);
        setCurrentUser(userWithOrganizations);
        setLastProfileFetch(Date.now());
        return userWithOrganizations;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      return null;
    }
  };
  
  const authContextValue: AuthContextType = {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth musi być używany wewnątrz AuthProvider');
  }
  
  return context;
};

// Eksportujemy interfejs User na potrzeby innych komponentów, które korzystają z kontekstu autoryzacji
export type { User };