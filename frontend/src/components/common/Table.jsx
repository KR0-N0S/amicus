import React, { useState } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaEdit, FaTrash } from 'react-icons/fa';
import StatusBadge from './StatusBadge';
import './Table.css';

const Table = ({ columns, data, onRowClick, actions = true }) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'none'
  });
  
  const handleSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = 'none';
        key = null;
      }
    }
    
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort />;
    if (sortConfig.direction === 'asc') return <FaSortUp />;
    if (sortConfig.direction === 'desc') return <FaSortDown />;
    return <FaSort />;
  };
  
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);
  
  const renderCellContent = (item, column) => {
    if (column.key === 'status') {
      return <StatusBadge status={item[column.key]} />;
    }
    
    if (column.render) {
      return column.render(item);
    }
    
    return item[column.key];
  };
  
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className={column.sortable ? 'sortable' : ''}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                {column.title}
                {column.sortable && (
                  <span className="sort-icon">
                    {getSortIcon(column.key)}
                  </span>
                )}
              </th>
            ))}
            {actions && <th className="actions-column">Akcje</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((item) => (
              <tr 
                key={item.id} 
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((column) => (
                  <td key={`${item.id}-${column.key}`}>
                    {renderCellContent(item, column)}
                  </td>
                ))}
                {actions && (
                  <td className="actions-cell">
                    <button 
                      className="action-button edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement edit action
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-button delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement delete action
                      }}
                    >
                      <FaTrash />
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="no-data">
                Brak danych
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
