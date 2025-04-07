/**
 * Serwis do zarządzania zwierzętami
 * @author KR0-N0S
 * @date 2025-04-06 (zoptymalizowano: 2025-04-06 18:56:33)
 */

const { AppError } = require('../middleware/errorHandler');
const { PAGINATION, ANIMAL_TYPES, HTTP_STATUS } = require('../config/constants');
const baseRepository = require('../repositories/baseRepository');
const userRepository = require('../repositories/userRepository'); // Dodany brakujący import

class AnimalService {
  /**
   * Tworzy nową instancję serwisu AnimalService
   * @param {Object} animalRepository - Repozytorium zwierząt
   */
  constructor(animalRepository) {
    this.animalRepository = animalRepository;
    this.baseRepository = baseRepository;
    this.userRepository = userRepository;
  }

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
   * @throws {AppError} - W przypadku błędu
   */
  async searchAnimalsByOwnerId(searchTerm, ownerId, animalType = null, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_PAGE_SIZE) {
    try {
      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const safeSearchTerm = searchTerm || '';
      console.log(`[ANIMAL_SERVICE] Wyszukiwanie zwierząt właściciela ${ownerId} dla frazy: "${safeSearchTerm}"`);
      const result = await this.animalRepository.searchAnimalsByOwnerId(
        safeSearchTerm, 
        ownerId, 
        animalType, 
        page, 
        safeLimit
      );
      return this._sanitizePaginationResult(result, page, safeLimit);
    } catch (error) {
      console.error('[ANIMAL_SERVICE] Błąd podczas wyszukiwania zwierząt właściciela:', error);
      throw new AppError('Wystąpił błąd podczas wyszukiwania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
   * @throws {AppError} - W przypadku błędu
   */
  async searchAnimalsByOrganizationId(searchTerm, organizationId, animalType = null, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_PAGE_SIZE) {
    try {
      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const safeSearchTerm = searchTerm || '';
      console.log(`[ANIMAL_SERVICE] Wyszukiwanie zwierząt w organizacji ${organizationId} dla frazy: "${safeSearchTerm}"`);
      const result = await this.animalRepository.searchAnimalsByOrganizationId(
        safeSearchTerm, 
        organizationId, 
        animalType, 
        page, 
        safeLimit
      );
      return this._sanitizePaginationResult(result, page, safeLimit);
    } catch (error) {
      console.error('[ANIMAL_SERVICE] Błąd podczas wyszukiwania zwierząt organizacji:', error);
      throw new AppError('Wystąpił błąd podczas wyszukiwania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Pobieranie pojedynczego zwierzęcia po ID
   * @param {number} id - ID zwierzęcia
   * @param {Object} options - Opcje dodatkowe (np. sprawdzanie właściciela)
   * @returns {Object} - Obiekt zwierzęcia
   * @throws {AppError} - Jeśli zwierzę nie zostanie znalezione lub brak uprawnień
   */
  async getAnimal(id, options = {}) {
    try {
      const animal = await this.animalRepository.findById(id);
      if (!animal) {
        throw new AppError('Nie znaleziono zwierzęcia o podanym ID', HTTP_STATUS.NOT_FOUND);
      }
      if (options.checkOwner && animal.owner_id !== options.ownerId) {
        throw new AppError('Brak uprawnień do tego zwierzęcia', HTTP_STATUS.FORBIDDEN);
      }
      return animal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierzęcia ID ${id}:`, error);
      throw new AppError('Wystąpił błąd podczas pobierania zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Pobieranie zwierzęcia po numerze identyfikacyjnym/kolczyku
   * @param {string} animalNumber - Numer identyfikacyjny zwierzęcia
   * @returns {Promise<Object|null>} - Obiekt zwierzęcia lub null, jeśli nie znaleziono
   */
  async getAnimalByNumber(animalNumber) {
    try {
      if (!animalNumber) {
        console.log('[ANIMAL_SERVICE] Wywołano getAnimalByNumber bez numeru zwierzęcia');
        return null;
      }
      const existingAnimals = await this.animalRepository.findByIdentifier(animalNumber);
      return existingAnimals && existingAnimals.length > 0 ? existingAnimals[0] : null;
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierzęcia po numerze ${animalNumber}:`, error);
      return null;
    }
  }

  /**
   * Pobieranie zwierząt danego właściciela
   * @param {number} ownerId - ID właściciela
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @param {string} animalType - Opcjonalny filtr typu zwierzęcia ('farm' lub 'companion')
   * @returns {Object} - Obiekt zawierający listę zwierząt i dane paginacji
   * @throws {AppError} - W przypadku błędu
   */
  async getOwnerAnimals(ownerId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_PAGE_SIZE, animalType = null) {
    try {
      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const offset = (page - 1) * safeLimit;
      const animals = await this.animalRepository.findByOwnerId(ownerId, safeLimit, offset, animalType);
      const totalCount = await this.animalRepository.countByOwnerId(ownerId, animalType);
      return {
        animals: animals || [],
        pagination: {
          page,
          limit: safeLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / safeLimit) || 1
        }
      };
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierząt właściciela ${ownerId}:`, error);
      throw new AppError('Wystąpił błąd podczas pobierania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Pobiera zwierzęta należące do wszystkich użytkowników w danej organizacji
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @param {string} animalType - Opcjonalny filtr typu zwierzęcia ('farm' lub 'companion')
   * @returns {Object} - Obiekt zawierający listę zwierząt i dane paginacji
   * @throws {AppError} - W przypadku błędu
   */
  async getOrganizationAnimals(organizationId, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_PAGE_SIZE, animalType = null) {
    try {
      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const offset = (page - 1) * safeLimit;
      const animals = await this.animalRepository.findByOrganizationId(organizationId, safeLimit, offset, animalType);
      const totalCount = await this.animalRepository.countByOrganizationId(organizationId, animalType);
      return {
        animals: animals || [],
        pagination: {
          page,
          limit: safeLimit,
          totalCount,
          totalPages: Math.ceil(totalCount / safeLimit) || 1
        }
      };
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierząt organizacji ${organizationId}:`, error);
      throw new AppError('Wystąpił błąd podczas pobierania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Tworzenie nowego zwierzęcia z obsługą transakcji
   * @param {Object} animalData - Dane nowego zwierzęcia (już zwalidowane przez middleware)
   * @returns {Object} - Utworzone zwierzę
   * @throws {AppError} - W przypadku błędów biznesowych
   */
  async createAnimal(animalData) {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      console.log(`[ANIMAL_SERVICE] Tworzenie nowego zwierzęcia:`, animalData);

      // Próba pobrania organization_id z właściciela, jeśli nie jest ustawiony
      if (!animalData.organization_id && animalData.owner_id) {
        console.log(`[ANIMAL_SERVICE] organization_id nie jest ustawiony, próba pobrania z właściciela`);
        try {
          const ownerOrganizations = await this.userRepository.getUserOrganizations(animalData.owner_id);
          if (ownerOrganizations?.length > 0) {
            animalData.organization_id = ownerOrganizations[0].organization_id;
            console.log(`[ANIMAL_SERVICE] Ustawiono organization_id=${animalData.organization_id}`);
          }
        } catch (ownerError) {
          console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania organizacji właściciela:`, ownerError);
        }
      }
      
      // Sprawdzenie unikalności numeru zwierzęcia
      if (animalData.animal_type === ANIMAL_TYPES.FARM && 
          (animalData.farm_animal?.identifier || animalData.animal_number)) {
        const identifier = animalData.farm_animal?.identifier || animalData.animal_number;
        const existingAnimal = await this.getAnimalByNumber(identifier);
        if (existingAnimal) {
          throw new AppError(
            `Zwierzę o numerze ${identifier} już istnieje w systemie`, 
            HTTP_STATUS.BAD_REQUEST
          );
        }
      }
      
      // Synchronizacja identyfikatora dla zwierząt gospodarskich
      if (animalData.animal_type === ANIMAL_TYPES.FARM) {
        if (!animalData.farm_animal) {
          animalData.farm_animal = {};
        }
        
        // Zapewnienie spójności identyfikatora
        if (!animalData.farm_animal.identifier && animalData.animal_number) {
          animalData.farm_animal.identifier = animalData.animal_number;
        } else if (animalData.farm_animal.identifier && !animalData.animal_number) {
          animalData.animal_number = animalData.farm_animal.identifier;
        }
      }
      
      // Przygotowanie danych podstawowych dla zwierzęcia
      const animalBaseData = {
        owner_id: animalData.owner_id,
        animal_number: animalData.animal_number,
        organization_id: animalData.organization_id,
        species: animalData.species,
        animal_type: animalData.animal_type,
        sex: animalData.sex,
        breed: animalData.breed,
        birth_date: animalData.birth_date,
        registration_date: animalData.registration_date,
        photo: animalData.photo,
        weight: animalData.weight,
        notes: animalData.notes
      };
      
      // Dane specyficzne dla typu zwierzęcia
      const specificData = animalData.animal_type === ANIMAL_TYPES.FARM 
        ? animalData.farm_animal 
        : animalData.companion_animal;
      
      // Tworzenie zwierzęcia w bazie danych
      const animal = await this.animalRepository.create(animalBaseData, animalData.animal_type, specificData, client);
      
      // Zatwierdzenie transakcji
      await this.baseRepository.commitTransaction(client);
      
      console.log(`[ANIMAL_SERVICE] Utworzono zwierzę ID: ${animal.id}`);
      return animal;
    } catch (error) {
      // Wycofanie transakcji w przypadku błędu
      await this.baseRepository.rollbackTransaction(client);
      
      if (error instanceof AppError) throw error;
      console.error('[ANIMAL_SERVICE] Błąd podczas tworzenia zwierzęcia:', error);
      throw new AppError('Wystąpił błąd podczas tworzenia zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Tworzenie rekordu farm_animal dla istniejącego zwierzęcia
   * @param {Object} farmAnimalData - Dane farm_animal
   * @returns {Object} - Utworzony rekord farm_animal
   * @throws {AppError} - W przypadku błędu
   */
  async createFarmAnimal(farmAnimalData) {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      if (!farmAnimalData.animal_id) {
        throw new AppError('Brak ID zwierzęcia dla danych farm_animal', HTTP_STATUS.BAD_REQUEST);
      }

      // Sprawdzenie czy zwierzę istnieje i jest typu farm
      const animal = await this.getAnimal(farmAnimalData.animal_id);
      if (animal.animal_type !== ANIMAL_TYPES.FARM) {
        throw new AppError('Nie można dodać danych farm_animal do zwierzęcia innego typu', 
          HTTP_STATUS.BAD_REQUEST);
      }
      
      // Sprawdzenie czy już istnieją dane farm_animal
      if (animal.farm_animal) {
        throw new AppError('Zwierzę już posiada dane farm_animal', HTTP_STATUS.BAD_REQUEST);
      }

      console.log(`[ANIMAL_SERVICE] Tworzenie danych farm_animal dla zwierzęcia ${farmAnimalData.animal_id}`);
      const result = await this.animalRepository.createFarmAnimal(farmAnimalData, client);
      
      await this.baseRepository.commitTransaction(client);
      return result;
    } catch (error) {
      await this.baseRepository.rollbackTransaction(client);
      
      if (error instanceof AppError) throw error;
      console.error('[ANIMAL_SERVICE] Błąd podczas tworzenia danych farm_animal:', error);
      throw new AppError('Wystąpił błąd podczas tworzenia danych zwierzęcia gospodarskiego', 
        HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Aktualizacja istniejącego zwierzęcia
   * @param {number} id - ID zwierzęcia
   * @param {Object} animalData - Nowe dane zwierzęcia (już zwalidowane przez middleware)
   * @returns {Object} - Zaktualizowane zwierzę
   * @throws {AppError} - W przypadku błędów biznesowych lub braku zwierzęcia
   */
  async updateAnimal(id, animalData) {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      console.log(`[ANIMAL_SERVICE] Aktualizacja zwierzęcia ID ${id}:`, animalData);
      
      // Sprawdzenie czy zwierzę istnieje
      const animal = await this.getAnimal(id, {
        checkOwner: animalData.checkOwnership,
        ownerId: animalData.currentUserId
      });
      
      // Sprawdzenie unikalności identyfikatora przy aktualizacji zwierząt gospodarskich
      if (animal.animal_type === ANIMAL_TYPES.FARM && animalData.farm_animal?.identifier) {
        if (animal.farm_animal?.identifier !== animalData.farm_animal.identifier) {
          const existingAnimal = await this.getAnimalByNumber(animalData.farm_animal.identifier);
          if (existingAnimal && existingAnimal.id !== parseInt(id)) {
            throw new AppError(
              `Zwierzę o numerze ${animalData.farm_animal.identifier} już istnieje w systemie`,
              HTTP_STATUS.BAD_REQUEST
            );
          }
        }
      }
      
      // Przygotowanie danych dla tabeli animals
      const animalBaseData = {
        species: animalData.species,
        sex: animalData.sex,
        breed: animalData.breed,
        birth_date: animalData.birth_date,
        registration_date: animalData.registration_date,
        photo: animalData.photo,
        weight: animalData.weight,
        notes: animalData.notes
      };
      
      // Dane specyficzne dla typu zwierzęcia
      const specificData = animal.animal_type === ANIMAL_TYPES.FARM 
        ? animalData.farm_animal 
        : animalData.companion_animal;
      
      // Aktualizacja zwierzęcia w bazie danych
      const updatedAnimal = await this.animalRepository.update(id, animalBaseData, animal.animal_type, specificData, client);
      
      await this.baseRepository.commitTransaction(client);
      console.log(`[ANIMAL_SERVICE] Zaktualizowano zwierzę ID: ${id}`);
      return updatedAnimal;
    } catch (error) {
      await this.baseRepository.rollbackTransaction(client);
      
      if (error instanceof AppError) throw error;
      console.error(`[ANIMAL_SERVICE] Błąd podczas aktualizacji zwierzęcia ID ${id}:`, error);
      throw new AppError('Wystąpił błąd podczas aktualizacji zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Usuwanie zwierzęcia
   * @param {number} id - ID zwierzęcia do usunięcia
   * @returns {boolean} - True jeśli operacja się powiodła
   * @throws {AppError} - W przypadku błędów lub braku zwierzęcia
   */
  async deleteAnimal(id) {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      console.log(`[ANIMAL_SERVICE] Usuwanie zwierzęcia ID: ${id}`);
      
      // Sprawdzenie czy zwierzę istnieje
      await this.getAnimal(id);
      
      // Usuwanie zwierzęcia w transakcji
      const result = await this.animalRepository.delete(id, client);
      
      await this.baseRepository.commitTransaction(client);
      console.log(`[ANIMAL_SERVICE] Usunięto zwierzę ID: ${id}`);
      return result;
    } catch (error) {
      await this.baseRepository.rollbackTransaction(client);
      
      if (error instanceof AppError) throw error;
      console.error(`[ANIMAL_SERVICE] Błąd podczas usuwania zwierzęcia ID ${id}:`, error);
      throw new AppError('Wystąpił błąd podczas usuwania zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
  
  /**
   * Metoda pomocnicza do sanityzacji wyników paginacji
   * @private
   * @param {Object} result - Wynik z repozytorium
   * @param {number} page - Numer strony
   * @param {number} limit - Limit elementów na stronę
   * @returns {Object} - Sformatowany wynik z paginacją
   */
  _sanitizePaginationResult(result, page, limit) {
    if (!result) {
      return {
        animals: [],
        pagination: { page, limit, totalCount: 0, totalPages: 1 }
      };
    }
    result.animals = result.animals || [];
    result.pagination = result.pagination || { page, limit, totalCount: 0, totalPages: 1 };
    return result;
  }
}

// Inicjalizacja i eksport serwisu
const animalRepository = require('../repositories/animalRepository');
module.exports = new AnimalService(animalRepository);