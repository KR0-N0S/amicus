import { useState, useCallback, useEffect } from 'react';
import { saveUserPreference, loadUserPreference } from '../utils/userPreferences';

// Interfejs dla zapisanego widoku
export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  columns: Record<string, boolean>;
  sortConfig: {
    column: string;
    direction: 'asc' | 'desc' | 'none';
  };
}

/**
 * Hook do zarządzania zapisanymi widokami list
 */
const useSavedViews = (
  userId?: number,
  storageKey?: string
) => {
  // Stan zapisanych widoków
  const [views, setViews] = useState<SavedView[]>([]);
  
  // Aktywny widok
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  
  // Wczytaj zapisane widoki przy inicjalizacji
  useEffect(() => {
    if (userId && storageKey) {
      const savedViewsJson = loadUserPreference(storageKey, userId);
      if (savedViewsJson) {
        try {
          const savedViews = JSON.parse(savedViewsJson);
          if (Array.isArray(savedViews)) {
            setViews(savedViews);
          }
        } catch (e) {
          console.error('Błąd podczas wczytywania zapisanych widoków:', e);
        }
      }
    }
  }, [userId, storageKey]);
  
  // Zapisz nowy widok
  const saveView = useCallback((
    name: string,
    filters: Record<string, any>,
    columns: Record<string, boolean>,
    sortConfig: { column: string; direction: 'asc' | 'desc' | 'none' }
  ) => {
    const newView: SavedView = {
      id: `view_${Date.now()}`,
      name,
      filters,
      columns,
      sortConfig
    };
    
    setViews(prev => {
      const updatedViews = [...prev, newView];
      
      // Zapisz w localStorage
      if (userId && storageKey) {
        saveUserPreference(storageKey, userId, JSON.stringify(updatedViews));
      }
      
      return updatedViews;
    });
    
    return newView;
  }, [userId, storageKey]);
  
  // Usuń widok
  const deleteView = useCallback((viewId: string) => {
    setViews(prev => {
      const filteredViews = prev.filter(v => v.id !== viewId);
      
      // Zapisz w localStorage
      if (userId && storageKey) {
        saveUserPreference(storageKey, userId, JSON.stringify(filteredViews));
      }
      
      return filteredViews;
    });
    
    // Resetuj aktywny widok jeśli był usunięty
    if (activeViewId === viewId) {
      setActiveViewId(null);
    }
  }, [activeViewId, userId, storageKey]);
  
  // Zastosuj widok
  const applyView = useCallback((viewId: string) => {
    setActiveViewId(viewId);
    return views.find(v => v.id === viewId);
  }, [views]);
  
  // Aktywny widok
  const activeView = views.find(v => v.id === activeViewId);
  
  return {
    views,
    activeViewId,
    activeView,
    saveView,
    deleteView,
    applyView
  };
};

export default useSavedViews;