import axiosInstance from './axios';
import axios, { AxiosError } from 'axios';
import { ClientsResponse, ClientResponse, Client } from '../types/models';

// ============= KLIENCI / ROLNICY =============

export const fetchClients = async (organizationId?: number): Promise<Client[]> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Fetching clients with params: ${queryParams}`);
    
    const response = await axiosInstance.get<ClientsResponse>(`/users/clients${queryParams}`);
    console.log('API response:', response);
    
    if (!response.data || !response.data.data || !response.data.data.clients) {
      console.error('Nieprawidłowa struktura odpowiedzi API:', response.data);
      return [];
    }
    
    return response.data.data.clients;
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const fetchClientById = async (clientId: number, organizationId?: number): Promise<Client> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Fetching client with ID ${clientId}, params: ${queryParams}`);
    
    const response = await axiosInstance.get<ClientResponse>(`/users/clients/${clientId}${queryParams}`);
    console.log('Client API response:', response.data);
    return response.data.data.client;
  } catch (error) {
    console.error(`Error fetching client with ID ${clientId}:`, error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error response:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    
    throw error;
  }
};

export const createClient = async (userData: Partial<Client>, organizationId?: number): Promise<Client> => {
  try {
    console.log('Creating new client via registration endpoint');
    console.log('Client data:', userData);
    console.log('Organization ID:', organizationId);
    
    // Przygotowanie danych do rejestracji
    const registerData: any = {
      // Dane osobowe
      email: userData.email,
      password: generateTemporaryPassword(), // Generowanie tymczasowego hasła
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone || '',
      street: userData.street || '',
      house_number: userData.house_number || '',
      city: userData.city || '',
      postal_code: userData.postal_code || '',
      tax_id: userData.tax_id || '',
      
      // Określamy rolę klienta w zależności od tego, czy posiada gospodarstwo
      role: userData.has_farm ? 'farmer' : 'client',
      
      // Dodanie pola określającego organizację, do której należy dodać klienta
      addToOrganizationId: organizationId
    };
    
    // Dodajemy dane organizacji, jeśli klient posiada firmę
    if (userData.has_company) {
      registerData.organization = {
        name: userData.company_name,
        tax_id: userData.company_tax_id || userData.tax_id,
        city: userData.company_city || userData.city,
        street: userData.company_street || userData.street,
        house_number: userData.company_house_number || userData.house_number,
        postal_code: userData.company_postal_code || userData.postal_code
      };
    }
    
    // Dodajemy dane o stadzie, jeśli podano
    if (userData.has_farm) {
      registerData.herd = {
        name: userData.farm_name || `Gospodarstwo ${userData.last_name}`,
        registration_number: userData.herd_registration_number,
        evaluation_number: userData.herd_evaluation_number || null
      };
    }

    console.log('Registration data being sent to API:', registerData);

    // Używamy specjalnego parametru informującego serwer, aby nie zwracał tokenu
    registerData.preserveCurrentSession = true;

    // Wywołujemy endpoint rejestracji
    const response = await axiosInstance.post<{
      status: string;
      data: {
        user: Client;
        organization?: any;
        token?: string; // Teraz token może być opcjonalny
      }
    }>('/auth/register', registerData);
    
    console.log('Client registration API response:', response.data);
    
    const newClient = response.data.data.user;
    
    // Żeby ułatwić dostęp do klienta, ustawiamy ID jego organizacji
    if (organizationId) {
      localStorage.setItem(`client_${newClient.id}_organizationId`, String(organizationId));
    }
    
    // Po 5 minutach usuwamy te dane
    setTimeout(() => {
      localStorage.removeItem(`client_${newClient.id}_organizationId`);
    }, 5 * 60 * 1000);
    
    // Zwracamy dane utworzonego użytkownika
    return newClient;
  } catch (error) {
    console.error('Error creating client:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error response:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    
    throw error;
  }
};

export const updateClient = async (clientId: number, clientData: Partial<Client>, organizationId?: number): Promise<Client> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Updating client ${clientId}, params: ${queryParams}`, clientData);
    
    const response = await axiosInstance.put<ClientResponse>(`/users/clients/${clientId}${queryParams}`, clientData);
    console.log('Update client API response:', response.data);
    
    return response.data.data.client;
  } catch (error) {
    console.error(`Error updating client ${clientId}:`, error);
    throw error;
  }
};

export const removeClientFromOrganization = async (clientId: number, organizationId?: number): Promise<void> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Removing client ${clientId} from organization, params: ${queryParams}`);
    
    await axiosInstance.patch(`/users/clients/${clientId}/deactivate${queryParams}`);
    console.log(`Client ${clientId} successfully removed from organization`);
  } catch (error) {
    console.error(`Error removing client ${clientId} from organization:`, error);
    throw error;
  }
};

