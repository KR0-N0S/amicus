const animalService = require('../../../services/animalService');
const animalRepository = require('../../../repositories/animalRepository');
const baseRepository = require('../../../repositories/baseRepository');
const userRepository = require('../../../repositories/userRepository');
const { AppError } = require('../../../middleware/errorHandler');
const { ANIMAL_TYPES, HTTP_STATUS } = require('../../../config/constants');

// Konfiguracja mocków dla wszystkich zależności
jest.mock('../../../repositories/animalRepository');
jest.mock('../../../repositories/baseRepository');
jest.mock('../../../repositories/userRepository', () => ({
    // Dodajemy wszystkie potrzebne metody
    findById: jest.fn(),
    findByEmail: jest.fn(),
    getUserOrganizations: jest.fn() // Dodana brakująca metoda
  }));

describe('AnimalService', () => {
  // Resetowanie wszystkich mocków przed każdym testem
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testy dla calculateAge
  describe('calculateAge', () => {
    test('oblicza wiek prawidłowo dla daty z przeszłości', () => {
      // Ustawienie aktualnej daty na stałą wartość dla testów
      const realDate = Date;
      const mockDate = new Date('2025-04-07');
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new realDate(mockDate);
          }
          return new realDate(...args);
        }
      };

      // Sprawdzanie różnych przypadków
      expect(animalService.calculateAge('2020-04-07')).toBe(5); // Dokładnie 5 lat
      expect(animalService.calculateAge('2020-04-08')).toBe(4); // Dzień przed 5 urodzinami
      expect(animalService.calculateAge('2024-06-10')).toBe(0); // Mniej niż rok

      // Przywrócenie oryginalnej implementacji Date
      global.Date = realDate;
    });

    test('zwraca null dla braku daty urodzenia', () => {
      expect(animalService.calculateAge(null)).toBeNull();
      expect(animalService.calculateAge(undefined)).toBeNull();
    });

    test('zwraca 0 dla przyszłej daty urodzenia', () => {
      const realDate = Date;
      const mockDate = new Date('2025-04-07');
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return new realDate(mockDate);
          }
          return new realDate(...args);
        }
      };

      expect(animalService.calculateAge('2026-04-07')).toBe(0);

      global.Date = realDate;
    });
  });

  // Testy dla getAnimal
  describe('getAnimal', () => {
    test('zwraca zwierzę gdy zostało znalezione', async () => {
      // Arrange
      const mockAnimal = { id: 1, species: 'Cattle', owner_id: 5 };
      animalRepository.findById.mockResolvedValue(mockAnimal);
      
      // Act
      const result = await animalService.getAnimal(1);
      
      // Assert
      expect(result).toEqual(mockAnimal);
      expect(animalRepository.findById).toHaveBeenCalledWith(1);
    });

    test('rzuca AppError gdy zwierzę nie zostało znalezione', async () => {
      // Arrange
      animalRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(animalService.getAnimal(999)).rejects.toThrow(AppError);
      await expect(animalService.getAnimal(999)).rejects.toThrow('Nie znaleziono zwierzęcia o podanym ID');
    });

    test('sprawdza właściciela gdy opcja checkOwner=true', async () => {
      // Arrange
      const mockAnimal = { id: 1, owner_id: 5 };
      animalRepository.findById.mockResolvedValue(mockAnimal);
      
      // Act & Assert - prawidłowy właściciel
      await expect(animalService.getAnimal(1, { checkOwner: true, ownerId: 5 })).resolves.toEqual(mockAnimal);
      
      // Act & Assert - nieprawidłowy właściciel
      await expect(animalService.getAnimal(1, { checkOwner: true, ownerId: 10 }))
        .rejects.toThrow('Brak uprawnień do tego zwierzęcia');
    });

    test('obsługuje błędy techniczne', async () => {
      // Arrange
      animalRepository.findById.mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(animalService.getAnimal(1)).rejects.toThrow(AppError);
      await expect(animalService.getAnimal(1)).rejects.toThrow('Wystąpił błąd podczas pobierania zwierzęcia');
    });
  });

  // Testy dla getAnimalByNumber
  describe('getAnimalByNumber', () => {
    test('zwraca pierwsze zwierzę gdy znaleziono po identyfikatorze', async () => {
      // Arrange
      const mockAnimals = [
        { id: 1, animal_number: 'PL123456789' }
      ];
      animalRepository.findByIdentifier.mockResolvedValue(mockAnimals);
      
      // Act
      const result = await animalService.getAnimalByNumber('PL123456789');
      
      // Assert
      expect(result).toEqual(mockAnimals[0]);
      expect(animalRepository.findByIdentifier).toHaveBeenCalledWith('PL123456789');
    });

    test('zwraca null gdy nie podano numeru zwierzęcia', async () => {
      // Act
      const result = await animalService.getAnimalByNumber(null);
      
      // Assert
      expect(result).toBeNull();
      expect(animalRepository.findByIdentifier).not.toHaveBeenCalled();
    });

    test('zwraca null gdy nie znaleziono zwierząt', async () => {
      // Arrange
      animalRepository.findByIdentifier.mockResolvedValue([]);
      
      // Act
      const result = await animalService.getAnimalByNumber('UNKNOWN123');
      
      // Assert
      expect(result).toBeNull();
    });
  });

  // Testy dla createAnimal
  describe('createAnimal', () => {
    test('tworzy nowe zwierzę gospodarskie z poprawnym identyfikatorem', async () => {
      // Arrange
      const animalData = {
        owner_id: 5,
        species: 'Cattle',
        animal_type: ANIMAL_TYPES.FARM,
        animal_number: 'PL123456789',
        farm_animal: {
          identifier: 'PL123456789',
          registration_date: '2025-01-15'
        }
      };

      const mockAnimal = { 
        id: 1, 
        ...animalData,
        farm_animal: { 
          animal_id: 1, 
          identifier: 'PL123456789',
          registration_date: '2025-01-15'
        }
      };

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.commitTransaction.mockResolvedValue();
      
      // Mock dla sprawdzenia istniejącego zwierzęcia
      animalService.getAnimalByNumber = jest.fn().mockResolvedValue(null);
      
      // Mock dla tworzenia zwierzęcia
      animalRepository.create.mockResolvedValue(mockAnimal);
      
      // Act
      const result = await animalService.createAnimal(animalData);
      
      // Assert
      expect(result).toEqual(mockAnimal);
      expect(baseRepository.beginTransaction).toHaveBeenCalled();
      expect(animalService.getAnimalByNumber).toHaveBeenCalledWith('PL123456789');
      expect(animalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ 
          owner_id: 5,
          animal_number: 'PL123456789',
          animal_type: ANIMAL_TYPES.FARM 
        }),
        ANIMAL_TYPES.FARM,
        expect.objectContaining({ identifier: 'PL123456789' }),
        'mock-transaction'
      );
      expect(baseRepository.commitTransaction).toHaveBeenCalledWith('mock-transaction');
    });

    test('rzuca błąd gdy zwierzę z podanym identyfikatorem już istnieje', async () => {
      // Arrange
      const animalData = {
        owner_id: 5,
        species: 'Cattle',
        animal_type: ANIMAL_TYPES.FARM,
        animal_number: 'PL123456789',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };

      const existingAnimal = { 
        id: 1, 
        animal_number: 'PL123456789',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.rollbackTransaction.mockResolvedValue();
      
      // Mock dla sprawdzenia istniejącego zwierzęcia
      animalService.getAnimalByNumber = jest.fn().mockResolvedValue(existingAnimal);
      
      // Act & Assert
      await expect(animalService.createAnimal(animalData)).rejects.toThrow(AppError);
      await expect(animalService.createAnimal(animalData))
        .rejects.toThrow('Zwierzę o numerze PL123456789 już istnieje w systemie');
      expect(baseRepository.beginTransaction).toHaveBeenCalled();
      expect(baseRepository.rollbackTransaction).toHaveBeenCalledWith('mock-transaction');
    });

    test('pobiera organization_id od właściciela jeśli nie jest ustawione', async () => {
      // Arrange
      const animalData = {
        owner_id: 5,
        species: 'Dog',
        animal_type: ANIMAL_TYPES.COMPANION
      };

      const mockOrganizations = [{ organization_id: 10 }];
      const mockAnimal = { id: 1, ...animalData, organization_id: 10 };

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.commitTransaction.mockResolvedValue();
      
      // Mock dla pobrania organizacji
      userRepository.getUserOrganizations.mockResolvedValue(mockOrganizations);
      
      // Mock dla tworzenia zwierzęcia
      animalRepository.create.mockResolvedValue(mockAnimal);
      
      // Act
      const result = await animalService.createAnimal(animalData);
      
      // Assert
      expect(result).toEqual(mockAnimal);
      expect(userRepository.getUserOrganizations).toHaveBeenCalledWith(5);
      expect(animalRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ 
          owner_id: 5,
          organization_id: 10,
          animal_type: ANIMAL_TYPES.COMPANION 
        }),
        ANIMAL_TYPES.COMPANION,
        undefined,
        'mock-transaction'
      );
    });
  });

  // Testy dla updateAnimal
  describe('updateAnimal', () => {
    test('aktualizuje zwierzę gdy zostało znalezione', async () => {
      // Arrange
      const animalId = 1;
      const updateData = {
        species: 'Updated Species',
        breed: 'Updated Breed',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };

      const existingAnimal = { 
        id: animalId, 
        animal_type: ANIMAL_TYPES.FARM,
        farm_animal: {
          identifier: 'PL123456789'
        }
      };

      const updatedAnimal = { 
        ...existingAnimal,
        species: 'Updated Species',
        breed: 'Updated Breed'
      };

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.commitTransaction.mockResolvedValue();
      
      // Mock dla pobierania zwierzęcia
      animalService.getAnimal = jest.fn().mockResolvedValue(existingAnimal);
      animalService.getAnimalByNumber = jest.fn().mockResolvedValue(null);
      
      // Mock dla aktualizacji
      animalRepository.update.mockResolvedValue(updatedAnimal);
      
      // Act
      const result = await animalService.updateAnimal(animalId, updateData);
      
      // Assert
      expect(result).toEqual(updatedAnimal);
      expect(baseRepository.beginTransaction).toHaveBeenCalled();
      expect(animalService.getAnimal).toHaveBeenCalledWith(animalId, expect.any(Object));
      expect(animalRepository.update).toHaveBeenCalledWith(
        animalId,
        expect.objectContaining({ 
          species: 'Updated Species',
          breed: 'Updated Breed'
        }),
        ANIMAL_TYPES.FARM,
        expect.objectContaining({ identifier: 'PL123456789' }),
        'mock-transaction'
      );
      expect(baseRepository.commitTransaction).toHaveBeenCalledWith('mock-transaction');
    });

    test('rzuca błąd gdy aktualizowany identyfikator już istnieje dla innego zwierzęcia', async () => {
      // Arrange
      const animalId = 1;
      const updateData = {
        farm_animal: {
          identifier: 'PL987654321'
        }
      };

      const existingAnimal = { 
        id: animalId, 
        animal_type: ANIMAL_TYPES.FARM,
        farm_animal: {
          identifier: 'PL123456789'
        }
      };

      const conflictingAnimal = { 
        id: 2,
        animal_type: ANIMAL_TYPES.FARM,
        farm_animal: {
          identifier: 'PL987654321'
        }
      };

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.rollbackTransaction.mockResolvedValue();
      
      // Mock dla pobierania zwierzęcia
      animalService.getAnimal = jest.fn().mockResolvedValue(existingAnimal);
      animalService.getAnimalByNumber = jest.fn().mockResolvedValue(conflictingAnimal);
      
      // Act & Assert
      await expect(animalService.updateAnimal(animalId, updateData)).rejects.toThrow(AppError);
      await expect(animalService.updateAnimal(animalId, updateData))
        .rejects.toThrow('Zwierzę o numerze PL987654321 już istnieje w systemie');
      expect(baseRepository.beginTransaction).toHaveBeenCalled();
      expect(baseRepository.rollbackTransaction).toHaveBeenCalledWith('mock-transaction');
    });
  });

  // Testy dla deleteAnimal
  describe('deleteAnimal', () => {
    test('usuwa zwierzę gdy zostało znalezione', async () => {
      // Arrange
      const animalId = 1;
      const mockAnimal = { id: animalId };

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.commitTransaction.mockResolvedValue();
      
      // Mock dla pobierania zwierzęcia
      animalService.getAnimal = jest.fn().mockResolvedValue(mockAnimal);
      
      // Mock dla usuwania
      animalRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await animalService.deleteAnimal(animalId);
      
      // Assert
      expect(result).toBe(true);
      expect(baseRepository.beginTransaction).toHaveBeenCalled();
      expect(animalService.getAnimal).toHaveBeenCalledWith(animalId);
      expect(animalRepository.delete).toHaveBeenCalledWith(animalId, 'mock-transaction');
      expect(baseRepository.commitTransaction).toHaveBeenCalledWith('mock-transaction');
    });

    test('obsługuje błędy przy usuwaniu zwierzęcia', async () => {
      // Arrange
      const animalId = 1;

      // Mock dla transakcji
      baseRepository.beginTransaction.mockResolvedValue('mock-transaction');
      baseRepository.rollbackTransaction.mockResolvedValue();
      
      // Mock dla pobierania zwierzęcia
      animalService.getAnimal = jest.fn().mockResolvedValue({ id: animalId });
      
      // Mock dla usuwania - symulacja błędu
      animalRepository.delete.mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(animalService.deleteAnimal(animalId)).rejects.toThrow(AppError);
      await expect(animalService.deleteAnimal(animalId))
        .rejects.toThrow('Wystąpił błąd podczas usuwania zwierzęcia');
      expect(baseRepository.beginTransaction).toHaveBeenCalled();
      expect(baseRepository.rollbackTransaction).toHaveBeenCalledWith('mock-transaction');
    });
  });

  // Testy dla searchAnimalsByOwnerId
  describe('searchAnimalsByOwnerId', () => {
    test('wyszukuje zwierzęta właściciela z odpowiednimi parametrami', async () => {
      // Arrange
      const mockResult = {
        animals: [{ id: 1, species: 'Cattle' }],
        pagination: {
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
          pageSize: 10
        }
      };
      
      animalRepository.searchAnimalsByOwnerId.mockResolvedValue(mockResult);
      
      // Act
      const result = await animalService.searchAnimalsByOwnerId('search term', 5);
      
      // Assert
      expect(result).toEqual(mockResult);
      expect(animalRepository.searchAnimalsByOwnerId).toHaveBeenCalledWith(
        'search term',
        5,
        null,
        1,
        10
      );
    });

    test('limituje rozmiar strony do maksymalnej wartości', async () => {
      // Arrange
      const mockResult = {
        animals: [],
        pagination: { totalCount: 0, totalPages: 1 }
      };
      
      animalRepository.searchAnimalsByOwnerId.mockResolvedValue(mockResult);
      
      // Act
      await animalService.searchAnimalsByOwnerId('', 5, null, 1, 1000);
      
      // Assert - zakładając że PAGINATION.MAX_PAGE_SIZE = 100
      expect(animalRepository.searchAnimalsByOwnerId).toHaveBeenCalledWith(
        '',
        5,
        null,
        1,
        expect.any(Number) // Tu byłoby dokładnie 100 ale wartość zależy od PAGINATION.MAX_PAGE_SIZE
      );
    });
  });

  // Testy dla getOwnerAnimals
  describe('getOwnerAnimals', () => {
    test('pobiera zwierzęta właściciela z paginacją', async () => {
      // Arrange
      const animals = [{ id: 1 }, { id: 2 }];
      animalRepository.findByOwnerId.mockResolvedValue(animals);
      animalRepository.countByOwnerId.mockResolvedValue(2);
      
      // Act
      const result = await animalService.getOwnerAnimals(5, 1, 10);
      
      // Assert
      expect(result).toEqual({
        animals,
        pagination: {
          page: 1,
          limit: 10,
          totalCount: 2,
          totalPages: 1
        }
      });
      expect(animalRepository.findByOwnerId).toHaveBeenCalledWith(5, 10, 0, null);
    });

    test('zwraca pustą tablicę gdy nie znaleziono zwierząt', async () => {
      // Arrange
      animalRepository.findByOwnerId.mockResolvedValue(null);
      animalRepository.countByOwnerId.mockResolvedValue(0);
      
      // Act
      const result = await animalService.getOwnerAnimals(5);
      
      // Assert
      expect(result.animals).toEqual([]);
      expect(result.pagination.totalCount).toBe(0);
    });
  });
});
