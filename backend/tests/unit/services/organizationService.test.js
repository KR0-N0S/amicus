const organizationService = require('../../../services/organizationService');
const organizationRepository = require('../../../repositories/organizationRepository');
const { AppError } = require('../../../middleware/errorHandler');

// Mockowanie zależności
jest.mock('../../../repositories/organizationRepository');

describe('Setup tests', () => {
  test('środowisko testowe jest poprawnie skonfigurowane', () => {
    expect(true).toBe(true);
  });
});

describe('OrganizationService', () => {
  // Resetowanie wszystkich mocków przed każdym testem
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrganization', () => {
    test('zwraca organizację gdy została znaleziona', async () => {
      // Arrange
      const orgId = 5;
      const mockOrganization = {
        id: orgId,
        name: 'Test Organization',
        street: 'Street 1',
        house_number: '10',
        city: 'Test City',
        postal_code: '00-000',
        tax_id: '1234567890'
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);

      // Act
      const result = await organizationService.getOrganization(orgId);

      // Assert
      expect(organizationRepository.findById).toHaveBeenCalledWith(orgId);
      expect(result).toEqual(mockOrganization);
    });

    test('rzuca błąd gdy organizacja nie została znaleziona', async () => {
      // Arrange
      const orgId = 999;
      organizationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(organizationService.getOrganization(orgId))
        .rejects.toThrow('Organizacja nie znaleziona');
    });
  });

  describe('createOrganization', () => {
    test('tworzy nową organizację i przypisuje użytkownika jako administratora', async () => {
      // Arrange
      const userId = 10;
      const organizationData = {
        name: 'New Organization',
        street: 'Street 1',
        house_number: '10',
        city: 'City',
        postal_code: '00-000',
        tax_id: '1234567890'
      };

      const createdOrganization = {
        id: 5,
        ...organizationData
      };

      organizationRepository.create.mockResolvedValue(createdOrganization);
      organizationRepository.addUserToOrganization.mockResolvedValue({
        organization_id: 5,
        user_id: userId,
        role: 'admin'
      });

      // Act
      const result = await organizationService.createOrganization(organizationData, userId);

      // Assert
      expect(organizationRepository.create).toHaveBeenCalledWith(organizationData);
      expect(organizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        createdOrganization.id, 
        userId, 
        'admin'
      );
      expect(result).toEqual(createdOrganization);
    });
  });

  describe('addUserToOrganization', () => {
    test('dodaje użytkownika do organizacji z określoną rolą', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const role = 'member';

      const organization = {
        id: organizationId,
        name: 'Test Organization'
      };

      organizationRepository.findById.mockResolvedValue(organization);
      organizationRepository.addUserToOrganization.mockResolvedValue({
        organization_id: organizationId,
        user_id: userId,
        role: role
      });

      // Act
      const result = await organizationService.addUserToOrganization(organizationId, userId, role);

      // Assert
      expect(organizationRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(organizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        organizationId,
        userId,
        role
      );
      expect(result).toBeTruthy();
    });

    test('rzuca błąd gdy organizacja nie istnieje', async () => {
      // Arrange
      const organizationId = 999;
      const userId = 10;
      organizationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(organizationService.addUserToOrganization(organizationId, userId))
        .rejects.toThrow('Organizacja nie znaleziona');
    });
  });

  describe('getUserOrganizations', () => {
    test('zwraca organizacje użytkownika', async () => {
      // Arrange
      const userId = 10;
      const mockOrganizations = [
        {
          id: 1,
          name: 'Organization 1'
        },
        {
          id: 2,
          name: 'Organization 2'
        }
      ];

      organizationRepository.getUserOrganizations.mockResolvedValue(mockOrganizations);

      // Act
      const result = await organizationService.getUserOrganizations(userId);

      // Assert
      expect(organizationRepository.getUserOrganizations).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('checkUserPermission', () => {
    test('zwraca true gdy użytkownik ma wymaganą rolę', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const requiredRole = 'member';

      organizationRepository.getUserRole.mockResolvedValue(requiredRole);

      // Act
      const result = await organizationService.checkUserPermission(organizationId, userId, requiredRole);

      // Assert
      expect(organizationRepository.getUserRole).toHaveBeenCalledWith(organizationId, userId);
      expect(result).toBe(true);
    });

    test('zwraca true gdy użytkownik ma rolę admin niezależnie od wymaganej roli', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const requiredRole = 'member';

      organizationRepository.getUserRole.mockResolvedValue('admin');

      // Act
      const result = await organizationService.checkUserPermission(organizationId, userId, requiredRole);

      // Assert
      expect(organizationRepository.getUserRole).toHaveBeenCalledWith(organizationId, userId);
      expect(result).toBe(true);
    });

    test('zwraca false gdy użytkownik nie ma wystarczających uprawnień', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const requiredRole = 'admin';

      organizationRepository.getUserRole.mockResolvedValue('member');

      // Act
      const result = await organizationService.checkUserPermission(organizationId, userId, requiredRole);

      // Assert
      expect(organizationRepository.getUserRole).toHaveBeenCalledWith(organizationId, userId);
      expect(result).toBe(false);
    });

    test('zwraca false gdy użytkownik nie ma żadnej roli w organizacji', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;

      organizationRepository.getUserRole.mockResolvedValue(null);

      // Act
      const result = await organizationService.checkUserPermission(organizationId, userId);

      // Assert
      expect(organizationRepository.getUserRole).toHaveBeenCalledWith(organizationId, userId);
      expect(result).toBe(false);
    });
  });
});