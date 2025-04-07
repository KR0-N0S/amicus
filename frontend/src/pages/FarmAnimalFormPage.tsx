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
import { AnimalCreatePayload, FarmAnimalPayload } from '../types/api-payloads';

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
  
  const handleSubmit = async (values: any) => {
    if (!userOrganization) {
      setError("Brak przypisanej organizacji. Nie możesz dodawać ani edytować zwierząt.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Upewnij się, że mamy identyfikator
      const identifier =
        values.animal_number ||
        (values.farm_animal?.identifier || values.identifier);
      if (!identifier) {
        setError("Numer identyfikacyjny (kolczyk) jest wymagany dla zwierząt gospodarskich.");
        setIsSubmitting(false);
        return;
      }
      
      // Przygotuj obiekt farm_animal
      const farmAnimal: any = {
        identifier: identifier,
        origin: values.origin || '',
        additional_id: values.additional_number || null,
      };
      
      // Dodaj registration_date tylko jeśli została podana
      if (values.registration_date) {
        farmAnimal.registration_date = typeof values.registration_date === 'string'
          ? values.registration_date
          : values.registration_date.toISOString().split('T')[0];
      }
      
      // Użyj danych przesłanych z formularza, uzupełniając o organization_id oraz konwersje dat
      const animalData = {
        ...values,
        organization_id: Number(userOrganization.id),
        owner_id: values.owner_id ? Number(values.owner_id) : Number(user?.id),
        animal_number: identifier,
        birth_date: values.birth_date
          ? (typeof values.birth_date === 'string'
              ? values.birth_date
              : values.birth_date.toISOString().split('T')[0])
          : null,
        farm_animal: farmAnimal
      };
      
      // Usuń pola z głównego obiektu, które należą do farm_animal
      delete animalData.registration_date;
      delete animalData.origin;
      delete animalData.additional_number;
      delete animalData.identifier;
      
      console.log('Przesyłane dane zwierzęcia:', animalData);
      
      let response;
      if (isEditMode && id) {
        response = await updateAnimal(Number(id), animalData as any);
        navigate(`/animals/farm/${id}`);
      } else {
        response = await createAnimal(animalData as any);
        if (response && response.id) {
          navigate(`/animals/farm/${response.id}`);
        } else {
          navigate('/animals/farm');
        }
      }
    } catch (err: any) {
      console.error('Error saving animal:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError("Nie masz uprawnień do wykonania tej operacji.");
      } else if (err.response?.status === 400) {
        const errorData = err.response?.data;
        if (errorData && errorData.errors && errorData.errors.length > 0) {
          setError(errorData.errors[0].msg || 'Nieprawidłowe dane. Sprawdź formularz.');
        } else {
          setError(errorData?.message || 'Nieprawidłowe dane. Sprawdź formularz.');
        }
      } else {
        setError('Wystąpił błąd podczas zapisywania danych zwierzęcia: ' + (err.message || JSON.stringify(err)));
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