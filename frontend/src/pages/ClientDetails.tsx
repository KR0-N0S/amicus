import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaPrint, FaSync } from 'react-icons/fa';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';  // Dodane import modala
import Tabs, { Tab } from '../components/common/Tabs/Tabs';
import { useAuth } from '../context/AuthContext';
import { fetchClientById, deactivateClient } from '../api/clientApi';
import { getCurrentUser } from '../utils/auth';
import { Client, OrganizationWithRole } from '../types/models';
import './ClientDetails.css';

interface ClientDetailsParams {
  id: string;
  [key: string]: string | undefined;
}

// Interfejs dla danych użytkownika z kontekstu uwierzytelniania
interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  organizations?: OrganizationWithRole[];
}

const ClientDetails: React.FC = () => {
  const { id } = useParams<ClientDetailsParams>();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  // Dodajemy stan dla modala
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Pobieramy dane użytkownika bezpośrednio z localStorage oraz z kontekstu
  const localStorageUser = getCurrentUser();
  const { user: contextUser } = useAuth() as { user: AuthUser | null };
  
  // Używamy najbardziej kompletne dane - preferujemy dane z localStorage
  const user = localStorageUser || contextUser;
  
  console.log("Pełny obiekt użytkownika (localStorage):", localStorageUser);
  console.log("Pełny obiekt użytkownika (kontekst):", contextUser);
  console.log("Używany obiekt użytkownika:", user);
  console.log("Email użytkownika:", user?.email);
  console.log("Organizacje użytkownika:", user?.organizations);
  
  // Funkcja pomocnicza sprawdzająca uprawnienia
  const userHasRole = (roles: string[]): boolean => {
    
    // Sprawdzenie, czy użytkownik ma organizacje
    if (!user?.organizations || user.organizations.length === 0) {
      return false;
    }
    
    // Sprawdzenie, czy w którejkolwiek organizacji ma wymaganą rolę
    return user.organizations.some((org: OrganizationWithRole) => {
      if (!org.role) return false;
      const orgRole = org.role.toLowerCase();
      return roles.includes(orgRole);
    });
  };
  
  // Uprawnienia do edycji/usuwania mają użytkownicy z rolą owner lub officestaff
  const canEditDelete = userHasRole(['owner', 'officestaff']);
  
  console.log('Użytkownik może edytować/usuwać:', canEditDelete);
  
  const loadClient = async () => {
    if (!id) {
      setError('Nie znaleziono identyfikatora klienta');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchClientById(Number(id));
      setClient(data);
      console.log("Client loaded:", data);
    } catch (err: any) {
      console.error('Error fetching client details:', err);
      
      if (err.response) {
        if (err.response.status === 403) {
          setError('Nie masz uprawnień do wyświetlenia tego klienta.');
        } else if (err.response.status === 404) {
          setError('Nie znaleziono klienta o podanym identyfikatorze.');
        } else if (err.response.status === 500) {
          setError('Wystąpił błąd serwera. Spróbuj odświeżyć stronę lub skontaktuj się z administratorem.');
        } else {
          setError(`Wystąpił błąd: ${err.response.data?.message || 'Nieznany błąd'}`);
        }
      } else if (err.request) {
        setError('Nie można połączyć się z serwerem. Sprawdź swoje połączenie internetowe.');
      } else {
        setError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [id, retryCount]);

  const handleEdit = () => {
    navigate(`/clients/${id}/edit`);
  };

  // Aktualizujemy funkcję handleDelete, która teraz tylko otwiera modal
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // Dodajemy nową funkcję do obsługi faktycznego usunięcia po potwierdzeniu w modalu
  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      await deactivateClient(Number(id));
      setIsLoading(false);
      
      // Zamykamy modal
      setIsDeleteModalOpen(false);
      
      // Przekierowanie do listy klientów
      navigate('/clients');
    } catch (error) {
      setIsLoading(false);
      console.error('Error deactivating client:', error);
      setError('Wystąpił błąd podczas dezaktywacji klienta');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Komponent dla głównych informacji o kliencie
  const ClientHeader = ({ client }: { client: Client }) => {
    // Znajdź organizację, w której klient jest właścicielem
    const ownedOrg = client.organizations?.find(org => 
      org.role?.toLowerCase() === 'owner');
      
    return (
      <div className="client-header">
        <div className="client-main-info">
          <h1>{client.first_name} {client.last_name}</h1>
          {ownedOrg && (
            <div className="client-organization">
              <h2>{ownedOrg.name}</h2>
              {ownedOrg.city && (
                <p className="client-address">
                  {ownedOrg.city}, ul. {ownedOrg.street || ''} {ownedOrg.house_number || ''}
                </p>
              )}
            </div>
          )}
          {client.city && (
            <p className="client-address">
              {client.city}, ul. {client.street || ''} {client.house_number || ''}
            </p>
          )}
        </div>
        <div className="client-actions">
          {/* Wyświetl przyciski edycji i usuwania tylko dla właścicieli i pracowników administracji */}
          {canEditDelete && (
            <>
              <Button 
                icon={<FaEdit size={18} />} 
                onClick={handleEdit}
                tooltip="Edytuj"
                variant="warning"
              />
              <Button 
                icon={<FaTrash size={18} />} 
                onClick={handleDelete}
                tooltip="Usuń"
                variant="danger"
              />
            </>
          )}
          <Button 
            icon={<FaPrint size={18} />} 
            onClick={handlePrint}
            tooltip="Drukuj"
            variant="info"
          />
        </div>
      </div>
    );
  };

  // Pozostała część kodu bez zmian
  const BasicInfoTab = ({ client }: { client: Client }) => {
    return (
      <div className="client-basic-info">
        <div className="info-section">
          <h3>Dane kontaktowe</h3>
          <div className="info-row">
            <div className="info-label">Email:</div>
            <div className="info-value">{client.email}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Telefon:</div>
            <div className="info-value">{client.phone || '-'}</div>
          </div>
        </div>

        <div className="info-section">
          <h3>Adres</h3>
          <div className="info-row">
            <div className="info-label">Miasto:</div>
            <div className="info-value">{client.city || '-'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Ulica:</div>
            <div className="info-value">{client.street || '-'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Nr domu:</div>
            <div className="info-value">{client.house_number || '-'}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Kod pocztowy:</div>
            <div className="info-value">{client.postal_code || '-'}</div>
          </div>
        </div>

        <div className="info-section">
          <h3>Dane firmowe</h3>
          <div className="info-row">
            <div className="info-label">NIP:</div>
            <div className="info-value">{client.tax_id || '-'}</div>
          </div>
          
          {client.organizations && client.organizations.length > 0 && (
            <>
              <h3>Organizacje</h3>
              {client.organizations.map((org, index) => (
                <div key={index} className="organization-item">
                  <div className="info-row">
                    <div className="info-label">Nazwa:</div>
                    <div className="info-value">{org.name}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Rola:</div>
                    <div className="info-value">{org.role}</div>
                  </div>
                  {org.city && (
                    <div className="info-row">
                      <div className="info-label">Adres:</div>
                      <div className="info-value">
                        {org.city}, ul. {org.street || ''} {org.house_number || ''}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="info-section">
          <h3>Inne informacje</h3>
          <div className="info-row">
            <div className="info-label">Status:</div>
            <div className="info-value">{client.status}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Data utworzenia:</div>
            <div className="info-value">{new Date(client.created_at).toLocaleDateString('pl-PL')}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Ostatnia aktualizacja:</div>
            <div className="info-value">{new Date(client.updated_at).toLocaleDateString('pl-PL')}</div>
          </div>
        </div>
      </div>
    );
  };

  const DocumentationTab = () => (
    <div className="empty-tab">
      <p>Funkcjonalność dokumentacji medycznej w przygotowaniu.</p>
    </div>
  );

  const InseminationsTab = () => (
    <div className="empty-tab">
      <p>Funkcjonalność inseminacji w przygotowaniu.</p>
    </div>
  );

  const AnimalsTab = () => (
    <div className="empty-tab">
      <p>Funkcjonalność zwierząt w przygotowaniu.</p>
    </div>
  );

  const BillingTab = () => (
    <div className="empty-tab">
      <p>Funkcjonalność rozliczeń w przygotowaniu.</p>
    </div>
  );

  // Komponent do wyświetlania błędów z możliwością ponownej próby
  const ErrorView = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <div className="error-container">
      <div className="error-message">{message}</div>
      <Button 
        variant="primary"
        icon={<FaSync />}
        onClick={onRetry}
      >
        Spróbuj ponownie
      </Button>
    </div>
  );

  const cardActions = (
    <Button
      variant="secondary"
      icon={<FaArrowLeft />}
      onClick={() => navigate('/clients')}
    >
      Powrót do listy
    </Button>
  );

  // Przygotujmy stopkę dla modala
  const deleteModalFooter = (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsDeleteModalOpen(false)}
      >
        Anuluj
      </Button>
      <Button
        variant="danger"
        onClick={confirmDelete}
      >
        Dezaktywuj
      </Button>
    </>
  );

  return (
    <div className="client-details">
      {/* Modal potwierdzenia dezaktywacji */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Potwierdzenie dezaktywacji"
        footer={deleteModalFooter}
      >
        <p>Czy na pewno chcesz dezaktywować tego klienta? Ta operacja nie może być cofnięta.</p>
        {client && <p><strong>{client.first_name} {client.last_name}</strong> zostanie dezaktywowany.</p>}
      </Modal>
      
      <Card title="Karta klienta" actions={cardActions}>
        {isLoading ? (
          <div className="loading-spinner">Ładowanie danych...</div>
        ) : error ? (
          <ErrorView message={error} onRetry={handleRetry} />
        ) : client ? (
          <>
            <ClientHeader client={client} />
            
            <Tabs defaultTab={0}>
              <Tab label="Dane">
                <BasicInfoTab client={client} />
              </Tab>
              <Tab label="Dokumentacja">
                <DocumentationTab />
              </Tab>
              <Tab label="Inseminacje">
                <InseminationsTab />
              </Tab>
              <Tab label="Zwierzęta">
                <AnimalsTab />
              </Tab>
              <Tab label="Rozliczenia">
                <BillingTab />
              </Tab>
            </Tabs>
          </>
        ) : (
          <div className="error-message">Nie znaleziono klienta.</div>
        )}
      </Card>
    </div>
  );
};

export default ClientDetails;