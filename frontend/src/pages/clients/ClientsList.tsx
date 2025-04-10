import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FaRegBookmark, FaRegPlusSquare, FaFileExport,
  FaTag, FaEnvelope, FaSms
} from 'react-icons/fa';
import { FiSearch, FiFilter, FiSettings, FiEye } from 'react-icons/fi';
import { 
  TextField, InputAdornment, Typography,
  IconButton, Chip, Tooltip, Box, Checkbox,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import axios from 'axios';

// Komponenty
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import BulkActionsPanel, { BulkAction } from '../../components/common/BulkActionsPanel';
import ExportDataDialog from '../../components/common/ExportDataDialog';
import TagManager from '../../components/clients/TagManager';
import ListFiltersPanel from '../../components/common/ListFiltersPanel';
import ListViewsManager from '../../components/common/ListViewsManager';
import StatusBadge, { StatusType } from '../../components/common/StatusBadge';
import Tag from '../../components/common/Tag';

// Hooki i utilities
import { useAuth } from '../../context/AuthContext';
import useDataFilters from '../../hooks/useDataFilters';
import useColumnSettings from '../../hooks/useColumnSettings';
import useDebounce from '../../hooks/useDebounce';
import useSavedViews, { SavedView } from '../../hooks/useSavedViews';
import { fetchClients, searchClients, assignTagsToClients } from '../../api/userApi';
import { Client, OrganizationWithRole } from '../../types/models';
import { ClientFilterState } from '../../types/filters';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';

// Style
import './ClientsList.css';

// Stałe konfiguracyjne
const COLUMN_SETTINGS_KEY = 'amicus_client_list_column_settings';
const USER_FILTERS_KEY = 'amicus_client_list_filters';
const USER_VIEWS_KEY = 'amicus_client_list_views';
const ITEMS_PER_PAGE = 20;

// Typ dla dialogów akcji masowych
type BulkActionType = 'tags' | 'email' | 'sms';

// Interfejs dla znaczników (tagów)
interface Tag {
  id: number;
  name: string;
  color: string;
  organization_id?: number;
}

// Interfejs dla tabeli
interface TableColumnInternal {
  key: string;
  title: string;
  sortable: boolean;
  visible?: boolean;
  width?: string;
  render?: (item: any) => React.ReactNode;
}

// Funkcja pomocnicza do mapowania statusów na typy StatusType
const mapStatusToStatusType = (status: string): StatusType => {
  switch (status) {
    case 'active': return 'active';
    case 'inactive': return 'inactive';
    case 'pending': return 'pending';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    case 'processing': return 'processing';
    case 'new': return 'new';
    case 'vip': return 'vip';
    case 'blocked': return 'blocked';
    case 'debt': return 'debt';
    case 'potential': return 'potential';
    case 'archived': return 'archived';
    default: return 'inactive'; // domyślny status
  }
};

/**
 * Komponent izolujący pole wyszukiwania, aby uniknąć nieskończonych rerenderów
 */
const SearchField = React.memo(({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  // Używamy lokalnego stanu w izolowanym komponencie
  const [localValue, setLocalValue] = React.useState(value);
  
  // Synchronizujemy lokalny stan z wartością z props
  React.useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Obsługa zmiany wartości wejściowej - zoptymalizowana
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue); // Najpierw aktualizujemy stan lokalny
    onChange(newValue);      // Następnie przekazujemy zmianę do rodzica
  }, [onChange]);

  return (
    <TextField
      placeholder="Szukaj klientów..."
      value={localValue}
      onChange={handleChange}
      size="small"
      fullWidth
      className="search-input"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FiSearch className="search-icon" size={16} />
          </InputAdornment>
        ),
      }}
    />
  );
});

/**
 * Komponent listy klientów z zaawansowanym filtrowaniem i akcjami masowymi
 */
