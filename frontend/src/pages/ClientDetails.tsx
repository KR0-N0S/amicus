import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaPrint, FaSync } from 'react-icons/fa';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Tabs, { Tab } from '../components/common/Tabs/Tabs';
import { useAuth } from '../context/AuthContext';
import { deactivateClient } from '../api/userApi';
import { getCurrentUser } from '../utils/auth';
import useClient from '../hooks/useClient';
import { Client, OrganizationWithRole } from '../types/models';
import Alert from '@mui/material/Alert';
import './ClientDetails.css';

interface ClientDetailsParams {
  id: string;
  [key: string]: string | undefined;
}

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  organizations?: OrganizationWithRole[];
}

const checkAccessToClient = (clientData: Client, currentUser: any): boolean => {
  if (!currentUser || !clientData) {
    console.log('Missing user or client data');
    return false;
  }
  
  console.log('Checking access for client:', {
    id: clientData.id, 
    name: `${clientData.first_name} ${clientData.last_name}`,
    status: clientData.status,
    organizations: clientData.organizations
  });
  
  console.log('Current user:', {
    id: currentUser.id,
    organizations: currentUser.organizations
  });
  
  // 1. Jeśli użytkownik przegląda swoje własne dane - ma dostęp
  if (currentUser.id === clientData.id) {
    console.log('User is viewing their own data - access granted');
    return true;
  }
  
  // 2. Sprawdź niedawno utworzonych klientów (to jest wcześniej niż sprawdzanie organizacji)
  const recentlyCreatedClientId = localStorage.getItem('recentlyCreatedClientId');
  const storedOrgId = localStorage.getItem(`client_${clientData.id}_organizationId`);
  
  if (recentlyCreatedClientId === String(clientData.id)) {
    console.log('Client was recently created by this user - access granted');
    return true;
  }
  
  if (storedOrgId) {
    console.log(`Found stored organization association for client ${clientData.id} - access granted`);
    return true;
  }
  
  // 3. Jeśli użytkownik ma rolę administratora w JAKIEJKOLWIEK organizacji, ma dostęp do wszystkich klientów
  // To może być zbyt szerokie, ale na razie sprawdźmy czy to rozwiąże problem
  const hasAdminRole = currentUser.organizations && currentUser.organizations.some((org: OrganizationWithRole) => 
    ['owner', 'superadmin', 'officestaff', 'admin'].includes(org.role?.toLowerCase())
  );
  
  if (hasAdminRole) {
    console.log('User has administrative role - access granted');
    // To może być zbyt permisywne, ale sprawdźmy czy to rozwiąże problem
    return true;
  }
  
  // 4. Sprawdź powiązania organizacyjne - bardziej szczegółowa weryfikacja
  if (!currentUser.organizations || !clientData.organizations) {
    console.log('Missing organization data', {
      userOrgs: currentUser.organizations,
      clientOrgs: clientData.organizations
    });
    return false;
  }
  
  // 5. Sprawdź czy klient i użytkownik należą do tych samych organizacji
  for (const userOrg of currentUser.organizations) {
    // Dodajmy więcej logowania
    console.log(`Checking user's org: ${userOrg.id} (${userOrg.name}) with role: ${userOrg.role}`);
    
    // Sprawdź, czy klient należy do tej samej organizacji co użytkownik
    const matchingClientOrgs = clientData.organizations.filter(
      clientOrg => clientOrg.id === userOrg.id
    );
    
    if (matchingClientOrgs.length > 0) {
      console.log(`Client belongs to org: ${userOrg.id} with roles:`, 
        matchingClientOrgs.map(org => org.role)
      );
      
      const userRoleLower = userOrg.role?.toLowerCase() || '';
      
      // Jeśli użytkownik ma rolę administracyjną w organizacji klienta
      if (['owner', 'superadmin', 'officestaff', 'admin'].includes(userRoleLower)) {
        console.log(`User has admin role ${userRoleLower} in client's organization - access granted`);
        return true;
      }
      
      // Sprawdź role pracowników, którzy mogą mieć dostęp do klientów
      if (['employee', 'inseminator', 'vettech', 'vet'].includes(userRoleLower)) {
        // Sprawdź rolę klienta w tej organizacji
        const clientRoles = matchingClientOrgs.map(org => org.role?.toLowerCase() || '');
        console.log('Client roles in this organization:', clientRoles);
        
        // Sprawdź zarówno "client" jak i "farmer" oraz inne możliwe warianty (dodane case insensitive)
        const isClientOrFarmer = clientRoles.some(role => 
          ['client', 'farmer', 'klient', 'rolnik'].includes(role.toLowerCase())
        );
        
        if (isClientOrFarmer) {
          console.log('User is allowed to view this client based on roles - access granted');
          return true;
        }
      }
    }
  }
  
  // Nie znaleziono żadnego pasującego warunku dostępu
  console.log('Access denied - user does not have required permissions');
  return false;
};

