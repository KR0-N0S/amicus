import * as authController from '../../../controllers/authController';
import * as authService from '../../../services/authService';
import { AppError } from '../../../middleware/errorHandler';
import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../types/express'; // Importujemy istniejący typ

// Interfejs dla mocka Response
interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
}

// Interfejs dla mockowanych metod serwisu
interface AuthServiceMethods {
  register: jest.Mock;
  login: jest.Mock;
  getUserProfile: jest.Mock;
  refreshAccessToken: jest.Mock;
}

// Mockowanie serwisu autentykacji
jest.mock('../../../services/authService');
const mockedAuthService = authService as unknown as AuthServiceMethods;

describe('AuthController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: jest.Mock<ReturnType<NextFunction>>;

  beforeEach(() => {
    // Resetowanie mocków
    jest.clearAllMocks();

    // Przygotowanie wspólnych obiektów przed każdym testem
    req = {
      body: {},
      userId: 1,
      cookies: {} // Zawsze definiujemy cookies jako obiekt
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
    test('rejestruje nowego użytkownika i zwraca status 201', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };

      const organization = {
        name: 'Nowa Organizacja',
        address: 'Testowa 123'
      };

      req.body = {
        ...userData,
        organization
      };

      const mockServiceResult = {
        user: { id: 1, ...userData, password: undefined },
        organization: { id: 5, ...organization },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      mockedAuthService.register = jest.fn().mockResolvedValue(mockServiceResult);

      // Act
      await authController.register(req as RequestWithUser, res as Response, next);

      // Assert
      expect(mockedAuthService.register).toHaveBeenCalledWith(
        expect.objectContaining(userData),
        organization,
        null,
        null,
        'client'
      );

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh-token', expect.any(Object));
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

    test('nie ustawia cookie i nie zwraca tokenu gdy preserveCurrentSession=true', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123'
      };

      req.body = {
        ...userData,
        preserveCurrentSession: true
      };

      const mockServiceResult = {
        user: { id: 1, ...userData, password: undefined },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      mockedAuthService.register = jest.fn().mockResolvedValue(mockServiceResult);

      // Act
      await authController.register(req as RequestWithUser, res as Response, next);

      // Assert
      expect(res.cookie).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: expect.objectContaining({
          user: mockServiceResult.user
          // Nie powinno zawierać token
        })
      });
      expect(res.json.mock.calls[0][0].data.token).toBeUndefined();
    });

    test('przekazuje błąd do middleware następnego', async () => {
      // Arrange
      req.body = {
        email: 'existing@example.com',
        password: 'password123'
      };

      const error = new Error('Użytkownik o takim adresie email już istnieje');
      mockedAuthService.register = jest.fn().mockRejectedValue(error);

      // Act
      await authController.register(req as RequestWithUser, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('logowanie poprawne, zwraca dane użytkownika, organizacje i token', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      req.body = credentials;

      const mockServiceResult = {
        user: { id: 1, email: credentials.email },
        organizations: [{ id: 5, name: 'Test Org', role: 'admin' }],
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };

      mockedAuthService.login = jest.fn().mockResolvedValue(mockServiceResult);

      // Act
      await authController.login(req as RequestWithUser, res as Response, next);

      // Assert
      expect(mockedAuthService.login).toHaveBeenCalledWith(credentials.email, credentials.password);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh-token', expect.any(Object));
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

    test('zwraca błąd 400 gdy brakuje email lub hasła', async () => {
      // Arrange
      req.body = { email: 'test@example.com' }; // brak hasła

      // Act
      await authController.login(req as RequestWithUser, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(mockedAuthService.login).not.toHaveBeenCalled();
    });

    test('zwraca błąd 401 gdy dane logowania są niepoprawne', async () => {
      // Arrange
      req.body = {
        email: 'wrong@example.com',
        password: 'wrongPassword'
      };

      mockedAuthService.login = jest.fn().mockRejectedValue(new Error('Nieprawidłowe dane logowania'));

      // Act
      await authController.login(req as RequestWithUser, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
  });

  describe('getMe', () => {
    test('zwraca dane profilu zalogowanego użytkownika', async () => {
      // Arrange
      req.userId = 1;

      const mockProfileResult = {
        user: { id: 1, email: 'test@example.com', first_name: 'Jan' },
        organizations: [{ id: 5, name: 'Test Org', role: 'admin' }]
      };

      mockedAuthService.getUserProfile = jest.fn().mockResolvedValue(mockProfileResult);

      // Act
      await authController.getMe(req as RequestWithUser, res as Response, next);

      // Assert
      expect(mockedAuthService.getUserProfile).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          user: mockProfileResult.user,
          organizations: mockProfileResult.organizations
        }
      });
    });

    test('przekazuje błąd do middleware następnego', async () => {
      // Arrange
      req.userId = 999;
      const error = new Error('Użytkownik nie znaleziony');
      mockedAuthService.getUserProfile = jest.fn().mockRejectedValue(error);

      // Act
      await authController.getMe(req as RequestWithUser, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    test('odświeża token i zwraca nowy access token', async () => {
      // Arrange
      if (req.cookies) { // Bezpieczne sprawdzenie czy cookies istnieją
        req.cookies.refreshToken = 'valid-refresh-token';
      }

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      mockedAuthService.refreshAccessToken = jest.fn().mockResolvedValue(mockTokens);

      // Act
      await authController.refreshToken(req as RequestWithUser, res as Response, next);

      // Assert
      expect(mockedAuthService.refreshAccessToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          token: mockTokens.accessToken
        }
      });
    });

    test('zwraca błąd 401 gdy brak refresh tokenu', async () => {
      // Arrange
      if (req.cookies) {
        req.cookies.refreshToken = undefined;
      }

      // Act
      await authController.refreshToken(req as RequestWithUser, res as Response, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(mockedAuthService.refreshAccessToken).not.toHaveBeenCalled();
    });

    test('usuwa cookie i zwraca błąd 401 gdy refresh token jest nieprawidłowy', async () => {
      // Arrange
      if (req.cookies) {
        req.cookies.refreshToken = 'invalid-refresh-token';
      }
      mockedAuthService.refreshAccessToken = jest.fn().mockRejectedValue(new Error('Nieprawidłowy refresh token'));

      // Act
      await authController.refreshToken(req as RequestWithUser, res as Response, next);

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError);
      expect(next.mock.calls[0][0].statusCode).toBe(401);
    });
  });

  describe('logout', () => {
    test('usuwa refresh token cookie i zwraca potwierdzenie wylogowania', async () => {
      // Act
      await authController.logout(req as RequestWithUser, res as Response, next);

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