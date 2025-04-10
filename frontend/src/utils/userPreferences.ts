/**
 * Moduł zarządzający preferencjami użytkownika w localStorage
 */

/**
 * Zapisuje preferencję użytkownika do localStorage
 * @param key Klucz preferencji
 * @param userId ID użytkownika
 * @param value Wartość do zapisania
 */
export const saveUserPreference = (key: string, userId: number, value: string): void => {
    try {
      const userKey = `${key}_user_${userId}`;
      localStorage.setItem(userKey, value);
    } catch (error) {
      console.error('Error saving user preference:', error);
    }
  };
  
  /**
   * Pobiera preferencję użytkownika z localStorage
   * @param key Klucz preferencji
   * @param userId ID użytkownika
   * @returns Zapisana wartość lub null jeśli nie znaleziono
   */
  export const loadUserPreference = (key: string, userId: number): string | null => {
    try {
      const userKey = `${key}_user_${userId}`;
      return localStorage.getItem(userKey);
    } catch (error) {
      console.error('Error loading user preference:', error);
      return null;
    }
  };
  
  /**
   * Usuwa preferencję użytkownika z localStorage
   * @param key Klucz preferencji
   * @param userId ID użytkownika
   */
  export const deleteUserPreference = (key: string, userId: number): void => {
    try {
      const userKey = `${key}_user_${userId}`;
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Error deleting user preference:', error);
    }
  };