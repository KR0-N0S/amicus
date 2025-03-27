import axiosInstance from './axios';
import axios, { AxiosError } from 'axios';
import { ClientsResponse, ClientResponse, Client } from '../types/models';

export const fetchClients = async (organizationId?: number): Promise<Client[]> => {
  try {
    // Dodaj parametr organizationId tylko jeśli istnieje
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
    
    // Dodatkowe logowanie szczegółów błędu
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

// Nowa funkcja do tworzenia klienta
export const createClient = async (clientData: Partial<Client>, organizationId?: number): Promise<Client> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Creating new client, params: ${queryParams}`, clientData);
    
    const response = await axiosInstance.post<ClientResponse>(`/users/clients${queryParams}`, clientData);
    console.log('Create client API response:', response.data);
    
    return response.data.data.client;
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

// Nowa funkcja do aktualizacji klienta
export const updateClient = async (clientId: number, clientData: Partial<Client>, organizationId?: number): Promise<Client> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Updating client ${clientId}, params: ${queryParams}`, clientData);
    
    const response = await axiosInstance.put<ClientResponse>(`/users/clients/${clientId}${queryParams}`, clientData);
    console.log('Update client API response:', response.data);
    
    return response.data.data.client;
  } catch (error) {
    console.error(`Error updating client ${clientId}:`, error);
    
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

// Zmieniona funkcja - teraz służy do usunięcia powiązania klienta z organizacją zamiast dezaktywacji konta
export const removeClientFromOrganization = async (clientId: number, organizationId?: number): Promise<void> => {
  try {
    const queryParams = organizationId ? `?organizationId=${organizationId}` : '';
    console.log(`Removing client ${clientId} from organization, params: ${queryParams}`);
    
    // Nadal używamy tego samego endpointu, ale zmieniamy jego interpretację
    await axiosInstance.patch(`/users/clients/${clientId}/deactivate${queryParams}`);
    console.log(`Client ${clientId} successfully removed from organization`);
  } catch (error) {
    console.error(`Error removing client ${clientId} from organization:`, error);
    
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

// Dla zachowania kompatybilności wstecznej, zachowujemy stary alias funkcji
export const deactivateClient = removeClientFromOrganization;