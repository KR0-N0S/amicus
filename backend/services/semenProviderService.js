/**
 * Serwis obsługujący operacje na dostawcach nasienia
 * @author KR0-N0S
 * @date 2025-04-04
 */

const semenProviderRepository = require('../repositories/semenProviderRepository');
const { AppError } = require('../middleware/errorHandler');

class SemenProviderService {
  /**
   * Wyszukiwanie dostawców nasienia należących do danego właściciela
   * @param {string} searchTerm - Fraza wyszukiwania
   * @param {number} ownerId - ID właściciela
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę dostawców i dane paginacji
   */
  async searchProvidersByOwnerId(searchTerm, ownerId, page = 1, limit = 10) {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[SEMEN_PROVIDER_SERVICE] Wyszukiwanie dostawców nasienia właściciela ${ownerId} dla frazy: "${safeSearchTerm}"`);
      const result = await semenProviderRepository.searchByOwnerId(safeSearchTerm, ownerId, page, limit);
      
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
   * @param {string} searchTerm - Fraza wyszukiwania
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @param {boolean} includePublic - Czy dołączyć dostawców publicznych
   * @returns {Object} - Obiekt zawierający listę dostawców i dane paginacji
   */
  async searchProvidersByOrganizationId(searchTerm, organizationId, page = 1, limit = 10, includePublic = true) {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[SEMEN_PROVIDER_SERVICE] Wyszukiwanie dostawców nasienia w organizacji ${organizationId} dla frazy: "${safeSearchTerm}"`);
      const result = await semenProviderRepository.searchByOrganizationId(safeSearchTerm, organizationId, page, limit, includePublic);
      
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
   * @param {number} id - ID dostawcy nasienia
   * @returns {Object} - Obiekt dostawcy nasienia
   * @throws {AppError} - Jeśli dostawca nie zostanie znaleziony
   */
  async getProvider(id) {
    const provider = await semenProviderRepository.findById(id);
    if (!provider) {
      throw new AppError('Nie znaleziono dostawcy nasienia o podanym ID', 404);
    }
    return provider;
  }

  /**
   * Pobieranie dostawców nasienia dla danego właściciela
   * @param {number} ownerId - ID właściciela
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę dostawców i dane paginacji
   */
  async getOwnerProviders(ownerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const providers = await semenProviderRepository.findByOwnerId(ownerId, limit, offset);
      const totalCount = await semenProviderRepository.countByOwnerId(ownerId);
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
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @param {boolean} includePublic - Czy dołączyć dostawców publicznych
   * @returns {Object} - Obiekt zawierający listę dostawców i dane paginacji
   */
  async getOrganizationProviders(organizationId, page = 1, limit = 10, includePublic = true) {
    try {
      const offset = (page - 1) * limit;
      const providers = await semenProviderRepository.findByOrganizationId(organizationId, limit, offset, includePublic);
      const totalCount = await semenProviderRepository.countByOrganizationId(organizationId, includePublic);
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
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę publicznych dostawców i dane paginacji
   */
  async getPublicProviders(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const providers = await semenProviderRepository.findPublicProviders(limit, offset);
      const totalCount = await semenProviderRepository.countPublicProviders();
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
   * @param {Object} providerData - Dane dostawcy nasienia
   * @returns {Object} - Utworzony dostawca nasienia
   * @throws {AppError} - W przypadku problemów z tworzeniem dostawcy
   */
  async createProvider(providerData) {
    try {
      // Sprawdzanie czy istnieje już dostawca z tym samym numerem weterynaryjnym dla danego właściciela
      const exists = await semenProviderRepository.existsWithVetIdNumber(
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
      
      const provider = await semenProviderRepository.create(providerData);
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
   * @param {number} id - ID dostawcy nasienia
   * @param {Object} providerData - Nowe dane dostawcy nasienia
   * @returns {Object} - Zaktualizowany dostawca nasienia
   * @throws {AppError} - W przypadku problemów z aktualizacją dostawcy
   */
  async updateProvider(id, providerData) {
    try {
      // Sprawdzenie czy dostawca istnieje
      const existingProvider = await semenProviderRepository.findById(id);
      if (!existingProvider) {
        throw new AppError('Nie znaleziono dostawcy nasienia o podanym ID', 404);
      }
      
      // Sprawdzanie unikalności numeru weterynaryjnego jeśli jest aktualizowany
      if (providerData.vet_id_number && providerData.vet_id_number !== existingProvider.vet_id_number) {
        const exists = await semenProviderRepository.existsWithVetIdNumber(
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
      
      const updatedProvider = await semenProviderRepository.update(id, providerData);
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
   * @param {number} id - ID dostawcy nasienia
   * @returns {boolean} - Czy operacja się powiodła
   * @throws {AppError} - W przypadku problemów z usunięciem dostawcy
   */
  async deleteProvider(id) {
    try {
      const result = await semenProviderRepository.delete(id);
      if (!result) {
        throw new AppError('Nie udało się usunąć dostawcy nasienia', 404);
      }
      return true;
    } catch (error) {
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
   * @param {number} id - ID dostawcy nasienia
   * @param {number} organizationId - ID organizacji
   * @returns {boolean} - Czy dostawca należy do organizacji lub jest publiczny
   */
  async belongsToOrganization(id, organizationId) {
    return await semenProviderRepository.belongsToOrganization(id, organizationId);
  }
}

module.exports = new SemenProviderService();