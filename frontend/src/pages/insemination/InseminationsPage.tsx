import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaEye, 
  FaArrowLeft, 
  FaArrowRight 
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
  Typography
} from '@mui/material';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getInseminations } from '../../api/inseminationService';
import { Insemination } from '../../types/models';
import useDebounce from '../../hooks/useDebounce';

import '../DataList.css';

const ITEMS_PER_PAGE = 25;
const SEARCH_DEBOUNCE_TIME = 500;
const MIN_SEARCH_LENGTH = 3;

const InseminationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSearch = searchParams.get('search') || '';
  
  const [searchConfig, setSearchConfig] = useState({ page: initialPage, search: initialSearch });
  const [inseminations, setInseminations] = useState<Insemination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  
  const debouncedSearch = useDebounce(searchConfig.search, SEARCH_DEBOUNCE_TIME);
  
  // Funkcja formatująca datę
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };
  
  // Funkcja pobierająca dane inseminacji
  const fetchInseminations = useCallback(async (page: number, search = '') => {
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
      setSearchParams(newSearchParams);
      
      let params: any = { page, limit: ITEMS_PER_PAGE };
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        params.search = trimmedSearch;
      }
      
      const response = await getInseminations(params);
      
      const inseminationsList = response.data || [];
      const paginationInfo = response.pagination || {};
      const totalCount = paginationInfo.totalCount || 0;
      const calculatedTotalPages = paginationInfo.totalPages || Math.ceil(totalCount / ITEMS_PER_PAGE);
      
      setInseminations(inseminationsList);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setTotalItems(totalCount);
      
    } catch (error: any) {
      console.error('Error fetching inseminations:', error);
      setError(error.response?.data?.message || 'Nie udało się pobrać listy inseminacji');
      setInseminations([]);
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
  
  // useEffect wywołujący fetchInseminations, gdy zmieni się page lub debouncedSearch
  useEffect(() => {
    fetchInseminations(searchConfig.page, debouncedSearch);
  }, [searchConfig.page, debouncedSearch, fetchInseminations]);

  const navigateToInseminationDetails = (id: number) => {
    navigate(`/insemination/registers/${id}`);
  };

  const cardActions = (
    <Button
      variant="primary"
      icon={<FaPlus />}
      onClick={() => navigate('/insemination/registers/new')}
    >
      Dodaj zabieg
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
        Wyświetlanie {startItem}-{endItem} z {totalItems} zabiegów
      </Typography>
    );
  };

  return (
    <div className="inseminations-list">
      <Card title="Rejestr zabiegów inseminacji" actions={cardActions}>
        <div className="card-actions">
          <div className="search-container">
            <TextField
              className="search-input"
              placeholder={`Szukaj zabiegów (min. ${MIN_SEARCH_LENGTH} znaki)...`}
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
            {inseminations.length === 0 ? (
              <div className="empty-message">
                {searchConfig.search.trim().length >= MIN_SEARCH_LENGTH ? 
                  `Nie znaleziono zabiegów dla "${searchConfig.search.trim()}"` : 
                  'Nie znaleziono zabiegów inseminacji'}
              </div>
            ) : (
              <>
                {renderPaginationInfo()}
                {renderPagination()}
                <Paper elevation={0}>
                  <Table className="data-table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '15%' }}>Nr certyfikatu</TableCell>
                        <TableCell sx={{ width: '15%' }}>Data zabiegu</TableCell>
                        <TableCell sx={{ width: '15%' }}>Nr kolczyka</TableCell>
                        <TableCell sx={{ width: '20%' }}>Buhaj</TableCell>
                        <TableCell sx={{ width: '15%' }}>Inseminator</TableCell>
                        <TableCell sx={{ width: '10%' }}>Status</TableCell>
                        <TableCell sx={{ width: '10%' }} align="center">Akcje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inseminations.map((insemination) => (
                        <TableRow 
                          key={insemination.id}
                          onClick={() => navigateToInseminationDetails(insemination.id)}
                          hover
                          className="clickable-row"
                        >
                          <TableCell>{insemination.certificate_number}</TableCell>
                          <TableCell>{formatDate(insemination.procedure_date)}</TableCell>
                          <TableCell>{insemination.ear_tag_number || '-'}</TableCell>
                          <TableCell>{insemination.name || insemination.bull_id || '-'}</TableCell>
                          <TableCell>{insemination.inseminator || '-'}</TableCell>
                          <TableCell>{insemination.symlek_status || '-'}</TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <div className="action-buttons">
                              <Button 
                                icon={<FaEye size={18} />} 
                                variant="secondary"
                                tooltip="Zobacz"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToInseminationDetails(insemination.id);
                                }}
                              />
                              <Button 
                                icon={<FaEdit size={18} />} 
                                variant="warning"
                                tooltip="Edytuj"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/insemination/registers/${insemination.id}/edit`);
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

export default InseminationsPage;