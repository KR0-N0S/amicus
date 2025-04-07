import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
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
  Chip,
  IconButton,
  Tooltip,
  Stack,
  useTheme,
  Snackbar // Dodano komponent Snackbar z Material-UI
} from '@mui/material';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaEye, 
  FaTrash
} from 'react-icons/fa';

import DeleteConfirmDialog from '../../../components/common/DeleteConfirmDialog';
import { getSemenProviders, deleteSemenProvider } from '../../../api/semenProviderService';
import { SemenProvider } from '../../../types/models';
import useDebounce from '../../../hooks/useDebounce';

// Stałe konfiguracyjne
const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_TIME = 500;
const MIN_SEARCH_LENGTH = 3;

const ProvidersTab: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Stan dla listy dostawców
  const [providers, setProviders] = useState<SemenProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: ITEMS_PER_PAGE
  });
  
  // Stan dla dialogu usuwania
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<SemenProvider | null>(null);
  
  // Stan dla powiadomień (zastępujemy notistack)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_TIME);
  
  // Funkcja do pobierania dostawców nasienia
  const fetchProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Tworzymy parametry dla API
      const params: Record<string, any> = {
        page,
        limit: ITEMS_PER_PAGE
      };
      
      // Dodajemy parametr wyszukiwania, jeśli jest wystarczająco długi
      if (debouncedSearch.trim().length >= MIN_SEARCH_LENGTH) {
        params.search = debouncedSearch.trim();
      }
      
      const response = await getSemenProviders(params);
      
      setProviders(response.data || []);
      setPagination(response.pagination || {
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: ITEMS_PER_PAGE
      });
      
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      setError(error.response?.data?.message || 'Nie udało się pobrać listy dostawców');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  // Efekt pobierający dane przy zmianie strony lub frazy wyszukiwania
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);
  
  // Obsługa zmiany strony
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Obsługa wyszukiwania
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset do pierwszej strony przy wyszukiwaniu
  };
  
  // Funkcja do wyświetlania powiadomień (zamiast notistack)
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };
  
  // Nawigacja do formularza dodawania dostawcy
  const handleAddProvider = () => {
    navigate('/insemination/providers/new');
  };
  
  // Nawigacja do podglądu dostawcy
  const handleViewProvider = (id: number) => {
    navigate(`/insemination/providers/${id}`);
  };
  
  // Nawigacja do edycji dostawcy
  const handleEditProvider = (id: number) => {
    navigate(`/insemination/providers/${id}/edit`);
  };
  
  // Obsługa usuwania dostawcy
  const handleOpenDeleteDialog = (provider: SemenProvider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProviderToDelete(null);
    setIsDeleting(false);
  };
  
  const handleDeleteProvider = async () => {
    if (!providerToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteSemenProvider(providerToDelete.id);
      
      // Po usunięciu odświeżamy listę
      fetchProviders();
      showSnackbar(`Dostawca "${providerToDelete.name}" został usunięty`, 'success');
      
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      showSnackbar(
        error.response?.data?.message || 'Nie udało się usunąć dostawcy', 
        'error'
      );
    } finally {
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
      setIsDeleting(false);
    }
  };

  // Renderowanie statusu publiczny/prywatny
  const renderStatus = (isPublic: boolean) => {
    return isPublic ? (
      <Chip 
        label="Publiczny" 
        color="primary" 
        size="small" 
      />
    ) : (
      <Chip 
        label="Prywatny" 
        color="default" 
        size="small" 
        sx={{ bgcolor: theme.palette.grey[200] }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Dostawcy nasienia</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<FaPlus />}
          onClick={handleAddProvider}
        >
          Dodaj dostawcę
        </Button>
      </Box>
      
      {/* Wyszukiwarka */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder={`Szukaj dostawców (min. ${MIN_SEARCH_LENGTH} znaki)...`}
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}><FaSearch /></Box>
          }}
        />
      </Box>
      
      {/* Wyświetlanie błędów */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Wskaźnik ładowania */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Informacja o liczbie wyników */}
          {providers.length > 0 && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Wyświetlanie {((pagination.currentPage - 1) * pagination.pageSize) + 1}-
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} z {pagination.totalCount} dostawców
            </Typography>
          )}
          
          {/* Gdy brak wyników */}
          {providers.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                {searchTerm.trim().length >= MIN_SEARCH_LENGTH ? 
                  'Nie znaleziono dostawców spełniających kryteria wyszukiwania.' : 
                  'Brak dostawców nasienia. Kliknij "Dodaj dostawcę", aby utworzyć pierwszego dostawcę.'}
              </Typography>
            </Paper>
          )}
          
          {/* Tabela dostawców */}
          {providers.length > 0 && (
            <Paper variant="outlined">
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Nazwa</TableCell>
                    <TableCell>Nr weterynaryjny</TableCell>
                    <TableCell>Lokalizacja</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Akcje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {providers.map((provider) => (
                    <TableRow key={provider.id} hover>
                      <TableCell>{provider.name}</TableCell>
                      <TableCell>{provider.vet_id_number}</TableCell>
                      <TableCell>
                        {provider.address_city ? 
                          `${provider.address_city}${provider.address_street ? `, ${provider.address_street}` : ''}` : 
                          '-'}
                      </TableCell>
                      <TableCell align="center">
                        {renderStatus(provider.is_public || provider.organization_id === null)}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Szczegóły">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewProvider(provider.id)}
                            >
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edytuj">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditProvider(provider.id)}
                            >
                              <FaEdit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Usuń">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteDialog(provider)}
                            >
                              <FaTrash />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
          
          {/* Paginacja */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={pagination.totalPages} 
                page={pagination.currentPage} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
      
      {/* Dialog potwierdzenia usunięcia */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Usunąć dostawcę?"
        content={`Czy na pewno chcesz usunąć dostawcę "${providerToDelete?.name}"? Tej operacji nie można cofnąć.`}
        isDeleting={isDeleting}
        onCancel={handleCloseDeleteDialog}
        onConfirm={handleDeleteProvider}
      />
      
      {/* Komponent powiadomień (zamiast notistack) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProvidersTab;