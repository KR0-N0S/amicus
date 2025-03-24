import api from '../api/axios';
import { AxiosError } from 'axios';

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

// Pobieranie listy klientów z uwzględnieniem uprawnień zalogowanego użytkownika
export const fetchClients = async (): Promise<Client[]> => {
  try {
    const response = await api.get('/users/clients');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching clients:', axiosError.response?.data || axiosError.message);
    throw new Error('Failed to fetch clients');
  }
};

// Pobieranie szczegółów konkretnego klienta
export const fetchClientDetails = async (clientId: number): Promise<Client> => {
  try {
    const response = await api.get(`/users/${clientId}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error fetching client details:', axiosError.response?.data || axiosError.message);
    throw new Error('Failed to fetch client details');
  }
};

// Usuwanie klienta
export const deleteClient = async (clientId: number): Promise<void> => {
  try {
    await api.delete(`/users/${clientId}`);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error deleting client:', axiosError.response?.data || axiosError.message);
    throw new Error('Failed to delete client');
  }
};

// Aktualizacja danych klienta
export const updateClient = async (clientId: number, clientData: Partial<Client>): Promise<Client> => {
  try {
    const response = await api.put(`/users/${clientId}`, clientData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error updating client:', axiosError.response?.data || axiosError.message);
    throw new Error('Failed to update client');
  }
};

// Dodawanie nowego klienta
export const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
  try {
    const response = await api.post('/users', clientData);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('Error adding client:', axiosError.response?.data || axiosError.message);
    throw new Error('Failed to add client');
  }
};