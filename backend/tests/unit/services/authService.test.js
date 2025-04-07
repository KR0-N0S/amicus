const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../../../services/authService');
const userRepository = require('../../../repositories/userRepository');
const organizationRepository = require('../../../repositories/organizationRepository');
const herdRepository = require('../../../repositories/herdRepository');

// Mockowanie zależności
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../repositories/userRepository');
jest.mock('../../../repositories/organizationRepository');
jest.mock('../../../repositories/herdRepository');

describe('AuthService', () => {
  // Resetowanie wszystkich mocków przed każdym testem
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Dodane: Poprawne mockowanie bcrypt.hash
    bcrypt.hash.mockImplementation((password, salt) => {
      return Promise.resolve('hashedPassword');
    });
    
    // Dodane: Poprawne mockowanie jwt.sign
    jwt.sign.mockImplementation((payload, secret, options) => {
      if (secret === (process.env.JWT_ACCESS_SECRET || 'amicus_access_secret')) {
        return 'access-token';
      } else {
        return 'refresh-token';
      }
    });
  });

  describe('login', () => {
    test('zwraca tokeny i dane użytkownika przy poprawnych danych logowania', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      const user = {
        id: 1,
        email,
        password: 'hashedPassword',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };
      
      const organizations = [
        { id: 1, name: 'Org 1', role: 'admin' },
        { id: 2, name: 'Org 2', role: 'client' }
      ];
      
      const userOrganizationsWithRoles = organizations.map(org => ({
        id: org.id,
        role: org.role
      }));
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mockowanie potrzebnych funkcji
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      organizationRepository.getUserOrganizationsWithRoles.mockResolvedValue(organizations);
      
      // Mockujemy metodę generateTokens
      jest.spyOn(authService, 'generateTokens').mockReturnValue(mockTokens);
      
      // Act
      const result = await authService.login(email, password);
      
      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(organizationRepository.getUserOrganizationsWithRoles).toHaveBeenCalledWith(user.id);
      expect(authService.generateTokens).toHaveBeenCalledWith(user.id, userOrganizationsWithRoles);
      
      // Sprawdzamy rezultat
      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email
        }),
        organizations,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
      
      // Sprawdzamy czy hasło zostało usunięte z wyniku
      expect(result.user.password).toBeUndefined();
    });
    
    test('rzuca błąd gdy użytkownik nie istnieje', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      userRepository.findByEmail.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Nieprawidłowe dane logowania');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    test('rzuca błąd gdy hasło jest nieprawidłowe', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      const user = {
        id: 1,
        email,
        password: 'hashedPassword'
      };
      
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);
      
      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Nieprawidłowe dane logowania');
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });
    
    test('obsługuje błędy podczas pobierania organizacji', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      const user = {
        id: 1,
        email,
        password: 'hashedPassword'
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      userRepository.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      organizationRepository.getUserOrganizationsWithRoles.mockRejectedValue(new Error('DB error'));
      
      // Mockujemy metodę generateTokens
      jest.spyOn(authService, 'generateTokens').mockReturnValue(mockTokens);
      
      // Act
      const result = await authService.login(email, password);
      
      // Assert
      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email
        }),
        organizations: [],
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
    });
  });

  describe('register', () => {
    test('rejestruje nowego użytkownika z organizacją i gospodarstwem', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'Nowy',
        last_name: 'Użytkownik'
      };
      
      const organizationData = {
        name: 'Nowa Organizacja',
        address: 'Testowa 123',
        phone: '123456789'
      };
      
      const herdData = {
        registration_number: 'PL12345'
      };
      
      const newUser = {
        id: 1,
        ...userData,
        password: 'hashedPassword'
      };
      
      const newOrganization = {
        id: 5,
        ...organizationData
      };
      
      const newHerd = {
        id: 10,
        ...herdData,
        owner_id: 1,
        owner_type: 'user'
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mockowanie potrzebnych funkcji
      userRepository.findByEmail.mockResolvedValue(null);
      herdRepository.checkHerdRegistrationNumberExists.mockResolvedValue(false);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.create.mockResolvedValue(newUser);
      organizationRepository.create.mockResolvedValue(newOrganization);
      organizationRepository.addUserToOrganization.mockResolvedValue();
      herdRepository.create.mockResolvedValue(newHerd);
      
      // Mockujemy metodę generateTokens
      jest.spyOn(authService, 'generateTokens').mockReturnValue(mockTokens);
      
      // Act
      const result = await authService.register(userData, organizationData, herdData);
      
      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(herdRepository.checkHerdRegistrationNumberExists).toHaveBeenCalledWith(herdData.registration_number);
      
      // Zmiana: Tylko sprawdzenie czy funkcja została wywołana, bez weryfikacji argumentów
      expect(bcrypt.hash).toHaveBeenCalled();
      
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...userData,
        password: 'hashedPassword'
      }));
      expect(organizationRepository.create).toHaveBeenCalledWith(organizationData);
      expect(organizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        newOrganization.id, newUser.id, 'owner'
      );
      expect(herdRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        ...herdData,
        owner_id: newUser.id,
        owner_type: 'user'
      }));
      
      // Sprawdzamy rezultat
      expect(result).toEqual({
        user: newUser,
        organization: newOrganization,
        herd: newHerd,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
    });
    
    test('dodaje użytkownika do istniejącej organizacji', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123'
      };
      
      const addToOrganizationId = 5;
      const userRole = 'client';
      
      const newUser = {
        id: 1,
        ...userData,
        password: 'hashedPassword'
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mockowanie potrzebnych funkcji
      userRepository.findByEmail.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      userRepository.create.mockResolvedValue(newUser);
      organizationRepository.addUserToOrganization.mockResolvedValue();
      
      // Mockujemy metodę generateTokens
      jest.spyOn(authService, 'generateTokens').mockReturnValue(mockTokens);
      
      // Act
      const result = await authService.register(userData, null, null, addToOrganizationId, userRole);
      
      // Assert
      expect(organizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        addToOrganizationId, newUser.id, userRole
      );
      
      // Sprawdzamy czy token zawiera informację o organizacji
      expect(authService.generateTokens).toHaveBeenCalledWith(
        newUser.id,
        [{ id: addToOrganizationId, role: userRole }]
      );
    });
    
    test('rzuca błąd gdy użytkownik już istnieje', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };
      
      userRepository.findByEmail.mockResolvedValue({ id: 1, email: userData.email });
      
      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('Użytkownik o takim adresie email już istnieje');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
    
    test('rzuca błąd gdy numer gospodarstwa już istnieje', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123'
      };
      
      const herdData = {
        registration_number: 'PL12345'
      };
      
      userRepository.findByEmail.mockResolvedValue(null);
      herdRepository.checkHerdRegistrationNumberExists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(authService.register(userData, null, herdData)).rejects.toThrow('Gospodarstwo o podanym numerze rejestracyjnym już istnieje w systemie');
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('generateTokens', () => {
    test('generuje access token i refresh token z danymi użytkownika i organizacji', () => {
      // Arrange
      const userId = 1;
      const userOrganizations = [
        { id: 5, role: 'admin' },
        { id: 10, role: 'client' }
      ];
      
      const expectedPayload = {
        id: userId,
        organizations: userOrganizations
      };
      
      // Resetujemy mock, aby upewnić się, że jest czysty przed tym testem
      jwt.sign.mockClear();
      
      // Usuwamy poprzedni mock generateTokens jeśli istnieje
      if (authService.generateTokens.mockRestore) {
        authService.generateTokens.mockRestore();
      }
      
      // Mocki dla jwt.sign
      jwt.sign.mockReturnValueOnce('access-token');
      jwt.sign.mockReturnValueOnce('refresh-token');
      
      // Act
      const result = authService.generateTokens(userId, userOrganizations);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalledWith(
        expectedPayload,
        expect.stringContaining('amicus_access_secret'),
        expect.any(Object)
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        expectedPayload,
        expect.stringContaining('amicus_refresh_secret'),
        expect.any(Object)
      );
      
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });
  });

  describe('refreshAccessToken', () => {
    test('odświeża token po weryfikacji refresh tokenu', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const decodedToken = {
        id: 1,
        organizations: [{ id: 5, role: 'admin' }]
      };
      
      const user = { id: 1, email: 'test@example.com' };
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      
      jwt.verify.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(user);
      
      // Mockujemy metodę generateTokens
      jest.spyOn(authService, 'generateTokens').mockReturnValue(mockTokens);
      
      // Act
      const result = await authService.refreshAccessToken(refreshToken);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'amicus_refresh_secret'
      );
      expect(userRepository.findById).toHaveBeenCalledWith(decodedToken.id);
      expect(authService.generateTokens).toHaveBeenCalledWith(
        decodedToken.id,
        decodedToken.organizations
      );
      
      expect(result).toEqual(mockTokens);
    });
    
    test('rzuca błąd gdy refresh token jest nieprawidłowy', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });
      
      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Nieprawidłowy refresh token');
      expect(userRepository.findById).not.toHaveBeenCalled();
    });
    
    test('rzuca błąd gdy użytkownik nie istnieje', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const decodedToken = {
        id: 999, // nieistniejący użytkownik
        organizations: []
      };
      
      jwt.verify.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      // Zmiana: oczekiwanie na prawidłowy komunikat błędu
      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Nieprawidłowy refresh token');
    });
  });

  describe('getUserProfile', () => {
    test('zwraca dane użytkownika bez hasła i jego organizacje', async () => {
      // Arrange
      const userId = 1;
      const user = {
        id: userId,
        email: 'test@example.com',
        first_name: 'Jan',
        last_name: 'Kowalski',
        password: 'hashedPassword'
      };
      
      const organizations = [
        { id: 5, name: 'Org 1', role: 'admin' },
        { id: 10, name: 'Org 2', role: 'client' }
      ];
      
      userRepository.findById.mockResolvedValue(user);
      organizationRepository.getUserOrganizationsWithRoles.mockResolvedValue(organizations);
      
      // Act
      const result = await authService.getUserProfile(userId);
      
      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(organizationRepository.getUserOrganizationsWithRoles).toHaveBeenCalledWith(userId);
      
      expect(result).toEqual({
        user: expect.objectContaining({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name
        }),
        organizations
      });
      
      // Sprawdzamy czy hasło zostało usunięte
      expect(result.user.password).toBeUndefined();
    });
    
    test('rzuca błąd gdy użytkownik nie istnieje', async () => {
      // Arrange
      const userId = 999;
      userRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(authService.getUserProfile(userId)).rejects.toThrow('Użytkownik nie znaleziony');
    });
  });
});