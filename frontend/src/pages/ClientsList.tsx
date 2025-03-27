import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSearch, FaFile, FaPaw, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button'; // Poprawiony import (wcześniej był components.common/Button)
import { useAuth } from '../context/AuthContext';
import { fetchClients } from '../api/clientApi';
import { Client, OrganizationWithRole } from '../types/models';
import './ClientsList.css';

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  organizations?: OrganizationWithRole[];
}

const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();
  
  const { user } = useAuth() as { user: AuthUser | null };
  const organizationId = user?.organizations?.[0]?.id;

  // Używamy memoizacji, żeby nie przeliczać filtrowania przy każdej zmianie stanu
  const filteredClients = useMemo(() => {
    return clients.filter(
      (client) =>
        client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  // Memoizacja kolumn – są statyczne, więc nie muszą być przeliczane przy każdym renderze
  const columns = useMemo(() => [
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
      render: (client: Client) =>
        client.city
          ? `${client.city}, ul. ${client.street || ''} ${client.house_number || ''}`
          : '-'
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
        const ownedOrg = client.organizations?.find(org => org.role?.toLowerCase() === 'owner');
        if (ownedOrg) {
          const orgAddress = ownedOrg.city
            ? `[${ownedOrg.city}, ul. ${ownedOrg.street || ''} ${ownedOrg.house_number || ''}]`
            : '';
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
        </div>
      )
    }
  ], []); // zależności puste, ponieważ kolumny są statyczne

  // Używamy useCallback, by uniknąć zmiany referencji funkcji przy każdym renderze
  const handleRowClick = useCallback((client: Client) => {
    navigate(`/clients/${client.id}`);
  }, [navigate]);

  const handleDocumentationClick = useCallback((e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/documents`);
  }, [navigate]);

  const handleAnimalsClick = useCallback((e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/animals`);
  }, [navigate]);

  const handleBillingClick = useCallback((e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/billing`);
  }, [navigate]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
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

  const userRole = user?.organizations?.find(org =>
    org.id === Number(organizationId))?.role?.toLowerCase();

  const canAddClient = userRole === 'owner' || userRole === 'officestaff';

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
      {canAddClient && (
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
      <Card title="Klienci" actions={cardActions}>
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
          // Rozszerzenie tabeli do pełnej szerokości rodzica
          <div style={{ width: '100%' }}>
            <Table
              columns={columns}
              data={filteredClients}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClientsList;