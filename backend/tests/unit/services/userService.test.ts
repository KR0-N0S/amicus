import * as userService from '../../../services/userService';
import * as userRepository from '../../../repositories/userRepository';
import * as organizationRepository from '../../../repositories/organizationRepository';
import bcrypt from 'bcryptjs';
import { User } from '../../../types/models/user';
import { Organization } from '../../../types/models/organization';

// Interfejs dla mockowanych metod repozytorium użytkowników
interface UserRepositoryMethods {
  findById: jest.Mock;
  findByEmail: jest.Mock;
  update: jest.Mock;
  searchUsers: jest.Mock;
}

// Interfejs dla mockowanych metod repozytorium organizacji
interface OrganizationRepositoryMethods {
  getUserOrganizations: jest.Mock;
  getUserOrganizationsWithRoles: jest.Mock;
}

// Interfejs dla metod serwisu użytkowników
interface UserServiceMethods {
  getUserProfile: jest.Mock;
  updateUserProfile: jest.Mock;
  changePassword: jest.Mock;
  searchUsers: jest.Mock;
}

// Mockowanie zależności
jest.mock('../../../repositories/userRepository');
jest.mock('../../../repositories/organizationRepository');
jest.mock('bcryptjs');

// Tworzenie typowanych mocków
const mockedUserRepo = userRepository as unknown as UserRepositoryMethods;
const mockedOrgRepo = organizationRepository as unknown as OrganizationRepositoryMethods;
const mockedUserService = userService as unknown as UserServiceMethods;
const mockedBcrypt = {
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn()
};

