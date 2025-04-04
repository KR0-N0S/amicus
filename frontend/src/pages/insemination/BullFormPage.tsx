import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import BullForm from '../../components/forms/BullForm';
import { getBull, createBull, updateBull } from '../../api/bullService';
import { useAuth } from '../../context/AuthContext';
import { Bull } from '../../types/models';
import { CircularProgress, Alert } from '@mui/material';
import { BullCreatePayload } from '../../types/api-payloads';

interface BullFormParams {
  id?: string;
  [key: string]: string | undefined;
}

const BullFormPage: React.FC = () => {
  const { id } = useParams<BullFormParams>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [bull, setBull] = useState<Partial<Bull>>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  
  // Pobieramy organizację użytkownika
  const userOrganization = user?.organizations?.length ? user.organizations[0] : undefined;
  
  // Pobierz dane buhaja jeśli jesteśmy w trybie edycji
  useEffect(() => {
    const fetchBull = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      // Sprawdź, czy użytkownik ma organizację
      if (!userOrganization) {
        setError("Brak przypisanej organizacji. Nie możesz edytować buhajów.");
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getBull(Number(id));
        setBull(data);
      } catch (err: any) {
        console.error('Error fetching bull details:', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError("Nie masz uprawnień do edycji tego buhaja.");
          setUnauthorized(true);
        } else {
          setError(err.response?.data?.message || 'Nie udało się pobrać danych buhaja');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBull();
  }, [id, isEditMode, navigate, userOrganization]);
  
  // Sprawdzenie uprawnień przed renderowaniem formularza
  if (unauthorized) {
    return (
      <div className="bull-form-page">
        <Card title="Brak uprawnień" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/insemination/bulls')}
          >
            Wróć do listy buhajów
          </Button>
        }>
          <Alert severity="error">
            {error || "Nie masz uprawnień do edycji tego buhaja."}
          </Alert>
        </Card>
      </div>
    );
  }
  
  const handleSubmit = async (values: Partial<Bull>) => {
    if (!userOrganization) {
      setError("Brak przypisanej organizacji. Nie możesz dodawać ani edytować buhajów.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Walidacja numeru identyfikacyjnego - powinien mieć format: 2 wielkie litery + cyfry
      const idNumberPattern = /^[A-Z]{2}[0-9]+$/;
      if (!values.identification_number || !idNumberPattern.test(values.identification_number)) {
        setError("Numer identyfikacyjny jest wymagany i powinien mieć format: 2 wielkie litery + cyfry (np. PL12345)");
        setIsSubmitting(false);
        return;
      }
      
      // Przygotowanie danych zgodnych z wymaganym typem BullCreatePayload
      const bullData: BullCreatePayload = {
        identification_number: values.identification_number, // teraz na pewno jest zdefiniowane
        name: values.identification_number, // używamy numeru identyfikacyjnego jako nazwy
        vet_number: values.vet_number,
        breed: values.breed,
        bull_type: values.bull_type || 'dairy', // domyślna wartość jeśli nie jest określona
        supplier: values.supplier,
        semen_production_date: values.semen_production_date,
        additional_info: values.additional_info,
      };
      
      console.log('Przesyłane dane buhaja:', bullData);
      
      let response;
      if (isEditMode && id) {
        response = await updateBull(Number(id), bullData);
        navigate(`/insemination/bulls/${id}`);
      } else {
        response = await createBull(bullData);
        if (response && response.id) {
          navigate(`/insemination/bulls/${response.id}`);
        } else {
          navigate('/insemination/bulls');
        }
      }
    } catch (err: any) {
      console.error('Error saving bull:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError("Nie masz uprawnień do wykonania tej operacji.");
      } else {
        setError(err.response?.data?.message || 'Wystąpił błąd podczas zapisywania danych buhaja');
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
      onClick={() => navigate(isEditMode ? `/insemination/bulls/${id}` : '/insemination/bulls')}
    >
      {isEditMode ? 'Wróć do szczegółów buhaja' : 'Wróć do listy buhajów'}
    </Button>
  );
  
  const cardTitle = isEditMode ? 'Edycja buhaja' : 'Dodaj nowego buhaja';
  
  return (
    <div className="bull-form-page">
      <Card title={cardTitle} actions={cardActions}>
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : error && !unauthorized ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <BullForm
            initialValues={bull}
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

export default BullFormPage;