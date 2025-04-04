import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { CircularProgress, Alert } from '@mui/material';

import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import InseminationForm from '../../components/forms/InseminationForm';
import { getInsemination, createInsemination, updateInsemination } from '../../api/inseminationService';
import { useAuth } from '../../context/AuthContext';
import { Insemination } from '../../types/models';

interface InseminationFormParams {
  id?: string;
  [key: string]: string | undefined;
}

const InseminationFormPage: React.FC = () => {
  const { id } = useParams<InseminationFormParams>();
  const isEditMode = id !== 'new' && id !== undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [insemination, setInsemination] = useState<Partial<Insemination>>({});
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState<boolean>(false);
  
  // Pobieramy organizację użytkownika
  const userOrganization = user?.organizations?.length ? user.organizations[0] : undefined;
  
  // Pobierz dane zabiegu jeśli jesteśmy w trybie edycji
  useEffect(() => {
    const fetchInsemination = async () => {
      if (!isEditMode) {
        setIsLoading(false);
        return;
      }
      
      // Sprawdź, czy użytkownik ma organizację
      if (!userOrganization) {
        setError("Brak przypisanej organizacji. Nie możesz edytować zabiegów inseminacji.");
        setUnauthorized(true);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getInsemination(Number(id));
        
        // Sprawdź, czy zabieg należy do organizacji użytkownika
        if (data.owner_id && userOrganization.id !== data.owner_id) {
          setError("Nie masz uprawnień do edycji tego zabiegu inseminacji.");
          setUnauthorized(true);
          setIsLoading(false);
          return;
        }
        
        setInsemination(data);
      } catch (err: any) {
        console.error('Error fetching insemination details:', err);
        if (err.response?.status === 403 || err.response?.status === 401) {
          setError("Nie masz uprawnień do edycji tego zabiegu.");
          setUnauthorized(true);
        } else {
          setError(err.response?.data?.message || 'Nie udało się pobrać danych zabiegu');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsemination();
  }, [id, isEditMode, navigate, userOrganization]);
  
  // Sprawdzenie uprawnień przed renderowaniem formularza
  if (unauthorized) {
    return (
      <div className="insemination-form-page">
        <Card title="Brak uprawnień" actions={
          <Button
            variant="secondary"
            icon={<FaArrowLeft />}
            onClick={() => navigate('/insemination/registers')}
          >
            Wróć do rejestru inseminacji
          </Button>
        }>
          <Alert severity="error">
            {error || "Nie masz uprawnień do edycji tego zabiegu."}
          </Alert>
        </Card>
      </div>
    );
  }
  
  const handleSubmit = async (values: Partial<Insemination>) => {
    if (!userOrganization) {
      setError("Brak przypisanej organizacji. Nie możesz dodawać ani edytować zabiegów.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Przygotowanie danych
      const inseminationData = {
        ...values,
        owner_id: Number(userOrganization.id)
      };
      
      console.log('Przesyłane dane zabiegu:', inseminationData);
      
      let response;
      if (isEditMode && id) {
        response = await updateInsemination(Number(id), inseminationData);
        navigate(`/insemination/registers/${id}`);
      } else {
        response = await createInsemination(inseminationData);
        if (response && response.id) {
          navigate(`/insemination/registers/${response.id}`);
        } else {
          navigate('/insemination/registers');
        }
      }
    } catch (err: any) {
      console.error('Error saving insemination:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError("Nie masz uprawnień do wykonania tej operacji.");
      } else {
        setError(err.response?.data?.message || 'Wystąpił błąd podczas zapisywania danych zabiegu');
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
      onClick={() => navigate(isEditMode ? `/insemination/registers/${id}` : '/insemination/registers')}
    >
      {isEditMode ? 'Wróć do szczegółów zabiegu' : 'Wróć do rejestru inseminacji'}
    </Button>
  );
  
  const cardTitle = isEditMode ? 'Edycja zabiegu inseminacji' : 'Dodaj nowy zabieg inseminacji';
  
  return (
    <div className="insemination-form-page">
      <Card title={cardTitle} actions={cardActions}>
        {isLoading ? (
          <div className="loading-spinner">
            <CircularProgress size={40} />
            <p>Ładowanie danych...</p>
          </div>
        ) : error && !unauthorized ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <InseminationForm
            initialValues={insemination}
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

export default InseminationFormPage;