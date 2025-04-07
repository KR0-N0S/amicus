const jwt = require('jsonwebtoken');
const { verifyToken, checkOrganizationAccess } = require('../../../middleware/authMiddleware');
const userRepository = require('../../../repositories/userRepository');

// Mockowanie zależności
jest.mock('jsonwebtoken');
jest.mock('../../../repositories/userRepository');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Resetowanie mocków
    jest.clearAllMocks();

    // Przygotowanie wspólnych obiektów przed każdym testem
    req = {
      headers: {},
      params: {},
      query: {},
      body: {},
      userOrganizations: [],
      path: '/' // Dodane: Domyślna ścieżka dla wszystkich testów
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('verifyToken', () => {
    test('przepuszcza żądanie gdy token jest prawidłowy', async () => {
      // Arrange
      const token = 'valid-token';
      const decodedToken = {
        id: 1,
        organizations: [{ id: 5, role: 'admin' }]
      };

      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        first_name: 'Jan'
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(user);

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_ACCESS_SECRET || 'amicus_access_secret'
      );
      expect(userRepository.findById).toHaveBeenCalledWith(decodedToken.id);
      expect(req.userId).toBe(decodedToken.id);
      expect(req.userOrganizations).toEqual(decodedToken.organizations);
      expect(req.user).toEqual(expect.objectContaining({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        organizations: decodedToken.organizations
      }));
      expect(req.user.password).toBeUndefined(); // hasło powinno być usunięte
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('zwraca 401 gdy brak tokenu', async () => {
      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Unauthorized: Token required',
        code: 'TOKEN_REQUIRED'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('zwraca 401 gdy token wygasł', async () => {
      // Arrange
      req.headers.authorization = 'Bearer expired-token';
      
      const jwtError = new Error('Token expired');
      jwtError.name = 'TokenExpiredError';
      
      jwt.verify.mockImplementation(() => {
        throw jwtError;
      });

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Unauthorized: Token expired',
        code: 'TOKEN_EXPIRED'
      }));
    });

    test('zwraca 401 gdy token jest nieprawidłowy', async () => {
      // Arrange
      req.headers.authorization = 'Bearer invalid-token';
      
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Unauthorized: Invalid token',
        code: 'INVALID_TOKEN'
      }));
    });

    test('zwraca 401 gdy użytkownik nie istnieje', async () => {
      // Arrange
      const token = 'valid-token';
      const decodedToken = { id: 999 }; // nieistniejący użytkownik
      
      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(null);

      // Act
      await verifyToken(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Unauthorized: User not found',
        code: 'USER_NOT_FOUND'
      }));
    });
  });

  describe('checkOrganizationAccess', () => {
    test('przepuszcza żądanie gdy nie podano organizationId', async () => {
      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('przepuszcza żądanie gdy użytkownik ma dostęp do organizacji (z params)', async () => {
      // Arrange
      req.params.organizationId = '5';
      req.userOrganizations = [
        { id: 5, role: 'admin' },
        { id: 10, role: 'client' }
      ];

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.organizationId).toBe('5');
      expect(res.status).not.toHaveBeenCalled();
    });

    test('przepuszcza żądanie gdy użytkownik ma dostęp do organizacji (z query)', async () => {
      // Arrange
      req.query.organizationId = '10';
      req.userOrganizations = [
        { id: 5, role: 'admin' },
        { id: 10, role: 'client' }
      ];

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.organizationId).toBe('10');
    });

    test('przepuszcza żądanie gdy użytkownik ma dostęp do organizacji (z body)', async () => {
      // Arrange
      req.body.organizationId = 5;
      req.userOrganizations = [
        { id: 5, role: 'admin' }
      ];

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.organizationId).toBe(5);
    });

    test('zwraca 403 gdy użytkownik nie ma organizacji', async () => {
      // Arrange
      req.params.organizationId = '5';
      req.userOrganizations = [];

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Brak dostępu do tej organizacji',
        code: 'NO_ORGANIZATIONS'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    test('zwraca 403 gdy użytkownik nie ma dostępu do podanej organizacji', async () => {
      // Arrange
      req.params.organizationId = '999';
      req.userOrganizations = [
        { id: 5, role: 'admin' },
        { id: 10, role: 'client' }
      ];

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Brak dostępu do tej organizacji',
        code: 'ORGANIZATION_ACCESS_DENIED'
      }));
    });

    test('sprawdza uprawnienia dla ścieżek administracyjnych', async () => {
      // Arrange
      req.params.organizationId = '5';
      req.userOrganizations = [
        { id: 5, role: 'client' } // klient nie ma dostępu do admin
      ];
      req.path = '/admin/settings';

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Brak wymaganych uprawnień w tej organizacji',
        code: 'INSUFFICIENT_PERMISSIONS'
      }));
    });

    test('sprawdza uprawnienia dla ścieżek medycznych', async () => {
      // Arrange
      req.params.organizationId = '5';
      req.userOrganizations = [
        { id: 5, role: 'vet' } // weterynarz ma dostęp do medical
      ];
      req.path = '/medical/visit';

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('przepuszcza administratora dla wszystkich ścieżek', async () => {
      // Arrange
      req.params.organizationId = '5';
      req.userOrganizations = [
        { id: 5, role: 'admin' } // admin ma dostęp wszędzie
      ];
      // Sprawdzamy ścieżkę adminowską
      req.path = '/admin/settings';

      // Act
      await checkOrganizationAccess(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});