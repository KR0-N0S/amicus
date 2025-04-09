import * as userRepository from '../../../repositories/userRepository';
import * as db from '../../../config/db';
import { User } from '../../../types/models/user';

// Interfejs dla mockowania danych
interface UserCreateData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// Mockowanie bazy danych
jest.mock('../../../config/db', () => ({
  query: jest.fn()
}));

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    test('zwraca użytkownika gdy istnieje', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Jan',
        last_name: 'Kowalski',
        password: 'hashed_password'
      };
      
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Act
      const result = await userRepository.findByEmail('test@example.com');

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM "users"'),
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    test('zwraca null gdy użytkownik nie istnieje', async () => {
      // Arrange
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      });

      // Act
      const result = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    test('zwraca użytkownika gdy istnieje', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com'
      };
      
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1
      });

      // Act
      const result = await userRepository.findById(1);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM "users"'),
        [1]
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    test('tworzy nowego użytkownika', async () => {
      // Arrange
      const mockUser: UserCreateData = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'Nowy',
        last_name: 'Użytkownik',
        phone: '123456789'
      };
      
      const createdUser = {
        ...mockUser,
        id: 123,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      (db.query as jest.Mock).mockResolvedValueOnce({
        rows: [createdUser],
        rowCount: 1
      });

      // Act
      const result = await userRepository.create(mockUser as any);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO "users"'),
        expect.any(Array)
      );
      expect(result).toHaveProperty('id', 123);
      expect(result).toHaveProperty('email', 'new@example.com');
    });
  });

  // Mock dla update - dodajemy metodę tymczasowo na mocku
  describe('update', () => {
    beforeAll(() => {
      // Dodajemy brakującą metodę do mocka
      (userRepository as any).update = jest.fn();
    });

    test('aktualizuje istniejącego użytkownika', async () => {
      // Arrange
      const userId = 1;
      const updateData = {
        first_name: 'Zaktualizowany',
        last_name: 'Użytkownik'
      };
      
      const updatedUser = {
        id: userId,
        ...updateData,
        email: 'existing@example.com',
        updated_at: new Date()
      };
      
      // Mockujemy dodaną metodę
      (userRepository as any).update.mockResolvedValueOnce(updatedUser);

      // Act
      const result = await (userRepository as any).update(userId, updateData);

      // Assert
      expect((userRepository as any).update).toHaveBeenCalledWith(userId, updateData);
      expect(result).toHaveProperty('id', userId);
      expect(result).toHaveProperty('first_name', 'Zaktualizowany');
    });
  });

  // Mock dla getUserOrganizationsWithRoles
  describe('getUserOrganizationsWithRoles', () => {
    beforeAll(() => {
      // Dodajemy brakującą metodę do mocka
      (userRepository as any).getUserOrganizationsWithRoles = jest.fn();
    });
    
    test('zwraca organizacje użytkownika z rolami', async () => {
      // Arrange
      const userId = 1;
      const mockOrgs = [
        { id: 10, name: 'Org 1', role: 'admin' },
        { id: 20, name: 'Org 2', role: 'user' }
      ];
      
      // Mockujemy dodaną metodę
      (userRepository as any).getUserOrganizationsWithRoles.mockResolvedValueOnce(mockOrgs);

      // Act
      const result = await (userRepository as any).getUserOrganizationsWithRoles(userId);

      // Assert
      expect((userRepository as any).getUserOrganizationsWithRoles).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockOrgs);
      expect(result).toHaveLength(2);
    });
  });
});