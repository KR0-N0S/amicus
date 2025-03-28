import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CompanionAnimalForm from '../components/forms/CompanionAnimalForm';
import { getAnimal, createAnimal, updateAnimal } from '../api/animalService';
import { useAuth } from '../context/AuthContext';
import { Animal, OrganizationWithRole } from '../types/models';
import { CircularProgress, Alert } from '@mui/material';

interface AnimalFormParams {
  id?: string;
  [key: string]: string | undefined;
}

const CompanionAnimalFormPage: React.FC = () => {
  const { id } = useParams<AnimalFormParams>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [animal, setAnimal] = useState<Partial<Animal>>({
    animal_type: 'small', // Domyślnie ustawiamy typ na 'small' (domowe)
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pobierz dane zwierzęcia jeśli jesteśmy w trybie edycji
  useEffect(() => {
    const fetchAnimal = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getAnimal(Number(id));
        
        // Sprawdź czy typ zwierzęcia to 'small' (domowe)
        if (data.animal_type !== 'small') {
          navigate(`/animals/farm/${id}/edit`);
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
    
    fetchAnimal();
  }, [id, isEditMode, navigate]);
  
  // Obsługa zapisywania formularza
  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Upewnij się, że typ zwierzęcia jest poprawny
      const animalData = {
        ...values,
        animal_type: 'small', // Zawsze 'small' dla zwierząt domowych
      };
      
      if (isEditMode && id) {
        await updateAnimal(Number(id), animalData);
        navigate(`/animals/pets/${id}`);
      } else {
        const newAnimal = await createAnimal(animalData);
        navigate(`/animals/pets/${newAnimal.id}`);
      }
    } catch (err: any) {
      console.error('Error saving animal:', err);
      setError(err.response?.data?.message || 'Nie udało się zapisać danych zwierzęcia');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Akcje dla karty
  const cardActions = (
    <Button
      variant="secondary"
      icon={<FaArrowLeft />}
      onClick={() => navigate(isEditMode ? `/animals/pets/${id}` : '/animals/pets')}
    >
      {isEditMode ? 'Wróć do szczegółów zwierzęcia' : 'Wróć do listy zwierząt'}
    </Button>
  );
  
  const cardTitle = isEditMode ? 'Edycja zwierzęcia domowego' : 'Dodaj nowe zwierzę domowe';
  
  return (
    <div className="animal-form-page">
      <Card title={cardTitle} actions={cardActions}>
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <CompanionAnimalForm
            initialValues={animal}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            isEditMode={isEditMode}
          />
        )}
      </Card>
    </div>
  );
};

export default CompanionAnimalFormPage;