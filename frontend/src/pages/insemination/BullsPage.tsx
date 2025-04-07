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
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid
} from '@mui/material';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getBulls } from '../../api/bullService';
import { Bull } from '../../types/models';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';

import '../DataList.css';

const ITEMS_PER_PAGE = 25;
const SEARCH_DEBOUNCE_TIME = 500;
const MIN_SEARCH_LENGTH = 3;

// Rozszerzenie interfejsu Bull dla typowania
interface ExtendedBull extends Bull {
  name?: string;
  veterinary_number?: string; // Alias dla vet_number
}

const BullsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSearch = searchParams.get('search') || '';
  const initialBullType = searchParams.get('bull_type') || '';
  const initialBreed = searchParams.get('breed') || '';
  
  // Pobierz organizationId z kontekstu użytkownika
  const organizationId = user?.organizations?.[0]?.id;
  
  const [searchConfig, setSearchConfig] = useState({ 
    page: initialPage, 
    search: initialSearch,
    bull_type: initialBullType,
    breed: initialBreed
  });
  
  const [bulls, setBulls] = useState<ExtendedBull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [breeds, setBreeds] = useState<string[]>([]);
  
  const navigate = useNavigate();
  
  const debouncedSearch = useDebounce(searchConfig.search, SEARCH_DEBOUNCE_TIME);
  
  // Sprawdzenie czy użytkownik ma dostęp do organizacji
  useEffect(() => {
    if (!organizationId) {
      setError('Brak dostępu do organizacji. Skontaktuj się z administratorem.');
      setIsLoading(false);
    }
  }, [organizationId]);
  
  // Funkcja pobierająca dane buhajów
  const fetchBulls = useCallback(async () => {
    if (!organizationId) {
      setError('Brak dostępu do organizacji. Skontaktuj się z administratorem.');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { page, search, bull_type, breed } = searchConfig;
      const trimmedSearch = search.trim();
      
      // Aktualizujemy parametry URL
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('page', page.toString());
      
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        newSearchParams.set('search', trimmedSearch);
      }
      
      if (bull_type) {
        newSearchParams.set('bull_type', bull_type);
      }
      
      if (breed) {
        newSearchParams.set('breed', breed);
      }
      
      setSearchParams(newSearchParams);
      
      // Przygotowanie parametrów zapytania
      const queryParams: Record<string, any> = {
        page, 
        limit: ITEMS_PER_PAGE,
        sort_field: 'name',
        sort_direction: 'asc' as 'asc' | 'desc',
        organization_id: organizationId
      };
      
      // Dodanie opcjonalnych parametrów wyszukiwania
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        queryParams.search = trimmedSearch;
      }
      
      if (bull_type) {
        queryParams.bull_type = bull_type;
      }
      
      if (breed) {
        queryParams.breed = breed;
      }
      
      // Wykonanie zapytania
      const response = await getBulls(queryParams);
      
      const bullsList = response.data || [];
      const paginationInfo = response.pagination || {};
      const totalCount = paginationInfo.totalCount || 0;
      const calculatedTotalPages = paginationInfo.totalPages || Math.ceil(totalCount / ITEMS_PER_PAGE);
      
      setBulls(bullsList);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setTotalItems(totalCount);
      
      // Zbieramy unikalne nazwy ras dla filtra
      const uniqueBreeds = new Set<string>();
      bullsList.forEach((bull: Bull) => {
        if (bull.breed) {
          uniqueBreeds.add(bull.breed);
        }
      });
      
      if (uniqueBreeds.size > 0) {
        setBreeds(Array.from(uniqueBreeds));
      }
      
    } catch (error: any) {
      console.error('Error fetching bulls:', error);
      setError(error.response?.data?.message || 'Nie udało się pobrać listy buhajów');
      setBulls([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchConfig, setSearchParams, organizationId]);

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
  
  // Obsługa zmiany typu buhaja
  const handleBullTypeChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setSearchConfig(prev => ({ ...prev, bull_type: value, page: 1 }));
  };
  
  // Obsługa zmiany rasy
  const handleBreedChange = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setSearchConfig(prev => ({ ...prev, breed: value, page: 1 }));
  };
  
  // useEffect wywołujący fetchBulls po zmianie parametrów wyszukiwania
  useEffect(() => {
    fetchBulls();
  }, [searchConfig.page, debouncedSearch, searchConfig.bull_type, searchConfig.breed, fetchBulls]);

  const navigateToBullDetails = (id: number) => {
    navigate(`/insemination/bulls/${id}`);
  };

  // Funkcja renderująca tłumaczenie typu buhaja
  const renderBullType = (type: string | undefined) => {
    if (!type) return '-';
    
    switch (type) {
      case 'dairy':
        return <Chip label="Mleczny" color="primary" size="small" variant="outlined" />;
      case 'beef':
        return <Chip label="Mięsny" color="secondary" size="small" variant="outlined" />;
      case 'dual':
        return <Chip label="Dwukierunkowy" color="info" size="small" variant="outlined" />;
      default:
        return <Chip label={type} size="small" variant="outlined" />;
    }
  };

  const cardActions = (
    <Button
      variant="primary"
      icon={<FaPlus />}
      onClick={() => navigate('/insemination/bulls/new')}
    >
      Dodaj buhaja
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
        Wyświetlanie {startItem}-{endItem} z {totalItems} buhajów
      </Typography>
    );
  };

  return (
    <div className="bulls-list">
      <Card title="Lista buhajów" actions={cardActions}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <div className="search-container">
              <TextField
                className="search-input"
                placeholder={`Szukaj buhajów (min. ${MIN_SEARCH_LENGTH} znaki)...`}
                variant="outlined"
                size="small"
                fullWidth
                value={searchConfig.search}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <FaSearch className="search-icon" style={{ marginRight: 8 }} />
                }}
              />
            </div>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="bull-type-label">Typ buhaja</InputLabel>
              <Select
                labelId="bull-type-label"
                id="bull-type-select"
                value={searchConfig.bull_type}
                onChange={handleBullTypeChange}
                label="Typ buhaja"
              >
                <MenuItem value="">Wszystkie</MenuItem>
                <MenuItem value="dairy">Mleczne</MenuItem>
                <MenuItem value="beef">Mięsne</MenuItem>
                <MenuItem value="dual">Dwukierunkowe</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="breed-label">Rasa</InputLabel>
              <Select
                labelId="breed-label"
                id="breed-select"
                value={searchConfig.breed}
                onChange={handleBreedChange}
                label="Rasa"
              >
                <MenuItem value="">Wszystkie</MenuItem>
                {breeds.map((breed) => (
                  <MenuItem key={breed} value={breed}>{breed}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {error && <Alert severity="error">{error}</Alert>}
        
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : (
          <div className="table-container">
            {bulls.length === 0 ? (
              <div className="empty-message">
                {searchConfig.search.trim().length >= MIN_SEARCH_LENGTH || searchConfig.bull_type || searchConfig.breed ? 
                  'Nie znaleziono buhajów spełniających kryteria wyszukiwania' : 
                  'Nie znaleziono buhajów'}
              </div>
            ) : (
              <>
                {renderPaginationInfo()}
                {renderPagination()}
                <Paper elevation={0}>
                  <Table className="data-table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '25%' }}>Nazwa</TableCell>
                        <TableCell sx={{ width: '20%' }}>Nr identyfikacyjny</TableCell>
                        <TableCell sx={{ width: '15%' }}>Rasa</TableCell>
                        <TableCell sx={{ width: '20%' }}>Typ buhaja</TableCell>
                        <TableCell sx={{ width: '10%' }}>Nr weterynaryjny</TableCell>
                        <TableCell sx={{ width: '10%' }} align="center">Akcje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulls.map((bull) => (
                        <TableRow 
                          key={bull.id}
                          onClick={() => navigateToBullDetails(bull.id)}
                          hover
                          className="clickable-row"
                        >
                          <TableCell>{bull.name || bull.identification_number}</TableCell>
                          <TableCell>{bull.identification_number}</TableCell>
                          <TableCell>{bull.breed || '-'}</TableCell>
                          <TableCell>{renderBullType(bull.bull_type)}</TableCell>
                          <TableCell>{bull.veterinary_number || bull.vet_number || '-'}</TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <div className="action-buttons">
                              <Button 
                                icon={<FaEye size={18} />} 
                                variant="secondary"
                                tooltip="Zobacz"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToBullDetails(bull.id);
                                }}
                              />
                              <Button 
                                icon={<FaEdit size={18} />} 
                                variant="warning"
                                tooltip="Edytuj"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/insemination/bulls/${bull.id}/edit`);
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

export default BullsPage;