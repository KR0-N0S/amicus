const userService = require('../../../services/userService');
const userRepository = require('../../../repositories/userRepository');
const organizationRepository = require('../../../repositories/organizationRepository');
const bcrypt = require('bcryptjs');

// Mockowanie zależności
jest.mock('../../../repositories/userRepository');
jest.mock('../../../repositories/organizationRepository');
jest.mock('bcryptjs');

describe('Setup tests', () => {
  test('środowisko testowe jest poprawnie skonfigurowane', () => {
    expect(true).toBe(true);
  });
});

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Dodajemy alias dla metody update -> updateUser, aby test działał z istniejącym kodem serwisu
    userRepository.update = jest.fn();
  });

  describe('getUserProfile', () => {
    test('zwraca profil użytkownika z jego organizacjami', async () => {
      // Arrange
      const userId = 10;
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        first_name: 'Jan',
        last_name: 'Kowalski',
        phone: '123456789'
      };

      const mockOrganizations = [
        {
          id: 1,
          name: 'Organization 1',
          role: 'admin'
        },
        {
          id: 2,
          name: 'Organization 2',
          role: 'member'
        }
      ];

      userRepository.findById.mockResolvedValue(mockUser);
      organizationRepository.getUserOrganizations.mockResolvedValue(mockOrganizations);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(organizationRepository.getUserOrganizations).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        user: mockUser,
        organizations: mockOrganizations
      });
    });

    test('rzuca błąd gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserProfile(userId))
        .rejects.toThrow('Użytkownik nie znaleziony');
      expect(organizationRepository.getUserOrganizations).not.toHaveBeenCalled();
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

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        first_name: 'Stare Imię',
        last_name: 'Stare Nazwisko',
        phone: '123456789'
      };

      const updatedUser = {
        ...existingUser,
        ...userData
      };

      userRepository.findById.mockResolvedValue(existingUser);
      userRepository.update.mockResolvedValue(updatedUser); // Używamy aliasu update

      // Act
      const result = await userService.updateUserProfile(userId, userData);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalledWith(userId, userData); // Sprawdzamy alias update
      expect(result).toEqual(updatedUser);
    });

    test('rzuca błąd gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      const userData = { first_name: 'Nowe Imię' };

      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, userData))
        .rejects.toThrow('Użytkownik nie znaleziony');
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    test('zmienia hasło użytkownika gdy aktualne hasło jest poprawne', async () => {
      // Arrange
      const userId = 10;
      const currentPassword = 'password123';
      const newPassword = 'newPassword456';

      const user = {
        id: userId,
        email: 'user@example.com',
        password: 'hashedCurrentPassword'
      };

      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true); // Aktualne hasło jest poprawne
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      // Act
      const result = await userService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, user.password);
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 'salt');
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

      const user = {
        id: userId,
        email: 'user@example.com',
        password: 'hashedCurrentPassword'
      };

      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false); // Aktualne hasło jest nieprawidłowe

      // Act & Assert
      await expect(userService.changePassword(userId, currentPassword, newPassword))
        .rejects.toThrow('Aktualne hasło jest nieprawidłowe');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    test('rzuca błąd gdy użytkownik nie został znaleziony', async () => {
      // Arrange
      const userId = 999;
      const currentPassword = 'password123';
      const newPassword = 'newPassword456';

      userRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.changePassword(userId, currentPassword, newPassword))
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
          { id: 1, first_name: 'Jan', last_name: 'Kowalski' },
          { id: 2, first_name: 'Anna', last_name: 'Kowalska' }
        ],
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          pages: 1
        }
      };

      userRepository.searchUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await userService.searchUsers(searchQuery, roles, organizationId);

      // Assert
      expect(userRepository.searchUsers).toHaveBeenCalledWith(searchQuery, roles, organizationId);
      expect(result).toEqual(mockUsers);
    });

    test('rzuca błąd gdy brak ID organizacji', async () => {
      // Arrange
      const searchQuery = 'kowalski';
      const roles = ['client'];
      const organizationId = undefined;

      // Act & Assert
      await expect(userService.searchUsers(searchQuery, roles, organizationId))
        .rejects.toThrow('ID organizacji jest wymagane');
      expect(userRepository.searchUsers).not.toHaveBeenCalled();
    });
  });
});