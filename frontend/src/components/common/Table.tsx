import React, { useState, useMemo, useCallback } from 'react';
import { FiChevronUp, FiChevronDown, FiArrowRight } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import './Table.css';

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (item: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  onRowClick?: (item: any) => void;
  onSort?: (column: string, direction: 'asc' | 'desc' | 'none') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc' | 'none';
  isLoading?: boolean;
}

type SortDirection = 'asc' | 'desc' | 'none';

interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

const Table: React.FC<TableProps> = ({ 
  columns, 
  data, 
  onRowClick, 
  onSort,
  sortColumn: externalSortColumn,
  sortDirection: externalSortDirection,
  isLoading = false
}) => {
  // Wewnętrzne sortowanie, używane tylko gdy nie dostarczono zewnętrznego
  const [internalSortConfig, setInternalSortConfig] = useState<SortConfig>({
    key: externalSortColumn || null,
    direction: externalSortDirection || 'none'
  });
  
  // Używaj dostarczonych props do sortowania
  const sortConfig = useMemo<SortConfig>(() => {
    if (externalSortColumn !== undefined) {
      return { 
        key: externalSortColumn, 
        direction: externalSortDirection || 'asc'
      };
    }
    return internalSortConfig;
  }, [externalSortColumn, externalSortDirection, internalSortConfig]);
  
  // Funkcja obsługująca sortowanie - poprawiona implementacja
  const handleSort = useCallback((key: string) => {
    // Ignoruj kliknięcia podczas ładowania
    if (isLoading) return;
    
    // Rozpoczynamy z kierunkiem asc, chyba że już sortujemy po tej kolumnie
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else {
        direction = 'asc'; // Przełączanie między asc i desc, bez stanu "none"
      }
    }
    
    if (onSort) {
      onSort(key, direction);
    } else {
      setInternalSortConfig({ key, direction });
    }
  }, [sortConfig, onSort, isLoading]);
  
  // Handler dla kliknięcia nagłówka z zatrzymaniem propagacji
  const handleHeaderClick = useCallback((e: React.MouseEvent<HTMLDivElement>, column: TableColumn) => {
    if (column.sortable) {
      e.preventDefault();
      e.stopPropagation();
      handleSort(column.key);
    }
  }, [handleSort]);
  
  // Mapowanie kierunku sortowania na wartości ARIA
  const mapSortDirectionToAria = useCallback((direction: SortDirection): "none" | "ascending" | "descending" | "other" | undefined => {
    if (direction === 'asc') return 'ascending';
    if (direction === 'desc') return 'descending';
    return 'none';
  }, []);
  
  // Ikona sortowania dostosowana do aktualnego stanu
  const getSortIcon = useCallback((columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <FiArrowRight style={{ opacity: 0.3, width: 16 }} />; 
    }
    
    if (sortConfig.direction === 'asc') {
      return <FiChevronUp style={{ width: 16 }} />;
    }
    
    return <FiChevronDown style={{ width: 16 }} />;
  }, [sortConfig]);
  
  // Sortowanie danych lokalnie, jeśli nie używamy zewnętrznego sortowania
  const sortedData = useMemo(() => {
    // Jeśli jest dostarczony zewnętrzny mechanizm sortowania, używamy niesortowanych danych
    if (onSort) return data;
    
    // W przeciwnym wypadku sortujemy lokalnie
    if (!sortConfig.key) return data;
    
    const key = sortConfig.key;
    
    return [...data].sort((a, b) => {
      // Pobieramy wartości do porównania, obsługując zagnieżdżone ścieżki z notacją kropkową
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };
      
      const valA = getNestedValue(a, key);
      const valB = getNestedValue(b, key);
      
      // Bezpieczne porównanie dla przypadków gdy wartości są nullem/undefined
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      
      // Automatyczna detekcja typu i odpowiednie porównanie
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortConfig.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      if (valA instanceof Date && valB instanceof Date) {
        return sortConfig.direction === 'asc'
          ? valA.getTime() - valB.getTime()
          : valB.getTime() - valA.getTime();
      }
      
      // Domyślne porównanie numeryczne lub dla innych typów
      if (valA < valB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (valA > valB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, onSort]);
  
  // Renderowanie zawartości komórki
  const renderCellContent = useCallback((item: any, column: TableColumn) => {
    if (column.key === 'status' && !column.render) {
      try {
        return <StatusBadge status={item[column.key]} customLabel="" />;
      } catch (e) {
        try {
          // @ts-ignore
          return <StatusBadge status={item[column.key]} />;
        } catch {
          return item[column.key] || '-';
        }
      }
    }
    
    if (column.render) {
      return column.render(item);
    }
    
    // Obsługa zagnieżdżonych ścieżek z notacją kropkową
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => 
        acc !== undefined && acc !== null ? acc[part] : undefined, 
        obj
      );
    };
    
    const value = getNestedValue(item, column.key);
    return value !== undefined ? value : '-';
  }, []);
  
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className={`${column.sortable ? 'sortable' : ''} ${sortConfig.key === column.key ? 'active-sort' : ''}`}
                data-sort-key={column.key}
                data-sort-direction={sortConfig.key === column.key ? sortConfig.direction : undefined}
              >
                <div 
                  className={`th-content ${isLoading ? 'disabled' : ''}`}
                  onClick={(e) => handleHeaderClick(e, column)}
                  role={column.sortable ? "button" : undefined}
                  tabIndex={column.sortable && !isLoading ? 0 : undefined}
                  aria-sort={
                    column.sortable && sortConfig.key === column.key 
                      ? mapSortDirectionToAria(sortConfig.direction)
                      : undefined
                  }
                >
                  <span>{column.title}</span>
                  {column.sortable && (
                    <span className="sort-icon">
                      {getSortIcon(column.key)}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={isLoading ? 'loading' : ''}>
          {sortedData.length > 0 ? (
            sortedData.map((item, index) => (
              <tr 
                key={item.id || `row-${index}`} 
                onClick={() => onRowClick && !isLoading && onRowClick(item)}
                className={`${onRowClick && !isLoading ? 'clickable' : ''} ${isLoading ? 'disabled' : ''}`}
              >
                {columns.map((column) => (
                  <td key={`${item.id || index}-${column.key}`}>
                    {renderCellContent(item, column)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="no-data">
                {isLoading ? 'Trwa ładowanie...' : 'Brak danych'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;