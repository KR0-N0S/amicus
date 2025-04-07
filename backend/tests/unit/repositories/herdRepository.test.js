const herdRepository = require('../../../repositories/herdRepository');
const db = require('../../../config/db');

// Mockowanie modułu db
jest.mock('../../../config/db', () => ({
  query: jest.fn()
}));

describe('HerdRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('tworzy nowe stado i zwraca jego dane', async () => {
      // Arrange
      const herdData = {
        name: 'Test Herd',
        registration_number: 'PL12345',
        evaluation_number: 'EVAL123',
        owner_type: 'user',
        owner_id: 10,
        street: 'Herd Street',
        house_number: '5',
        city: 'Herd City',
        postal_code: '00-000'
      };

      const createdHerd = {
        id: 1,
        herd_id: 'PL12345',
        eval_herd_no: 'EVAL123',
        owner_type: 'user',
        owner_id: 10,
        street: 'Herd Street',
        house_number: '5',
        city: 'Herd City',
        postal_code: '00-000'
      };

      db.query.mockResolvedValue({
        rows: [createdHerd]
      });

      // Act
      const result = await herdRepository.create(herdData);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO herds'),
        [
          herdData.registration_number,
          herdData.owner_type,
          herdData.owner_id,
          herdData.street,
          herdData.house_number,
          herdData.city,
          herdData.postal_code,
          herdData.evaluation_number
        ]
      );
      expect(result).toEqual(createdHerd);
    });

    test('obsługuje błędy podczas tworzenia stada', async () => {
      // Arrange
      const herdData = {
        registration_number: 'PL12345',
        owner_type: 'user',
        owner_id: 10
      };

      const error = new Error('Database error');
      db.query.mockRejectedValue(error);

      // Act & Assert
      await expect(herdRepository.create(herdData)).rejects.toThrow('Database error');
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('getByOwnerId', () => {
    test('zwraca stada należące do właściciela', async () => {
      // Arrange
      const ownerId = 10;
      const ownerType = 'user';
      const mockHerds = [
        {
          id: 1,
          herd_id: 'PL12345',
          owner_id: ownerId,
          owner_type: ownerType
        },
        {
          id: 2,
          herd_id: 'PL67890',
          owner_id: ownerId,
          owner_type: ownerType
        }
      ];

      db.query.mockResolvedValue({
        rows: mockHerds
      });

      // Act
      const result = await herdRepository.getByOwnerId(ownerId, ownerType);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM herds'),
        [ownerId, ownerType]
      );
      expect(result).toEqual(mockHerds);
    });

    test('zwraca pustą tablicę gdy właściciel nie ma stad', async () => {
      // Arrange
      const ownerId = 10;
      const ownerType = 'user';

      db.query.mockResolvedValue({
        rows: []
      });

      // Act
      const result = await herdRepository.getByOwnerId(ownerId, ownerType);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM herds'),
        [ownerId, ownerType]
      );
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('zwraca stado gdy zostało znalezione', async () => {
      // Arrange
      const herdId = 1;
      const mockHerd = {
        id: herdId,
        herd_id: 'PL12345',
        owner_id: 10,
        owner_type: 'user'
      };

      db.query.mockResolvedValue({
        rows: [mockHerd]
      });

      // Act
      const result = await herdRepository.getById(herdId);

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM herds WHERE id = $1', [herdId]);
      expect(result).toEqual(mockHerd);
    });

    test('zwraca null gdy stado nie zostało znalezione', async () => {
      // Arrange
      const herdId = 999;
      db.query.mockResolvedValue({
        rows: []
      });

      // Act
      const result = await herdRepository.getById(herdId);

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM herds WHERE id = $1', [herdId]);
      expect(result).toBeNull();
    });
  });

  describe('checkHerdRegistrationNumberExists', () => {
    test('zwraca true gdy numer rejestracyjny istnieje', async () => {
      // Arrange
      const registrationNumber = 'PL12345';
      db.query.mockResolvedValue({
        rows: [{ exists: true }]
      });

      // Act
      const result = await herdRepository.checkHerdRegistrationNumberExists(registrationNumber);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'SELECT EXISTS(SELECT 1 FROM herds WHERE herd_id = $1)',
        [registrationNumber]
      );
      expect(result).toBe(true);
    });

    test('zwraca false gdy numer rejestracyjny nie istnieje', async () => {
      // Arrange
      const registrationNumber = 'PL99999';
      db.query.mockResolvedValue({
        rows: [{ exists: false }]
      });

      // Act
      const result = await herdRepository.checkHerdRegistrationNumberExists(registrationNumber);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'SELECT EXISTS(SELECT 1 FROM herds WHERE herd_id = $1)',
        [registrationNumber]
      );
      expect(result).toBe(false);
    });
  });
});