const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id;
  const organizationId = user?.organizations?.[0]?.id;

  // Referencje i liczniki
  const loadClientsCounter = useRef<number>(0);
  const cancelTokenSourceRef = useRef<any>(null);
  const isInternalPageChange = useRef<boolean>(false);
  const isInternalUrlUpdate = useRef<boolean>(false);
  const skipNextEffect = useRef<boolean>(false);

  // Stan komponentu
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('q') || '');
  const [totalResults, setTotalResults] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));

  // Stan interfejsu
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  const [showViewsMenu, setShowViewsMenu] = useState<boolean>(false);
  const [showColumnsSettings, setShowColumnsSettings] = useState<boolean>(false);

  // Dialog akcji masowych
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    type: BulkActionType;
    selectedTagIds?: number[];
  }>({
    open: false,
    type: 'tags',
    selectedTagIds: []
  });

  // Dialog eksportu
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Stan tagów klientów
  const [clientTags, setClientTags] = useState<Record<number, Tag[]>>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([
    { id: 1, name: "VIP", color: "primary" },
    { id: 2, name: "Stały klient", color: "success" },
    { id: 3, name: "Nowy", color: "info" },
    { id: 4, name: "Wymaga kontaktu", color: "warning" },
    { id: 5, name: "Potencjalny", color: "secondary" }
  ]);
  
  // Stan sortowania
  const [sortConfig, setSortConfig] = useState({
    column: searchParams.get('sort') || 'name',
    direction: (searchParams.get('order') || 'asc') as 'asc' | 'desc' | 'none'
  });
  
  // Hook debounce dla wyszukiwania
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Stan filtrów z własnego hooka
  const initialFilters: ClientFilterState = {
    status: searchParams.get('status') || 'all',
    type: searchParams.get('type') || 'all',
    dateFrom: searchParams.get('dateFrom') || null,
    dateTo: searchParams.get('dateTo') || null,
    city: searchParams.get('city') || '',
    organization: searchParams.get('organization') || '',
    tags: searchParams.getAll('tags') || [],
    hasOrders: searchParams.get('hasOrders') === 'true' ? true :
      searchParams.get('hasOrders') === 'false' ? false : null,
    lastActivityFrom: searchParams.get('lastActivityFrom') || null,
    lastActivityTo: searchParams.get('lastActivityTo') || null
  };

  const { 
    filters, 
    setFilter, 
    resetFilters, 
    setFilters, 
    saveFilters 
  } = useDataFilters<ClientFilterState>(
    initialFilters,
    userId,
    USER_FILTERS_KEY
  );

  // Hook dla zapisanych widoków
  const {
    views: savedViews,
    saveView,
    deleteView,
    applyView
  } = useSavedViews(userId, USER_VIEWS_KEY);

  // Pomocnicze funkcje
  const formatAddress = useCallback((city?: string, street?: string, houseNumber?: string): string => {
    if (!city) return '-';
    
    if (street) {
      return `${city}, ul. ${street} ${houseNumber || ''}`.trim();
    } else {
      return `${city} ${houseNumber || ''}`.trim();
    }
  }, []);

  // Sprawdzenie uprawnień użytkownika
  const userOrg = user?.organizations?.find(org => 
    org.id === Number(organizationId)) as OrganizationWithRole | undefined;
  const userRole = userOrg?.role?.toLowerCase();
  
  const canAddClient = userRole === 'owner' || userRole === 'officestaff';
  const canEditClient = canAddClient;
  
  // Funkcja ładująca klientów - deklaracja przed użyciem
  const loadClients = useCallback(async (
    sortColumn = sortConfig.column, 
    sortDirection = sortConfig.direction,
    page = currentPage
  ) => {
    if (!user) return;
    
    // Anuluj poprzednie żądanie, jeśli jest aktywne
    if (cancelTokenSourceRef.current) {
      cancelTokenSourceRef.current.cancel('Nowe żądanie anuluje poprzednie');
    }
    
    // Utwórz nowy token anulowania
    const CancelToken = axios.CancelToken;
    cancelTokenSourceRef.current = CancelToken.source();
    
    // Generujemy unikalny identyfikator dla tego wywołania loadClients
    const currentRequestId = ++loadClientsCounter.current;
    
    setIsLoading(true);
    try {
      // Przygotuj parametry zapytania
      const queryParams: Record<string, any> = {
        page: page,
        limit: ITEMS_PER_PAGE,
        sort: sortColumn,
        order: sortDirection
      };
      
      // Dodaj filtry
      if (filters.status !== 'all') queryParams.status = filters.status;
      if (filters.type !== 'all') queryParams.type = filters.type;
      if (filters.dateFrom) queryParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) queryParams.dateTo = filters.dateTo;
      if (filters.city) queryParams.city = filters.city;
      if (filters.organization) queryParams.organization = filters.organization;
      if (filters.tags && filters.tags.length > 0) queryParams.tags = filters.tags.join(',');
      if (filters.hasOrders !== null) queryParams.hasOrders = filters.hasOrders;
      if (filters.lastActivityFrom) queryParams.lastActivityFrom = filters.lastActivityFrom;
      if (filters.lastActivityTo) queryParams.lastActivityTo = filters.lastActivityTo;
      
      let data;
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
        // Wywołanie API wyszukiwania
        const response = await searchClients(
          debouncedSearchTerm, 
          ['client', 'farmer'], 
          organizationId ? Number(organizationId) : undefined,
          page,
          ITEMS_PER_PAGE,
          queryParams,
          cancelTokenSourceRef.current.token // Przekaż token anulowania
        );
        
        if (currentRequestId !== loadClientsCounter.current) return;
        
        data = response.data.clients || [];
        setTotalResults(response.data.pagination?.total || data.length);
      } else {
        // Wywołanie API pobierania klientów
        const response = await fetchClients(
          organizationId ? Number(organizationId) : undefined,
          queryParams,
          cancelTokenSourceRef.current.token // Przekaż token anulowania
        );
        
        if (currentRequestId !== loadClientsCounter.current) return;
        
        data = response;
        setTotalResults(response.length);
      }
      
      // Generuj losowe tagi dla celów demonstracyjnych
      // W rzeczywistej aplikacji tagi byłyby pobierane z API
      const demoTags: Record<number, Tag[]> = {};
      data.forEach((client: Client) => {
        if (Math.random() > 0.3) { // 70% klientów będzie mieć tagi
          const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tagów
          const tags: Tag[] = [];
          
          for (let i = 0; i < numTags; i++) {
            const tagIndex = Math.floor(Math.random() * availableTags.length);
            // Upewnij się, że tag nie został już dodany
            if (!tags.some(t => t.id === availableTags[tagIndex].id)) {
              tags.push(availableTags[tagIndex]);
            }
          }
          
          if (tags.length) {
            demoTags[client.id] = tags;
          }
        }
      });
      
      setClientTags(demoTags);
      setClients(data);
      setSelectedClientIds([]); // Reset zaznaczonych klientów przy nowych danych
      setError(null);
    } catch (err: any) {
      // Ignoruj błędy anulowania
      if (axios.isCancel(err)) {
        console.log('Request canceled:', err.message);
        return;
      }
      
      console.error('Błąd podczas pobierania klientów:', err);
      setError('Nie udało się pobrać listy klientów. Spróbuj ponownie później.');
      setClients([]);
      setTotalResults(0);
    } finally {
      // Ignoruj jeśli to była anulowana operacja lub nieaktualne żądanie
      if (currentRequestId !== loadClientsCounter.current) {
        return;
      }
      setIsLoading(false);
    }
  }, [user, organizationId, availableTags, filters]);

  // Definicja dostępnych kolumn tabeli
  const availableColumns: TableColumnInternal[] = useMemo(() => {
    // Kolumna z checkboxami wyboru
    const selectionColumn: TableColumnInternal = {
      key: 'selection',
      title: '', // Pusta wartość dla kolumny z checkboxami
      sortable: false,
      width: '50px',
      visible: true,
      render: (client: Client) => (
        <Checkbox
          checked={selectedClientIds.includes(client.id)}
          onChange={(e) => {
            e.stopPropagation();
            if (e.target.checked) {
              setSelectedClientIds(prev => [...prev, client.id]);
            } else {
              setSelectedClientIds(prev => prev.filter(id => id !== client.id));
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      )
    };
    
    // Pozostałe kolumny danych
    const dataColumns: TableColumnInternal[] = [
      { 
        key: 'name', 
        title: 'Imię i Nazwisko', 
        sortable: true,
        visible: true,
        render: (client: Client) => `${client.first_name} ${client.last_name}`
      },
      { 
        key: 'address', 
        title: 'Adres', 
        sortable: true,
        visible: true,
        render: (client: Client) => formatAddress(client.city, client.street, client.house_number)
      },
      { 
        key: 'phone', 
        title: 'Telefon', 
        sortable: true,
        visible: true,
        render: (client: Client) => client.phone || '-'
      },
      { 
        key: 'email', 
        title: 'Email', 
        sortable: true,
        visible: true
      },
      { 
        key: 'organization', 
        title: 'Firma', 
        sortable: true,
        visible: true,
        render: (client: Client) => {
          const ownedOrg = client.organizations?.find(org => {
            const orgWithRole = org as OrganizationWithRole;
            return orgWithRole.role?.toLowerCase() === 'owner';
          });
          
          if (ownedOrg) {
            const orgAddress = ownedOrg.city
              ? `[${formatAddress(ownedOrg.city, ownedOrg.street, ownedOrg.house_number)}]`
              : '';
            return `${ownedOrg.name} ${orgAddress}`;
          }
          return '-';
        }
      },
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        visible: true,
        render: (client: Client) => (
          <StatusBadge status={mapStatusToStatusType(client.status)} />
        )
      },
      {
        key: 'tags',
        title: 'Tagi',
        sortable: false,
        visible: true,
        render: (client: Client) => {
          const tags = clientTags[client.id] || [];
          if (tags.length === 0) return '-';
          
          return (
            <div className="client-tags">
              {tags.slice(0, 3).map(tag => (
                <Tag
                  key={tag.id}
                  id={tag.id}
                  label={tag.name}
                  color={tag.color as any}
                />
              ))}
              {tags.length > 3 && (
                <Chip 
                  label={`+${tags.length - 3}`} 
                  size="small" 
                  variant="outlined" 
                  className="more-tags-chip"
                />
              )}
            </div>
          );
        }
      },
      {
        key: 'last_activity',
        title: 'Ostatnia aktywność',
        sortable: true,
        visible: false,
        render: (client: Client) => {
          return client.last_activity 
            ? new Date(client.last_activity).toLocaleDateString('pl-PL')
            : '-';
        }
      },
      {
        key: 'created_at',
        title: 'Data utworzenia',
        sortable: true,
        visible: false,
        render: (client: Client) => {
          return new Date(client.created_at).toLocaleDateString('pl-PL');
        }
      },
      {
        key: 'actions',
        title: 'Akcje',
        sortable: false,
        visible: true,
        render: (client: Client) => (
          <div className="action-buttons">
            <IconButton 
              size="small"
              onClick={(e) => handleDetailsClick(e, client.id)}
              color="primary"
              className="action-icon-button"
              disabled={isLoading}
            >
              <FiEye size={16} />
            </IconButton>
            {canEditClient && (
              <IconButton 
                size="small"
                onClick={(e) => handleEditClick(e, client.id)}
                color="warning"
                className="action-icon-button"
                disabled={isLoading}
              >
                <FiSettings size={16} />
              </IconButton>
            )}
          </div>
        )
      }
    ];
    
    // Łączymy kolumnę wyboru z kolumnami danych
    return [selectionColumn, ...dataColumns];
  }, [clients, selectedClientIds, formatAddress, clientTags, isLoading, canEditClient]);

  // Hook do zarządzania ustawieniami kolumn
  const {
    columnSettings,
    toggleColumn,
    resetColumns,
    visibleColumns: visibleColumnsInternal,
    hasModifiedSettings
  } = useColumnSettings(availableColumns, userId, COLUMN_SETTINGS_KEY);

  // Konwersja kolumn do formatu wymaganego przez komponent Table
  const visibleColumns = useMemo(() => {
    return visibleColumnsInternal.map(col => ({
      key: col.key,
      title: col.title,
      sortable: col.sortable,
      width: col.width,
      render: col.render
    }));
  }, [visibleColumnsInternal]);

  // Handler otwierania panelu filtrów
  const handleToggleFilters = useCallback(() => {
    setShowFiltersPanel(prev => !prev);
    setShowViewsMenu(false);
    setShowColumnsSettings(false);
  }, []);

  // Handler otwierania menu widoków
  const handleToggleViews = useCallback(() => {
    setShowViewsMenu(prev => !prev);
    setShowFiltersPanel(false);
    setShowColumnsSettings(false);
  }, []);

  // Handler otwierania ustawień kolumn
  const handleToggleColumnsSettings = useCallback(() => {
    setShowColumnsSettings(prev => !prev);
    setShowFiltersPanel(false);
    setShowViewsMenu(false);
  }, []);

  // Obsługa wyszukiwania
  const handleSearchChange = useCallback((newValue: string) => {
    skipNextEffect.current = false;
    setSearchTerm(newValue);
  }, []);

  // Funkcje obsługi akcji
  const handleRowClick = useCallback((client: Client) => {
    navigate(`/clients/${client.id}`);
  }, [navigate]);

  const handleDetailsClick = useCallback((e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}`);
  }, [navigate]);

  const handleEditClick = useCallback((e: React.MouseEvent, clientId: number) => {
    e.stopPropagation();
    navigate(`/clients/${clientId}/edit`);
  }, [navigate]);

  // Obsługa sortowania
  const handleSort = useCallback((column: string, direction: 'asc' | 'desc' | 'none') => {
    if (isLoading) return;

    setSortConfig({ column, direction });

    // Aktualizuj URL
    isInternalUrlUpdate.current = true;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', column);
    newParams.set('order', direction);
    setSearchParams(newParams);

    // Przeładuj dane klientów bezpośrednio, nie poprzez useEffect
    loadClients(column, direction, currentPage);
  }, [isLoading, searchParams, setSearchParams, loadClients, currentPage]);

  // Obsługa filtrowania
  const applyFilters = useCallback(() => {
    // Aktualizuj URL
    const newParams = new URLSearchParams();

    // Dodaj filtry do URL
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(v => newParams.append(key, v));
      } else if (value !== null && value !== '' && !Array.isArray(value)) {
        newParams.set(key, String(value));
      }
    });

    // Dodaj pozostałe parametry
    if (searchTerm) newParams.set('q', searchTerm);
    newParams.set('sort', sortConfig.column);
    newParams.set('order', sortConfig.direction);
    newParams.set('page', '1');
    setSearchParams(newParams);

    // Reset strony i przeładuj dane
    setCurrentPage(1);
    saveFilters();
    loadClients(sortConfig.column, sortConfig.direction, 1); // Przekazujemy 1 jako numer strony

    // Zamknij panel filtrów
    setShowFiltersPanel(false);
  }, [filters, searchTerm, sortConfig, setSearchParams, saveFilters, loadClients]);

  // Obsługa zmiany strony
  const handlePageChange = useCallback((page: number) => {
    isInternalPageChange.current = true;
    setCurrentPage(page);

    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(page));
    isInternalUrlUpdate.current = true;
    setSearchParams(newParams);

    // Bezpośrednie wywołanie loadClients zamiast polegania na useEffect
    loadClients(sortConfig.column, sortConfig.direction, page);
  }, [searchParams, setSearchParams, loadClients, sortConfig.column, sortConfig.direction]);

  // Obsługa akcji masowych
  const handleBulkActionClick = useCallback((actionType: BulkActionType) => {
    if (selectedClientIds.length === 0) return;

    setBulkActionDialog({
      open: true,
      type: actionType,
      selectedTagIds: []
    });
  }, [selectedClientIds]);

  // Przypisanie tagów do klientów
  const handleAssignTags = useCallback(async (tagIds: number[]) => {
    if (tagIds.length === 0 || selectedClientIds.length === 0) return;

    try {
      await assignTagsToClients(selectedClientIds, tagIds, organizationId);
      
      // Aktualizuj lokalny stan tagów klientów
      const updatedClientTags = { ...clientTags };
      
      selectedClientIds.forEach(clientId => {
        const currentTags = updatedClientTags[clientId] || [];
        const newTags = tagIds
          .filter(tagId => !currentTags.some(tag => tag.id === tagId))
          .map(tagId => {
            const tag = availableTags.find(t => t.id === tagId);
            return tag ? tag : { id: tagId, name: `Tag ${tagId}`, color: "default" };
          });
          
        updatedClientTags[clientId] = [...currentTags, ...newTags];
      });
      
      setClientTags(updatedClientTags);
      setBulkActionDialog(prev => ({ ...prev, open: false }));
      
    } catch (error) {
      console.error('Błąd podczas przypisywania tagów:', error);
    }
  }, [selectedClientIds, clientTags, availableTags, organizationId]);

  // Obsługa wysyłki email
  const handleSendEmail = useCallback(() => {
    navigate(`/emails/new?clients=${selectedClientIds.join(',')}`);
    setBulkActionDialog(prev => ({ ...prev, open: false }));
  }, [navigate, selectedClientIds]);

  // Obsługa wysyłki SMS
  const handleSendSms = useCallback(() => {
    navigate(`/sms/new?clients=${selectedClientIds.join(',')}`);
    setBulkActionDialog(prev => ({ ...prev, open: false }));
  }, [navigate, selectedClientIds]);

  // Obsługa zapisanego widoku
  const handleSaveCurrentView = useCallback((viewName: string) => {
    saveView(viewName, filters, columnSettings, sortConfig);
  }, [saveView, filters, columnSettings, sortConfig]);

  // Obsługa zastosowania zapisanego widoku
  const handleApplyView = useCallback((view: SavedView) => {
    // Ustaw filtry
    setFilters(view.filters);
    
    // Ustaw kolumny
    Object.keys(view.columns).forEach(key => {
      toggleColumn(key, view.columns[key]);
    });
    
    // Ustaw sortowanie
    setSortConfig(view.sortConfig);
    
    // Zamknij menu widoków
    setShowViewsMenu(false);
    
    // Załaduj dane z nowymi ustawieniami
    loadClients(view.sortConfig.column, view.sortConfig.direction, 1);
  }, [setFilters, toggleColumn, setSortConfig, loadClients]);

  // Efekty
  
  // NOWA sekcja: init effect - uruchamiany tylko raz przy montowaniu komponentu
  useEffect(() => {
    // Inicjalne załadowanie danych przy pierwszym renderowaniu
    if (user) {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const sortColumn = searchParams.get('sort') || 'name';
      const sortDirection = (searchParams.get('order') || 'asc') as 'asc' | 'desc' | 'none';
      loadClients(sortColumn, sortDirection, page);
    }
    // Wywołujemy tylko przy montowaniu
  }, [user]);

  // POPRAWIONE: Efekt do aktualizacji URL przy zmianie wyszukiwania, BEZ WYWOŁANIA loadClients
  useEffect(() => {
    if (debouncedSearchTerm !== undefined && !skipNextEffect.current) {
      isInternalUrlUpdate.current = true;
      const newParams = new URLSearchParams(searchParams);
      if (debouncedSearchTerm) {
        newParams.set('q', debouncedSearchTerm);
      } else {
        newParams.delete('q');
      }
      newParams.set('page', '1'); // Resetujemy stronę przy wyszukiwaniu
      setSearchParams(newParams);
      
      isInternalPageChange.current = true;
      setCurrentPage(1); // Resetujemy stronę przy wyszukiwaniu
      
      // Bezpośrednie wywołanie loadClients
      loadClients(sortConfig.column, sortConfig.direction, 1);
    }
    skipNextEffect.current = false;
  }, [debouncedSearchTerm]);

  // Efekt do czyszczenia i anulowania żądania przy odmontowaniu
  useEffect(() => {
    // Funkcja czyszcząca, która zostanie wywołana przy odmontowaniu komponentu
    return () => {
      if (cancelTokenSourceRef.current) {
        cancelTokenSourceRef.current.cancel('Component unmounted');
      }
    };
  }, []);
  
  // Akcje masowe
  const bulkActions: BulkAction<BulkActionType>[] = useMemo(() => [
    {
      type: 'tags',
      icon: <FaTag />,
      label: 'Przypisz tagi',
      handler: () => handleBulkActionClick('tags')
    },
    {
      type: 'email',
      icon: <FaEnvelope />,
      label: 'Wyślij e-mail',
      handler: () => handleBulkActionClick('email')
    },
    {
      type: 'sms',
      icon: <FaSms />,
      label: 'Wyślij SMS',
      handler: () => handleBulkActionClick('sms')
    }
  ], [handleBulkActionClick]);

  // Zliczenie aktywnych filtrów
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.city) count++;
    if (filters.organization) count++;
    if (filters.tags.length > 0) count++;
    if (filters.hasOrders !== null) count++;
    if (filters.lastActivityFrom) count++;
    if (filters.lastActivityTo) count++;
    return count;
  }, [filters]);

  // Funkcja do obsługi zmiany filtrów w ListFiltersPanel
  const handleFilterChange = useCallback((key: string, value: any) => {
    // Dostosowanie typu klucza
    setFilter(key as keyof ClientFilterState, value);
  }, [setFilter]);

  // Funkcja do obsługi eksportu
  const handleExport = useCallback((
    format: 'csv' | 'excel',
    includeAllColumns: boolean,
    selectedColumnKeys: string[],
    filename: string
  ) => {
    // Filtruj kolumny do eksportu
    const columnsToExport = availableColumns.filter(col => 
      col.key !== 'actions' && col.key !== 'selection' &&
      (includeAllColumns || selectedColumnKeys.includes(col.key))
    );
    
    // Przygotuj dane do eksportu
    const dataToExport = clients.map(client => {
      const exportItem: Record<string, any> = {};
      
      columnsToExport.forEach(column => {
        const key = column.key;
        // Bezpieczne pobranie tytułu
        const title = column.title || key;
        
        switch (key) {
          case 'name':
            exportItem[title] = `${client.first_name} ${client.last_name}`;
            break;
          case 'address':
            exportItem[title] = formatAddress(client.city, client.street, client.house_number);
            break;
          case 'status':
            exportItem[title] = client.status === 'active' ? 'Aktywny' : 'Nieaktywny';
            break;
          case 'organization': {
            const ownedOrg = client.organizations?.find(org => {
              const orgWithRole = org as OrganizationWithRole;
              return orgWithRole.role?.toLowerCase() === 'owner';
            });
            exportItem[title] = ownedOrg ? ownedOrg.name : '-';
            break;
          }
          case 'created_at':
          case 'last_activity': {
            const date = key === 'created_at' ? client.created_at : client.last_activity;
            exportItem[title] = date ? new Date(date).toLocaleDateString('pl-PL') : '-';
            break;
          }
          case 'tags': {
            const tags = clientTags[client.id] || [];
            exportItem[title] = tags.map(tag => tag.name).join(', ') || '-';
            break;
          }
          default:
            exportItem[title] = client[key] !== undefined ? client[key] : '-';
        }
      });
      
      return exportItem;
    });
    
    // Wykonaj export
    if (format === 'csv') {
      exportToCSV(dataToExport, filename);
    } else {
      exportToExcel(dataToExport, filename);
    }
    
    // Zamknij dialog
    setExportDialogOpen(false);
  }, [clients, availableColumns, clientTags, formatAddress]);

  return (
    <div className="clients-list">
      <Card 
        title="Lista klientów"
        actions={
          <div className="card-actions">
            <div className="search-and-actions">
              <div className="search-container">
                <SearchField
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="action-buttons">
                <Tooltip title={`Filtry${activeFilterCount ? ` (${activeFilterCount})` : ''}`}>
                  <IconButton 
                    className="action-button"
                    onClick={handleToggleFilters}
                    color={activeFilterCount > 0 || showFiltersPanel ? "primary" : "default"}
                    size="small"
                  >
                    <FiFilter size={16} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Zapisane widoki">
                  <IconButton 
                    className="action-button"
                    onClick={handleToggleViews}
                    color={showViewsMenu ? "primary" : "default"}
                    size="small"
                  >
                    <FaRegBookmark size={16} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Ustawienia kolumn">
                  <IconButton 
                    className="action-button"
                    onClick={handleToggleColumnsSettings}
                    color={hasModifiedSettings || showColumnsSettings ? "primary" : "default"}
                    size="small"
                  >
                    <FiSettings size={16} />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Eksport">
                  <IconButton 
                    className="action-button"
                    onClick={() => setExportDialogOpen(true)}
                    color="default"
                    size="small"
                  >
                    <FaFileExport size={16} />
                  </IconButton>
                </Tooltip>
                
                {canAddClient && (
                  <Tooltip title="Dodaj klienta">
                    <IconButton
                      className="action-button add-button"
                      onClick={() => navigate('/clients/add')}
                      color="primary" 
                      size="small"
                    >
                      <FaRegPlusSquare size={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        }
      >
        {/* Panel akcji masowych */}
        <BulkActionsPanel
          selectedIds={selectedClientIds}
          actions={bulkActions}
          onClearSelection={() => setSelectedClientIds([])}
          entityName="klient"
        />
        
        {/* Panel filtrów */}
        {showFiltersPanel && (
          <ListFiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApplyFilters={applyFilters}
            onResetFilters={resetFilters}
            className="mb-3"
            availableTags={availableTags} // Przekazanie dostępnych tagów do panelu filtrów
          />
        )}
        
        {/* Panel widoków */}
        {showViewsMenu && (
          <ListViewsManager
            views={savedViews}
            onApplyView={handleApplyView}
            onDeleteView={deleteView}
            onSaveView={handleSaveCurrentView}
            className="mb-3"
          />
        )}
        
        {/* Panel ustawień kolumn */}
        {showColumnsSettings && (
          <Box className="columns-settings" p={2} mb={2} sx={{ border: '1px solid #eee', borderRadius: '4px' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">Ustawienia kolumn</Typography>
              <Button 
                variant="outlined" 
                size="small"
                onClick={resetColumns}
              >
                Przywróć domyślne
              </Button>
            </Box>
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              {availableColumns
                .filter(col => col.key !== 'selection')
                .map(column => (
                  <Chip
                    key={column.key}
                    label={column.title}
                    variant={columnSettings[column.key] !== false ? "filled" : "outlined"}
                    onClick={() => toggleColumn(column.key)}
                    color={columnSettings[column.key] !== false ? "primary" : "default"}
                    size="small"
                  />
                ))}
            </Box>
          </Box>
        )}
        
        {/* Tabela klientów */}
        <div className="table-responsive">
          <Table
            columns={visibleColumns}
            data={clients}
            onRowClick={handleRowClick}
            onSort={handleSort}
            sortColumn={sortConfig.column}
            sortDirection={sortConfig.direction}
            isLoading={isLoading}
          />
          
          {isLoading && <div className="loading-overlay">
            <div className="loading-spinner">Ładowanie danych...</div>
          </div>}
          
          {!isLoading && error && (
            <div className="error-message">{error}</div>
          )}
          
          {!isLoading && !error && clients.length === 0 && (
            <div className="empty-message">
              {debouncedSearchTerm.length >= 3 
                ? "Brak wyników dla podanych kryteriów wyszukiwania" 
                : "Brak klientów do wyświetlenia"}
            </div>
          )}
          
          {/* Paginacja */}
          {totalResults > ITEMS_PER_PAGE && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1 || isLoading}
                className="pagination-button"
              >
                &laquo; Poprzednia
              </button>
              
              <span className="pagination-info">
                Strona {currentPage} z {Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE))}
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage >= Math.ceil(totalResults / ITEMS_PER_PAGE) || isLoading}
                className="pagination-button"
              >
                Następna &raquo;
              </button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Dialog akcji masowych */}
      <Dialog 
        open={bulkActionDialog.open} 
        onClose={() => setBulkActionDialog(prev => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {bulkActionDialog.type === 'tags' && 'Przypisz tagi'}
          {bulkActionDialog.type === 'email' && 'Wyślij email'}
          {bulkActionDialog.type === 'sms' && 'Wyślij SMS'}
        </DialogTitle>
        <DialogContent>
          {bulkActionDialog.type === 'tags' && (
            <TagManager
              selectedTags={bulkActionDialog.selectedTagIds || []}
              onChange={(tagIds: number[]) => setBulkActionDialog(prev => ({ 
                ...prev, 
                selectedTagIds: tagIds 
              }))}
              organizationId={organizationId}
            />
          )}
          
          {bulkActionDialog.type === 'email' && (
            <Typography>
              Czy chcesz przejść do strony tworzenia e-maila dla {selectedClientIds.length} wybranych klientów?
            </Typography>
          )}
          
          {bulkActionDialog.type === 'sms' && (
            <Typography>
              Czy chcesz przejść do strony tworzenia SMS dla {selectedClientIds.length} wybranych klientów?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setBulkActionDialog(prev => ({ ...prev, open: false }))}
          >
            Anuluj
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (bulkActionDialog.type === 'tags') {
                handleAssignTags(bulkActionDialog.selectedTagIds || []);
              } else if (bulkActionDialog.type === 'email') {
                handleSendEmail();
              } else if (bulkActionDialog.type === 'sms') {
                handleSendSms();
              }
            }}
          >
            {bulkActionDialog.type === 'tags' && 'Przypisz tagi'}
            {bulkActionDialog.type === 'email' && 'Przejdź do tworzenia e-maila'}
            {bulkActionDialog.type === 'sms' && 'Przejdź do tworzenia SMS'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog eksportu */}
      <ExportDataDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        columns={availableColumns
          .filter(col => col.key !== 'selection' && col.key !== 'actions')
          .map(col => ({
            key: col.key,
            title: col.title
          }))}
        defaultFilename={`klienci_${new Date().toISOString().slice(0, 10)}`}
      />
    </div>
  );
};

export default ClientsList;