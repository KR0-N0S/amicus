import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaPrint, FaSync } from 'react-icons/fa';
import { Typography, CircularProgress, Alert } from '@mui/material';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Tabs, { Tab } from '../components/common/Tabs/Tabs';
import { getAnimal, deleteAnimal } from '../api/animalService';
import { Animal } from '../types/models';
import { useAuth } from '../context/AuthContext';
import './FarmAnimalDetailsPage.css';

interface AnimalParams {
  id: string;
  [key: string]: string | undefined;
}

const FarmAnimalDetailsPage: React.FC = () => {
  const { id } = useParams<AnimalParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  
  // Pobieranie danych zwierzęcia
  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getAnimal(Number(id));
        
        // Sprawdź czy typ zwierzęcia to 'farm' (gospodarskie)
        if (data.animal_type !== 'farm') {
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
  
  // Obsługa drukowania
  const handlePrint = () => {
    window.print();
  };
  
  // Obsługa usuwania zwierzęcia
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteAnimal(Number(id));
      setIsDeleteModalOpen(false);
      navigate('/animals/farm');
    } catch (err: any) {
      console.error('Error deleting animal:', err);
      setError(err.response?.data?.message || 'Nie udało się usunąć zwierzęcia');
      setIsLoading(false);
    }
  };
  
  // Odświeżanie danych
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAnimal(Number(id));
      setAnimal(data);
    } catch (err: any) {
      console.error('Error refreshing animal details:', err);
      setError(err.response?.data?.message || 'Nie udało się odświeżyć danych zwierzęcia');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funkcja formatująca wiek zwierzęcia
  const formatAge = (birthDate: string | undefined): string => {
    if (!birthDate) return "Nieznany";
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    // Obliczanie różnicy dni
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Do 30 dni - podajemy wiek w dniach
    if (diffDays <= 30) {
      return `${diffDays} ${diffDays === 1 ? 'dzień' : 
             (diffDays % 10 >= 2 && diffDays % 10 <= 4 && (diffDays % 100 < 10 || diffDays % 100 >= 20)) ? 'dni' : 'dni'}`;
    }
    
    // Obliczanie różnicy miesięcy
    const diffMonths = Math.floor(diffDays / 30.436875); // średnia liczba dni w miesiącu
    
    // Do 23 miesięcy - podajemy wiek w miesiącach
    if (diffMonths <= 23) {
      return `${diffMonths} ${diffMonths === 1 ? 'miesiąc' : 
             (diffMonths % 10 >= 2 && diffMonths % 10 <= 4 && (diffMonths % 100 < 10 || diffMonths % 100 >= 20)) ? 'miesiące' : 'miesięcy'}`;
    }
    
    // Powyżej 23 miesięcy - podajemy wiek w latach
    const years = Math.floor(diffDays / 365.25);
    
    if (years === 1) return "1 rok";
    if (years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) return `${years} lata`;
    return `${years} lat`;
  };
  
  // Funkcja formatująca dane właściciela
  const formatOwnerInfo = (animal: Animal): string => {
    const ownerName = (animal as any).owner_name || 
      ((animal as any).owner_first_name && (animal as any).owner_last_name ? 
        `${(animal as any).owner_first_name} ${(animal as any).owner_last_name}` : 'Brak danych');
    
    let address = '';
    if ((animal as any).owner_city) {
      address = (animal as any).owner_city;
      if ((animal as any).owner_street) {
        address += `, ul. ${(animal as any).owner_street}`;
        if ((animal as any).owner_house_number) {
          address += ` ${(animal as any).owner_house_number}`;
        }
      }
    } else {
      address = 'Brak adresu';
    }
    
    return `${ownerName}${address ? `, ${address}` : ''}`;
  };
  
  // Akcje dla karty
  const cardActions = (
    <Button variant="secondary" icon={<FaArrowLeft />} onClick={() => navigate('/animals/farm')}>
      Powrót do listy
    </Button>
  );
  
  // Nagłówek karty zwierzęcia
  const AnimalHeader = ({ animal }: { animal: Animal }) => {
    return (
      <div className="animal-header">
        <div className="animal-header-info">
          <h1 className="animal-name">
            {animal.farm_animal?.identifier || animal.animal_number || 'Brak numeru'}
          </h1>
          {animal.breed && (
            <h2 className="animal-breed">{animal.species} {animal.breed}</h2>
          )}
          <p className="animal-owner">
            Właściciel: {formatOwnerInfo(animal)}
          </p>
          {animal.birth_date && (
            <p className="animal-age">
              Wiek: {formatAge(animal.birth_date)} ({new Date(animal.birth_date).toLocaleDateString('pl-PL')})
            </p>
          )}
        </div>
        <div className="animal-header-actions">
          <Button icon={<FaEdit />} onClick={() => navigate(`/animals/farm/${id}/edit`)} tooltip="Edytuj" variant="warning" />
          <Button icon={<FaTrash />} onClick={() => setIsDeleteModalOpen(true)} tooltip="Usuń" variant="danger" />
          <Button icon={<FaPrint />} onClick={handlePrint} tooltip="Drukuj" variant="info" />
          <Button icon={<FaSync />} onClick={handleRefresh} tooltip="Odśwież" variant="secondary" />
        </div>
      </div>
    );
  };

  // Zakładka z podstawowymi danymi
  const BasicInfoTab = ({ animal }: { animal: Animal }) => (
    <div className="animal-basic-info">
      <div className="info-section">
        <h3>Dane podstawowe</h3>
        <div className="info-row">
          <span className="label">Gatunek:</span>
          <span className="value">{animal.species}</span>
        </div>
        <div className="info-row">
          <span className="label">Rasa:</span>
          <span className="value">{animal.breed || '-'}</span>
        </div>
        <div className="info-row">
          <span className="label">Płeć:</span>
          <span className="value">
            {animal.sex === 'male' ? 'Samiec' : 
             animal.sex === 'female' ? 'Samica' : 'Nieokreślona'}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Data urodzenia:</span>
          <span className="value">
            {animal.birth_date ? new Date(animal.birth_date).toLocaleDateString('pl-PL') : '-'}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Waga:</span>
          <span className="value">{animal.weight ? `${animal.weight} kg` : '-'}</span>
        </div>
      </div>
      
      <div className="info-section">
        <h3>Identyfikacja</h3>
        <div className="info-row">
          <span className="label">Numer kolczyka:</span>
          <span className="value">{animal.farm_animal?.identifier || '-'}</span>
        </div>
        <div className="info-row">
          <span className="label">Dodatkowy identyfikator:</span>
          <span className="value">{animal.farm_animal?.additional_id || '-'}</span>
        </div>
      </div>
      
      <div className="info-section">
        <h3>Informacje o rejestracji</h3>
        <div className="info-row">
          <span className="label">Data rejestracji:</span>
          <span className="value">
            {animal.farm_animal?.registration_date ? 
             new Date(animal.farm_animal.registration_date).toLocaleDateString('pl-PL') : '-'}
          </span>
        </div>
        <div className="info-row">
          <span className="label">Pochodzenie:</span>
          <span className="value">{animal.farm_animal?.origin || '-'}</span>
        </div>
      </div>
      
      <div className="info-section">
        <h3>Notatki</h3>
        <div className="notes-container">
          {animal.notes || 'Brak notatek'}
        </div>
      </div>
    </div>
  );

  // Zakładka z dokumentacją
  const DocumentationTab = () => (
    <div className="empty-tab">
      <p>Dokumentacja zwierzęcia w przygotowaniu.</p>
    </div>
  );

  // Zakładka z inseminacjami
  const InseminationsTab = () => (
    <div className="empty-tab">
      <p>Funkcjonalność inseminacji w przygotowaniu.</p>
    </div>
  );

  // Zakładka ze zdarzeniami
  const EventsTab = () => (
    <div className="empty-tab">
      <p>Funkcjonalność zdarzeń w przygotowaniu.</p>
    </div>
  );

  // Zakładka z innymi informacjami
  const OtherTab = () => (
    <div className="empty-tab">
      <p>Inne informacje w przygotowaniu.</p>
    </div>
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
          <div className="error-actions">
            <Button 
              variant="primary"
              icon={<FaSync />}
              onClick={handleRefresh}
            >
              Spróbuj ponownie
            </Button>
          </div>
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
    <div className="farm-animal-details">
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Potwierdzenie usunięcia"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Anuluj</Button>
            <Button variant="danger" onClick={handleDelete}>Usuń</Button>
          </>
        }
      >
        <p>Czy na pewno chcesz usunąć to zwierzę? Ta operacja nie może być cofnięta.</p>
        {animal && (
          <p>
            <strong>
              {animal.species} {animal.farm_animal?.identifier && `#${animal.farm_animal.identifier}`}
            </strong> zostanie usunięte.
          </p>
        )}
      </Modal>
      
      <Card title="Karta zwierzęcia gospodarskiego" actions={cardActions}>
        <AnimalHeader animal={animal} />
        <Tabs defaultTab={0}>
          <Tab label="Dane">
            <BasicInfoTab animal={animal} />
          </Tab>
          <Tab label="Dokumentacja">
            <DocumentationTab />
          </Tab>
          <Tab label="Inseminacje">
            <InseminationsTab />
          </Tab>
          <Tab label="Zdarzenia">
            <EventsTab />
          </Tab>
          <Tab label="Inne">
            <OtherTab />
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
};

export default FarmAnimalDetailsPage;