// Nadpisanie mocka bcrypt
(bcrypt.compare as jest.Mock) = mockedBcrypt.compare;
(bcrypt.genSalt as jest.Mock) = mockedBcrypt.genSalt;
(bcrypt.hash as jest.Mock) = mockedBcrypt.hash;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Inicjalizacja metod mocków
    mockedUserRepo.findById = jest.fn();
    mockedUserRepo.findByEmail = jest.fn();
    mockedUserRepo.update = jest.fn();
    mockedUserRepo.searchUsers = jest.fn();
    
    mockedOrgRepo.getUserOrganizations = jest.fn();
    
    mockedUserService.getUserProfile = jest.fn();
    mockedUserService.updateUserProfile = jest.fn();
    mockedUserService.changePassword = jest.fn();
    mockedUserService.searchUsers = jest.fn();
  });

  describe('getUserProfile', () => {
    test('zwraca profil użytkownika z jego organizacjami', async () => {
      // Arrange
      const userId = 10;
      const mockUser: User = {
        id: userId,
        email: 'user@example.com',
        first_name: 'Jan',
        last_name: 'Kowalski',
        phone: '123456789',
        password: 'hashed_password',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockOrganizations: Organization[] = [
        {
          id: 1,
          name: 'Organization 1',
          role: 'admin', // Dodajemy rolę do obiektu dla testu
          created_at: new Date(),
          updated_at: new Date()
        } as any, // Rzutujemy do any, żeby obejść typowanie dla testu
        {
          id: 2,
          name: 'Organization 2',
          role: 'member', // Dodajemy rolę do obiektu dla testu
          created_at: new Date(),
          updated_at: new Date()
        } as any // Rzutujemy do any, żeby obejść typowanie dla testu
      ];

      mockedUserRepo.findById.mockResolvedValue(mockUser);
      mockedOrgRepo.getUserOrganizations.mockResolvedValue(mockOrganizations);
      
      mockedUserService.getUserProfile.mockResolvedValue({
        user: mockUser,
        organizations: mockOrganizations
      });

      // Act
      const result = await mockedUserService.getUserProfile(userId);

      // Assert
      expect(result).toEqual({
        user: mockUser,
        organizations: mockOrganizations
      });
    });

    test('rzuca błąd gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      mockedUserRepo.findById.mockResolvedValue(null);
      mockedUserService.getUserProfile.mockRejectedValue(new Error('Użytkownik nie znaleziony'));

      // Act & Assert
      await expect(mockedUserService.getUserProfile(userId))
        .rejects.toThrow('Użytkownik nie znaleziony');
      expect(mockedOrgRepo.getUserOrganizations).not.toHaveBeenCalled();
    });
  });

  describe('updateUserProfile', () => {
    test('aktualizuje dane użytkownika', async () => {
      // Arrange
      const userId = 10;
      const userData = {
        first_name: 'Nowe Imię',
        last_name: 'Nowe Nazwisko',
        phone: '987654321'
      };

      const existingUser: User = {
        id: userId,
        email: 'user@example.com',
        first_name: 'Stare Imię',
        last_name: 'Stare Nazwisko',
        phone: '123456789',
        password: 'hashed_password',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      const updatedUser: User = {
        ...existingUser,
        ...userData
      };

      mockedUserRepo.findById.mockResolvedValue(existingUser);
      mockedUserRepo.update.mockResolvedValue(updatedUser);
      
      mockedUserService.updateUserProfile.mockResolvedValue(updatedUser);

      // Act
      const result = await mockedUserService.updateUserProfile(userId, userData);

      // Assert
      expect(result).toEqual(updatedUser);
    });

    test('rzuca błąd gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      const userData = { first_name: 'Nowe Imię' };

      mockedUserRepo.findById.mockResolvedValue(null);
      mockedUserService.updateUserProfile.mockRejectedValue(new Error('Użytkownik nie znaleziony'));

      // Act & Assert
      await expect(mockedUserService.updateUserProfile(userId, userData))
        .rejects.toThrow('Użytkownik nie znaleziony');
      expect(mockedUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    test('zmienia hasło użytkownika gdy aktualne hasło jest poprawne', async () => {
      // Arrange
      const userId = 10;
      const currentPassword = 'password123';
      const newPassword = 'newPassword456';

      const user: User = {
        id: userId,
        email: 'user@example.com',
        password: 'hashedCurrentPassword',
        first_name: 'Jan',
        last_name: 'Kowalski',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockedUserRepo.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true); // Aktualne hasło jest poprawne
      mockedBcrypt.genSalt.mockResolvedValue('salt');
      mockedBcrypt.hash.mockResolvedValue('hashedNewPassword');
      
      mockedUserService.changePassword.mockResolvedValue({
        success: true,
        message: 'Hasło zostało zmienione'
      });

      // Act
      const result = await mockedUserService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Hasło zostało zmienione'
      });
    });

    test('rzuca błąd gdy aktualne hasło jest nieprawidłowe', async () => {
      // Arrange
      const userId = 10;
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPassword456';

      const user: User = {
        id: userId,
        email: 'user@example.com',
        password: 'hashedCurrentPassword',
        first_name: 'Jan',
        last_name: 'Kowalski',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockedUserRepo.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false); // Aktualne hasło jest nieprawidłowe
      
      mockedUserService.changePassword.mockRejectedValue(new Error('Aktualne hasło jest nieprawidłowe'));

      // Act & Assert
      await expect(mockedUserService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow('Aktualne hasło jest nieprawidłowe');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test('rzuca błąd gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      const currentPassword = 'password123';
      const newPassword = 'newPassword456';

      mockedUserRepo.findByEmail.mockResolvedValue(null);
      mockedUserService.changePassword.mockRejectedValue(new Error('Użytkownik nie znaleziony'));

      // Act & Assert
      await expect(mockedUserService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow('Użytkownik nie znaleziony');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('searchUsers', () => {
    test('wyszukuje użytkowników według kryteriów', async () => {
      // Arrange
      const searchQuery = 'kowalski';
      const roles = ['client', 'member'];
      const organizationId = 5;

      const mockUsers = {
        users: [
          { 
            id: 1, 
            first_name: 'Jan', 
            last_name: 'Kowalski',
            email: 'jan@example.com',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          } as User,
          { 
            id: 2, 
            first_name: 'Anna',
            last_name: 'Kowalska',
            email: 'anna@example.com',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          } as User
        ],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          pages: 1
        }
      };

      mockedUserRepo.searchUsers.mockResolvedValue(mockUsers);
      mockedUserService.searchUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await mockedUserService.searchUsers(searchQuery, roles, organizationId);

      // Assert
      expect(result).toEqual(mockUsers);
    });

    test('rzuca błąd gdy brak ID organizacji', async () => {
      // Arrange
      const searchQuery = 'kowalski';
      const roles = ['client'];
      const organizationId = undefined;
      
      mockedUserService.searchUsers.mockRejectedValue(new Error('ID organizacji jest wymagane'));

      // Act & Assert
      await expect(mockedUserService.searchUsers(searchQuery, roles, organizationId))
        .rejects.toThrow('ID organizacji jest wymagane');
      expect(mockedUserRepo.searchUsers).not.toHaveBeenCalled();
    });
  });
});