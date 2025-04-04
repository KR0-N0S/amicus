import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaEye, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
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

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getAnimals } from '../api/animalService';
import { Animal } from '../types/models';
import useDebounce from '../hooks/useDebounce';

import './DataList.css';

// Tymczasowo rozszerzamy typ Animal, aby nie było błędów TypeScript
interface ExtendedAnimal extends Animal {
  owner_name?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_city?: string;
  owner_street?: string;
  owner_house_number?: string;
  identifier?: string; // Dla numeru kolczyka
}

const ITEMS_PER_PAGE = 25; // Liczba zwierząt na stronę
const SEARCH_DEBOUNCE_TIME = 500; // 500ms debounce
const MIN_SEARCH_LENGTH = 3; // Minimalna długość frazy wyszukiwania

const FarmAnimalsPage: React.FC = () => {
  // Unikalny identyfikator instancji komponentu do diagnostyki
  const componentId = useRef(`farm-animals-${Math.random().toString(36).substring(2, 9)}`);
  
  // Licznik renderów komponentu
  const renderCount = useRef(0);
  
  // Diagnostyka - log przy każdym renderowaniu
  console.log(`[${new Date().toISOString()}] Renderowanie komponentu ${componentId.current}, render #${++renderCount.current}`);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSearch = searchParams.get('search') || '';
  
  // Referencje do śledzenia ostatnich wartości dla diagnostyki
  const lastPageRef = useRef<number>(initialPage);
  const lastSearchRef = useRef<string>(initialSearch);
  
  // Scalamy currentPage i searchTerm w jeden obiekt
  const [searchConfig, setSearchConfig] = useState({ page: initialPage, search: initialSearch });
  
  const [animals, setAnimals] = useState<ExtendedAnimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  
  // Używamy hooka useDebounce dla frazy wyszukiwania
  const debouncedSearch = useDebounce(searchConfig.search, SEARCH_DEBOUNCE_TIME);
  
  // Referencja do śledzenia zmian debouncedSearch
  const lastDebouncedSearchRef = useRef<string>(debouncedSearch);
  
  // Diagnostyka - log przy zmianie debouncedSearch
  if (lastDebouncedSearchRef.current !== debouncedSearch) {
    console.log(`[${new Date().toISOString()}] Zmiana debouncedSearch: "${lastDebouncedSearchRef.current}" -> "${debouncedSearch}"`);
    lastDebouncedSearchRef.current = debouncedSearch;
  }

  // Funkcja do formatowania wieku
  const formatAge = (birthDate: string | null | undefined): string => {
    if (!birthDate) return '-';
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    if (isNaN(birthDateObj.getTime())) return '-';
    const diffMs = today.getTime() - birthDateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return `${diffDays} ${getDeclination(diffDays, 'dzień', 'dni', 'dni')}`;
    }
    const diffMonths = Math.floor(diffDays / 30.44);
    if (diffMonths <= 23) {
      return `${diffMonths} ${getDeclination(diffMonths, 'miesiąc', 'miesiące', 'miesięcy')}`;
    }
    const diffYears = Math.floor(diffDays / 365.25);
    return `${diffYears} ${getDeclination(diffYears, 'rok', 'lata', 'lat')}`;
  };
  
  const getDeclination = (number: number, singular: string, plural2to4: string, plural5plus: string): string => {
    if (number === 1) return singular;
    if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) {
      return plural2to4;
    }
    return plural5plus;
  };

  const formatOwnerInfo = (animal: ExtendedAnimal): string => {
    const ownerName = animal.owner_name || 
      (animal.owner_first_name && animal.owner_last_name ? 
        `${animal.owner_first_name} ${animal.owner_last_name}` : null);
    let address = '';
    if (animal.owner_city) {
      address = animal.owner_city;
      if (animal.owner_street) {
        address += `, ul. ${animal.owner_street}`;
        if (animal.owner_house_number) {
          address += ` ${animal.owner_house_number}`;
        }
      }
    }
    if (ownerName) {
      return `${ownerName}${address ? `\n${address}` : ''}`;
    }
    if (animal.owner_id) {
      return `ID: ${animal.owner_id}`;
    }
    return 'Brak danych';
  };

  // Licznik wywołań fetchAnimals dla diagnostyki
  const fetchCounter = useRef(0);
  
  // Funkcja aktualizująca URL - wydzielona z fetchAnimals
  const updateSearchParams = useCallback((page: number, search: string) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', page.toString());
    
    const trimmedSearch = search.trim();
    if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
      newSearchParams.set('search', trimmedSearch);
    }
    
    setSearchParams(newSearchParams);
  }, [setSearchParams]);
  
  // Funkcja pobierająca dane zwierząt - już nie aktualizuje parametrów URL
  const fetchAnimals = useCallback(async (page: number, search = '') => {
    // Generuj unikalny identyfikator dla każdego wywołania
    const callId = ++fetchCounter.current;
    const timestamp = new Date().toISOString();
    
    // Diagnostyka - początek wywołania
    console.log(`[${timestamp}] fetchAnimals #${callId} (${componentId.current}): ROZPOCZĘCIE, strona=${page}, fraza="${search}"`);
    
    try {
      setIsLoading(true);
      setError(null);
      
      const trimmedSearch = search.trim();
      
      // Diagnostyka - szczegóły zapytania
      console.log(`[${timestamp}] fetchAnimals #${callId}: Wywołanie dla strony=${page}, fraza="${trimmedSearch}", długość=${trimmedSearch.length}`);
      
      let response;
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        console.log(`[${timestamp}] fetchAnimals #${callId}: Wywołanie getAnimals z search=${trimmedSearch}`);
        response = await getAnimals(page, ITEMS_PER_PAGE, 'farm', { search: trimmedSearch });
      } else {
        console.log(`[${timestamp}] fetchAnimals #${callId}: Pobieranie wszystkich zwierząt - fraza zbyt krótka lub pusta`);
        response = await getAnimals(page, ITEMS_PER_PAGE, 'farm', {});
      }
      
      // Diagnostyka - odpowiedź z API
      console.log(`[${timestamp}] fetchAnimals #${callId}: Otrzymano odpowiedź z API`);
      
      const animalsList = response.data || [];
      const paginationInfo = response.pagination || {};
      const totalCount = paginationInfo.totalCount || 0;
      const calculatedTotalPages = paginationInfo.totalPages || Math.ceil(totalCount / ITEMS_PER_PAGE);
      
      // Diagnostyka - podsumowanie odpowiedzi
      console.log(`[${timestamp}] fetchAnimals #${callId}: Pobrano ${animalsList.length} z ${totalCount} zwierząt (strona ${page}/${calculatedTotalPages})`);
      
      setAnimals(animalsList);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setTotalItems(totalCount);
      
    } catch (error: any) {
      console.error(`[${timestamp}] fetchAnimals #${callId}: Błąd:`, error);
      setError(error.response?.data?.message || 'Nie udało się pobrać listy zwierząt gospodarskich');
      setAnimals([]);
    } finally {
      setIsLoading(false);
      // Diagnostyka - zakończenie
      console.log(`[${timestamp}] fetchAnimals #${callId}: ZAKOŃCZONO`);
    }
  }, []); // Brak zależności - funkcja jest stabilna

  // Obsługa zmiany strony – aktualizujemy tylko page w obiekcie searchConfig
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    console.log(`[${new Date().toISOString()}] handlePageChange: ${searchConfig.page} -> ${value}`);
    setSearchConfig(prev => ({ ...prev, page: value }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obsługa wyszukiwania – aktualizujemy search (oraz resetujemy page do 1)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(`[${new Date().toISOString()}] handleSearch: "${searchConfig.search}" -> "${value}"`);
    setSearchConfig(prev => ({ ...prev, search: value, page: 1 }));
  };

  // Licznik wywołań useEffect
  const effectCounter = useRef(0);
  
  // useEffect wywołujący fetchAnimals, gdy zmieni się page lub debouncedSearch
  useEffect(() => {
    // Unikalne ID dla każdego uruchomienia efektu
    const effectId = ++effectCounter.current;
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] useEffect #${effectId} (${componentId.current}): URUCHOMIONY, page=${searchConfig.page}, debouncedSearch="${debouncedSearch}"`);
    
    // Sprawdzenie czy faktycznie wartości się zmieniły
    const pageChanged = lastPageRef.current !== searchConfig.page;
    const searchChanged = lastSearchRef.current !== debouncedSearch;
    
    console.log(`[${timestamp}] useEffect #${effectId}: Zmiany - page: ${pageChanged ? 'TAK' : 'NIE'}, search: ${searchChanged ? 'TAK' : 'NIE'}`);
    
    // Aktualizacja referencji ostatnich wartości
    lastPageRef.current = searchConfig.page;
    lastSearchRef.current = debouncedSearch;
    
    // Wywołanie fetchAnimals
    console.log(`[${timestamp}] useEffect #${effectId}: Wywołanie fetchAnimals(${searchConfig.page}, "${debouncedSearch}")`);
    fetchAnimals(searchConfig.page, debouncedSearch);
    
    // Aktualizujemy parametry URL w osobnym useEffect
    
    // Funkcja czyszcząca
    return () => {
      console.log(`[${timestamp}] useEffect #${effectId}: CLEANUP`);
    };
  }, [searchConfig.page, debouncedSearch, fetchAnimals]);

  // Osobny useEffect do aktualizacji parametrów URL
  useEffect(() => {
    // Mamy już dane, więc możemy zaktualizować URL
    updateSearchParams(searchConfig.page, debouncedSearch);
  }, [searchConfig.page, debouncedSearch, updateSearchParams]);

  const navigateToAnimalDetails = (id: number) => {
    navigate(`/animals/farm/${id}`);
  };

  const cardActions = (
    <Button
      variant="primary"
      icon={<FaPlus />}
      onClick={() => navigate('/animals/farm/new')}
    >
      Dodaj zwierzę gospodarskie
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
        Wyświetlanie {startItem}-{endItem} z {totalItems} zwierząt
      </Typography>
    );
  };

  // Log przy każdym renderowaniu
  React.useEffect(() => {
    console.log(`[${new Date().toISOString()}] Komponent ${componentId.current} zamontowany`);
    return () => {
      console.log(`[${new Date().toISOString()}] Komponent ${componentId.current} odmontowany`);
    };
  }, []);

  return (
    <div className="clients-list">
      <Card title="Lista zwierząt gospodarskich" actions={cardActions}>
        <div className="card-actions">
          <div className="search-container">
            <TextField
              className="search-input"
              placeholder={`Szukaj zwierząt (min. ${MIN_SEARCH_LENGTH} znaki)...`}
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
            {animals.length === 0 ? (
              <div className="empty-message">
                {searchConfig.search.trim().length >= MIN_SEARCH_LENGTH ? 
                  `Nie znaleziono zwierząt gospodarskich dla "${searchConfig.search.trim()}"` : 
                  'Nie znaleziono zwierząt gospodarskich'}
              </div>
            ) : (
              <>
                {renderPaginationInfo()}
                {renderPagination()}
                <Paper elevation={0}>
                  <Table className="data-table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '30%' }}>Właściciel</TableCell>
                        <TableCell sx={{ width: '20%' }}>Nr kolczyka</TableCell>
                        <TableCell sx={{ width: '15%' }}>Gatunek</TableCell>
                        <TableCell sx={{ width: '10%' }}>Płeć</TableCell>
                        <TableCell sx={{ width: '15%' }}>Wiek</TableCell>
                        <TableCell sx={{ width: '10%' }} align="center">Akcje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {animals.map((animal, index) => {
                        const identifierValue = 
                          (animal.farm_animal?.identifier) || animal.animal_number || '-';
                        return (
                          <TableRow 
                            key={`${animal.id}-${index}`}
                            onClick={() => navigateToAnimalDetails(animal.id)}
                            hover
                            className="clickable-row"
                          >
                            <TableCell sx={{ whiteSpace: 'pre-line', verticalAlign: 'top', paddingY: 2 }}>
                              {formatOwnerInfo(animal)}
                            </TableCell>
                            <TableCell>{identifierValue}</TableCell>
                            <TableCell>{animal.species || '-'}</TableCell>
                            <TableCell>{animal.sex === 'male' ? 'Samiec' : animal.sex === 'female' ? 'Samica' : '-'}</TableCell>
                            <TableCell>{formatAge(animal.birth_date)}</TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <div className="action-buttons">
                                <Button 
                                  icon={<FaEye size={18} />} 
                                  variant="secondary"
                                  tooltip="Zobacz"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToAnimalDetails(animal.id);
                                  }}
                                />
                                <Button 
                                  icon={<FaEdit size={18} />} 
                                  variant="warning"
                                  tooltip="Edytuj"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/animals/farm/${animal.id}/edit`);
                                  }}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

export default FarmAnimalsPage;