export const deactivateClient = removeClientFromOrganization;

// ============= PRACOWNICY =============

// Funkcja do pobierania pracowników
export const fetchEmployees = async (organizationId?: number) => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Fetching employees with params: ${queryParams}`);
    
    const response = await axiosInstance.get(`/users/employees${queryParams}`);
    console.log('Employees API response:', response);
    
    if (!response.data || !response.data.data || !response.data.data.employees) {
      console.error('Nieprawidłowa struktura odpowiedzi API:', response.data);
      return [];
    }
    
    return response.data.data.employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Funkcja do pobierania pracownika po ID
export const fetchEmployeeById = async (employeeId: number, organizationId?: number) => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Fetching employee with ID ${employeeId}, params: ${queryParams}`);
    
    const response = await axiosInstance.get(`/users/employees/${employeeId}${queryParams}`);
    console.log('Employee API response:', response.data);
    
    return response.data.data.employee;
  } catch (error) {
    console.error(`Error fetching employee with ID ${employeeId}:`, error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error response:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    
    throw error;
  }
};

// Funkcja do tworzenia nowego pracownika
export const createEmployee = async (employeeData: any, organizationId?: number) => {
  try {
    console.log('Creating new employee');
    console.log('Employee data:', employeeData);
    console.log('Organization ID:', organizationId);
    
    // Przygotowanie danych do rejestracji pracownika
    const registerData = {
      ...employeeData,
      role: 'employee',
      password: generateTemporaryPassword(),
      preserveCurrentSession: true,
      addToOrganizationId: organizationId
    };

    const response = await axiosInstance.post('/auth/register', registerData);
    console.log('Employee creation API response:', response.data);
    
    return response.data.data.user;
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Error response:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    
    throw error;
  }
};

// Funkcja do aktualizacji danych pracownika
export const updateEmployee = async (employeeId: number, employeeData: any, organizationId?: number) => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Updating employee ${employeeId}, params: ${queryParams}`, employeeData);
    
    const response = await axiosInstance.put(`/users/employees/${employeeId}${queryParams}`, employeeData);
    console.log('Update employee API response:', response.data);
    
    return response.data.data.employee;
  } catch (error) {
    console.error(`Error updating employee ${employeeId}:`, error);
    throw error;
  }
};

// ============= WSPÓLNE FUNKCJE =============

// Funkcja do generowania tymczasowego hasła
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

// Uniwersalna funkcja do wyszukiwania użytkowników z różnymi rolami
export const searchUsers = async (searchTerm: string, roles: string[] = ['farmer', 'client'], organizationId?: number) => {
  try {
    if (searchTerm.length < 3) {
      return { data: [] };
    }

    const queryParams = new URLSearchParams({
      query: searchTerm,
      roles: roles.join(',') // Możliwość filtrowania po dowolnych rolach
    });
    
    if (organizationId) {
      queryParams.append('organizationId', organizationId.toString());
    }
    
    console.log(`Searching users with query: ${searchTerm}, roles: ${roles.join(',')}, params: ${queryParams}`);
    
    const response = await axiosInstance.get(`/users/search?${queryParams}`);
    console.log('User search API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: [] };
  }
};

export const fetchOwnerDetails = async (ownerId: string | number): Promise<any> => {
  try {
    console.log(`Pobieranie danych właściciela o ID: ${ownerId}`);
    
    // Używamy poprawnego endpointu zgodnie ze specyfikacją API
    const response = await axiosInstance.get(`/users/clients/${ownerId}`);
    
    if (!response.data || !response.data.data || !response.data.data.client) {
      throw new Error('Nieprawidłowa struktura odpowiedzi API');
    }
    
    const client = response.data.data.client;
    console.log('Pobrano dane właściciela:', client);
    
    // Mapujemy tablicę herds[0] na pole herd dla zachowania kompatybilności z istniejącym kodem
    const clientWithHerd = {
      ...client,
      herd: client.herds && client.herds.length > 0 ? client.herds[0] : { herd_id: '', eval_herd_no: '' }
    };
    
    return clientWithHerd;
  } catch (error) {
    console.error(`Błąd pobierania danych właściciela o ID ${ownerId}:`, error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Odpowiedź serwera:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers
      });
    }
    
    throw error;
  }
};