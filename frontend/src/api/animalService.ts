import axiosInstance from './axios';
import { Animal } from '../types/models';

// Konfiguracja
const ITEMS_PER_PAGE = 25; // Standardowa liczba elementów na stronę
const MIN_SEARCH_LENGTH = 3; // Minimalna długość frazy wyszukiwania

// Interfejs dla parametrów wyszukiwania
interface AnimalSearchParams {
  page?: number;
  limit?: number;
  animal_type?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  owner_id?: number;
  species?: string;
}

// Cache dla ostatnich wyników (proste rozwiązanie, które można rozbudować)
const responseCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_TTL = 60000; // 1 minuta w milisekundach

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
 * Funkcja do pobierania listy zwierząt z paginacją i filtrowaniem
 * @param page Numer strony (domyślnie 1)
 * @param limit Liczba elementów na stronę (domyślnie ITEMS_PER_PAGE)
 * @param animalType Typ zwierzęcia (farm/companion)
 * @param searchParams Dodatkowe parametry wyszukiwania
 */
export const getAnimals = async (
  page = 1,
  limit = ITEMS_PER_PAGE,
  animalType?: string,
  searchParams?: Partial<AnimalSearchParams>
) => {
  // Przygotowanie parametrów zapytania
  const params: Record<string, any> = {
    page,
    limit
  };

  // Dodanie typu zwierzęcia jeśli określony
  if (animalType) {
    params.animal_type = animalType;
  }

  // Bezpieczne dodanie pozostałych parametrów z uwzględnieniem minimalnej długości wyszukiwania
  if (searchParams) {
    // Specjalna obsługa parametru search
    if (searchParams.search !== undefined) {
      const trimmedSearch = String(searchParams.search).trim();
      if (trimmedSearch.length >= MIN_SEARCH_LENGTH) {
        params.search = trimmedSearch;
        console.log(`Performing server-side search for term: "${trimmedSearch}" (length: ${trimmedSearch.length})`);
      } else {
        console.log(`Search term too short: "${trimmedSearch}" (length: ${trimmedSearch.length}), not using search parameter`);
        // Celowo nie dodajemy parametru search dla zbyt krótkich fraz
      }
    }

    // Dodanie pozostałych parametrów - bezpieczne pod względem typów
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'search' && value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });
  }

  // Diagnostyczne logowanie
  console.log(`API params debug - page: ${params.page}, limit: ${params.limit}, animal_type: ${params.animal_type}, search: ${params.search || 'not set'}`);
  
  // Generowanie klucza cache
  const cacheKey = generateCacheKey('/animals', params);
  
  // Sprawdzenie cache - pomijamy cache dla wyszukiwań, aby zawsze mieć aktualne wyniki
  const cachedResponse = params.search ? null : responseCache.get(cacheKey);
  if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
    console.log(`Using cached response for ${cacheKey}`);
    return cachedResponse.data;
  }

  console.log(`API request: GET /animals with params:`, params);

  // Wykonanie zapytania z mierzeniem czasu
  const response = await measureResponseTime(
    axiosInstance.get('/animals', { params }),
    '/animals'
  );

  // Diagnostyczne logowanie odpowiedzi
  if (response && response.data) {
    console.log(`API response received: contains ${response.data.data ? response.data.data.length : 0} items`);
  }

  // Zapisanie odpowiedzi w cache (jeśli to nie jest wyszukiwanie)
  if (!params.search) {
    responseCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });
  }
  
  return response.data;
};

/**
 * Funkcja do wyszukiwania zwierząt - helper dla lepszej czytelności kodu
 * @param searchTerm Fraza wyszukiwania
 * @param animalType Typ zwierzęcia (farm/companion)
 * @param page Numer strony
 * @param limit Liczba elementów na stronę
 */
export const searchAnimals = async (
  searchTerm: string,
  animalType?: string,
  page = 1,
  limit = ITEMS_PER_PAGE,
  additionalParams?: Partial<AnimalSearchParams>
) => {
  return getAnimals(page, limit, animalType, {
    search: searchTerm,
    ...additionalParams
  });
};

// Pozostałe funkcje pozostają bez zmian
export const getAnimal = async (id: number): Promise<Animal> => {
  const endpoint = `/animals/${id}`;
  
  const cacheKey = generateCacheKey(endpoint, {});
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
    console.log(`Using cached response for ${cacheKey}`);
    return cachedResponse.data.data;
  }

  console.log(`API request: GET ${endpoint}`);
  
  const response = await measureResponseTime(
    axiosInstance.get(endpoint),
    endpoint
  );
  
  responseCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data.data;
};

export const createAnimal = async (animalData: Partial<Animal>): Promise<Animal> => {
  const dataToSend = { ...animalData };
  
  if (dataToSend.animal_type === 'farm' && 
      dataToSend.farm_animal?.identifier && 
      !dataToSend.animal_number) {
    dataToSend.animal_number = dataToSend.farm_animal.identifier;
  }
  
  console.log('API request: POST /animals with data:', dataToSend);
  
  const response = await measureResponseTime(
    axiosInstance.post('/animals', dataToSend),
    '/animals (POST)'
  );
  
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/animals:'))
    .forEach(key => responseCache.delete(key));
  
  return response.data.data;
};

export const updateAnimal = async (id: number, animalData: Partial<Animal>): Promise<Animal> => {
  const dataToSend = { ...animalData };
  
  if (dataToSend.animal_type === 'farm' && 
      dataToSend.farm_animal?.identifier && 
      !dataToSend.animal_number) {
    dataToSend.animal_number = dataToSend.farm_animal.identifier;
  }
  
  const endpoint = `/animals/${id}`;
  console.log(`API request: PUT ${endpoint} with data:`, dataToSend);
  
  const response = await measureResponseTime(
    axiosInstance.put(endpoint, dataToSend),
    endpoint + ' (PUT)'
  );
  
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/animals:') || key === generateCacheKey(endpoint, {}))
    .forEach(key => responseCache.delete(key));
  
  return response.data.data;
};

export const deleteAnimal = async (id: number): Promise<void> => {
  const endpoint = `/animals/${id}`;
  console.log(`API request: DELETE ${endpoint}`);
  
  await measureResponseTime(
    axiosInstance.delete(endpoint),
    endpoint + ' (DELETE)'
  );
  
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/animals:') || key === generateCacheKey(endpoint, {}))
    .forEach(key => responseCache.delete(key));
};

export const clearAnimalsCache = (): void => {
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/animals:'))
    .forEach(key => responseCache.delete(key));
  
  console.log('Animals cache cleared');
};