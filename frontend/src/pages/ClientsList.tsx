import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSearch, FaFile, FaPaw, FaMoneyBillWave, FaEdit, FaTrash } from 'react-icons/fa';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { fetchClients } from '../services/clientService';
import './ClientsList.css';

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  city: string;
  street: string;
  house_number: string;
  phone: string;
  email: string;
  organization_name?: string;
  organization_city?: string;
  organization_street?: string;
  organization_house_number?: string;
  role?: string;
}

// Definiujemy interfejs użytkownika, aby uniknąć błędu z właściwością 'role'
interface AuthUser {
  id: number;
  username: string;
  role: string;
  // Inne pola użytkownika, które mogą być potrzebne
}

const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();
  // Używamy rzutowania typu dla kontekstu uwierzytelniania
  const { user } = useAuth() as { user: AuthUser | null };

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const data = await fetchClients();
        setClients(data);
        setError(null);
      } catch (err) {
        setError('Nie udało się pobrać listy klientów. Spróbuj ponownie później.');
        console.error('Error fetching clients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  // Filtrowanie klientów po wyszukiwanej frazie
  const filteredClients = clients.filter(
    (client) =>
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  // Sprawdzanie, czy użytkownik ma uprawnienia do edycji i usuwania
  const canEditDelete = user && (user.role === 'Owner' || user.role === 'OfficeStaff');

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

  const handleDocumentationClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    // Tutaj można dodać logikę rozwijania menu lub nawigację do podstrony dokumentacji
  };

  const handleAnimalsClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    // Tutaj można dodać logikę rozwijania menu lub nawigację do podstrony zwierząt
  };

  const handleBillingClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    // Tutaj można dodać logikę rozwijania menu lub nawigację do podstrony rozliczeń
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
      render: (client: Client) => `${client.city}, ul. ${client.street} ${client.house_number}`
    },
    { 
      key: 'phone', 
      title: 'Telefon', 
      sortable: true 
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
        if (client.organization_name) {
          const orgAddress = client.organization_city && client.organization_street ? 
            `[${client.organization_city}, ul. ${client.organization_street} ${client.organization_house_number || ''}]` : '';
          return `${client.organization_name} ${orgAddress}`;
        }
        return '';
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
      <Button
        variant="success"
        icon={<FaUserPlus />}
        onClick={() => navigate('/clients/add')}
      >
        Dodaj klienta
      </Button>
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
          <div className="empty-message">Brak klientów do wyświetlenia</div>
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