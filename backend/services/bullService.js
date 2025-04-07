const bullRepository = require('../repositories/bullRepository');
const { AppError } = require('../middleware/errorHandler');

class BullService {
  /**
   * Wyszukiwanie buhajów z filtrowaniem i paginacją
   * @param {string} searchTerm - Fraza wyszukiwania
   * @param {Object} filters - Filtry (typ, rasa)
   * @param {Object} sorting - Parametry sortowania
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę buhajów i dane paginacji
   */
  async searchBulls(searchTerm, filters = {}, sorting = {}, page = 1, limit = 10) {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[BULL_SERVICE] Wyszukiwanie buhajów dla frazy: "${safeSearchTerm}"`);
      const result = await bullRepository.searchBulls(safeSearchTerm, filters, sorting, page, limit);
      
      // Zabezpieczenie przed nieprawidłową strukturą wyniku
      if (!result) {
        return {
          bulls: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit
          }
        };
      }
      
      // Upewniamy się, że bulls istnieje
      if (!result.bulls) {
        result.bulls = [];
      }
      
      // Upewniamy się, że pagination istnieje
      if (!result.pagination) {
        result.pagination = {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        };
      }
      
      return result;
    } catch (error) {
      console.error('[BULL_SERVICE] Błąd podczas wyszukiwania buhajów:', error);
      // Zwracamy domyślny obiekt zamiast rzucać wyjątek
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobiera konkretnego buhaja po ID
   * @param {number} id - ID buhaja
   * @returns {Object} - Dane buhaja
   * @throws {AppError} - Błąd jeśli buhaj nie istnieje
   */
  async getBull(id) {
    const bull = await bullRepository.findById(id);
    if (!bull) {
      throw new AppError('Nie znaleziono buhaja o podanym ID', 404);
    }
    return bull;
  }

  /**
   * Pobiera buhaje należące do właściciela
   * @param {number} ownerId - ID właściciela
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę buhajów i dane paginacji
   */
  async getOwnerBulls(ownerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const bulls = await bullRepository.findByOwnerId(ownerId, limit, offset);
      const totalCount = await bullRepository.countByOwnerId(ownerId);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        bulls: bulls || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[BULL_SERVICE] Błąd podczas pobierania buhajów właściciela ${ownerId}:`, error);
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobiera buhaje należące do organizacji
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę buhajów i dane paginacji
   */
  async getOrganizationBulls(organizationId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const bulls = await bullRepository.findByOrganizationId(organizationId, limit, offset);
      const totalCount = await bullRepository.countByOrganizationId(organizationId);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        bulls: bulls || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[BULL_SERVICE] Błąd podczas pobierania buhajów organizacji ${organizationId}:`, error);
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Tworzy nowego buhaja
   * @param {Object} bullData - Dane buhaja
   * @returns {Object} - Utworzony buhaj
   */
  async createBull(bullData) {
    try {
      // Walidacja numeru identyfikacyjnego
      if (!bullData.identification_number) {
        throw new AppError('Numer identyfikacyjny buhaja jest wymagany', 400);
      }

      const idNumberRegex = /^[A-Z]{2}[0-9]+$/;
      if (!idNumberRegex.test(bullData.identification_number)) {
        throw new AppError('Niepoprawny format numeru identyfikacyjnego. Wymagany format: 2 duże litery + cyfry', 400);
      }

      // Walidacja typu buhaja
      if (!bullData.bull_type) {
        throw new AppError('Typ buhaja jest wymagany', 400);
      }

      // Jeśli nie podano nazwy, użyj numeru identyfikacyjnego
      if (!bullData.name) {
        bullData.name = bullData.identification_number;
      }

      const bull = await bullRepository.create(bullData);
      return bull;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas tworzenia buhaja:', error);
      throw new AppError('Nie udało się utworzyć buhaja', 500);
    }
  }

  /**
   * Aktualizuje dane buhaja
   * @param {number} id - ID buhaja
   * @param {Object} bullData - Nowe dane
   * @returns {Object} - Zaktualizowany buhaj
   */
  async updateBull(id, bullData) {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      // Walidacja numeru identyfikacyjnego
      if (bullData.identification_number) {
        const idNumberRegex = /^[A-Z]{2}[0-9]+$/;
        if (!idNumberRegex.test(bullData.identification_number)) {
          throw new AppError('Niepoprawny format numeru identyfikacyjnego. Wymagany format: 2 duże litery + cyfry', 400);
        }
      }
      
      const bull = await bullRepository.update(id, bullData);
      return bull;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas aktualizacji buhaja:', error);
      throw new AppError('Nie udało się zaktualizować buhaja', 500);
    }
  }

  /**
   * Usuwa buhaja
   * @param {number} id - ID buhaja
   * @returns {boolean} - Czy operacja się powiodła
   */
  async deleteBull(id) {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const result = await bullRepository.delete(id);
      if (!result) {
        throw new AppError('Nie udało się usunąć buhaja', 500);
      }
      return true;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas usuwania buhaja:', error);
      throw new AppError('Nie udało się usunąć buhaja', 500);
    }
  }

  /**
   * Pobiera statystyki dla buhaja
   * @param {number} id - ID buhaja
   * @returns {Object} - Statystyki buhaja
   */
  async getBullStats(id) {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const stats = await bullRepository.getBullStats(id);
      return stats;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas pobierania statystyk buhaja:', error);
      throw new AppError('Nie udało się pobrać statystyk buhaja', 500);
    }
  }

  /**
   * Pobiera historię dostaw nasienia dla buhaja
   * @param {number} id - ID buhaja
   * @param {number} page - Numer strony
   * @param {number} limit - Liczba wyników na stronę
   * @returns {Array} - Historia dostaw
   */
  async getBullDeliveries(id, page = 1, limit = 10) {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const offset = (page - 1) * limit;
      const deliveries = await bullRepository.getBullDeliveries(id, limit, offset);
      return deliveries;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas pobierania historii dostaw buhaja:', error);
      throw new AppError('Nie udało się pobrać historii dostaw buhaja', 500);
    }
  }

  /**
   * Pobiera historię inseminacji dla buhaja
   * @param {number} id - ID buhaja
   * @param {number} page - Numer strony
   * @param {number} limit - Liczba wyników na stronę
   * @returns {Array} - Historia inseminacji
   */
  async getBullInseminations(id, page = 1, limit = 10) {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const offset = (page - 1) * limit;
      const inseminations = await bullRepository.getBullInseminations(id, limit, offset);
      return inseminations;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas pobierania historii inseminacji buhaja:', error);
      throw new AppError('Nie udało się pobrać historii inseminacji buhaja', 500);
    }
  }
}

module.exports = new BullService();