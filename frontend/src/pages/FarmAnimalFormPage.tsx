import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import FarmAnimalForm from '../components/forms/FarmAnimalForm';
import { getAnimal, createAnimal, updateAnimal } from '../api/animalService';
import { useAuth } from '../context/AuthContext';
import { Animal } from '../types/models';
import { CircularProgress, Alert } from '@mui/material';
import { getDecodedToken } from '../utils/auth';

interface AnimalFormParams {
  id?: string;
  [key: string]: string | undefined;
}

// Funkcja pomocnicza do pobierania roli organizacji z tokenu JWT
const getUserOrganizationRole = (): string => {
  const decodedToken = getDecodedToken();
  if (!decodedToken?.organizations || decodedToken.organizations.length === 0) {
    return '';
  }
  return decodedToken.organizations[0]?.role || '';
};

const FarmAnimalFormPage: React.FC = () => {
  const { id } = useParams<AnimalFormParams>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [animal, setAnimal] = useState<Partial<Animal>>({
    animal_type: 'farm', // Używamy poprawnego typu 'farm'
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  
  // Pobieramy organizację użytkownika bez sztywnego typowania
  const userOrganization = user?.organizations?.length ? user.organizations[0] : undefined;
  // Pobieramy rolę organizacji z tokenu JWT
  const organizationRole = getUserOrganizationRole();
  
  // Pobierz dane zwierzęcia jeśli jesteśmy w trybie edycji
  useEffect(() => {
    const fetchAnimal = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      // Sprawdź, czy użytkownik ma organizację
      if (!userOrganization) {
        setError("Brak przypisanej organizacji. Nie możesz edytować zwierząt.");
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getAnimal(Number(id));
        
        // Sprawdź czy typ zwierzęcia to 'farm' (gospodarskie)
        if (data.animal_type !== 'farm') {
          navigate(`/animals/pets/${id}/edit`);
          return;
        }
        
        // Sprawdź, czy zwierzę należy do organizacji użytkownika (tylko jeśli data.organization_id istnieje)
        if (data.organization_id && userOrganization.id !== data.organization_id) {
          setError("Nie masz uprawnień do edycji tego zwierzęcia.");
          setUnauthorized(true);
          setIsLoading(false);
          return;
        }
        
        setAnimal(data);
      } catch (err: any) {
        console.error('Error fetching animal details:', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError("Nie masz uprawnień do edycji tego zwierzęcia.");
          setUnauthorized(true);
        } else {
          setError(err.response?.data?.message || 'Nie udało się pobrać danych zwierzęcia');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnimal();
  }, [id, isEditMode, navigate, userOrganization]);
  
  // Sprawdzenie uprawnień przed renderowaniem formularza
  if (unauthorized) {
    return (
      <div className="animal-form-page">
        <Card title="Brak uprawnień" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/animals/farm')}
          >
            Wróć do listy zwierząt
          </Button>
        }>
          <Alert severity="error">
            {error || "Nie masz uprawnień do edycji tego zwierzęcia."}
          </Alert>
        </Card>
      </div>
    );
  }
  
  // Sprawdź, czy użytkownik może tworzyć zwierzęta (na podstawie roli z tokenu)
  if (!isEditMode && userOrganization && 
      ['client', 'farmer'].includes(organizationRole) &&
      !['owner', 'admin', 'officestaff', 'employee', 'vet', 'vettech', 'inseminator'].includes(organizationRole)) {
    return (
      <div className="animal-form-page">
        <Card title="Brak uprawnień" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/animals/farm')}
          >
            Wróć do listy zwierząt
          </Button>
        }>
          <Alert severity="error">
            Nie masz uprawnień do dodawania nowych zwierząt. Skontaktuj się z administratorem.
          </Alert>
        </Card>
      </div>
    );
  }
  
  // Obsługa zapisywania formularza
  const handleSubmit = async (values: any) => {
    // Sprawdź, czy użytkownik ma organizację
    if (!userOrganization) {
      setError("Brak przypisanej organizacji. Nie możesz dodawać ani edytować zwierząt.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Upewnij się, że typ zwierzęcia i organizacja są poprawne
      const animalData = {
        ...values,
        animal_type: 'farm', // Zmienione z 'large' na 'farm'
        owner_id: values.owner_id || (user && user.id ? user.id : null), // Bezpieczne sprawdzenie user.id
        organization_id: userOrganization.id // Dodaj identyfikator organizacji
      };
      
      if (isEditMode && id) {
        await updateAnimal(Number(id), animalData);
        navigate(`/animals/farm/${id}`);
      } else {
        const newAnimal = await createAnimal(animalData);
        navigate(`/animals/farm/${newAnimal.id}`);
      }
    } catch (err: any) {
      console.error('Error saving animal:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError("Nie masz uprawnień do wykonania tej operacji.");
      } else {
        setError(err.response?.data?.message || 'Nie udało się zapisać danych zwierzęcia');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Akcje dla karty
  const cardActions = (
    <Button
      variant="secondary"
      icon={<FaArrowLeft />}
      onClick={() => navigate(isEditMode ? `/animals/farm/${id}` : '/animals/farm')}
    >
      {isEditMode ? 'Wróć do szczegółów zwierzęcia' : 'Wróć do listy zwierząt'}
    </Button>
  );
  
  const cardTitle = isEditMode ? 'Edycja zwierzęcia gospodarskiego' : 'Dodaj nowe zwierzę gospodarskie';
  
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
          <FarmAnimalForm
            initialValues={animal}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            isEditMode={isEditMode}
            userRole={organizationRole} // Dodane: przekazanie roli użytkownika
            currentOrganizationId={userOrganization?.id} // Dodane: przekazanie ID organizacji
          />
        )}
      </Card>
    </div>
  );
};

export default FarmAnimalFormPage;