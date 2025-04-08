/**
 * Serwis do zarządzania zwierzętami
 * @author KR0-N0S
 * @date 2025-04-08 15:15:08
 */

import { AppError } from '../middleware/errorHandler';
import { PAGINATION, ANIMAL_TYPES, HTTP_STATUS } from '../config/constants';
import baseRepository from '../repositories/baseRepository';
import * as userRepository from '../repositories/userRepository';
import animalRepository from '../repositories/animalRepository';

import { Animal, AnimalBaseData, Pagination } from '../types/models/animal';
import { AnimalSearchOptions, PaginatedResult, AnimalInputData } from '../types/services/animalService';

class AnimalService {
  private baseRepository: typeof baseRepository;
  private userRepository: typeof userRepository;

  /**
   * Tworzy nową instancję serwisu AnimalService
   */
  constructor() {
    this.baseRepository = baseRepository;
    this.userRepository = userRepository;
  }

  /**
   * Wylicza wiek na podstawie daty urodzenia
   * @param birthDate - Data urodzenia
   * @returns Wyliczony wiek lub null jeśli brak daty urodzenia
   */
  calculateAge(birthDate?: Date | string | null): number | null {
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
   * @param searchTerm - Fraza wyszukiwania
   * @param ownerId - ID właściciela
   * @param animalType - Typ zwierzęcia ('farm' lub 'companion')
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @returns Obiekt zawierający listę zwierząt i dane paginacji
   * @throws AppError - W przypadku błędu
   */
  async searchAnimalsByOwnerId(
    searchTerm?: string, 
    ownerId?: number, 
    animalType: string | null = null, 
    page: number = PAGINATION.DEFAULT_PAGE, 
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResult> {
    try {
      if (!ownerId) {
        throw new AppError('ID właściciela jest wymagane', HTTP_STATUS.BAD_REQUEST);
      }

      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const safeSearchTerm = searchTerm || '';
      console.log(`[ANIMAL_SERVICE] Wyszukiwanie zwierząt właściciela ${ownerId} dla frazy: "${safeSearchTerm}"`);
      
      const result = await animalRepository.searchAnimalsByOwnerId(
        safeSearchTerm, 
        ownerId, 
        animalType, 
        page, 
        safeLimit
      );
      
      // Użyj rzutowania typów dla wyniku z repozytorium
      return this._sanitizePaginationResult(result as any, page, safeLimit);
    } catch (error) {
      console.error('[ANIMAL_SERVICE] Błąd podczas wyszukiwania zwierząt właściciela:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Wystąpił błąd podczas wyszukiwania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Wyszukiwanie zwierząt w całej organizacji
   * @param searchTerm - Fraza wyszukiwania
   * @param organizationId - ID organizacji
   * @param animalType - Typ zwierzęcia ('farm' lub 'companion')
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @returns Obiekt zawierający listę zwierząt i dane paginacji
   * @throws AppError - W przypadku błędu
   */
  async searchAnimalsByOrganizationId(
    searchTerm?: string, 
    organizationId?: number, 
    animalType: string | null = null, 
    page: number = PAGINATION.DEFAULT_PAGE, 
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<PaginatedResult> {
    try {
      if (!organizationId) {
        throw new AppError('ID organizacji jest wymagane', HTTP_STATUS.BAD_REQUEST);
      }

      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const safeSearchTerm = searchTerm || '';
      console.log(`[ANIMAL_SERVICE] Wyszukiwanie zwierząt w organizacji ${organizationId} dla frazy: "${safeSearchTerm}"`);
      
      const result = await animalRepository.searchAnimalsByOrganizationId(
        safeSearchTerm, 
        organizationId, 
        animalType, 
        page, 
        safeLimit
      );
      
      // Użyj rzutowania typów dla wyniku z repozytorium
      return this._sanitizePaginationResult(result as any, page, safeLimit);
    } catch (error) {
      console.error('[ANIMAL_SERVICE] Błąd podczas wyszukiwania zwierząt organizacji:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Wystąpił błąd podczas wyszukiwania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Pobieranie pojedynczego zwierzęcia po ID
   * @param id - ID zwierzęcia
   * @param options - Opcje dodatkowe (np. sprawdzanie właściciela)
   * @returns Obiekt zwierzęcia
   * @throws AppError - Jeśli zwierzę nie zostanie znalezione lub brak uprawnień
   */
  async getAnimal(id: number, options: AnimalSearchOptions = {}): Promise<Animal> {
    try {
      const animal = await animalRepository.findById(id);
      
      if (!animal) {
        throw new AppError('Nie znaleziono zwierzęcia o podanym ID', HTTP_STATUS.NOT_FOUND);
      }
      
      if (options.checkOwner && animal.owner_id !== options.ownerId) {
        throw new AppError('Brak uprawnień do tego zwierzęcia', HTTP_STATUS.FORBIDDEN);
      }
      
      // Użyj rzutowania typów dla wyniku z repozytorium
      return animal as unknown as Animal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierzęcia ID ${id}:`, error);
      throw new AppError('Wystąpił błąd podczas pobierania zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Pobieranie zwierzęcia po numerze identyfikacyjnym/kolczyku
   * @param animalNumber - Numer identyfikacyjny zwierzęcia
   * @returns Obiekt zwierzęcia lub null, jeśli nie znaleziono
   */
  async getAnimalByNumber(animalNumber?: string): Promise<Animal | null> {
    try {
      if (!animalNumber) {
        console.log('[ANIMAL_SERVICE] Wywołano getAnimalByNumber bez numeru zwierzęcia');
        return null;
      }
      
      const existingAnimals = await animalRepository.findByIdentifier(animalNumber);
      // Użyj rzutowania typów dla wyniku z repozytorium
      return existingAnimals && existingAnimals.length > 0 ? existingAnimals[0] as unknown as Animal : null;
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierzęcia po numerze ${animalNumber}:`, error);
      return null;
    }
  }

  /**
   * Pobieranie zwierząt danego właściciela
   * @param ownerId - ID właściciela
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @param animalType - Opcjonalny filtr typu zwierzęcia ('farm' lub 'companion')
   * @returns Obiekt zawierający listę zwierząt i dane paginacji
   * @throws AppError - W przypadku błędu
   */
  async getOwnerAnimals(
    ownerId: number, 
    page: number = PAGINATION.DEFAULT_PAGE, 
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE, 
    animalType: string | null = null
  ): Promise<PaginatedResult> {
    try {
      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const offset = (page - 1) * safeLimit;
      const animals = await animalRepository.findByOwnerId(ownerId, safeLimit, offset, animalType);
      const totalCount = await animalRepository.countByOwnerId(ownerId, animalType);
      return {
        animals: animals as unknown as Animal[] || [],
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / safeLimit) || 1,
          currentPage: page,
          pageSize: safeLimit
        }
      };
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierząt właściciela ${ownerId}:`, error);
      throw new AppError('Wystąpił błąd podczas pobierania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Pobieranie zwierząt w danej organizacji
   * @param organizationId - ID organizacji
   * @param page - Numer strony (paginacja)
   * @param limit - Liczba elementów na stronę
   * @param animalType - Opcjonalny filtr typu zwierzęcia ('farm' lub 'companion')
   * @returns Obiekt zawierający listę zwierząt i dane paginacji
   * @throws AppError - W przypadku błędu
   */
  async getOrganizationAnimals(
    organizationId: number, 
    page: number = PAGINATION.DEFAULT_PAGE, 
    limit: number = PAGINATION.DEFAULT_PAGE_SIZE, 
    animalType: string | null = null
  ): Promise<PaginatedResult> {
    try {
      const safeLimit = Math.min(limit, PAGINATION.MAX_PAGE_SIZE);
      const offset = (page - 1) * safeLimit;
      const animals = await animalRepository.findByOrganizationId(organizationId, safeLimit, offset, animalType);
      const totalCount = await animalRepository.countByOrganizationId(organizationId, animalType);
      return {
        animals: animals as unknown as Animal[] || [],
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / safeLimit) || 1,
          currentPage: page,
          pageSize: safeLimit
        }
      };
    } catch (error) {
      console.error(`[ANIMAL_SERVICE] Błąd podczas pobierania zwierząt organizacji ${organizationId}:`, error);
      throw new AppError('Wystąpił błąd podczas pobierania zwierząt', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Tworzenie nowego zwierzęcia z obsługą transakcji
   * @param animalData - Dane nowego zwierzęcia (już zwalidowane przez middleware)
   * @returns Utworzone zwierzę
   * @throws AppError - W przypadku błędów biznesowych
   */
  async createAnimal(animalData: AnimalInputData): Promise<Animal> {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      console.log(`[ANIMAL_SERVICE] Tworzenie nowego zwierzęcia:`, animalData);

      // Walidacja wymaganych pól
      if (!animalData.animal_type) {
        throw new AppError('Typ zwierzęcia jest wymagany', HTTP_STATUS.BAD_REQUEST);
      }

      // Próba pobrania organization_id z właściciela, jeśli nie jest ustawiony
      if (!animalData.organization_id && animalData.owner_id) {
        console.log(`[ANIMAL_SERVICE] organization_id nie jest ustawiony, próba pobrania z właściciela`);
        try {
          const userDetails = await userRepository.getSingleUser(animalData.owner_id, true);
          if (userDetails?.organizations && userDetails.organizations.length > 0) {
            animalData.organization_id = userDetails.organizations[0].id;
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
        
        if (typeof identifier === 'string') {
          const existingAnimal = await this.getAnimalByNumber(identifier);
          if (existingAnimal) {
            throw new AppError(
              `Zwierzę o numerze ${identifier} już istnieje w systemie`, 
              HTTP_STATUS.BAD_REQUEST
            );
          }
        }
      }
      
      // Reszta kodu pozostaje bez zmian
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
      
      // Przygotowanie danych podstawowych dla zwierzęcia - użyj rzutowania typu dla zgodności
      const animalBaseData = {
        owner_id: animalData.owner_id!, // Wymaga wartości - nie może być undefined
        species: animalData.species || '', // Zapewniamy wartość domyślną
        animal_type: animalData.animal_type, // Już zwalidowane
        sex: animalData.sex || '', // Zapewniamy wartość domyślną
        breed: animalData.breed,
        birth_date: animalData.birth_date,
        weight: animalData.weight,
        photo: animalData.photo,
        notes: animalData.notes,
        organization_id: animalData.organization_id
      } as unknown as AnimalBaseData;
      
      // Dane specyficzne dla typu zwierzęcia
      const specificData = animalData.animal_type === ANIMAL_TYPES.FARM 
        ? animalData.farm_animal 
        : animalData.companion_animal;
      
      // Tworzenie zwierzęcia w bazie danych - teraz z rzutowaniem
      const animal = await animalRepository.create(
        animalBaseData as any,
        animalData.animal_type,  
        specificData
      );
      
      await this.baseRepository.commitTransaction(client);
      console.log(`[ANIMAL_SERVICE] Utworzono zwierzę ID: ${animal.id}`);
      return animal as unknown as Animal;
    } catch (error) {
      await this.baseRepository.rollbackTransaction(client);
      
      if (error instanceof AppError) throw error;
      console.error('[ANIMAL_SERVICE] Błąd podczas tworzenia zwierzęcia:', error);
      throw new AppError('Wystąpił błąd podczas tworzenia zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Aktualizacja istniejącego zwierzęcia
   * @param id - ID zwierzęcia
   * @param animalData - Nowe dane zwierzęcia (już zwalidowane przez middleware)
   * @returns Zaktualizowane zwierzę
   * @throws AppError - W przypadku błędów biznesowych lub braku zwierzęcia
   */
  async updateAnimal(id: number, animalData: AnimalInputData): Promise<Animal> {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      console.log(`[ANIMAL_SERVICE] Aktualizacja zwierzęcia ID ${id}:`, animalData);
      
      // Sprawdzenie czy zwierzę istnieje
      const animal = await this.getAnimal(id, {
        checkOwner: animalData.checkOwnership,
        ownerId: animalData.currentUserId
      });
      
      // Aktualizacja zwierzęcia w bazie danych - użyj rzutowania typu
      const animalBaseData = {
        species: animalData.species,
        sex: animalData.sex,
        breed: animalData.breed,
        birth_date: animalData.birth_date,
        weight: animalData.weight,
        photo: animalData.photo,
        notes: animalData.notes
      } as unknown as Partial<AnimalBaseData>;
      
      // Dane specyficzne dla typu zwierzęcia
      const specificData = animal.animal_type === ANIMAL_TYPES.FARM 
        ? animalData.farm_animal 
        : animalData.companion_animal;
      
      const updatedAnimal = await animalRepository.update(id, animalBaseData as any, animal.animal_type, specificData);
      
      // Sprawdzenie czy aktualizacja się powiodła
      if (!updatedAnimal) {
        throw new AppError('Nie udało się zaktualizować zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      
      await this.baseRepository.commitTransaction(client);
      console.log(`[ANIMAL_SERVICE] Zaktualizowano zwierzę ID: ${id}`);
      return updatedAnimal as unknown as Animal;
    } catch (error) {
      await this.baseRepository.rollbackTransaction(client);
      
      if (error instanceof AppError) throw error;
      console.error(`[ANIMAL_SERVICE] Błąd podczas aktualizacji zwierzęcia ID ${id}:`, error);
      throw new AppError('Wystąpił błąd podczas aktualizacji zwierzęcia', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Usuwanie zwierzęcia
   * @param id - ID zwierzęcia do usunięcia
   * @returns True jeśli operacja się powiodła
   * @throws AppError - W przypadku błędów lub braku zwierzęcia
   */
  async deleteAnimal(id: number): Promise<boolean> {
    const client = await this.baseRepository.beginTransaction();
    
    try {
      console.log(`[ANIMAL_SERVICE] Usuwanie zwierzęcia ID: ${id}`);
      
      // Sprawdzenie czy zwierzę istnieje
      await this.getAnimal(id);
      
      // Usuwanie zwierzęcia w transakcji
      const result = await animalRepository.delete(id);
      
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
   * @param result - Wynik z repozytorium
   * @param page - Numer strony
   * @param limit - Limit elementów na stronę
   * @returns Sformatowany wynik z paginacją
   */
  private _sanitizePaginationResult(
    result: PaginatedResult | null | undefined, 
    page: number, 
    limit: number
  ): PaginatedResult {
    if (!result) {
      return {
        animals: [],
        pagination: { 
          totalCount: 0, 
          totalPages: 1, 
          currentPage: page, 
          pageSize: limit 
        }
      };
    }
    
    result.animals = result.animals || [];
    result.pagination = result.pagination || { 
      totalCount: 0, 
      totalPages: 1, 
      currentPage: page, 
      pageSize: limit 
    };
    
    return result;
  }
}

// Inicjalizacja i eksport serwisu
export default new AnimalService();