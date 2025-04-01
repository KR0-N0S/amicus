import axiosInstance from './axios';
import { Animal } from '../types/models';

// Konfiguracja
const ITEMS_PER_PAGE = 25; // Standardowa liczba elementów na stronę

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

// Funkcja do mapowania typów zwierząt między frontendem a backendem
const mapAnimalTypeToBackend = (type?: string): string | undefined => {
  if (type === 'farm') return 'large';
  if (type === 'companion') return 'small';
  return type;
};

const mapAnimalTypeFromBackend = (animal: any): Animal => {
  if (animal.animal_type === 'large') {
    animal.animal_type = 'farm';
  } else if (animal.animal_type === 'small') {
    animal.animal_type = 'companion';
  }
  return animal;
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
  const params: AnimalSearchParams = {
    page,
    limit,
    ...searchParams
  };

  // Dodanie typu zwierzęcia jeśli określony
  if (animalType) {
    params.animal_type = mapAnimalTypeToBackend(animalType);
  }

  // Generowanie klucza cache
  const cacheKey = generateCacheKey('/animals', params);
  
  // Sprawdzenie cache
  const cachedResponse = responseCache.get(cacheKey);
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

  // Mapowanie typów w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = response.data.data.map(mapAnimalTypeFromBackend);
  }

  // Zapisanie odpowiedzi w cache
  responseCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data;
};

/**
 * Funkcja do pobierania pojedynczego zwierzęcia
 * @param id Identyfikator zwierzęcia
 */
export const getAnimal = async (id: number): Promise<Animal> => {
  const endpoint = `/animals/${id}`;
  
  // Sprawdzenie cache
  const cacheKey = generateCacheKey(endpoint, {});
  const cachedResponse = responseCache.get(cacheKey);
  if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
    console.log(`Using cached response for ${cacheKey}`);
    return cachedResponse.data.data;
  }

  console.log(`API request: GET ${endpoint}`);
  
  // Wykonanie zapytania z mierzeniem czasu
  const response = await measureResponseTime(
    axiosInstance.get(endpoint),
    endpoint
  );
  
  // Mapowanie typu w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = mapAnimalTypeFromBackend(response.data.data);
  }

  // Zapisanie odpowiedzi w cache
  responseCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now()
  });
  
  return response.data.data;
};

/**
 * Funkcja do tworzenia nowego zwierzęcia
 * @param animalData Dane zwierzęcia
 */
export const createAnimal = async (animalData: Partial<Animal>): Promise<Animal> => {
  // Kopiujemy dane, aby nie modyfikować oryginalnego obiektu
  const mappedData = { ...animalData };
  
  // Mapowanie typu przed wysłaniem
  if (mappedData.animal_type) {
    mappedData.animal_type = mapAnimalTypeToBackend(mappedData.animal_type) as 'farm' | 'companion';
  }
  
  console.log('API request: POST /animals with data:', mappedData);
  
  // Wykonanie zapytania z mierzeniem czasu
  const response = await measureResponseTime(
    axiosInstance.post('/animals', mappedData),
    '/animals (POST)'
  );
  
  // Mapowanie typu w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = mapAnimalTypeFromBackend(response.data.data);
    
    // Czyszczenie cache po dodaniu nowego zwierzęcia
    Array.from(responseCache.keys())
      .filter(key => key.startsWith('/animals:'))
      .forEach(key => responseCache.delete(key));
  }
  
  return response.data.data;
};

/**
 * Funkcja do aktualizacji zwierzęcia
 * @param id Identyfikator zwierzęcia
 * @param animalData Dane zwierzęcia do aktualizacji
 */
export const updateAnimal = async (id: number, animalData: Partial<Animal>): Promise<Animal> => {
  // Kopiujemy dane, aby nie modyfikować oryginalnego obiektu
  const mappedData = { ...animalData };
  
  // Mapowanie typu przed wysłaniem
  if (mappedData.animal_type) {
    mappedData.animal_type = mapAnimalTypeToBackend(mappedData.animal_type) as 'farm' | 'companion';
  }
  
  const endpoint = `/animals/${id}`;
  console.log(`API request: PUT ${endpoint} with data:`, mappedData);
  
  // Wykonanie zapytania z mierzeniem czasu
  const response = await measureResponseTime(
    axiosInstance.put(endpoint, mappedData),
    endpoint + ' (PUT)'
  );
  
  // Mapowanie typu w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = mapAnimalTypeFromBackend(response.data.data);
    
    // Czyszczenie cache po aktualizacji
    Array.from(responseCache.keys())
      .filter(key => key.startsWith('/animals:') || key === generateCacheKey(endpoint, {}))
      .forEach(key => responseCache.delete(key));
  }
  
  return response.data.data;
};

/**
 * Funkcja do usuwania zwierzęcia
 * @param id Identyfikator zwierzęcia do usunięcia
 */
export const deleteAnimal = async (id: number): Promise<void> => {
  const endpoint = `/animals/${id}`;
  console.log(`API request: DELETE ${endpoint}`);
  
  // Wykonanie zapytania z mierzeniem czasu
  await measureResponseTime(
    axiosInstance.delete(endpoint),
    endpoint + ' (DELETE)'
  );
  
  // Czyszczenie cache po usunięciu
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/animals:') || key === generateCacheKey(endpoint, {}))
    .forEach(key => responseCache.delete(key));
};

/**
 * Funkcja do czyszczenia cache - można wywołać np. po wylogowaniu
 */
export const clearAnimalsCache = (): void => {
  Array.from(responseCache.keys())
    .filter(key => key.startsWith('/animals:'))
    .forEach(key => responseCache.delete(key));
  
  console.log('Animals cache cleared');
};