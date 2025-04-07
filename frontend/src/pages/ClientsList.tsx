import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSearch, FaFile, FaPaw, FaMoneyBillWave } from 'react-icons/fa';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { fetchClients, searchClients } from '../api/userApi';
import { Client, OrganizationWithRole } from '../types/models';
import './ClientsList.css';
import useDebounce from '../hooks/useDebounce';

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
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const itemsPerPage = 20; // Zgodnie z konfiguracją w API

  const navigate = useNavigate();
  
  const { user } = useAuth() as { user: AuthUser | null };
  const organizationId = user?.organizations?.[0]?.id;
  
  // Używamy debounce do ograniczenia liczby zapytań podczas wpisywania
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
  ], []);

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

  // Funkcja do pobierania klientów z wyszukiwaniem lub bez
  const loadClients = useCallback(async (search?: string, page: number = 1) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let data;
      
      if (search && search.length >= 3) {
        console.log(`Wyszukiwanie klientów, fraza: "${search}", strona: ${page}`);
        setIsSearching(true);
        const response = await searchClients(search, ['client', 'farmer'], organizationId ? Number(organizationId) : undefined, page);
        
        data = response.data.clients || [];
        setTotalResults(response.data.pagination?.total || data.length);
        console.log(`Znaleziono ${data.length} klientów (łącznie ${response.data.pagination?.total || data.length})`);
      } else {
        console.log(`Pobieranie wszystkich klientów dla organizacji: ${organizationId || 'brak'}`);
        setIsSearching(false);
        data = await fetchClients(organizationId ? Number(organizationId) : undefined);
        setTotalResults(data.length);
      }
      
      setClients(data);
      setError(null);
    } catch (err) {
      console.error('Błąd podczas pobierania klientów:', err);
      setError('Nie udało się pobrać listy klientów. Spróbuj ponownie później.');
      setClients([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  }, [user, organizationId]);

  // Handler do zmiany strony
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    loadClients(debouncedSearchTerm, page);
  }, [debouncedSearchTerm, loadClients]);

  // Efekt do ładowania danych przy pierwszym renderowaniu i zmianie organizacji
  useEffect(() => {
    loadClients();
  }, [organizationId, user, loadClients]);

  // Efekt do wyszukiwania klientów gdy zmieni się fraza wyszukiwania
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      setCurrentPage(1); // Reset do pierwszej strony przy nowym wyszukiwaniu
      loadClients(debouncedSearchTerm, 1);
    }
  }, [debouncedSearchTerm, loadClients]);

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

  // Komponent paginacji
  const Pagination = () => (
    <div className="pagination">
      <button 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1 || isLoading}
        className="pagination-button"
      >
        &laquo; Poprzednia
      </button>
      
      <span className="pagination-info">
        Strona {currentPage} z {Math.max(1, Math.ceil(totalResults / itemsPerPage))}
      </span>
      
      <button 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage >= Math.ceil(totalResults / itemsPerPage) || isLoading}
        className="pagination-button"
      >
        Następna &raquo;
      </button>
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
        ) : clients.length === 0 ? (
          <div className="empty-message">
            {debouncedSearchTerm.length >= 3 
              ? "Brak wyników dla podanych kryteriów wyszukiwania" 
              : "Brak klientów do wyświetlenia"}
            {user && <p>Zalogowany jako: {user.email} (ID: {user.id})</p>}
            {organizationId && <p>Organizacja ID: {organizationId}</p>}
            {userRole && <p>Rola: {userRole}</p>}
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <Table
              columns={columns}
              data={clients}
              onRowClick={handleRowClick}
            />
            {totalResults > itemsPerPage && <Pagination />}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ClientsList;