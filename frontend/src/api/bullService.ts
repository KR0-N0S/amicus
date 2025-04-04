import axiosInstance from './axios';
import { Bull } from '../types/models';
import { BullCreatePayload, BullUpdatePayload } from '../types/api-payloads';

// Konfiguracja
const ITEMS_PER_PAGE = 25; // Standardowa liczba elementów na stronę
const MIN_SEARCH_LENGTH = 3; // Minimalna długość frazy wyszukiwania

// Interfejs dla parametrów wyszukiwania buhajów
interface BullSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  owner_id?: number;
  bull_type?: string;
  breed?: string;
}

// Cache dla ostatnich wyników
const responseCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 60000; // 1 minuta w milisekundach
const EMPTY_RESPONSE_TTL = 5000; // 5 sekund dla pustych odpowiedzi

// Funkcja sprawdzająca czy odpowiedź jest pusta lub niepełna
const isEmptyOrIncompleteResponse = (data: any): boolean => {
  if (!data) return true;
  if (typeof data === 'object' && Object.keys(data).length === 0) return true;
  if (data.data && typeof data.data === 'object' && Object.keys(data.data).length === 0) return true;
  return false;
};

// Funkcja do generowania klucza cache
const generateCacheKey = (endpoint: string, params: any): string => {
  return `${endpoint}:${JSON.stringify(params)}`;
};

// Funkcja pomocnicza do mierzenia czasu wykonania zapytania
const measureResponseTime = async <T>(
  promise: Promise<T>,
  endpoint: string
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await promise;
    const endTime = performance.now();
    console.log(`API call to ${endpoint} completed in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`API call to ${endpoint} failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    throw error;
  }
};

/**
 * Funkcja do pobierania listy buhajów z paginacją i filtrowaniem
 * @param params Parametry wyszukiwania i paginacji
 */
export const getBulls = async (params: Partial<BullSearchParams> = {}) => {
  // Domyślne wartości
  const queryParams: Record<string, any> = {
    page: params.page || 1,
    limit: params.limit || ITEMS_PER_PAGE
  };

  // Dodanie parametru wyszukiwania jeśli spełnia wymagania
  if (params.search) {
    const trimmedSearch = String(params.search).trim();
    if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
      queryParams.search = trimmedSearch;
      console.log(`Performing server-side search for term: "${trimmedSearch}" (length: ${trimmedSearch.length})`);
    } else {
      console.log(`Search term too short: "${trimmedSearch}" (length: ${trimmedSearch.length}), not using search parameter`);
    }
  }

  // Dodanie pozostałych parametrów
  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'search' && key !== 'page' && key !== 'limit' && 
        value !== undefined && value !== null && value !== '') {
      queryParams[key] = value;
    }
  });

  // Diagnostyczne logowanie
  console.log(`API params debug - page: ${queryParams.page}, limit: ${queryParams.limit}, search: ${queryParams.search || 'not set'}`);
  
  // Generowanie klucza cache
  const cacheKey = generateCacheKey('/bulls', queryParams);
  
  // Sprawdzenie cache - pomijamy cache dla wyszukiwań
  const cachedResponse = queryParams.search ? null : responseCache.get(cacheKey);
  if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
    console.log(`Using cached response for ${cacheKey}`);
    return cachedResponse.data;
  }

  console.log(`API request: GET /bulls with params:`, queryParams);

  // Wykonanie zapytania z mierzeniem czasu
  const response = await measureResponseTime(
    axiosInstance.get('/bulls', { params: queryParams }),
    '/bulls'
  );

  // Diagnostyczne logowanie odpowiedzi
  if (response && response.data) {
    console.log(`API response received: contains ${response.data.data ? response.data.data.length : 0} items`);
  }

  // Zapisanie odpowiedzi w cache (jeśli to nie jest wyszukiwanie)
  if (!queryParams.search) {
    responseCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
  }
  
  return response.data;
};

/**
 * Funkcja do pobierania danych konkretnego buhaja po ID
 * @param id ID buhaja
 */
