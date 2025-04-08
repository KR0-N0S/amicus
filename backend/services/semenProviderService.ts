/**
 * Serwis obsługujący operacje na dostawcach nasienia
 * @author KR0-N0S
 * @date 2025-04-08 12:23:39
 */

import * as semenProviderRepository from '../repositories/semenProviderRepository';
import { AppError } from '../middleware/errorHandler';
import { 
  SemenProvider, 
  SemenProviderData, 
  PaginatedProvidersResult 
} from '../types/models/semenProvider';

class SemenProviderService {
  /**
   * Wyszukiwanie dostawców nasienia należących do danego właściciela
   * @param searchTerm - Fraza wyszukiwania
   * @param ownerId - ID właściciela
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @returns Obiekt zawierający listę dostawców i dane paginacji
   */
  async searchProvidersByOwnerId(
    searchTerm?: string, 
    ownerId?: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedProvidersResult> {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[SEMEN_PROVIDER_SERVICE] Wyszukiwanie dostawców nasienia właściciela ${ownerId} dla frazy: "${safeSearchTerm}"`);
      const result = await (semenProviderRepository as any).searchByOwnerId(safeSearchTerm, ownerId, page, limit);
      
      // Zabezpieczenie przed nieprawidłową strukturą wyniku
      if (!result) {
        return {
          providers: [],
          pagination: {
            totalCount: 0,
            totalPages: 1,
            currentPage: page,
            pageSize: limit
          }
        };
      }
      
      return result;
    } catch (error) {
      console.error('[SEMEN_PROVIDER_SERVICE] Błąd podczas wyszukiwania dostawców nasienia właściciela:', error);
      // Zwracamy domyślny obiekt zamiast rzucać wyjątek
      return {
        providers: [],
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Wyszukiwanie dostawców nasienia w całej organizacji
   * @param searchTerm - Fraza wyszukiwania
   * @param organizationId - ID organizacji
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @param includePublic - Czy dołączyć dostawców publicznych
   * @returns Obiekt zawierający listę dostawców i dane paginacji
   */
  async searchProvidersByOrganizationId(
    searchTerm?: string, 
    organizationId?: number, 
    page: number = 1, 
    limit: number = 10, 
    includePublic: boolean = true
  ): Promise<PaginatedProvidersResult> {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[SEMEN_PROVIDER_SERVICE] Wyszukiwanie dostawców nasienia w organizacji ${organizationId} dla frazy: "${safeSearchTerm}"`);
      const result = await (semenProviderRepository as any).searchByOrganizationId(safeSearchTerm, organizationId, page, limit, includePublic);
      
      // Zabezpieczenie przed nieprawidłową strukturą wyniku
      if (!result) {
        return {
          providers: [],
          pagination: {
            totalCount: 0,
            totalPages: 1,
            currentPage: page,
            pageSize: limit
          }
        };
      }
      
      return result;
    } catch (error) {
      console.error('[SEMEN_PROVIDER_SERVICE] Błąd podczas wyszukiwania dostawców nasienia organizacji:', error);
      // Zwracamy domyślny obiekt zamiast rzucać wyjątek
      return {
        providers: [],
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobieranie pojedynczego dostawcy nasienia po ID
   * @param id - ID dostawcy nasienia
   * @returns Obiekt dostawcy nasienia
   * @throws AppError - Jeśli dostawca nie zostanie znaleziony
   */
  async getProvider(id: number): Promise<SemenProvider> {
    const provider = await (semenProviderRepository as any).findById(id);
    if (!provider) {
      throw new AppError('Nie znaleziono dostawcy nasienia o podanym ID', 404);
    }
    return provider;
  }

  /**
   * Pobieranie dostawców nasienia dla danego właściciela
   * @param ownerId - ID właściciela
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @returns Obiekt zawierający listę dostawców i dane paginacji
   */
  async getOwnerProviders(
    ownerId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedProvidersResult> {
    try {
      const offset = (page - 1) * limit;
      const providers = await (semenProviderRepository as any).findByOwnerId(ownerId, limit, offset);
      const totalCount = await (semenProviderRepository as any).countByOwnerId(ownerId);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        providers: providers || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages: totalPages > 0 ? totalPages : 1,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[SEMEN_PROVIDER_SERVICE] Błąd podczas pobierania dostawców nasienia właściciela ${ownerId}:`, error);
      return {
        providers: [],
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobieranie dostawców nasienia dla danej organizacji
   * @param organizationId - ID organizacji
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @param includePublic - Czy dołączyć dostawców publicznych
   * @returns Obiekt zawierający listę dostawców i dane paginacji
   */
  async getOrganizationProviders(
    organizationId: number, 
    page: number = 1, 
    limit: number = 10, 
    includePublic: boolean = true
  ): Promise<PaginatedProvidersResult> {
    try {
      const offset = (page - 1) * limit;
      const providers = await (semenProviderRepository as any).findByOrganizationId(organizationId, limit, offset, includePublic);
      const totalCount = await (semenProviderRepository as any).countByOrganizationId(organizationId, includePublic);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        providers: providers || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages: totalPages > 0 ? totalPages : 1,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[SEMEN_PROVIDER_SERVICE] Błąd podczas pobierania dostawców nasienia organizacji ${organizationId}:`, error);
      return {
        providers: [],
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobieranie publicznych dostawców nasienia
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @returns Obiekt zawierający listę publicznych dostawców i dane paginacji
   */
  async getPublicProviders(
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedProvidersResult> {
    try {
      const offset = (page - 1) * limit;
      const providers = await (semenProviderRepository as any).findPublicProviders(limit, offset);
      const totalCount = await (semenProviderRepository as any).countPublicProviders();
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        providers: providers || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages: totalPages > 0 ? totalPages : 1,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[SEMEN_PROVIDER_SERVICE] Błąd podczas pobierania publicznych dostawców nasienia:`, error);
      return {
        providers: [],
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Tworzenie nowego dostawcy nasienia
   * @param providerData - Dane dostawcy nasienia
   * @returns Utworzony dostawca nasienia
   * @throws AppError - W przypadku problemów z tworzeniem dostawcy
   */
  async createProvider(providerData: SemenProviderData): Promise<SemenProvider> {
    try {
      // Sprawdzanie czy istnieje już dostawca z tym samym numerem weterynaryjnym dla danego właściciela
      const exists = await (semenProviderRepository as any).existsWithVetIdNumber(
        providerData.vet_id_number,
        providerData.owner_id
      );
      
      if (exists) {
        throw new AppError('Dostawca z takim numerem weterynaryjnym już istnieje', 400);
      }
      
      // Obsługa flagi is_public do ustawienia organization_id na null
      if (providerData.is_public === true) {
        providerData.organization_id = null;
      }
      
      const provider = await (semenProviderRepository as any).create(providerData);
      if (!provider) {
        throw new AppError('Nie udało się utworzyć dostawcy nasienia', 500);
      }
      
      return provider;
    } catch (error) {
      console.error('[SEMEN_PROVIDER_SERVICE] Błąd podczas tworzenia dostawcy nasienia:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Wystąpił błąd podczas tworzenia dostawcy nasienia', 500);
    }
  }

  /**
   * Aktualizacja istniejącego dostawcy nasienia
   * @param id - ID dostawcy nasienia
   * @param providerData - Nowe dane dostawcy nasienia
   * @returns Zaktualizowany dostawca nasienia
   * @throws AppError - W przypadku problemów z aktualizacją dostawcy
   */
  async updateProvider(id: number, providerData: Partial<SemenProviderData>): Promise<SemenProvider> {
    try {
      // Sprawdzenie czy dostawca istnieje
      const existingProvider = await (semenProviderRepository as any).findById(id);
      if (!existingProvider) {
        throw new AppError('Nie znaleziono dostawcy nasienia o podanym ID', 404);
      }
      
      // Sprawdzanie unikalności numeru weterynaryjnego jeśli jest aktualizowany
      if (providerData.vet_id_number && providerData.vet_id_number !== existingProvider.vet_id_number) {
        const exists = await (semenProviderRepository as any).existsWithVetIdNumber(
          providerData.vet_id_number,
          existingProvider.owner_id,
          id // Wykluczamy bieżący rekord z wyszukiwania
        );
        
        if (exists) {
          throw new AppError('Dostawca z takim numerem weterynaryjnym już istnieje', 400);
        }
      }
      
      // Obsługa flagi is_public do ustawienia organization_id na null
      if (providerData.is_public === true) {
        providerData.organization_id = null;
      }
      
      const updatedProvider = await (semenProviderRepository as any).update(id, providerData);
      if (!updatedProvider) {
        throw new AppError('Nie udało się zaktualizować dostawcy nasienia', 500);
      }
      
      return updatedProvider;
    } catch (error) {
      console.error('[SEMEN_PROVIDER_SERVICE] Błąd podczas aktualizacji dostawcy nasienia:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Wystąpił błąd podczas aktualizacji dostawcy nasienia', 500);
    }
  }

  /**
   * Usuwanie dostawcy nasienia
   * @param id - ID dostawcy nasienia
   * @returns Czy operacja się powiodła
   * @throws AppError - W przypadku problemów z usunięciem dostawcy
   */
  async deleteProvider(id: number): Promise<boolean> {
    try {
      const result = await (semenProviderRepository as any).delete(id);
      if (!result) {
        throw new AppError('Nie udało się usunąć dostawcy nasienia', 404);
      }
      return true;
    } catch (error: any) {
      console.error('[SEMEN_PROVIDER_SERVICE] Błąd podczas usuwania dostawcy nasienia:', error);
      
      // Obsługa specyficznych błędów
      if (error.message && error.message.includes('associated deliveries')) {
        throw new AppError('Nie można usunąć dostawcy, który ma powiązane dostawy nasienia', 400);
      }
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Wystąpił błąd podczas usuwania dostawcy nasienia', 500);
    }
  }

  /**
   * Sprawdzanie czy dostawca nasienia należy do danej organizacji lub jest publiczny
   * @param id - ID dostawcy nasienia
   * @param organizationId - ID organizacji
   * @returns Czy dostawca należy do organizacji lub jest publiczny
   */
  async belongsToOrganization(id: number, organizationId: number): Promise<boolean> {
    return await (semenProviderRepository as any).belongsToOrganization(id, organizationId);
  }
}

export default new SemenProviderService();