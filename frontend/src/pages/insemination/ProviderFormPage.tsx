import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SemenProviderForm from '../../components/forms/SemenProviderForm';
import { getSemenProvider, createSemenProvider, updateSemenProvider } from '../../api/semenProviderService';
import { useAuth } from '../../context/AuthContext';
import { SemenProvider } from '../../types/models';
import { CircularProgress, Alert } from '@mui/material';
import { SemenProviderCreatePayload, SemenProviderUpdatePayload } from '../../types/api-payloads';

interface ProviderFormParams {
  id?: string;
  [key: string]: string | undefined;
}

const ProviderFormPage: React.FC = () => {
  const { id } = useParams<ProviderFormParams>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [provider, setProvider] = useState<Partial<SemenProvider>>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  
  // Pobieramy organizację użytkownika
  const userOrganization = user?.organizations?.length ? user.organizations[0] : undefined;
  
  // Pobierz dane dostawcy jeśli jesteśmy w trybie edycji
  useEffect(() => {
    const fetchProvider = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      // Sprawdź, czy użytkownik ma organizację
      if (!userOrganization) {
        setError("Brak przypisanej organizacji. Nie możesz edytować dostawców.");
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getSemenProvider(Number(id));
        setProvider(data);
      } catch (err: any) {
        console.error('Error fetching provider details:', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError("Nie masz uprawnień do edycji tego dostawcy.");
          setUnauthorized(true);
        } else {
          setError(err.response?.data?.message || 'Nie udało się pobrać danych dostawcy');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProvider();
  }, [id, isEditMode, navigate, userOrganization]);
  
  // Sprawdzenie uprawnień przed renderowaniem formularza
  if (unauthorized) {
    return (
      <div className="provider-form-page">
        <Card title="Brak uprawnień" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/insemination/providers')}
          >
            Wróć do listy dostawców
          </Button>
        }>
          <Alert severity="error">
            {error || "Nie masz uprawnień do edycji tego dostawcy."}
          </Alert>
        </Card>
      </div>
    );
  }
  
  const handleSubmit = async (values: Partial<SemenProvider>) => {
    if (!userOrganization) {
      setError("Brak przypisanej organizacji. Nie możesz dodawać ani edytować dostawców.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Walidacja numeru weterynaryjnego
      if (!values.vet_id_number) {
        setError("Numer weterynaryjny dostawcy jest wymagany");
        setIsSubmitting(false);
        return;
      }
      
      let response;
      if (isEditMode && id) {
        const updateData: SemenProviderUpdatePayload = {
          id: Number(id),
          ...values
        };
        response = await updateSemenProvider(Number(id), updateData);
        navigate(`/insemination/providers/${id}`);
      } else {
        const createData: SemenProviderCreatePayload = {
          name: values.name!,
          vet_id_number: values.vet_id_number!,
          address_street: values.address_street,
          address_city: values.address_city,
          address_postal_code: values.address_postal_code,
          address_province: values.address_province,
          address_country: values.address_country,
          contact_phone: values.contact_phone,
          contact_email: values.contact_email
        };
        response = await createSemenProvider(createData);
        if (response && response.id) {
          navigate(`/insemination/providers/${response.id}`);
        } else {
          navigate('/insemination/providers');
        }
      }
    } catch (err: any) {
      console.error('Error saving provider:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError("Nie masz uprawnień do wykonania tej operacji.");
      } else {
        setError(err.response?.data?.message || 'Wystąpił błąd podczas zapisywania danych dostawcy');
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
      onClick={() => navigate(isEditMode ? `/insemination/providers/${id}` : '/insemination/providers')}
    >
      {isEditMode ? 'Wróć do szczegółów dostawcy' : 'Wróć do listy dostawców'}
    </Button>
  );
  
  const cardTitle = isEditMode ? 'Edycja dostawcy nasienia' : 'Dodaj nowego dostawcę nasienia';
  
  return (
    <div className="provider-form-page">
      <Card title={cardTitle} actions={cardActions}>
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : error && !unauthorized ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <SemenProviderForm
            initialValues={provider}
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

export default ProviderFormPage;