export const getBull = async (id: number): Promise<Bull> => {
  const endpoint = `/bulls/${id}`;
  
  const cacheKey = generateCacheKey(endpoint, {});
  const cachedResponse = responseCache.get(cacheKey);

  // Sprawdzamy czy cache istnieje, nie jest przeterminowany i nie jest pusty
  if (cachedResponse && 
      (Date.now() - cachedResponse.timestamp < CACHE_TTL) && 
      !isEmptyOrIncompleteResponse(cachedResponse.data)) {
    console.log(`Using cached response for ${cacheKey}`);
    return cachedResponse.data;
  } else if (cachedResponse && isEmptyOrIncompleteResponse(cachedResponse.data)) {
    // Jeśli mamy pustą odpowiedź w cache, używamy jej tylko jeśli nie jest starsza niż EMPTY_RESPONSE_TTL
    if (Date.now() - cachedResponse.timestamp < EMPTY_RESPONSE_TTL) {
      console.log(`Using cached empty response for ${cacheKey} (short TTL)`);
      return cachedResponse.data;
    } else {
      console.log(`Cached empty response for ${cacheKey} expired, fetching new data`);
      responseCache.delete(cacheKey);
    }
  }

  console.log(`API request: GET ${endpoint}`);
  
  try {
    const response = await measureResponseTime(
      axiosInstance.get(endpoint),
      endpoint
    );
    
    // Sprawdzamy czy odpowiedź jest pusta i ustawiamy odpowiedni TTL
    const responseData = response.data.data || response.data;
    
    if (isEmptyOrIncompleteResponse(responseData)) {
      console.warn(`Received empty or incomplete response for ${endpoint}, using short cache TTL`);
      responseCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now() // Ten cache wygaśnie po EMPTY_RESPONSE_TTL
      });
    } else {
      responseCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });
    }
    
    return responseData;
  } catch (error) {
    // W przypadku błędu usuwamy potencjalnie problematyczny cache
    responseCache.delete(cacheKey);
    throw error;
  }
};

/**
 * Funkcja do tworzenia nowego buhaja
 * @param bullData Dane buhaja do utworzenia
 */
export const createBull = async (bullData: BullCreatePayload): Promise<Bull> => {
  const endpoint = '/bulls';
  console.log(`API request: POST ${endpoint} with data:`, bullData);
  
  const response = await measureResponseTime(
    axiosInstance.post(endpoint, bullData),
    `${endpoint} (POST)`
  );
  
  // Po utworzeniu czyścimy cache dla listy buhajów
  clearBullsCache();
  
  return response.data.data || response.data;
};

/**
 * Funkcja do aktualizacji istniejącego buhaja
 * @param id ID buhaja do aktualizacji
 * @param bullData Nowe dane buhaja
 */
export const updateBull = async (id: number, bullData: BullUpdatePayload): Promise<Bull> => {
  const endpoint = `/bulls/${id}`;
  console.log(`API request: PUT ${endpoint} with data:`, bullData);
  
  const response = await measureResponseTime(
    axiosInstance.put(endpoint, bullData),
    `${endpoint} (PUT)`
  );
  
  // Po aktualizacji czyścimy cache dla danego buhaja i listy buhajów
  const bullCacheKey = generateCacheKey(endpoint, {});
  responseCache.delete(bullCacheKey);
  clearBullsCache();
  
  return response.data.data || response.data;
};

/**
 * Funkcja do usuwania buhaja
 * @param id ID buhaja do usunięcia
 */
export const deleteBull = async (id: number): Promise<void> => {
  const endpoint = `/bulls/${id}`;
  console.log(`API request: DELETE ${endpoint}`);
  
  await measureResponseTime(
    axiosInstance.delete(endpoint),
    `${endpoint} (DELETE)`
  );
  
  // Po usunięciu czyścimy cache dla danego buhaja i listy buhajów
  const bullCacheKey = generateCacheKey(endpoint, {});
  responseCache.delete(bullCacheKey);
  clearBullsCache();
};

/**
 * Funkcja do czyszczenia cache związanego z buhajami
 */
export const clearBullsCache = (): void => {
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/bulls:'))
    .forEach(key => responseCache.delete(key));
  
  console.log('Bulls cache cleared');
};

// Eksport funkcji dla testów
export const _isEmptyOrIncompleteResponse = isEmptyOrIncompleteResponse;