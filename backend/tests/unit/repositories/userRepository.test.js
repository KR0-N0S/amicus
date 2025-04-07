const userRepository = require('../../../repositories/userRepository');
const db = require('../../../config/db');

// Mockowanie modułu db
jest.mock('../../../config/db', () => ({
  query: jest.fn()
}));

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    test('zwraca użytkownika gdy został znaleziony', async () => {
      // Arrange
      const userId = 1;
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };

      db.query.mockResolvedValue({
        rows: [mockUser]
      });

      // Act
      const result = await userRepository.findById(userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [userId]);
      expect(result).toEqual(mockUser);
    });

    test('zwraca undefined gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      db.query.mockResolvedValue({
        rows: []
      });

      // Act
      const result = await userRepository.findById(userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [userId]);
      expect(result).toBeUndefined();
    });
  });

  describe('findByEmail', () => {
    test('zwraca użytkownika gdy został znaleziony po email', async () => {
      // Arrange
      const email = 'user@example.com';
      const mockUser = {
        id: 1,
        email,
        first_name: 'Jan',
        last_name: 'Kowalski'
      };

      db.query.mockResolvedValue({
        rows: [mockUser]
      });

      // Act
      const result = await userRepository.findByEmail(email);

      // Assert
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', [email]);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    test('tworzy nowego użytkownika i zwraca jego dane', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'hashedpassword',
        first_name: 'Nowy',
        last_name: 'Użytkownik',
        phone: '123456789',
        street: 'Street',
        house_number: '10',
        city: 'City',
        postal_code: '00-000',
        tax_id: '1234567890'
      };

      const createdUser = {
        id: 10,
        ...userData,
        status: 'active',
        created_at: expect.any(Date),
        updated_at: expect.any(Date)
      };

      db.query.mockResolvedValue({
        rows: [createdUser]
      });

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });
  });

  describe('updateUser', () => {
    test('aktualizuje dane użytkownika', async () => {
      // Arrange
      const userId = 1;
      const userData = {
        email: 'updated@example.com',
        first_name: 'Zaktualizowane',
        last_name: 'Nazwisko',
        phone: '987654321',
        street: 'New Street',
        house_number: '20',
        city: 'New City',
        postal_code: '11-111',
        tax_id: '0987654321'
      };

      const updatedUser = {
        id: userId,
        ...userData,
        updated_at: expect.any(Date)
      };

      db.query.mockResolvedValue({
        rows: [updatedUser]
      });

      // Act
      const result = await userRepository.updateUser(userId, userData);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([
          userData.email,
          userData.first_name,
          userData.last_name,
          expect.any(Date),
          userId
        ])
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updatePassword', () => {
    test('aktualizuje hasło użytkownika', async () => {
      // Arrange
      const userId = 1;
      const password = 'newhashed-password';
      
      const updatedUser = {
        id: userId,
        password,
        updated_at: expect.any(Date)
      };

      db.query.mockResolvedValue({
        rows: [updatedUser]
      });

      // Act
      const result = await userRepository.updatePassword(userId, password);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [password, expect.any(Date), userId]
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deactivateUser', () => {
    test('zmienia status użytkownika na nieaktywny', async () => {
      // Arrange
      const userId = 1;
      
      const deactivatedUser = {
        id: userId,
        status: 'inactive',
        updated_at: expect.any(Date)
      };

      db.query.mockResolvedValue({
        rows: [deactivatedUser]
      });

      // Act
      const result = await userRepository.deactivateUser(userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [expect.any(Date), userId]
      );
      expect(result).toEqual(deactivatedUser);
    });
  });

  // Ze względu na złożoność funkcji searchUsers, testy tej funkcji
  // zostały wyłączone z tego przykładu. W praktyce należałoby przygotować
  // szczegółowe testy dla różnych scenariuszy wyszukiwania.
});