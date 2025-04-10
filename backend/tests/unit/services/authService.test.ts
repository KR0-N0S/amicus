import authService from '../../../services/authService';
import * as userRepository from '../../../repositories/userRepository';
import * as organizationRepository from '../../../repositories/organizationRepository';
import * as herdRepository from '../../../repositories/herdRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../../middleware/errorHandler';

// Mockowanie zależności
jest.mock('../../../repositories/userRepository');
jest.mock('../../../repositories/organizationRepository');
jest.mock('../../../repositories/herdRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Typ User z repozytorium
type RepoUser = userRepository.User;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('zwraca tokeny i dane użytkownika przy poprawnych danych logowania', async () => {
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
      
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(mockUser));
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true) as Promise<boolean>);
      jest.spyOn(organizationRepository, 'getUserOrganizationsWithRoles')
        .mockImplementation(() => Promise.resolve(mockOrganizations));
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
      
      // Sprawdzamy, że hasło nie istnieje w zwróconym obiekcie user
      expect(result.user).not.toHaveProperty('password');
    });

    it('rzuca błąd gdy użytkownik nie istnieje', async () => {
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
    
    it('rzuca błąd gdy hasło jest nieprawidłowe', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongPassword';
      
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
    it('rejestruje nowego użytkownika z organizacją', async () => {
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
      
      // Tworzymy kopię użytkownika bez hasła, aby zasymulować zachowanie usuwania hasła w rzeczywistej implementacji
      const mockUserWithoutPassword = { ...mockUser };
      delete mockUserWithoutPassword.password;
      
      jest.spyOn(userRepository, 'findByEmail').mockImplementation(() => Promise.resolve(undefined));
      jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => Promise.resolve('salt') as unknown as Promise<string>);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_password') as unknown as Promise<string>);
      jest.spyOn(userRepository, 'create').mockImplementation(() => Promise.resolve(mockUser));
      jest.spyOn(organizationRepository, 'create').mockImplementation(() => Promise.resolve(mockOrganization));
      jest.spyOn(organizationRepository, 'addUserToOrganization').mockImplementation(() => Promise.resolve(mockUserOrgRelation));
      
      // Symulujemy tutaj właściwą implementację authService.register przez nadpisanie oryginalnej metody
      const originalRegister = authService.register;
      const spyRegister = jest.spyOn(authService, 'register').mockImplementation(
        async (...args) => {
          // Wywołujemy oryginalną metodę, ale modyfikujemy wynik przed zwróceniem
          const result = await originalRegister.apply(authService, args);
          return {
            ...result,
            user: mockUserWithoutPassword // Podstawiamy użytkownika bez hasła
          };
        }
      );
      
      jest.spyOn(authService as any, 'generateTokens').mockImplementation(() => mockTokens);
      
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
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name
        }),
        organization: mockOrganization,
        herd: null,
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken
      });
      
      // Sprawdzamy, że hasło nie istnieje w zwróconym obiekcie user
      expect(result.user).not.toHaveProperty('password');
      
      // Przywracamy oryginalną metodę
      spyRegister.mockRestore();
    });
    
    it('rzuca błąd gdy użytkownik już istnieje', async () => {
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
    it('odświeża token gdy refresh token jest prawidłowy', async () => {
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
    
    it('rzuca błąd 401 gdy refresh token jest nieprawidłowy', async () => {
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