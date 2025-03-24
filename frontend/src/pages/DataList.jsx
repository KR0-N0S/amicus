import React, { useState } from 'react';
import Table from '../components/common/Table';
import Card from '../components/common/Card';
import { FaFilter, FaPlus, FaSearch, FaSync } from 'react-icons/fa';
import './DataList.css';

const DataList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Przykładowe dane dla tabeli
  const data = [
    { id: 1, name: 'Zlecenie 001', client: 'Jan Kowalski', date: '2025-03-22', status: 'active', amount: 1250.00 },
    { id: 2, name: 'Zlecenie 002', client: 'Anna Nowak', date: '2025-03-20', status: 'completed', amount: 980.50 },
    { id: 3, name: 'Zlecenie 003', client: 'Piotr Zieliński', date: '2025-03-18', status: 'pending', amount: 3200.75 },
    { id: 4, name: 'Zlecenie 004', client: 'Marta Wiśniewska', date: '2025-03-15', status: 'active', amount: 750.25 },
    { id: 5, name: 'Zlecenie 005', client: 'Michał Nowicki', date: '2025-03-10', status: 'cancelled', amount: 1800.00 },
    { id: 6, name: 'Zlecenie 006', client: 'Katarzyna Lewandowska', date: '2025-03-08', status: 'completed', amount: 2150.30 },
    { id: 7, name: 'Zlecenie 007', client: 'Tomasz Wojciechowski', date: '2025-03-05', status: 'active', amount: 950.00 },
    { id: 8, name: 'Zlecenie 008', client: 'Aleksandra Kowalczyk', date: '2025-03-01', status: 'pending', amount: 3500.75 },
  ];
  
  // Definicja kolumn tabeli
  const columns = [
    { key: 'name', title: 'Nazwa', sortable: true },
    { key: 'client', title: 'Klient', sortable: true },
    { 
      key: 'date', 
      title: 'Data', 
      sortable: true,
      render: (item) => new Date(item.date).toLocaleDateString('pl-PL')
    },
    { key: 'status', title: 'Status', sortable: true },
    { 
      key: 'amount', 
      title: 'Kwota', 
      sortable: true,
      render: (item) => `${item.amount.toFixed(2)} PLN`
    },
  ];
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search logic
    console.log('Searching for:', searchTerm);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Implement filter logic
    console.log('Applying filters:', filters);
    setFilterVisible(false);
  };
  
  const handleResetFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
    });
  };
  
  const handleRowClick = (item) => {
    // Implement row click logic (e.g., navigate to detail view)
    console.log('Row clicked:', item);
  };
  
  return (
    <div className="data-list-page">
      <div className="page-header">
        <h1 className="page-title">Lista danych</h1>
        
        <div className="page-actions">
          <button className="btn btn-primary">
            <FaPlus className="btn-icon" /> Dodaj nowy
          </button>
        </div>
      </div>
      
      <Card>
        <div className="data-list-tools">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-field">
              <input
                type="text"
                placeholder="Szukaj..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-button">
                <FaSearch />
              </button>
            </div>
          </form>
          
          <div className="filter-actions">
            <button 
              className={`btn btn-filter ${filterVisible ? 'active' : ''}`}
              onClick={() => setFilterVisible(!filterVisible)}
            >
              <FaFilter className="btn-icon" /> Filtry
            </button>
            
            <button className="btn btn-refresh">
              <FaSync className="btn-icon" /> Odśwież
            </button>
          </div>
        </div>
        
        {filterVisible && (
          <div className="filter-panel">
            <form onSubmit={handleFilterSubmit}>
              <div className="filter-grid">
                <div className="filter-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Wszystkie</option>
                    <option value="active">Aktywne</option>
                    <option value="pending">Oczekujące</option>
                    <option value="completed">Zakończone</option>
                    <option value="cancelled">Anulowane</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="dateFrom">Data od</label>
                  <input
                    type="date"
                    id="dateFrom"
                    name="dateFrom"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="filter-group">
                  <label htmlFor="dateTo">Data do</label>
                  <input
                    type="date"
                    id="dateTo"
                    name="dateTo"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="filter-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleResetFilters}
                >
                  Resetuj filtry
                </button>
                <button type="submit" className="btn btn-primary">
                  Zastosuj filtry
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="data-list-table">
          <Table 
            columns={columns} 
            data={data} 
            onRowClick={handleRowClick}
          />
        </div>
      </Card>
    </div>
  );
};

export default DataList;
