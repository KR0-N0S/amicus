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
  Button as MuiButton
} from '@mui/material';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { getInsemination, deleteInsemination } from '../../api/inseminationService';
import { Insemination } from '../../types/models';

const InseminationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [insemination, setInsemination] = useState<Insemination | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pobieranie danych zabiegu
  useEffect(() => {
    const fetchInseminationDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getInsemination(Number(id));
        setInsemination(data);
      } catch (err: any) {
        console.error('Error fetching insemination details:', err);
        setError(err.response?.data?.message || 'Nie udało się pobrać danych zabiegu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInseminationDetails();
  }, [id]);

  // Obsługa usuwania zabiegu
  const handleDeleteInsemination = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      await deleteInsemination(Number(id));
      setDeleteDialogOpen(false);
      navigate('/insemination/registers');
    } catch (err: any) {
      console.error('Error deleting insemination:', err);
      setError(err.response?.data?.message || 'Nie udało się usunąć zabiegu');
    } finally {
      setIsDeleting(false);
    }
  };

  // Funkcja formatująca datę
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  // Akcje dla karty
  const cardActions = (
    <>
      <Button
        variant="secondary"
        icon={<FaArrowLeft />}
        onClick={() => navigate('/insemination/registers')}
      >
        Powrót do rejestru
      </Button>
      <Button
        variant="warning"
        icon={<FaEdit />}
        onClick={() => navigate(`/insemination/registers/${id}/edit`)}
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
    <div className="insemination-detail-page">
      <Card 
        title={isLoading ? 'Ładowanie danych zabiegu...' : `Zabieg inseminacji: ${insemination?.certificate_number || 'Nieznany'}`} 
        actions={cardActions}
      >
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : insemination ? (
          <>
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Podstawowe informacje
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer certyfikatu
                    </Typography>
                    <Typography variant="body1">
                      {insemination.certificate_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data zabiegu
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(insemination.procedure_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer pliku
                    </Typography>
                    <Typography variant="body1">
                      {insemination.file_number || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer procedury
                    </Typography>
                    <Typography variant="body1">
                      {insemination.procedure_number || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ponowna inseminacja
                    </Typography>
                    <Typography variant="body1">
                      {insemination.re_insemination || 'Nie'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status SymLek
                    </Typography>
                    <Typography variant="body1">
                      {insemination.symlek_status || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Dane zwierzęcia
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID zwierzęcia
                    </Typography>
                    <Typography variant="body1">
                      {insemination.animal_id || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer kolczyka
                    </Typography>
                    <Typography variant="body1">
                      {insemination.ear_tag_number || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer stada
                    </Typography>
                    <Typography variant="body1">
                      {insemination.herd_number || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Numer oceny stada
                    </Typography>
                    <Typography variant="body1">
                      {insemination.herd_eval_number || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Właściciel samicy
                    </Typography>
                    <Typography variant="body1">
                      {insemination.dam_owner || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data ostatniego wycielenia
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(insemination.last_calving_date)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Dane buhaja
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID buhaja
                    </Typography>
                    <Typography variant="body1">
                      {insemination.bull_id || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Nazwa
                    </Typography>
                    <Typography variant="body1">
                      {insemination.name || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Typ buhaja
                    </Typography>
                    <Typography variant="body1">
                      {insemination.bull_type || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dostawca
                    </Typography>
                    <Typography variant="body1">
                      {insemination.supplier || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Dane wykonawcy
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Inseminator
                    </Typography>
                    <Typography variant="body1">
                      {insemination.inseminator || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Odpowiedzialność SymLek
                    </Typography>
                    <Typography variant="body1">
                      {insemination.symlek_responsibility || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>

            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Data utworzenia
              </Typography>
              <Typography variant="body2">
                {insemination.created_at ? new Date(insemination.created_at).toLocaleString('pl-PL') : '-'}
              </Typography>
            </Box>
          </>
        ) : (
          <Alert severity="info">Nie znaleziono danych zabiegu.</Alert>
        )}
      </Card>

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Potwierdź usunięcie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Czy na pewno chcesz usunąć zabieg inseminacji {insemination?.certificate_number}? Tej operacji nie można cofnąć.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Anuluj
          </MuiButton>
          <MuiButton 
            onClick={handleDeleteInsemination} 
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

export default InseminationDetailPage;