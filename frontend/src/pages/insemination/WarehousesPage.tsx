import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaEye, 
  FaArrowLeft, 
  FaArrowRight,
  FaWarehouse
} from 'react-icons/fa';
import { 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Paper, 
  TextField,
  CircularProgress,
  Alert,
  Pagination,
  PaginationItem,
  Box,
  Typography,
  Tabs,
  Tab
} from '@mui/material';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getWarehouses } from '../../api/warehouseService';
import useDebounce from '../../hooks/useDebounce';

import '../DataList.css';

const ITEMS_PER_PAGE = 25;
const SEARCH_DEBOUNCE_TIME = 500;
const MIN_SEARCH_LENGTH = 3;

interface Warehouse {
  id: number;
  warehouse_type: string;
  container_number?: string;
  location?: string;
  owner_id?: number;
  current_stock?: number;
  last_updated?: string;
}

const WarehousesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSearch = searchParams.get('search') || '';
  const initialTab = searchParams.get('type') || 'all';
  
  const [searchConfig, setSearchConfig] = useState({ 
    page: initialPage, 
    search: initialSearch,
    tab: initialTab
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  
  const debouncedSearch = useDebounce(searchConfig.search, SEARCH_DEBOUNCE_TIME);
  
  // Funkcja formatująca typ magazynu
  const formatWarehouseType = (type: string) => {
    switch (type) {
      case 'main': return 'Główny';
      case 'sub': return 'Poboczny';
      default: return type;
    }
  };
  
  // Funkcja pobierająca dane magazynów
  const fetchWarehouses = useCallback(async (page: number, search = '', tab = 'all') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const trimmedSearch = search.trim();
      
      // Aktualizujemy parametry URL
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('page', page.toString());
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        newSearchParams.set('search', trimmedSearch);
      }
      if (tab !== 'all') {
        newSearchParams.set('type', tab);
      }
      setSearchParams(newSearchParams);
      
      let params: any = { page, limit: ITEMS_PER_PAGE };
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        params.search = trimmedSearch;
      }
      if (tab !== 'all') {
        params.warehouse_type = tab;
      }
      
      const response = await getWarehouses(params);
      
      const warehousesList = response.data || [];
      const paginationInfo = response.pagination || {};
      const totalCount = paginationInfo.totalCount || 0;
      const calculatedTotalPages = paginationInfo.totalPages || Math.ceil(totalCount / ITEMS_PER_PAGE);
      
      setWarehouses(warehousesList);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setTotalItems(totalCount);
      
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      setError(error.response?.data?.message || 'Nie udało się pobrać listy magazynów');
      setWarehouses([]);
    } finally {
      setIsLoading(false);
    }
  }, [setSearchParams]);

  // Obsługa zmiany strony
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setSearchConfig(prev => ({ ...prev, page: value }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obsługa wyszukiwania
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchConfig(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Obsługa zmiany zakładki
  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSearchConfig(prev => ({ ...prev, tab: newValue, page: 1 }));
  };
  
  // useEffect wywołujący fetchWarehouses, gdy zmieni się page, debouncedSearch lub tab
  useEffect(() => {
    fetchWarehouses(searchConfig.page, debouncedSearch, searchConfig.tab);
  }, [searchConfig.page, debouncedSearch, searchConfig.tab, fetchWarehouses]);

  const navigateToWarehouseDetails = (id: number) => {
    navigate(`/insemination/warehouses/${id}`);
  };

  const cardActions = (
    <Button
      variant="primary"
      icon={<FaPlus />}
      onClick={() => navigate('/insemination/warehouses/new')}
    >
      Dodaj magazyn
    </Button>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2 }}>
        <Pagination
          count={totalPages}
          page={searchConfig.page}
          onChange={handlePageChange}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
          renderItem={(item) => (
            <PaginationItem components={{ previous: FaArrowLeft, next: FaArrowRight }} {...item} />
          )}
        />
      </Box>
    );
  };

  const renderPaginationInfo = () => {
    if (totalItems === 0) return null;
    const startItem = (searchConfig.page - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(searchConfig.page * ITEMS_PER_PAGE, totalItems);
    return (
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1, mb: 1 }}>
        Wyświetlanie {startItem}-{endItem} z {totalItems} magazynów
      </Typography>
    );
  };

  return (
    <div className="warehouses-list">
      <Card title="Magazyny nasienia" actions={cardActions}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={searchConfig.tab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab value="all" label="Wszystkie" />
            <Tab value="main" label="Główne" />
            <Tab value="sub" label="Poboczne" />
          </Tabs>
        </Box>
        
        <div className="card-actions">
          <div className="search-container">
            <TextField
              className="search-input"
              placeholder={`Szukaj magazynów (min. ${MIN_SEARCH_LENGTH} znaki)...`}
              variant="outlined"
              size="small"
              fullWidth
              value={searchConfig.search}
              onChange={handleSearch}
            />
            <FaSearch className="search-icon" />
          </div>
        </div>
        
        {error && <Alert severity="error">{error}</Alert>}
        
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : (
          <div className="table-container">
            {warehouses.length === 0 ? (
              <div className="empty-message">
                {searchConfig.search.trim().length >= MIN_SEARCH_LENGTH ? 
                  `Nie znaleziono magazynów dla "${searchConfig.search.trim()}"` : 
                  'Nie znaleziono magazynów'}
              </div>
            ) : (
              <>
                {renderPaginationInfo()}
                {renderPagination()}
                <Paper elevation={0}>
                  <Table className="data-table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '25%' }}>Numer kontenera</TableCell>
                        <TableCell sx={{ width: '20%' }}>Typ magazynu</TableCell>
                        <TableCell sx={{ width: '25%' }}>Lokalizacja</TableCell>
                        <TableCell sx={{ width: '15%' }}>Stan magazynu</TableCell>
                        <TableCell sx={{ width: '15%' }} align="center">Akcje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {warehouses.map((warehouse) => (
                        <TableRow 
                          key={warehouse.id}
                          onClick={() => navigateToWarehouseDetails(warehouse.id)}
                          hover
                          className="clickable-row"
                        >
                          <TableCell>{warehouse.container_number || '-'}</TableCell>
                          <TableCell>{formatWarehouseType(warehouse.warehouse_type)}</TableCell>
                          <TableCell>{warehouse.location || '-'}</TableCell>
                          <TableCell>{warehouse.current_stock !== undefined ? `${warehouse.current_stock} szt.` : '-'}</TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <div className="action-buttons">
                              <Button 
                                icon={<FaEye size={18} />} 
                                variant="secondary"
                                tooltip="Zobacz"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToWarehouseDetails(warehouse.id);
                                }}
                              />
                              <Button 
                                icon={<FaEdit size={18} />} 
                                variant="warning"
                                tooltip="Edytuj"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/insemination/warehouses/${warehouse.id}/edit`);
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
                {renderPagination()}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WarehousesPage;