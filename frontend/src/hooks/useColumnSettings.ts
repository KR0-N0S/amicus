import { useState, useEffect, useCallback } from 'react';
import { saveUserPreference, loadUserPreference } from '../utils/userPreferences';

type ColumnSettingsType = Record<string, boolean>;

interface Column {
  key: string;
  visible?: boolean;
  [key: string]: any;
}

/**
 * Hook do zarządzania widocznością kolumn w tabelach
 */
const useColumnSettings = <T extends Column>(
  columns: T[],
  userId?: number,
  storageKey?: string
) => {
  // Stan ustawień kolumn
  const [columnSettings, setColumnSettings] = useState<ColumnSettingsType>({});
  
  // Czy ustawienia zostały zmodyfikowane względem domyślnych
  const [hasModifiedSettings, setHasModifiedSettings] = useState(false);
  
  // Inicjalizacja ustawień na podstawie domyślnych wartości i zapisanych preferencji
  useEffect(() => {
    // Utwórz domyślne ustawienia z definicji kolumn
    const defaultSettings: ColumnSettingsType = {};
    columns.forEach(column => {
      defaultSettings[column.key] = column.visible !== false;
    });
    
    // Próba wczytania zapisanych ustawień
    if (userId && storageKey) {
      const savedSettingsJson = loadUserPreference(storageKey, userId);
      if (savedSettingsJson) {
        try {
          const savedSettings = JSON.parse(savedSettingsJson);
          
          // Porównaj z domyślnymi i ustaw flagę modyfikacji
          setHasModifiedSettings(
            Object.keys(defaultSettings).some(
              key => savedSettings[key] !== defaultSettings[key]
            )
          );
          
          // Użyj zapisanych ustawień, ale zachowaj domyślne dla nowych kolumn
          setColumnSettings({ ...defaultSettings, ...savedSettings });
          return;
        } catch (e) {
          console.error('Błąd podczas parsowania zapisanych ustawień kolumn:', e);
        }
      }
    }
    
    // Jeśli nie ma zapisanych ustawień, użyj domyślnych
    setColumnSettings(defaultSettings);
    setHasModifiedSettings(false);
  }, [columns, userId, storageKey]);
  
  // Przełączanie widoczności kolumny
  const toggleColumn = useCallback((columnKey: string, forcedValue?: boolean) => {
    setColumnSettings(prev => {
      const newValue = forcedValue !== undefined ? forcedValue : !prev[columnKey];
      const newSettings = { ...prev, [columnKey]: newValue };
      
      // Zapisz nowe ustawienia
      if (userId && storageKey) {
        saveUserPreference(storageKey, userId, JSON.stringify(newSettings));
      }
      
      return newSettings;
    });
    
    setHasModifiedSettings(true);
  }, [userId, storageKey]);
  
  // Resetowanie ustawień do domyślnych
  const resetColumns = useCallback(() => {
    const defaultSettings: ColumnSettingsType = {};
    columns.forEach(column => {
      defaultSettings[column.key] = column.visible !== false;
    });
    
    setColumnSettings(defaultSettings);
    setHasModifiedSettings(false);
    
    // Zapisz domyślne ustawienia
    if (userId && storageKey) {
      saveUserPreference(storageKey, userId, JSON.stringify(defaultSettings));
    }
  }, [columns, userId, storageKey]);
  
  // Lista widocznych kolumn
  const visibleColumns = columns.filter(column => columnSettings[column.key] !== false);
  
  return {
    columnSettings,
    toggleColumn,
    resetColumns,
    visibleColumns,
    hasModifiedSettings
  };
};

export default useColumnSettings;