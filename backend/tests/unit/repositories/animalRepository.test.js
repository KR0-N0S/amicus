const animalRepository = require('../../../repositories/animalRepository');
const db = require('../../../config/db');

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
      
      db.query.mockResolvedValue({
        rows: [mockAnimal]
      });

      // Act
      const result = await animalRepository.findById(1);

      // Assert
      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.species).toBe('Cattle');
      expect(result.farm_animal).toBeDefined();
      expect(result.farm_animal.identifier).toBe('PL123456789');
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query.mock.calls[0][1]).toEqual([1]); // Sprawdza czy ID zostało prawidłowo przekazane
    });

    it('should return null when animal is not found', async () => {
      // Arrange
      db.query.mockResolvedValue({
        rows: []
      });

      // Act
      const result = await animalRepository.findById(999);

      // Assert
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it('should return null when query throws error', async () => {
      // Arrange
      db.query.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await animalRepository.findById(1);

      // Assert
      expect(result).toBeNull();
      expect(db.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('_mapAnimal', () => {
    it('should return null for null input', () => {
      const result = animalRepository._mapAnimal(null);
      expect(result).toBeNull();
    });

    it('should correctly map farm animal', () => {
      // Arrange
      const mockRow = {
        id: 1,
        species: 'Cattle',
        animal_type: 'farm',
        birth_date: '2020-01-01',
        animal_details: {
          identifier: 'PL123456789',
          registration_date: '2020-01-15',
          origin: 'Import',
          additional_id: 'ADD123'
        }
      };

      // Act
      const result = animalRepository._mapAnimal(mockRow);

      // Assert
      expect(result).not.toBeNull();
      expect(result.id).toBe(1);
      expect(result.farm_animal).toBeDefined();
      expect(result.farm_animal.identifier).toBe('PL123456789');
      expect(result.animal_number).toBe('PL123456789');
      expect(result.animal_details).toBeUndefined();
    });

    it('should correctly map companion animal', () => {
      // Arrange
      const mockRow = {
        id: 2,
        species: 'Dog',
        animal_type: 'companion',
        birth_date: '2019-05-10',
        animal_details: {
          chip_number: '123456789012345',
          sterilized: true,
          passport_number: 'PASS123',
          special_needs: 'Allergy to grain'
        }
      };

      // Act
      const result = animalRepository._mapAnimal(mockRow);

      // Assert
      expect(result).not.toBeNull();
      expect(result.id).toBe(2);
      expect(result.companion_animal).toBeDefined();
      expect(result.companion_animal.chip_number).toBe('123456789012345');
      expect(result.animal_details).toBeUndefined();
    });

    it('should calculate age correctly', () => {
      // Arrange
      const today = new Date();
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(today.getFullYear() - 2);
      
      const mockRow = {
        id: 3,
        species: 'Cat',
        animal_type: 'companion',
        birth_date: twoYearsAgo.toISOString().split('T')[0]
      };

      // Act
      const result = animalRepository._mapAnimal(mockRow);

      // Assert
      expect(result.age).toBe(2);
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
        birth_date: '2020-01-01'
      };
      
      const specificData = {
        identifier: 'PL123456789',
        additional_id: 'ADD123',
        registration_date: '2020-01-15',
        origin: 'Import'
      };

      // Mock queries
      db.query.mockImplementation((sql, params) => {
        if (sql.includes('INSERT INTO animals')) {
          return {
            rows: [{
              id: 1,
              ...animalData,
              animal_type: 'farm'
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
      });

      // Act
      const result = await animalRepository.create(animalData, 'farm', specificData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.animal_type).toBe('farm');
      expect(result.farm_animal).toBeDefined();
      expect(result.farm_animal.identifier).toBe('PL123456789');
      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO farm_animals'), expect.any(Array));
    });

    it('should throw error when missing required data', async () => {
      // Arrange & Act & Assert
      await expect(animalRepository.create(null, 'farm', {}))
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
      
      db.query.mockImplementation((sql, params) => {
        if (sql.includes('UPDATE animals')) {
          return {
            rows: [{
              id: animalId,
              ...updateData,
              animal_type: 'farm'
            }]
          };
        }
        if (sql.includes('SELECT * FROM animals')) {
          return {
            rows: [{
              id: animalId,
              animal_type: 'farm'
            }]
          };
        }
        if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('SELECT id FROM farm_animals')) {
          return { rows: [] };
        }
      });

      // Mocking findById to return complete animal object
      const mockAnimal = {
        id: animalId,
        species: 'Updated Species',
        breed: 'Updated Breed',
        animal_type: 'farm'
      };
      jest.spyOn(animalRepository, 'findById').mockResolvedValue(mockAnimal);

      // Act
      const result = await animalRepository.update(animalId, updateData, 'farm', {});

      // Assert
      expect(result).toEqual(mockAnimal);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE animals'),
        expect.arrayContaining([updateData.species, updateData.breed, animalId])
      );
    });
  });

  describe('delete', () => {
    it('should delete animal and return true when successful', async () => {
      // Arrange
      db.query.mockImplementation((sql, params) => {
        if (sql.includes('DELETE FROM animals')) {
          return { rows: [{ id: 1 }] };
        }
        return { rows: [] };
      });

      // Act
      const result = await animalRepository.delete(1);

      // Assert
      expect(result).toBe(true);
      expect(db.query).toHaveBeenCalledWith('DELETE FROM farm_animals WHERE animal_id = $1', [1]);
      expect(db.query).toHaveBeenCalledWith('DELETE FROM companion_animals WHERE animal_id = $1', [1]);
      expect(db.query).toHaveBeenCalledWith('DELETE FROM animals WHERE id = $1 RETURNING id', [1]);
    });

    it('should return false when animal not found', async () => {
      // Arrange
      db.query.mockImplementation((sql, params) => {
        return { rows: [] };
      });

      // Act
      const result = await animalRepository.delete(999);

      // Assert
      expect(result).toBe(false);
    });
  });
});
