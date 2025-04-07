import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Tooltip, TablePagination, CircularProgress,
  Alert, TextField, InputAdornment
} from '@mui/material';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaEye
} from 'react-icons/fa';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getSemenProviders, deleteSemenProvider } from '../../api/semenProviderService';
import { SemenProvider } from '../../types/models';
import DeleteConfirmDialog from '../../components/common/DeleteConfirmDialog';

const ProvidersPage: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<SemenProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [providerToDelete, setProviderToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSemenProviders();
      setProviders(response.data || []);
    } catch (err: any) {
      console.error('Błąd podczas pobierania dostawców:', err);
      setError(err.response?.data?.message || 'Wystąpił błąd podczas pobierania dostawców');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const openDeleteDialog = (id: number) => {
    setProviderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProvider = async () => {
    if (!providerToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteSemenProvider(providerToDelete);
      setProviders(providers.filter(provider => provider.id !== providerToDelete));
      setDeleteDialogOpen(false);
    } catch (err: any) {
      console.error('Błąd podczas usuwania dostawcy:', err);
      setError(err.response?.data?.message || 'Wystąpił błąd podczas usuwania dostawcy');
    } finally {
      setIsDeleting(false);
      setProviderToDelete(null);
    }
  };

  // Filtrowanie dostawców na podstawie wyszukiwania
  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.vet_id_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (provider.address_city && provider.address_city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginacja dostawców
  const paginatedProviders = filteredProviders
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className="providers-page">
      <Card
        title="Dostawcy nasienia"
        actions={
          <Button 
            variant="primary"
            icon={<FaPlus />}
            onClick={() => navigate('/insemination/providers/new')}
          >
            Dodaj dostawcę
          </Button>
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Szukaj dostawcy..."
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredProviders.length === 0 ? (
              <Alert severity="info">
                Nie znaleziono żadnych dostawców nasienia.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nazwa</TableCell>
                      <TableCell>Numer weterynaryjny</TableCell>
                      <TableCell>Adres</TableCell>
                      <TableCell>Kontakt</TableCell>
                      <TableCell align="right">Akcje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProviders.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>{provider.name}</TableCell>
                        <TableCell>{provider.vet_id_number}</TableCell>
                        <TableCell>
                          {provider.address_city ? (
                            <>
                              {provider.address_postal_code} {provider.address_city}
                              {provider.address_street && <><br />{provider.address_street}</>}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {provider.contact_phone || provider.contact_email ? (
                            <>
                              {provider.contact_phone && <div>{provider.contact_phone}</div>}
                              {provider.contact_email && <div>{provider.contact_email}</div>}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Szczegóły">
                            <IconButton 
                              aria-label="szczegóły"
                              onClick={() => navigate(`/insemination/providers/${provider.id}`)}
                            >
                              <FaEye />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edytuj">
                            <IconButton 
                              aria-label="edytuj"
                              onClick={() => navigate(`/insemination/providers/${provider.id}/edit`)}
                            >
                              <FaEdit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Usuń">
                            <IconButton 
                              aria-label="usuń"
                              onClick={() => openDeleteDialog(provider.id)}
                              color="error"
                            >
                              <FaTrash />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredProviders.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Wierszy na stronę:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
                />
              </TableContainer>
            )}
          </Grid>
        </Grid>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        title="Usuń dostawcę"
        content="Czy na pewno chcesz usunąć tego dostawcę? Ta operacja jest nieodwracalna i może wpłynąć na powiązane dane dostaw nasienia."
        isDeleting={isDeleting}
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteProvider}
      />
    </Box>
  );
};

export default ProvidersPage;