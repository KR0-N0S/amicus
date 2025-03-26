import axiosInstance from './axios';
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
    const response = await axiosInstance.get<ClientResponse>(`/users/clients/${clientId}${queryParams}`);
    return response.data.data.client;
  } catch (error) {
    console.error(`Error fetching client with ID ${clientId}:`, error);
    throw error;
  }
};