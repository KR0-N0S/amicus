import { useState, useEffect, useCallback, useRef } from 'react';
import { saveUserPreference, loadUserPreference } from '../utils/userPreferences';

/**
 * Hook do zarządzania filtrami list danych z persistencją
 */
const useDataFilters = <T extends Record<string, any>>(
  initialFilters: T,
  userId?: number,
  storageKey?: string
) => {
  // Stan filtrów
  const [filters, setFilters] = useState<T>(initialFilters);
  
  // Czy filtry zostały zmodyfikowane
  const [hasModifiedFilters, setHasModifiedFilters] = useState(false);
  
  // Referencja do początkowego stanu filtrów, aby uniknąć nieskończonej pętli
  const initialFiltersRef = useRef<T>(initialFilters);
  
  // Referencja do flagi wskazującej, czy filtry zostały już wczytane
  const filtersLoaded = useRef<boolean>(false);
  
  // Wczytaj zapisane filtry przy inicjalizacji - tylko raz
  useEffect(() => {
    // Zapobiegaj wielokrotnemu wczytywaniu filtrów
    if (filtersLoaded.current) return;
    
    if (userId && storageKey) {
      const savedFiltersJson = loadUserPreference(storageKey, userId);
      if (savedFiltersJson) {
        try {
          const savedFilters = JSON.parse(savedFiltersJson);
          setFilters(prev => ({ ...prev, ...savedFilters }));
          
          // Sprawdź czy filtry różnią się od domyślnych
          const hasChanges = Object.keys(savedFilters).some(key => {
            if (Array.isArray(savedFilters[key]) && Array.isArray(initialFiltersRef.current[key])) {
              return JSON.stringify(savedFilters[key]) !== JSON.stringify(initialFiltersRef.current[key]);
            }
            return savedFilters[key] !== initialFiltersRef.current[key];
          });
          
          setHasModifiedFilters(hasChanges);
          filtersLoaded.current = true;
        } catch (e) {
          console.error('Błąd podczas parsowania zapisanych filtrów:', e);
          filtersLoaded.current = true;
        }
      } else {
        filtersLoaded.current = true;
      }
    } else {
      filtersLoaded.current = true;
    }
  }, [userId, storageKey]); // Usunięto initialFilters z zależności
  
  // Ustaw pojedynczy filtr
  const setFilter = useCallback((key: keyof T, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setHasModifiedFilters(true);
  }, []);
  
  // Resetuj filtry do wartości początkowych
  const resetFilters = useCallback(() => {
    setFilters(initialFiltersRef.current); // Używamy referencji
    setHasModifiedFilters(false);
    
    // Usuń zapisane filtry
    if (userId && storageKey) {
      saveUserPreference(storageKey, userId, JSON.stringify(initialFiltersRef.current));
    }
  }, [userId, storageKey]); // Usunięto initialFilters z zależności
  
  // Ustaw wiele filtrów naraz
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setHasModifiedFilters(true);
  }, []);
  
  // Zapisz filtry w storage
  const saveFilters = useCallback(() => {
    if (userId && storageKey) {
      saveUserPreference(storageKey, userId, JSON.stringify(filters));
    }
  }, [filters, userId, storageKey]);
  
  return {
    filters,
    setFilter,
    resetFilters,
    setFilters: updateFilters,
    saveFilters,
    hasModifiedFilters
  };
};

export default useDataFilters;