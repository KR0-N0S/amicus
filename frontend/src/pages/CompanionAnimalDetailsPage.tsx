import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Button as MuiButton, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { getAnimal, deleteAnimal } from '../api/animalService';
import { Animal } from '../types/models';

interface AnimalParams {
  id: string;
  [key: string]: string | undefined;
}

const CompanionAnimalDetailsPage: React.FC = () => {
  const { id } = useParams<AnimalParams>();
  const navigate = useNavigate();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getAnimal(Number(id));
        
        // Sprawdź czy typ zwierzęcia to 'companion' (domowe)
        if (data.animal_type !== 'companion') {
          navigate(`/animals/farm/${id}`);
          return;
        }
        
        setAnimal(data);
      } catch (err: any) {
        console.error('Error fetching animal details:', err);
        setError(err.response?.data?.message || 'Nie udało się pobrać danych zwierzęcia');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchAnimal();
    }
  }, [id, navigate]);
  
  // Obsługa usuwania zwierzęcia
  const handleDelete = async () => {
    if (window.confirm('Czy na pewno chcesz usunąć to zwierzę? Ta operacja jest nieodwracalna.')) {
      try {
        setIsLoading(true);
        await deleteAnimal(Number(id));
        navigate('/animals/pets');
      } catch (err: any) {
        console.error('Error deleting animal:', err);
        setError(err.response?.data?.message || 'Nie udało się usunąć zwierzęcia');
        setIsLoading(false);
      }
    }
  };
  
  // Akcje dla karty
  const cardActions = (
    <>
      <Button
        variant="secondary"
        icon={<FaArrowLeft />}
        onClick={() => navigate('/animals/pets')}
      >
        Wróć do listy
      </Button>
      <Button
        variant="warning"
        icon={<FaEdit />}
        onClick={() => navigate(`/animals/pets/${id}/edit`)}
      >
        Edytuj
      </Button>
      <Button
        variant="danger"
        icon={<FaTrash />}
        onClick={handleDelete}
      >
        Usuń
      </Button>
    </>
  );
  
  if (isLoading) {
    return (
      <div className="page-container">
        <Card title="Ładowanie...">
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych zwierzęcia...</p>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="page-container">
        <Card title="Błąd" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/animals/pets')}
          >
            Wróć do listy
          </Button>
        }>
          <Alert severity="error">{error}</Alert>
        </Card>
      </div>
    );
  }
  
  if (!animal) {
    return (
      <div className="page-container">
        <Card title="Nie znaleziono zwierzęcia" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/animals/pets')}
          >
            Wróć do listy
          </Button>
        }>
          <Alert severity="warning">Nie znaleziono zwierzęcia o podanym identyfikatorze</Alert>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <h1 className="page-title">
        {animal.name} <small>({animal.species})</small>
      </h1>
      
      <Card 
        title="Szczegóły zwierzęcia domowego" 
        actions={cardActions}
      >
        {/* Podstawowe informacje */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Podstawowe informacje</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Imię</Typography>
              <Typography variant="body1">{animal.name}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Gatunek</Typography>
              <Typography variant="body1">{animal.species}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Rasa</Typography>
              <Typography variant="body1">{animal.breed || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Płeć</Typography>
              <Typography variant="body1">
                {animal.sex === 'male' ? 'Samiec' : 
                 animal.sex === 'female' ? 'Samica' : 
                 'Nieznana'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Data urodzenia</Typography>
              <Typography variant="body1">
                {animal.birth_date ? new Date(animal.birth_date).toLocaleDateString('pl-PL') : 
                 (animal.age ? `${animal.age} lat` : '-')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Waga</Typography>
              <Typography variant="body1">{animal.weight ? `${animal.weight} kg` : '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Umaszczenie</Typography>
              <Typography variant="body1">{(animal as any).color || '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Identyfikacja */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Identyfikacja</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Numer mikrochipa</Typography>
              <Typography variant="body1">{animal.microchip_number || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Numer identyfikacyjny</Typography>
              <Typography variant="body1">{animal.identifier || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Znaki szczególne</Typography>
              <Typography variant="body1">{(animal as any).special_markings || '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Informacje o sterylizacji/kastracji */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Informacje o sterylizacji/kastracji</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Status</Typography>
              <Typography variant="body1">{(animal as any).is_sterilized ? 'Wysterylizowane/wykastrowane' : 'Niesterylizowane/niekastrowane'}</Typography>
            </Grid>
            {(animal as any).is_sterilized && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Data sterylizacji/kastracji</Typography>
                <Typography variant="body1">
                  {(animal as any).sterilization_date ? 
                   new Date((animal as any).sterilization_date).toLocaleDateString('pl-PL') : '-'}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
        
        {/* Dodatkowe informacje */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Dodatkowe informacje</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Temperament</Typography>
              <Typography variant="body1">{(animal as any).temperament || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={12}>
              <Typography variant="subtitle2">Specjalne potrzeby</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {(animal as any).special_needs || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={12}>
              <Typography variant="subtitle2">Dodatkowe notatki</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {animal.notes || 'Brak dodatkowych notatek'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Przyciski akcji na dole strony */}
        <Box display="flex" justifyContent="flex-end" mt={3}>
          <MuiButton
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/animals/pets/${id}/edit`)}
            sx={{ mr: 2 }}
          >
            Edytuj dane
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="error"
            onClick={handleDelete}
          >
            Usuń zwierzę
          </MuiButton>
        </Box>
      </Card>
    </div>
  );
};

export default CompanionAnimalDetailsPage;