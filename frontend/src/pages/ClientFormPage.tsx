import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ClientForm from '../components/forms/ClientForm';
import { fetchClientById, createClient, updateClient } from '../api/clientApi';
import { useAuth } from '../context/AuthContext';
import { Client } from '../types/models';
import { AuthContextType } from '../context/auth-types';

// Interfejs dla parametrów URL
interface ClientFormParams {
  id?: string;
  [key: string]: string | undefined;
}

const ClientFormPage: React.FC = () => {
  const { id } = useParams<ClientFormParams>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuth() as AuthContextType;
  
  const [client, setClient] = useState<Partial<Client>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pobierz dane klienta jeśli jesteśmy w trybie edycji
  useEffect(() => {
    const fetchClient = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Pobierz organizationId z pierwszej organizacji użytkownika (jeśli istnieje)
        const organizationId = user?.organizations && user.organizations.length > 0
          ? user.organizations[0].id
          : undefined;
          
        const data = await fetchClientById(Number(id), organizationId);
        
        // Sprawdź uprawnienia do tego klienta
        const hasAccess = checkAccessToClient(data, user);
        
        if (!hasAccess) {
          console.error('Access denied to client data');
          // Zamiast ustawiać flagę braku dostępu, przekierowujemy do listy klientów
          navigate('/clients');
          return;
        }
        
        // Pobierz dane o firmie i gospodarstwie, jeśli dostępne
        const clientData: Partial<Client> = {
          ...data,
          // Dane firmy - można by było pobrać z API na backendzie,
          // ale w tej chwili nie mamy do tego endpointu
          has_company: !!data.organizations?.find(org => org.role !== 'client'),
          // Dane gospodarstwa - podobnie jak wyżej
          has_farm: !!data.herds?.length
        };
        
        setClient(clientData);
      } catch (err: any) {
        console.error('Error fetching client details:', err);
        
        // Obsługa błędu 403 (brak uprawnień) i 404 (nie znaleziono)
        if (err.response?.status === 403 || err.response?.status === 404) {
          // Przekieruj do listy klientów zamiast pokazywać błąd
          navigate('/clients');
          return;
        } else {
          setError(err.response?.data?.message || 'Nie udało się pobrać danych klienta');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClient();
  }, [id, isEditMode, user, navigate]);
  
  // Funkcja sprawdzająca uprawnienia użytkownika do oglądania/edycji danego klienta
  const checkAccessToClient = (clientData: Client, currentUser: any): boolean => {
    if (!currentUser || !clientData) return false;
    
    // Jeśli użytkownik przegląda swoje własne dane - zawsze ma dostęp
    if (currentUser.id === clientData.id) {
      return true;
    }
    
    // Sprawdź role użytkownika w organizacjach
    if (!currentUser.organizations || !clientData.organizations) {
      return false;
    }
    
    // Sprawdź, czy użytkownik ma rolę admin/owner w organizacji, do której należy klient
    const userOrgs = currentUser.organizations;
    
    for (const userOrg of userOrgs) {
      const clientBelongsToOrg = clientData.organizations.some(clientOrg => 
        clientOrg.id === userOrg.id
      );
      
      if (clientBelongsToOrg) {
        // Sprawdź, czy użytkownik ma odpowiednią rolę w tej organizacji
        if (['owner', 'superadmin', 'officestaff'].includes(userOrg.role.toLowerCase())) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Obsługa zapisywania formularza
  const handleSubmit = async (values: Partial<Client>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Saving client data:', values);
      
      // Pobierz organizationId z pierwszej organizacji użytkownika (jeśli istnieje)
      const organizationId = user?.organizations && user.organizations.length > 0
        ? user.organizations[0].id
        : undefined;
      
      // Dodajemy log, aby sprawdzić czy organizationId jest poprawnie pobierany
      console.log('User organizations:', user?.organizations);
      console.log('Selected organizationId:', organizationId);
        
      if (isEditMode && id) {
        // Przed edycją sprawdź jeszcze raz uprawnienia
        const clientData = await fetchClientById(Number(id), organizationId);
        const hasAccess = checkAccessToClient(clientData, user);
        
        if (!hasAccess) {
          // Przekieruj do listy klientów zamiast pokazywać błąd
          navigate('/clients');
          return;
        }
        
        // Tryb edycji - aktualizuj istniejącego klienta
        try {
          const updatedClient = await updateClient(Number(id), values, organizationId);
          navigate(`/clients/${id}`);
        } catch (updateErr: any) {
          console.error('Error updating client:', updateErr);
          
          // Sprawdź czy błąd to 404 (edycja nie jest zaimplementowana na backendzie)
          if (updateErr.response?.status === 404) {
            setError('Funkcja edycji klienta nie jest jeszcze dostępna');
          } else {
            setError(updateErr.response?.data?.message || 'Nie udało się zaktualizować danych klienta');
          }
          
          return;
        }
      } else {
        // Tryb dodawania - twórz nowego klienta przez endpoint rejestracji
        try {
          // Upewnij się, że organizationId jest przekazywane
          if (!organizationId) {
            console.error('Brak organizationId - klient nie zostanie przypisany do organizacji');
            setError('Nie można przypisać klienta do organizacji. Skontaktuj się z administratorem systemu.');
            setIsSubmitting(false);
            return;
          }
          
          // Przekazujemy organizationId do funkcji createClient
          const newClient = await createClient(values, organizationId);
          console.log('Client created successfully with ID:', newClient.id);
          
          // Zapisujemy ID nowo utworzonego klienta w localStorage
          localStorage.setItem('recentlyCreatedClientId', String(newClient.id));
          
          // Po pewnym czasie usuwamy tę informację (np. po 5 minutach)
          setTimeout(() => {
            localStorage.removeItem('recentlyCreatedClientId');
          }, 5 * 60 * 1000);
          
          navigate(`/clients/${newClient.id}`);
        } catch (createErr: any) {
          console.error('Error registering client:', createErr);
          
          // Obsługa możliwych błędów rejestracji
          if (createErr.response?.data?.message) {
            setError(createErr.response.data.message);
          } else if (createErr.response?.status === 409) {
            setError('Użytkownik z tym adresem email już istnieje');
          } else if (createErr.response?.status === 400) {
            setError('Nieprawidłowe dane formularza. Sprawdź wszystkie wymagane pola.');
          } else {
            setError('Wystąpił błąd podczas rejestracji klienta');
          }
          
          return;
        }
      }
    } catch (err: any) {
      console.error('Error saving client:', err);
      setError(err.response?.data?.message || 'Nie udało się zapisać danych klienta');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Akcje dla karty
  const cardActions = (
    <Button
      variant="secondary"
      icon={<FaArrowLeft />}
      onClick={() => navigate(isEditMode ? `/clients/${id}` : '/clients')}
    >
      {isEditMode ? 'Wróć do szczegółów klienta' : 'Wróć do listy klientów'}
    </Button>
  );
  
  const cardTitle = isEditMode ? 'Edycja klienta' : 'Dodaj nowego klienta';
  
  return (
    <div className="client-form-page">
      <Card title={cardTitle} actions={cardActions}>
        {isLoading ? (
          <div className="loading-spinner">Ładowanie danych...</div>
        ) : (
          <ClientForm
            initialValues={client}
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

export default ClientFormPage;