const animalRepository = require('../repositories/animalRepository');
const { AppError } = require('../middleware/errorHandler');

class AnimalService {
  /**
   * Wylicza wiek na podstawie daty urodzenia
   * @param {Date|string} birthDate - Data urodzenia
   * @returns {number|null} - Wyliczony wiek lub null jeśli brak daty urodzenia
   */
  calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    
    // Korekta wieku jeśli urodziny jeszcze nie nastąpiły w tym roku
    if (
      today.getMonth() < birthDateObj.getMonth() || 
      (today.getMonth() === birthDateObj.getMonth() && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }
    
    return age < 0 ? 0 : age;
  }

  /**
   * Wyszukiwanie zwierząt należących do danego właściciela
   * @param {string} searchTerm - Fraza wyszukiwania
   * @param {number} ownerId - ID właściciela
   * @param {string} animalType - Typ zwierzęcia ('farm' lub 'companion')
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę zwierząt i dane paginacji
   */
  async searchAnimalsByOwnerId(searchTerm, ownerId, animalType = null, page = 1, limit = 10) {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[ANIMAL_SERVICE] Wyszukiwanie zwierząt właściciela ${ownerId} dla frazy: "${safeSearchTerm}"`);
      const result = await animalRepository.searchAnimalsByOwnerId(safeSearchTerm, ownerId, animalType, page, limit);
      
      // Zabezpieczenie przed nieprawidłową strukturą wyniku
      if (!result) {
        return {
          animals: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0
          }
        };
      }
      
      // Upewniamy się, że animals istnieje
      if (!result.animals) {
        result.animals = [];
      }
      
      // Upewniamy się, że pagination istnieje
      if (!result.pagination) {
        result.pagination = {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        };
      }
      
      return result;
    } catch (error) {
      console.error('[ANIMAL_SERVICE] Błąd podczas wyszukiwania zwierząt właściciela:', error);
      // Zwracamy domyślny obiekt zamiast rzucać wyjątek
      return {
        animals: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Wyszukiwanie zwierząt w całej organizacji
   * @param {string} searchTerm - Fraza wyszukiwania
   * @param {number} organizationId - ID organizacji
   * @param {string} animalType - Typ zwierzęcia ('farm' lub 'companion')
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @returns {Object} - Obiekt zawierający listę zwierząt i dane paginacji
   */
  async searchAnimalsByOrganizationId(searchTerm, organizationId, animalType = null, page = 1, limit = 10) {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[ANIMAL_SERVICE] Wyszukiwanie zwierząt w organizacji ${organizationId} dla frazy: "${safeSearchTerm}"`);
      const result = await animalRepository.searchAnimalsByOrganizationId(safeSearchTerm, organizationId, animalType, page, limit);
      
      // Zabezpieczenie przed nieprawidłową strukturą wyniku
      if (!result) {
        return {
          animals: [],
          pagination: {
            page,
            limit,
            totalCount: 0,
            totalPages: 0
          }
        };
      }
      
      // Upewniamy się, że animals istnieje
      if (!result.animals) {
        result.animals = [];
      }
      
      // Upewniamy się, że pagination istnieje
      if (!result.pagination) {
        result.pagination = {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        };
      }
      
      return result;
    } catch (error) {
      console.error('[ANIMAL_SERVICE] Błąd podczas wyszukiwania zwierząt organizacji:', error);
      // Zwracamy domyślny obiekt zamiast rzucać wyjątek
      return {
        animals: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
  }

  async getAnimal(id) {
    const animal = await animalRepository.findById(id);
    if (!animal) {
      throw new AppError('Nie znaleziono zwierzęcia o podanym ID', 404);
    }
    return animal;
  }

  async getOwnerAnimals(ownerId, page = 1, limit = 10, animalType = null) {
    try {
      const offset = (page - 1) * limit;
      const animals = await animalRepository.findByOwnerId(ownerId, limit, offset, animalType);
      const totalCount = await animalRepository.countByOwnerId(ownerId, animalType);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        animals: animals || [], // Zabezpieczenie przed undefined
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      };
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierząt właściciela ${ownerId}:`, error);
      return {
        animals: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Pobiera zwierzęta należące do wszystkich użytkowników w danej organizacji
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @param {string} animalType - Opcjonalny filtr typu zwierzęcia ('farm' lub 'companion')
   * @returns {Object} - Obiekt zawierający listę zwierząt i dane paginacji
   */
  async getOrganizationAnimals(organizationId, page = 1, limit = 10, animalType = null) {
    try {
      const offset = (page - 1) * limit;
      const animals = await animalRepository.findByOrganizationId(organizationId, limit, offset, animalType);
      const totalCount = await animalRepository.countByOrganizationId(organizationId, animalType);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        animals: animals || [], // Zabezpieczenie przed undefined
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      };
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierząt organizacji ${organizationId}:`, error);
      return {
        animals: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      };
    }
  }

  // Pozostałe metody bez zmian...
  async createAnimal(animalData) {
    // Istniejąca implementacja
  }

  async updateAnimal(id, animalData) {
    // Istniejąca implementacja
  }

  async deleteAnimal(id) {
    // Istniejąca implementacja
  }
}

module.exports = new AnimalService();