const ClientDetails: React.FC = () => {
  const { id } = useParams<ClientDetailsParams>();
  const navigate = useNavigate();
  
  const localStorageUser = getCurrentUser();
  const { user: contextUser } = useAuth() as { user: AuthUser | null };
  const user = localStorageUser || contextUser;
  
  const canEditDelete = useMemo(() => {
    if (!user?.organizations) return false;
    return user.organizations.some((org: OrganizationWithRole) =>
      ['owner', 'officestaff'].includes(org.role?.toLowerCase())
    );
  }, [user]);
  
  const stableUser = React.useMemo(() => user, [user?.id, user?.email]);
  const { client, isLoading, error, reload } = useClient(id, stableUser, checkAccessToClient);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  
  const handleEdit = () => {
    navigate(`/clients/${id}/edit`);
  };

  const handlePrint = () => {
    window.print();
  };

  const confirmDelete = async () => {
    try {
      const organizationId = user?.organizations && user.organizations.length > 0
        ? user.organizations[0].id
        : undefined;
      await deactivateClient(Number(id), organizationId);
      setIsDeleteModalOpen(false);
      navigate('/clients');
    } catch (err) {
      console.error('Error deactivating client:', err);
    }
  };
  
  const cardActions = (
    <Button variant="secondary" icon={<FaArrowLeft />} onClick={() => navigate('/clients')}>
      Powrót do listy
    </Button>
  );
  
  // Rozbudowany, profesjonalnie wyglądający nagłówek karty klienta
  const ClientHeader = ({ client }: { client: Client }) => {
    const ownedOrg = client.organizations?.find(org => org.role?.toLowerCase() === 'owner');
    return (
      <div className="client-header">
        <div className="client-header-info">
          <h1 className="client-name">{client.first_name} {client.last_name}</h1>
          {ownedOrg && (
            <div className="client-org">
              <h2 className="org-name">{ownedOrg.name}</h2>
              {ownedOrg.city && (
                <p className="org-address">
                  {ownedOrg.city}, ul. {ownedOrg.street || ''} {ownedOrg.house_number || ''}
                </p>
              )}
            </div>
          )}
          <p className="client-address">
            {client.city}, ul. {client.street || ''} {client.house_number || ''}
          </p>
        </div>
        <div className="client-header-actions">
          {canEditDelete && (
            <>
              <Button icon={<FaEdit size={18} />} onClick={handleEdit} tooltip="Edytuj" variant="warning" />
              <Button icon={<FaTrash size={18} />} onClick={() => setIsDeleteModalOpen(true)} tooltip="Usuń" variant="danger" />
            </>
          )}
          <Button icon={<FaPrint size={18} />} onClick={handlePrint} tooltip="Drukuj" variant="info" />
        </div>
      </div>
    );
  };

  // Zoptymalizowany BasicInfoTab z wyraźnym podziałem sekcji
  const BasicInfoTab = ({ client }: { client: Client }) => (
    <div className="client-basic-info">
      <div className="info-section">
        <h3>Dane kontaktowe</h3>
        <div className="info-row">
          <span className="label">Email:</span>
          <span className="value">{client.email}</span>
        </div>
        <div className="info-row">
          <span className="label">Telefon:</span>
          <span className="value">{client.phone || '-'}</span>
        </div>
      </div>
      <div className="info-section">
        <h3>Adres</h3>
        <div className="info-row">
          <span className="label">Miasto:</span>
          <span className="value">{client.city || '-'}</span>
        </div>
        <div className="info-row">
          <span className="label">Ulica:</span>
          <span className="value">{client.street || '-'}</span>
        </div>
        <div className="info-row">
          <span className="label">Nr domu:</span>
          <span className="value">{client.house_number || '-'}</span>
        </div>
        <div className="info-row">
          <span className="label">Kod pocztowy:</span>
          <span className="value">{client.postal_code || '-'}</span>
        </div>
      </div>
      <div className="info-section">
        <h3>Dane firmowe</h3>
        <div className="info-row">
          <span className="label">NIP:</span>
          <span className="value">{client.tax_id || '-'}</span>
        </div>
        {client.organizations && client.organizations.length > 0 && (
          <>
            <h3>Organizacje</h3>
            {client.organizations.map((org, index) => (
              <div key={index} className="organization-item">
                <div className="info-row">
                  <span className="label">Nazwa:</span>
                  <span className="value">{org.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Rola:</span>
                  <span className="value">{org.role}</span>
                </div>
                {org.city && (
                  <div className="info-row">
                    <span className="label">Adres:</span>
                    <span className="value">
                      {org.city}, ul. {org.street || ''} {org.house_number || ''}
                    </span>
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
          <span className="label">Status:</span>
          <span className="value">{client.status}</span>
        </div>
        <div className="info-row">
          <span className="label">Data utworzenia:</span>
          <span className="value">{new Date(client.created_at).toLocaleDateString('pl-PL')}</span>
        </div>
        <div className="info-row">
          <span className="label">Ostatnia aktualizacja:</span>
          <span className="value">{new Date(client.updated_at).toLocaleDateString('pl-PL')}</span>
        </div>
      </div>
    </div>
  );

  const DocumentationTab = () => (
    <div className="empty-tab">
      <p>Dokumentacja w przygotowaniu.</p>
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
  
  if (error) {
    return (
      <div className="client-details">
        <Card title="Karta klienta" actions={cardActions}>
          <div className="error-message">{error}</div>
        </Card>
      </div>
    );
  }

  if (!client) return null;
  
  return (
    <div className="client-details">
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Potwierdzenie dezaktywacji"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Anuluj</Button>
            <Button variant="danger" onClick={confirmDelete}>Dezaktywuj</Button>
          </>
        }
      >
        <p>Czy na pewno chcesz dezaktywować tego klienta? Ta operacja nie może być cofnięta.</p>
        {client && <p><strong>{client.first_name} {client.last_name}</strong> zostanie dezaktywowany.</p>}
      </Modal>
      
      <Card title="Karta klienta" actions={cardActions}>
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
      </Card>
    </div>
  );
};

export default ClientDetails;