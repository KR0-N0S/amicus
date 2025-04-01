import React, { useState, useEffect, useCallback } from 'react';
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

import './DataList.css';

// Tymczasowo rozszerzamy typ Animal, aby nie było błędów TypeScript
interface ExtendedAnimal extends Animal {
  owner_name?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  identifier?: string; // Dla numeru kolczyka
}

const ITEMS_PER_PAGE = 25; // Liczba zwierząt na stronę

const FarmAnimalsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get('page') || '1');
  const initialSearch = searchParams.get('search') || '';
  
  const [animals, setAnimals] = useState<ExtendedAnimal[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();

  // Funkcja do formatowania wieku
  const formatAge = (birthDate: string | null | undefined): string => {
    if (!birthDate) return '-';
    
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    
    // Sprawdzamy, czy data jest poprawna
    if (isNaN(birthDateObj.getTime())) return '-';
    
    // Obliczanie różnicy w milisekundach
    const diffMs = today.getTime() - birthDateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Wyświetlanie odpowiedniego formatu
    if (diffDays <= 30) {
      return `${diffDays} ${getDeclination(diffDays, 'dzień', 'dni', 'dni')}`;
    }
    
    // Obliczanie miesięcy
    const diffMonths = Math.floor(diffDays / 30.44); // średnio dni w miesiącu
    
    if (diffMonths <= 23) {
      return `${diffMonths} ${getDeclination(diffMonths, 'miesiąc', 'miesiące', 'miesięcy')}`;
    }
    
    // Obliczanie lat
    const diffYears = Math.floor(diffDays / 365.25); // uwzględnienie lat przestępnych
    return `${diffYears} ${getDeclination(diffYears, 'rok', 'lata', 'lat')}`;
  };
  
  // Odmiana polskich wyrazów w zależności od liczby
  const getDeclination = (number: number, singular: string, plural2to4: string, plural5plus: string): string => {
    if (number === 1) return singular;
    
    if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) {
      return plural2to4;
    }
    
    return plural5plus;
  };

  // Pobieranie listy zwierząt gospodarskich
const fetchAnimals = useCallback(async (page: number, search = '') => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Aktualizujemy parametry URL, aby zapewnić możliwość odświeżenia strony i zachowania kontekstu
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('page', page.toString());
    if (search) newSearchParams.set('search', search);
    setSearchParams(newSearchParams);
    
    // Przekazujemy obiekt searchParams zamiast samego stringa
    const searchParamsObj = search ? { search } : undefined;
    
    // Pobieramy dane z paginacją - poprawione wywołanie
    const response = await getAnimals(page, ITEMS_PER_PAGE, 'farm', searchParamsObj);
    
    // Dane zwierząt są w response.data
    let animalsList = response.data || [];
    
    // Filtrowanie po stronie klienta jeśli podano frazę wyszukiwania
    if (search) {
      const lowerCaseSearch = search.toLowerCase();
      const filtered = animalsList.filter((animal: ExtendedAnimal) => 
        ((animal.farm_animal?.identifier || animal.animal_number || '').toLowerCase().includes(lowerCaseSearch)) ||
        ((animal.owner_name || '').toLowerCase().includes(lowerCaseSearch)) ||
        ((animal.species || '').toLowerCase().includes(lowerCaseSearch))
      );
      animalsList = filtered;
    }
    
    // Informacje o paginacji są w response.pagination
    const paginationInfo = response.pagination || {};
    const totalCount = paginationInfo.totalCount || animalsList.length;
    const calculatedTotalPages = paginationInfo.totalPages || Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    console.log(`Pobrano ${animalsList.length} z ${totalCount} zwierząt (strona ${page}/${calculatedTotalPages})`);
    
    setAnimals(animalsList);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    setTotalItems(totalCount);
    
  } catch (error: any) {
    console.error('Error fetching farm animals:', error);
    setError(error.response?.data?.message || 'Nie udało się pobrać listy zwierząt gospodarskich');
    setAnimals([]);
  } finally {
    setIsLoading(false);
  }
}, [setSearchParams]);

  // Efekt dla zmiany strony lub wyszukiwania
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchAnimals(currentPage, searchTerm);
    }, 300); // Debounce do wyszukiwania
    
    return () => clearTimeout(delay);
  }, [currentPage, searchTerm, fetchAnimals]);

  // Obsługa zmiany strony
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    // Przewijamy na górę strony przy zmianie strony
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Obsługa wyszukiwania
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Wracamy do pierwszej strony przy nowym wyszukiwaniu
  };

  // Nawigacja do szczegółów zwierzęcia
  const navigateToAnimalDetails = (id: number) => {
    navigate(`/animals/farm/${id}`);
  };

  // Akcje dla karty
  const cardActions = (
    <Button
      variant="primary"
      icon={<FaPlus />}
      onClick={() => navigate('/animals/farm/new')}
    >
      Dodaj zwierzę gospodarskie
    </Button>
  );

  // Komponenty paginacji
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
          size="large"
          showFirstButton
          showLastButton
          renderItem={(item) => (
            <PaginationItem
              components={{ previous: FaArrowLeft, next: FaArrowRight }}
              {...item}
            />
          )}
        />
      </Box>
    );
  };

  // Informacja o liczbie wyświetlanych elementów
  const renderPaginationInfo = () => {
    if (totalItems === 0) return null;
    
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    
    return (
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1, mb: 1 }}>
        Wyświetlanie {startItem}-{endItem} z {totalItems} zwierząt
      </Typography>
    );
  };

  return (
    <div className="clients-list">
      <h1 className="page-title">Zwierzęta gospodarskie</h1>
      <Card 
        title="Lista zwierząt gospodarskich"
        actions={cardActions}
      >
        <div className="card-actions">
          <div className="search-container">
            <TextField
              className="search-input"
              placeholder="Szukaj zwierząt..."
              variant="outlined"
              size="small"
              fullWidth
              value={searchTerm}
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
                Nie znaleziono zwierząt gospodarskich
              </div>
            ) : (
              <>
                {renderPaginationInfo()}
                {renderPagination()}
                <Paper elevation={0}>
                  <Table className="data-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Właściciel</TableCell>
                        <TableCell>Nr kolczyka</TableCell>
                        <TableCell>Gatunek</TableCell>
                        <TableCell>Płeć</TableCell>
                        <TableCell>Wiek</TableCell>
                        <TableCell align="center">Akcje</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {animals.map((animal, index) => {
                        // Określamy, gdzie może być numer kolczyka
                        const identifierValue = 
                          (animal.farm_animal?.identifier) || 
                          animal.animal_number || 
                          '-';
                        
                        return (
                          <TableRow 
                            key={`${animal.id}-${index}`}
                            onClick={() => navigateToAnimalDetails(animal.id)}
                            hover
                            className="clickable-row"
                          >
                            <TableCell>{animal.owner_name || ''}</TableCell>
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