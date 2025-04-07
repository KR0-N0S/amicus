import axiosInstance from './axios';
import { SemenProvider } from '../types/models';

// Konfiguracja
const ITEMS_PER_PAGE = 10; // Standardowa liczba elementów na stronę
const MIN_SEARCH_LENGTH = 3; // Minimalna długość frazy wyszukiwania

// Interfejs dla parametrów zapytania
interface SemenProviderParams {
  page?: number;
  limit?: number;
  search?: string;
  owner_id?: number;
  include_public?: boolean;
}

/**
 * Funkcja do pobierania listy dostawców nasienia z paginacją i filtrowaniem
 * @param params Parametry wyszukiwania i paginacji
 * @returns Promise z odpowiedzią zawierającą listę dostawców i dane paginacji
 */
export const getSemenProviders = async (params: Partial<SemenProviderParams> = {}) => {
  // Przygotowanie parametrów zapytania
  const queryParams: Record<string, any> = {
    page: params.page || 1,
    limit: params.limit || ITEMS_PER_PAGE
  };

  // Dodanie parametru wyszukiwania jeśli spełnia wymagania
  if (params.search) {
    const trimmedSearch = String(params.search).trim();
    if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
      queryParams.search = trimmedSearch;
    }
  }

  // Dodanie parametru właściciela jeśli podany
  if (params.owner_id) {
    queryParams.owner_id = params.owner_id;
  }
  
  // Dodanie parametru include_public jeśli podany
  if (params.include_public !== undefined) {
    queryParams.include_public = params.include_public;
  }

  try {
    const response = await axiosInstance.get('/semen-providers', { params: queryParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching semen providers:', error);
    throw error;
  }
};

/**
 * Funkcja do pobierania danych konkretnego dostawcy nasienia po ID
 * @param id ID dostawcy nasienia
 * @returns Promise z danymi dostawcy
 */
export const getSemenProvider = async (id: number): Promise<SemenProvider> => {
  try {
    const response = await axiosInstance.get(`/semen-providers/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching semen provider with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Funkcja do tworzenia nowego dostawcy nasienia
 * @param providerData Dane dostawcy do utworzenia
 * @returns Promise z utworzonym dostawcą
 */
export const createSemenProvider = async (providerData: Partial<SemenProvider>): Promise<SemenProvider> => {
  try {
    const response = await axiosInstance.post('/semen-providers', providerData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating semen provider:', error);
    throw error;
  }
};

/**
 * Funkcja do aktualizacji istniejącego dostawcy nasienia
 * @param id ID dostawcy do aktualizacji
 * @param providerData Nowe dane dostawcy
 * @returns Promise z zaktualizowanym dostawcą
 */
export const updateSemenProvider = async (id: number, providerData: Partial<SemenProvider>): Promise<SemenProvider> => {
  try {
    const response = await axiosInstance.put(`/semen-providers/${id}`, providerData);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating semen provider with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Funkcja do usuwania dostawcy nasienia
 * @param id ID dostawcy do usunięcia
 * @returns Promise z potwierdzeniem usunięcia
 */
export const deleteSemenProvider = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/semen-providers/${id}`);
  } catch (error) {
    console.error(`Error deleting semen provider with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Funkcja do pobierania publicznych dostawców nasienia
 * @param page Numer strony
 * @param limit Liczba wyników na stronę
 * @returns Promise z listą publicznych dostawców
 */
export const getPublicSemenProviders = async (page = 1, limit = ITEMS_PER_PAGE) => {
  try {
    const response = await axiosInstance.get('/semen-providers/public', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching public semen providers:', error);
    throw error;
  }
};