import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSearch, FaFile, FaPaw, FaMoneyBillWave, FaEdit, FaTrash } from 'react-icons/fa';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { fetchClients } from '../api/clientApi';
import { Client, OrganizationWithRole } from '../types/models';
import './ClientsList.css';

// Interfejs dla danych użytkownika z kontekstu uwierzytelniania
interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  organizations?: OrganizationWithRole[];
}

// Komponent listy klientów
const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();
  
  // Używamy kontekstu uwierzytelniania
  const { user } = useAuth() as { user: AuthUser | null };
  
  // Pobieramy ID organizacji z pierwszej organizacji użytkownika
  const organizationId = user?.organizations?.[0]?.id;

  // Dodajemy debugowanie, aby sprawdzić co zawiera obiekt użytkownika
  console.log("User data:", user);
  console.log("Organization ID:", organizationId);
  
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        
        // Jeśli użytkownik jest zalogowany, próbujemy pobrać klientów
        if (user) {
          console.log(`Pobieranie klientów dla organizacji: ${organizationId || 'brak'}`);
          const data = await fetchClients(organizationId ? Number(organizationId) : undefined);
          console.log("Otrzymane dane klientów:", data);
          setClients(data);
          setError(null);
        } else {
          setError('Użytkownik nie jest zalogowany.');
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Nie udało się pobrać listy klientów. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [organizationId, user]);

  // Filtrowanie klientów po wyszukiwanej frazie
  const filteredClients = clients.filter(
    (client) =>
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm))
  );

  console.log("Filtered clients:", filteredClients);

  // Sprawdzanie roli użytkownika w organizacji - ignorujemy wielkość liter
  const userRole = user?.organizations?.find(org => 
    org.id === Number(organizationId))?.role?.toLowerCase();
  
  console.log("User role detected:", userRole);
  
  // Sprawdzanie, czy użytkownik ma uprawnienia do edycji i usuwania
  const canEditDelete = userRole === 'owner' || userRole === 'officestaff';

  const handleRowClick = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleEdit = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation(); // Zapobiega wywołaniu handleRowClick
    navigate(`/clients/${clientId}/edit`);
  };

  const handleDelete = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation(); // Zapobiega wywołaniu handleRowClick
    if (window.confirm('Czy na pewno chcesz usunąć tego klienta?')) {
      // Tutaj implementacja usuwania klienta przez API
      console.log('Usuwanie klienta o ID:', clientId);
    }
  };

  // Funkcje obsługi przycisków akcji
  const handleDocumentationClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/documents`);
  };

  const handleAnimalsClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/animals`);
  };

  const handleBillingClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/billing`);
  };

  const columns = [
    { 
      key: 'name', 
      title: 'Imię i Nazwisko', 
      sortable: true,
      render: (client: Client) => `${client.first_name} ${client.last_name}`
    },
    { 
      key: 'address', 
      title: 'Adres', 
      sortable: true,
      render: (client: Client) => client.city ? `${client.city}, ul. ${client.street || ''} ${client.house_number || ''}` : '-'
    },
    { 
      key: 'phone', 
      title: 'Telefon', 
      sortable: true,
      render: (client: Client) => client.phone || '-'
    },
    { 
      key: 'email', 
      title: 'Email', 
      sortable: true 
    },
    { 
      key: 'organization', 
      title: 'Firma', 
      sortable: true,
      render: (client: Client) => {
        // Znajdź organizację, w której klient jest właścicielem
        // Ignorujemy wielkość liter w roli
        const ownedOrg = client.organizations?.find(org => 
          org.role?.toLowerCase() === 'owner');
        if (ownedOrg) {
          const orgAddress = ownedOrg.city ? 
            `[${ownedOrg.city}, ul. ${ownedOrg.street || ''} ${ownedOrg.house_number || ''}]` : '';
          return `${ownedOrg.name} ${orgAddress}`;
        }
        return '-';
      }
    },
    {
      key: 'actions',
      title: 'Akcje',
      sortable: false,
      render: (client: Client) => (
        <div className="action-buttons">
          <Button 
            icon={<FaFile />} 
            onClick={(e) => handleDocumentationClick(e, client.id)}
            tooltip="Dokumentacja"
            variant="primary"
          />
          <Button 
            icon={<FaPaw />} 
            onClick={(e) => handleAnimalsClick(e, client.id)}
            tooltip="Zwierzęta"
            variant="primary"
          />
          <Button 
            icon={<FaMoneyBillWave />} 
            onClick={(e) => handleBillingClick(e, client.id)}
            tooltip="Rozliczenia"
            variant="primary"
          />
          {canEditDelete && (
            <>
              <Button 
                icon={<FaEdit />} 
                onClick={(e) => handleEdit(e, client.id)}
                tooltip="Edytuj"
                variant="warning"
              />
              <Button 
                icon={<FaTrash />} 
                onClick={(e) => handleDelete(e, client.id)}
                tooltip="Usuń"
                variant="danger"
              />
            </>
          )}
        </div>
      )
    }
  ];

  // Komponent action buttons dla nagłówka karty
  const cardActions = (
    <div className="card-actions">
      <div className="search-container">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Szukaj klientów..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {canEditDelete && (
        <Button
          variant="success"
          icon={<FaUserPlus />}
          onClick={() => navigate('/clients/add')}
        >
          Dodaj klienta
        </Button>
      )}
    </div>
  );

  return (
    <div className="clients-list">
      <h1 className="page-title">Lista klientów</h1>

      <Card 
        title="Klienci" 
        actions={cardActions}
      >
        {isLoading ? (
          <div className="loading-spinner">Ładowanie danych...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="empty-message">
            Brak klientów do wyświetlenia
            {user && <p>Zalogowany jako: {user.email} (ID: {user.id})</p>}
            {organizationId && <p>Organizacja ID: {organizationId}</p>}
            {userRole && <p>Rola: {userRole}</p>}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredClients}
            onRowClick={handleRowClick}
          />
        )}
      </Card>
    </div>
  );
};

export default ClientsList;