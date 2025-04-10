import * as authController from '../../../controllers/authController';
import authService from '../../../services/authService';
import * as userRepository from '../../../repositories/userRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Response } from 'express';
import { RequestWithUser } from '../../../types/express';

// Mockowanie zależności
jest.mock('../../../services/authService');
jest.mock('../../../repositories/userRepository');

describe('AuthController', () => {
  let req: Partial<RequestWithUser>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      userId: 1,
      cookies: {
        refreshToken: undefined
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('register', () => {
    it('rejestruje użytkownika, ustawia cookie i zwraca odpowiedź 201', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };

      const organization = {
        name: 'Nowa Organizacja'
      };

      req.body = { ...userData, organization };

      const mockServiceResult = {
        user: {
          id: 1,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active'
        },
        organization: { 
          id: 5, 
          name: organization.name,
          created_at: new Date(),
          updated_at: new Date()
        },
        herd: null,
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockServiceResult);

      // Act
      await authController.register(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining(userData),
        organization,
        null,
        null,
        'client'
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        expect.any(Object)
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          user: mockServiceResult.user,
          organization: mockServiceResult.organization,
          token: mockServiceResult.accessToken
        })
      });
    });

    it('nie ustawia cookie i nie zwraca tokenu gdy preserveCurrentSession=true', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      req.body = { ...userData, preserveCurrentSession: true };

      const mockServiceResult = {
        user: {
          id: 1,
          email: userData.email,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        organization: null,
        herd: null,
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockServiceResult);

      // Act
      await authController.register(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          user: mockServiceResult.user
        })
      });
      // Sprawdzamy, że token nie jest zwracany
      const responseData = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(responseData.token).toBeUndefined();
    });

    it('przekazuje błąd do middleware next gdy wystąpi wyjątek', async () => {
      // Arrange
      req.body = {
        email: 'existing@example.com',
        password: 'Password123!'
      };

      const error = new AppError('Użytkownik o takim adresie email już istnieje', 400);
      jest.spyOn(authService, 'register').mockRejectedValue(error);

      // Act
      await authController.register(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('loguje użytkownika i zwraca dane z tokenem', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      req.body = credentials;

      const mockServiceResult = {
        user: { 
          id: 1, 
          email: credentials.email,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date()
        },
        organizations: [
          { 
            id: 5, 
            name: 'Test Org', 
            role: 'admin',
            created_at: new Date(), 
            updated_at: new Date() 
          }
        ],
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      jest.spyOn(authService, 'login').mockResolvedValue(mockServiceResult);

      // Act
      await authController.login(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(authService.login).toHaveBeenCalledWith(credentials.email, credentials.password);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'test-refresh-token',
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: mockServiceResult.user,
          organizations: mockServiceResult.organizations,
          token: mockServiceResult.accessToken
        }
      });
    });

    it('zwraca błąd 400 gdy brakuje email lub hasła', async () => {
      // Arrange
      req.body = { email: 'test@example.com' }; // brak hasła

      // Act
      await authController.login(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('odświeża token i zwraca nowy access token', async () => {
      // Arrange
      req.cookies = { refreshToken: 'valid-refresh-token' };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      jest.spyOn(authService, 'refreshAccessToken').mockResolvedValue(mockTokens);

      // Act
      await authController.refreshToken(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          token: mockTokens.accessToken
        }
      });
    });

    it('zwraca błąd 401 gdy brak refresh tokenu', async () => {
      // Arrange
      req.cookies = {}; // Brak tokenu

      // Act
      await authController.refreshToken(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(authService.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('usuwa refresh token cookie i zwraca potwierdzenie wylogowania', async () => {
      // Act
      await authController.logout(
        req as RequestWithUser,
        res as Response,
        next
      );

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Wylogowano pomyślnie'
      });
    });
  });
});