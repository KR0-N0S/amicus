import axiosInstance from './axios';
import axios, { AxiosError } from 'axios';
import { ClientsResponse, ClientResponse, Client } from '../types/models';

export const fetchClients = async (organizationId?: number): Promise<Client[]> => {
  // [Bez zmian]
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
  // [Bez zmian]
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

// KLUCZOWA ZMIANA: Modyfikacja do tworzenia klienta bez wpływu na bieżącą sesję
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

    // ⚠️ KLUCZOWE ZMIANY - używamy specjalnego endpointu lub parametru
    // Opcja 1: Użyj specjalnego parametru informującego serwer, aby nie zwracał tokenu
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
    
    // ⚠️ WAŻNA ZMIANA: NIE zapisujemy tokena zwróconego przez API
    // NIE wykonujemy:
    // if (response.data.data.token) {
    //   setToken(response.data.data.token);
    //   setCurrentUser(response.data.data.user);
    // }
    
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

// [Pozostała część kodu bez zmian]
function generateTemporaryPassword(): string {
  // Generuje losowe hasło o długości 12 znaków
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

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