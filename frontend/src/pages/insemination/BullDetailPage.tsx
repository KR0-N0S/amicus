import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { 
  CircularProgress, 
  Alert, 
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button as MuiButton,
  Chip
} from '@mui/material';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getBull, deleteBull } from '../../api/bullService';
import { Bull } from '../../types/models';

const BullDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [bull, setBull] = useState<Bull | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pobieranie danych buhaja
  useEffect(() => {
    const fetchBullDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getBull(Number(id));
        setBull(data);
      } catch (err: any) {
        console.error('Error fetching bull details:', err);
        setError(err.response?.data?.message || 'Nie udało się pobrać danych buhaja');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBullDetails();
  }, [id]);

  // Obsługa usuwania buhaja
  const handleDeleteBull = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      await deleteBull(Number(id));
      setDeleteDialogOpen(false);
      navigate('/insemination/bulls');
    } catch (err: any) {
      console.error('Error deleting bull:', err);
      setError(err.response?.data?.message || 'Nie udało się usunąć buhaja');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Funkcja formatująca typ buhaja
  const formatBullType = (type?: string) => {
    if (!type) return 'Nieznany';
    
    switch (type) {
      case 'dairy': return 'Mleczny';
      case 'beef': return 'Mięsny';
      case 'dual': return 'Dwukierunkowy';
      default: return type;
    }
  };

  // Akcje dla karty
  const cardActions = (
    <>
      <Button
        variant="secondary"
        icon={<FaArrowLeft />}
        onClick={() => navigate('/insemination/bulls')}
      >
        Powrót do listy
      </Button>
      <Button
        variant="warning"
        icon={<FaEdit />}
        onClick={() => navigate(`/insemination/bulls/${id}/edit`)}
      >
        Edytuj
      </Button>
      <Button
        variant="danger"
        icon={<FaTrash />}
        onClick={() => setDeleteDialogOpen(true)}
      >
        Usuń
      </Button>
    </>
  );

  return (
    <div className="bull-detail-page">
      <Card 
        title={isLoading ? 'Ładowanie danych buhaja...' : `Buhaj: ${bull?.identification_number || 'Nieznane'}`} 
        actions={cardActions}
      >
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : bull ? (
          <>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Podstawowe informacje
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer identyfikacyjny
                    </Typography>
                    <Typography variant="body1">
                      {bull.identification_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer weterynaryjny
                    </Typography>
                    <Typography variant="body1">
                      {bull.vet_number || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Typ buhaja
                    </Typography>
                    <Typography variant="body1">
                      <Chip 
                        label={formatBullType(bull.bull_type)} 
                        color={bull.bull_type === 'dairy' ? 'primary' : 'default'} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Rasa
                    </Typography>
                    <Typography variant="body1">
                      {bull.breed || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Dane produkcyjne
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data produkcji nasienia
                    </Typography>
                    <Typography variant="body1">
                      {bull.semen_production_date ? new Date(bull.semen_production_date).toLocaleDateString('pl-PL') : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dostawca
                    </Typography>
                    <Typography variant="body1">
                      {bull.supplier || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data ostatniej dostawy
                    </Typography>
                    <Typography variant="body1">
                      {bull.last_delivery_date ? new Date(bull.last_delivery_date).toLocaleDateString('pl-PL') : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Liczba słomek z ostatniej dostawy
                    </Typography>
                    <Typography variant="body1">
                      {bull.straws_last_delivery || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Aktualny stan słomek
                    </Typography>
                    <Typography variant="body1">
                      {bull.current_straw_count || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sugerowana cena
                    </Typography>
                    <Typography variant="body1">
                      {bull.suggested_price ? `${bull.suggested_price} zł` : '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            {bull.additional_info && (
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  Dodatkowe informacje
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {bull.additional_info}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Data utworzenia
              </Typography>
              <Typography variant="body2">
                {bull.created_at ? new Date(bull.created_at).toLocaleString('pl-PL') : '-'}
              </Typography>
            </Box>
          </>
        ) : (
          <Alert severity="info">Nie znaleziono danych buhaja.</Alert>
        )}
      </Card>

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Czy na pewno chcesz usunąć buhaja {bull?.identification_number}? Tej operacji nie można cofnąć.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Anuluj
          </MuiButton>
          <MuiButton 
            onClick={handleDeleteBull} 
            color="error" 
            disabled={isDeleting}
            variant="contained"
          >
            {isDeleting ? 'Usuwanie...' : 'Usuń'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default BullDetailPage;