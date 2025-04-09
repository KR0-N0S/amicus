import * as animalRepository from '../../../repositories/animalRepository';
import * as db from '../../../config/db';
import { Animal, AnimalType } from '../../../types/models/animal';

// Definiujemy interfejs dla metod repozytorium
interface AnimalRepositoryInterface {
  findById(id: number): Promise<Animal | null>;
  create(animalData: any, animalType: string, specificData: any): Promise<Animal | null>;
  update(id: number, animalData: any, animalType?: string, specificData?: any): Promise<Animal | null>;
  delete(id: number): Promise<boolean>;
  _mapAnimal(row: any): Animal | null;
}

// Rozszerzamy interfejs Animal dla testów
interface AnimalExtended extends Animal {
  age?: number;  // Dodajemy właściwość age, która może być dynamiczną właściwością w wynikach z repozytorium
}

// Rzutowanie typu dla repozytorium
const typedAnimalRepo = animalRepository as unknown as AnimalRepositoryInterface;

// Mock modułu db
jest.mock('../../../config/db', () => ({
  query: jest.fn()
}));

describe('AnimalRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return animal when found', async () => {
      // Arrange
      const mockAnimal = {
        id: 1,
        owner_id: 5,
        species: 'Cattle',
        animal_type: 'farm',
        breed: 'Holstein',
        birth_date: '2020-05-15',
        animal_details: {
          id: 1,
          identifier: 'PL123456789',
          additional_id: 'ADD123',
          registration_date: '2020-05-20',
          origin: 'Import'
        }
      };
      
      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockAnimal]
      });

      // Act
      const result = await typedAnimalRepo.findById(1);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.species).toBe('Cattle');
      expect(result!.farm_animal).toBeDefined();
      expect(result!.farm_animal!.identifier).toBe('PL123456789');
      expect(db.query).toHaveBeenCalledTimes(1);
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1]); // Sprawdza czy ID zostało prawidłowo przekazane
    });

    it('should return null when animal is not found', async () => {
      // Arrange
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Act
      const result = await typedAnimalRepo.findById(999);

      // Assert
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should return null when query throws error', async () => {
      // Arrange
      (db.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await typedAnimalRepo.findById(1);

      // Assert
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('_mapAnimal', () => {
    it('should return null for null input', () => {
      const result = typedAnimalRepo._mapAnimal(null);
      expect(result).toBeNull();
    });

    it('should correctly map farm animal', () => {
      // Arrange
      const mockRow = {
        id: 1,
        species: 'Cattle',
        animal_type: AnimalType.FARM,
        birth_date: '2020-01-01',
        owner_id: 5,
        created_at: new Date(),
        updated_at: new Date(),
        animal_details: {
          identifier: 'PL123456789',
          registration_date: '2020-01-15',
          origin: 'Import',
          additional_id: 'ADD123'
        }
      };

      // Act
      const result = typedAnimalRepo._mapAnimal(mockRow);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.farm_animal).toBeDefined();
      expect(result!.farm_animal!.identifier).toBe('PL123456789');
      expect(result!.animal_number).toBe('PL123456789');
      expect((result as any).animal_details).toBeUndefined();
    });

    it('should correctly map companion animal', () => {
      // Arrange
      const mockRow = {
        id: 2,
        species: 'Dog',
        animal_type: AnimalType.COMPANION,
        birth_date: '2019-05-10',
        owner_id: 5,
        created_at: new Date(),
        updated_at: new Date(),
        animal_details: {
          chip_number: '123456789012345',
          sterilized: true,
          passport_number: 'PASS123',
          special_needs: 'Allergy to grain'
        }
      };

      // Act
      const result = typedAnimalRepo._mapAnimal(mockRow);

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(2);
      expect(result!.companion_animal).toBeDefined();
      expect(result!.companion_animal!.microchip_number).toBe('123456789012345');
      expect((result as any).animal_details).toBeUndefined();
    });

    it('should calculate age correctly', () => {
      // Arrange
      const today = new Date();
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(today.getFullYear() - 2);
      
      const mockRow = {
        id: 3,
        species: 'Cat',
        animal_type: AnimalType.COMPANION,
        birth_date: twoYearsAgo.toISOString().split('T')[0],
        owner_id: 5,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Act
      const result = typedAnimalRepo._mapAnimal(mockRow);

      // Assert
      // Używamy rzutowania, ponieważ age jest dynamicznie obliczane, a nie częścią interfejsu
      expect((result as AnimalExtended)!.age).toBe(2);
    });
  });

  describe('create', () => {
    it('should create farm animal successfully', async () => {
      // Arrange
      const animalData = {
        owner_id: 5,
        species: 'Cattle',
        sex: 'M',
        breed: 'Holstein',
        birth_date: '2020-01-01',
        animal_type: AnimalType.FARM
      };
      
      const specificData = {
        identifier: 'PL123456789',
        additional_id: 'ADD123',
        registration_date: '2020-01-15',
        origin: 'Import'
      };

      // Mock queries
      (db.query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('INSERT INTO animals')) {
          return {
            rows: [{
              id: 1,
              ...animalData
            }]
          };
        }
        if (sql.includes('INSERT INTO farm_animals')) {
          return {
            rows: [{
              animal_id: 1,
              ...specificData
            }]
          };
        }
        if (sql.includes('BEGIN') || sql.includes('COMMIT')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      // Act
      const result = await typedAnimalRepo.create(animalData, 'farm', specificData);

      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.animal_type).toBe(AnimalType.FARM);
      expect(result!.farm_animal).toBeDefined();
      expect(result!.farm_animal!.identifier).toBe('PL123456789');
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO farm_animals'), expect.any(Array));
    });

    it('should throw error when missing required data', async () => {
      // Arrange & Act & Assert
      await expect(typedAnimalRepo.create(null as any, 'farm', {}))
        .rejects
        .toThrow('Missing required data for animal creation');
    });
  });

  describe('update', () => {
    it('should update animal data correctly', async () => {
      // Arrange
      const animalId = 1;
      const updateData = {
        species: 'Updated Species',
        breed: 'Updated Breed'
      };
      
      (db.query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('UPDATE animals')) {
          return {
            rows: [{
              id: animalId,
              ...updateData,
              animal_type: AnimalType.FARM
            }]
          };
        }
        if (sql.includes('SELECT * FROM animals')) {
          return {
            rows: [{
              id: animalId,
              animal_type: AnimalType.FARM
            }]
          };
        }
        if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('SELECT id FROM farm_animals')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

      // Mocking findById to return complete animal object
      const mockAnimal = {
        id: animalId,
        species: 'Updated Species',
        breed: 'Updated Breed',
        animal_type: AnimalType.FARM,
        owner_id: 5,
        created_at: new Date(),
        updated_at: new Date()
      } as Animal;
      
      // Zachowujemy oryginalne metody
      const originalFindById = typedAnimalRepo.findById;
      
      // Mockujemy tymczasowo na potrzeby testu
      (typedAnimalRepo.findById as jest.Mock) = jest.fn().mockResolvedValue(mockAnimal);

      // Act
      const result = await typedAnimalRepo.update(animalId, updateData, 'farm', {});

      // Assert
      expect(result).toEqual(mockAnimal);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE animals'),
        expect.arrayContaining([updateData.species, updateData.breed, animalId])
      );

      // Przywracamy oryginalną metodę
      typedAnimalRepo.findById = originalFindById;
    });
  });

  describe('delete', () => {
    it('should delete animal and return true when successful', async () => {
      // Arrange
      (db.query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        if (sql.includes('DELETE FROM animals')) {
          return { rows: [{ id: 1 }] };
        }
        return { rows: [] };
      });

      // Act
      const result = await typedAnimalRepo.delete(1);

      // Assert
      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith('DELETE FROM farm_animals WHERE animal_id = $1', [1]);
      expect(db.query).toHaveBeenCalledWith('DELETE FROM companion_animals WHERE animal_id = $1', [1]);
      expect(db.query).toHaveBeenCalledWith('DELETE FROM animals WHERE id = $1 RETURNING id', [1]);
    });

    it('should return false when animal not found', async () => {
      // Arrange
      (db.query as jest.Mock).mockImplementation((sql: string, params: any[]) => {
        return { rows: [] };
      });

      // Act
      const result = await typedAnimalRepo.delete(999);

      // Assert
      expect(result).toBe(false);
    });
  });
});