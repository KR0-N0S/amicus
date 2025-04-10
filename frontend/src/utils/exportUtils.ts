import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

/**
 * Funkcja eksportująca dane do formatu CSV
 * @param data - Dane do wyeksportowania
 * @param filename - Nazwa pliku bez rozszerzenia
 * @param headers - Opcjonalne mapowanie nagłówków
 * @returns Czy eksport się powiódł
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[], 
  filename: string, 
  headers?: Record<keyof T, string>
): boolean {
  if (!data || !data.length) {
    console.warn('No data to export');
    return false;
  }

  try {
    // Tworzenie nagłówków
    const headerRow = headers 
      ? Object.keys(headers).map(key => headers[key as keyof T])
      : Object.keys(data[0] as Record<string, any>);
    
    // Przygotowanie wierszy danych
    const csvRows = data.map(item => {
      return Object.keys(item as Record<string, any>).map(key => {
        // Pobierz wartość dla danego klucza
        const value = item[key];
        
        // Konwersja specjalnych typów danych
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]; // Format YYYY-MM-DD
        }
        
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value).replace(/"/g, '""');
        }
        
        // Dla string'ów - escapowanie cudzysłowów i dodanie cudzysłowów jeśli zawiera przecinek
        if (typeof value === 'string') {
          const escaped = value.replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        }
        
        return value === null || value === undefined ? '' : String(value);
      }).join(',');
    });
    
    // Połączenie nagłówków i wierszy
    const csvContent = [headerRow.join(','), ...csvRows].join('\n');
    
    // Utworzenie Blob i pobranie pliku
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
}

/**
 * Funkcja eksportująca dane do formatu Excel (XLSX)
 * @param data - Dane do wyeksportowania
 * @param filename - Nazwa pliku bez rozszerzenia
 * @param headers - Opcjonalne mapowanie nagłówków
 * @returns Czy eksport się powiódł
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[], 
  filename: string, 
  headers?: Record<keyof T, string>
): boolean {
  if (!data || !data.length) {
    console.warn('No data to export');
    return false;
  }

  try {
    let exportData: Record<string, any>[] = data;

    // Jeśli mamy własne nagłówki, mapujemy dane
    if (headers) {
      exportData = data.map(item => {
        const mappedItem: Record<string, any> = {};
        Object.keys(headers).forEach(key => {
          const header = headers[key as keyof T];
          mappedItem[header] = item[key as keyof T];
        });
        return mappedItem;
      });
    }

    // Utworzenie arkusza kalkulacyjnego
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Zapisanie pliku
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

/**
 * Funkcja przygotowująca formularz eksportu danych
 */
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeHeaders: boolean;
  customFilename?: string;
  selectedColumns?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}