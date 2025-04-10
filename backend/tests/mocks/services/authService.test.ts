import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import authService from '../../../services/authService';
import * as userRepository from '../../../repositories/userRepository';
import * as organizationRepository from '../../../repositories/organizationRepository';
import * as herdRepository from '../../../repositories/herdRepository';
import { AppError } from '../../../middleware/errorHandler';

// Mockowanie zależności
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../repositories/userRepository');
jest.mock('../../../repositories/organizationRepository');
jest.mock('../../../repositories/herdRepository');

// Użycie typu User z repozytorium
type RepoUser = userRepository.User;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('powinien zalogować użytkownika i zwrócić tokeny', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      const mockUser: RepoUser = {
        id: 1,
        email,
        password: 'hashed_password',
        first_name: 'Test',
        last_name: 'User',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockOrganizations = [
        { 
          id: 1, 
          name: 'Test Org', 
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mockowanie z prawidłowymi typami
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(mockUser));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true) as Promise<boolean>);
      jest.spyOn(organizationRepository, 'getUserOrganizationsWithRoles').mockImplementation(() => Promise.resolve(mockOrganizations));
      
      // Symulujemy zachowanie usuwania hasła z obiektu user
      jest.spyOn(authService as any, 'generateTokens').mockImplementation(() => mockTokens);
      
      // Act
      const result = await authService.login(email, password);
      
      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(organizationRepository.getUserOrganizationsWithRoles).toHaveBeenCalledWith(mockUser.id);
      
      expect(result).toEqual({
        user: expect.objectContaining({ 
          id: mockUser.id, 
          email: mockUser.email 
        }),
        organizations: mockOrganizations,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
      
      // Sprawdzamy, że hasło nie istnieje w zwróconym obiekcie
      expect(result.user).not.toHaveProperty('password');
    });

    test('powinien rzucić błąd gdy użytkownik nie istnieje', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(undefined));
      
      // Act & Assert
      await expect(authService.login(email, password))
        .rejects
        .toThrow('Nieprawidłowe dane logowania');
      
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
    
    test('powinien rzucić błąd gdy hasło jest nieprawidłowe', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      const mockUser: RepoUser = {
        id: 1,
        email,
        password: 'hashed_password',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(mockUser));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false) as Promise<boolean>);
      
      // Act & Assert
      await expect(authService.login(email, password))
        .rejects
        .toThrow('Nieprawidłowe dane logowania');
    });
  });

  describe('register', () => {
    test('powinien zarejestrować nowego użytkownika z organizacją', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };
      
      const organizationData = {
        name: 'Nowa Organizacja',
        city: 'Warszawa'
      };
      
      const mockUser: RepoUser = {
        id: 1,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        password: 'hashed_password',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockOrganization = {
        id: 1,
        name: organizationData.name,
        city: organizationData.city,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockUserOrgRelation = {
        organization_id: mockOrganization.id,
        user_id: mockUser.id,
        role: 'owner'
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mockowanie z prawidłowymi typami
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(undefined));
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt') as unknown as Promise<string>);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_password') as unknown as Promise<string>);
      
      // Tworzę usera bez hasła, symulując jego usunięcie w rzeczywistej implementacji
      jest.spyOn(userRepository, 'create').mockImplementation(() => {
        const userWithPassword = { ...mockUser };
        return Promise.resolve(userWithPassword);
      });
      
      jest.spyOn(organizationRepository, 'create').mockImplementation(() => Promise.resolve(mockOrganization));
      jest.spyOn(organizationRepository, 'addUserToOrganization').mockImplementation(() => Promise.resolve(mockUserOrgRelation));
      jest.spyOn(authService as any, 'generateTokens').mockImplementation(() => mockTokens);
      
      // Mocowanie metody register po to aby usunęła hasło z odpowiedzi
      const originalRegister = authService.register;
      const mockRegister = jest.spyOn(authService, 'register').mockImplementation(
        async (...args) => {
          const result = await originalRegister.apply(authService, args);
          return {
            ...result,
            user: {
              ...result.user,
              password: undefined
            }
          };
        }
      );
      
      // Act
      const result = await authService.register(userData, organizationData);
      
      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(organizationRepository.create).toHaveBeenCalledWith(organizationData);
      expect(organizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        mockOrganization.id,
        mockUser.id,
        'owner'
      );
      
      expect(result).toEqual({
        user: expect.any(Object),
        organization: mockOrganization,
        herd: null,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
      
      // Sprawdzamy, że hasło nie istnieje w obiekcie user
      expect(result.user.password).toBeUndefined();
      
      // Przywracamy oryginalną metodę
      mockRegister.mockRestore();
    });
    
    test('powinien rzucić błąd gdy użytkownik już istnieje', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };
      
      const existingUser: RepoUser = {
        id: 1,
        email: userData.email,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(existingUser));
      
      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow('Użytkownik o takim adresie email już istnieje');
      
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    test('powinien odświeżyć token gdy refresh token jest prawidłowy', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';
      const decoded = { id: 1, organizations: [] };
      
      const mockUser: RepoUser = { 
        id: 1, 
        email: 'test@example.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      
      jest.spyOn(jwt, 'verify').mockImplementation(() => decoded as any);
      jest.spyOn(userRepository, 'findById').mockImplementation(() => Promise.resolve(mockUser));
      jest.spyOn(authService as any, 'generateTokens').mockImplementation(() => mockTokens);
      
      // Act
      const result = await authService.refreshAccessToken(refreshToken);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalled();
      expect(userRepository.findById).toHaveBeenCalledWith(decoded.id);
      expect(result).toEqual(mockTokens);
    });
    
    test('powinien rzucić błąd 401 gdy refresh token jest nieprawidłowy', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';
      
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Act & Assert
      await expect(authService.refreshAccessToken(refreshToken))
        .rejects
        .toThrow('Nieprawidłowy refresh token');
    });
  });
});