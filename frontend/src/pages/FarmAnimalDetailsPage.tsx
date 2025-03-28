import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { 
  Typography, 
  Grid, 
  Paper, 
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

const FarmAnimalDetailsPage: React.FC = () => {
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
        
        // Sprawdź czy typ zwierzęcia to 'large' (gospodarskie)
        if (data.animal_type !== 'large') {
          navigate(`/animals/pets/${id}`);
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
        navigate('/animals/farm');
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
        onClick={() => navigate('/animals/farm')}
      >
        Wróć do listy
      </Button>
      <Button
        variant="warning"
        icon={<FaEdit />}
        onClick={() => navigate(`/animals/farm/${id}/edit`)}
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
            onClick={() => navigate('/animals/farm')}
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
            onClick={() => navigate('/animals/farm')}
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
        {animal.species} {animal.animal_number ? `#${animal.animal_number}` : ''}
      </h1>
      
      <Card 
        title="Szczegóły zwierzęcia gospodarskiego" 
        actions={cardActions}
      >
        {/* Podstawowe informacje */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Podstawowe informacje</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Numer identyfikacyjny (kolczyk)</Typography>
              <Typography variant="body1">{animal.identifier || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Numer zwierzęcia</Typography>
              <Typography variant="body1">{animal.animal_number || '-'}</Typography>
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
          </Grid>
        </Paper>
        
        {/* Informacje o stadzie i rejestracji */}
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Informacje o stadzie i rejestracji</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Numer stada</Typography>
              <Typography variant="body1">{(animal as any).herd_number || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Data rejestracji</Typography>
              <Typography variant="body1">
                {(animal as any).registration_date ? 
                 new Date((animal as any).registration_date).toLocaleDateString('pl-PL') : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Pochodzenie</Typography>
              <Typography variant="body1">{(animal as any).origin || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Status szczepień</Typography>
              <Typography variant="body1">{(animal as any).vaccination_status || '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Dodatkowe notatki */}
        <Paper elevation={0} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Dodatkowe notatki</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {animal.notes || 'Brak dodatkowych notatek'}
          </Typography>
        </Paper>
        
        {/* Przyciski akcji na dole strony */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <MuiButton
            variant="outlined"
            color="primary"
            onClick={() => navigate(`/animals/farm/${id}/edit`)}
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
        </div>
      </Card>
    </div>
  );
};

export default FarmAnimalDetailsPage;