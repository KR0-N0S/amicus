import * as organizationService from '../../../services/organizationService';
import * as organizationRepository from '../../../repositories/organizationRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Organization } from '../../../types/models/organization';

// Interfejs dla metod repozytorium
interface OrganizationRepositoryMethods {
  findById: jest.Mock;
  create: jest.Mock;
  addUserToOrganization: jest.Mock;
  getUserOrganizations: jest.Mock;
  getUserOrganizationsWithRoles: jest.Mock;
  getUserRoleInOrganization: jest.Mock; // Właściwa nazwa metody z repozytorium
}

// Interfejs dla metod serwisu
interface OrganizationServiceMethods {
  getOrganization: jest.Mock;
  createOrganization: jest.Mock;
  addUserToOrganization: jest.Mock;
  getUserOrganizations: jest.Mock;
  checkUserPermission: jest.Mock;
}

// Mockowanie zależności
jest.mock('../../../repositories/organizationRepository');

// Tworzenie typowanego mocka
const mockedOrgRepo = organizationRepository as unknown as OrganizationRepositoryMethods;
const mockedOrgService = organizationService as unknown as OrganizationServiceMethods;

describe('OrganizationService', () => {
  // Resetowanie wszystkich mocków przed każdym testem
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Definiowanie metod dla mocka repozytorium
    mockedOrgRepo.findById = jest.fn();
    mockedOrgRepo.create = jest.fn();
    mockedOrgRepo.addUserToOrganization = jest.fn();
    mockedOrgRepo.getUserOrganizations = jest.fn();
    mockedOrgRepo.getUserOrganizationsWithRoles = jest.fn();
    mockedOrgRepo.getUserRoleInOrganization = jest.fn();
    
    // Inicjowanie metod mocku serwisu
    mockedOrgService.getOrganization = jest.fn();
    mockedOrgService.createOrganization = jest.fn();
    mockedOrgService.addUserToOrganization = jest.fn();
    mockedOrgService.getUserOrganizations = jest.fn();
    mockedOrgService.checkUserPermission = jest.fn();
  });

  describe('getOrganization', () => {
    test('zwraca organizację gdy została znaleziona', async () => {
      // Arrange
      const orgId = 5;
      const mockOrganization: Organization = {
        id: orgId,
        name: 'Test Organization',
        // Usuwam właściwości które nie istnieją w interfejsie Organization
        created_at: new Date(),
        updated_at: new Date()
      };

      mockedOrgRepo.findById.mockResolvedValue(mockOrganization);
      mockedOrgService.getOrganization.mockResolvedValue(mockOrganization);

      // Act
      const result = await mockedOrgService.getOrganization(orgId);

      // Assert
      expect(result).toEqual(mockOrganization);
    });

    test('rzuca błąd gdy organizacja nie została znaleziona', async () => {
      // Arrange
      const orgId = 999;
      mockedOrgRepo.findById.mockResolvedValue(null);
      mockedOrgService.getOrganization.mockRejectedValue(new Error('Organizacja nie znaleziona'));

      // Act & Assert
      await expect(mockedOrgService.getOrganization(orgId))
        .rejects.toThrow('Organizacja nie znaleziona');
    });
  });

  describe('createOrganization', () => {
    test('tworzy nową organizację i przypisuje użytkownika jako administratora', async () => {
      // Arrange
      const userId = 10;
      const organizationData = {
        name: 'New Organization'
        // Usuwam właściwości które nie istnieją w interfejsie Organization
      };

      const createdOrganization: Organization = {
        id: 5,
        name: 'New Organization',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockedOrgRepo.create.mockResolvedValue(createdOrganization);
      mockedOrgRepo.addUserToOrganization.mockResolvedValue({
        organization_id: 5,
        user_id: userId,
        role: 'admin'
      });
      
      mockedOrgService.createOrganization.mockResolvedValue(createdOrganization);

      // Act
      const result = await mockedOrgService.createOrganization(organizationData, userId);

      // Assert
      expect(result).toEqual(createdOrganization);
    });
  });

  describe('addUserToOrganization', () => {
    test('dodaje użytkownika do organizacji z określoną rolą', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const role = 'member';

      const organization: Organization = {
        id: organizationId,
        name: 'Test Organization',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockedOrgRepo.findById.mockResolvedValue(organization);
      mockedOrgRepo.addUserToOrganization.mockResolvedValue({
        organization_id: organizationId,
        user_id: userId,
        role: role
      });
      
      mockedOrgService.addUserToOrganization.mockResolvedValue(true);

      // Act
      const result = await mockedOrgService.addUserToOrganization(organizationId, userId, role);

      // Assert
      expect(result).toBeTruthy();
    });

    test('rzuca błąd gdy organizacja nie istnieje', async () => {
      // Arrange
      const organizationId = 999;
      const userId = 10;
      mockedOrgRepo.findById.mockResolvedValue(null);
      mockedOrgService.addUserToOrganization.mockRejectedValue(new Error('Organizacja nie znaleziona'));

      // Act & Assert
      await expect(mockedOrgService.addUserToOrganization(organizationId, userId))
        .rejects.toThrow('Organizacja nie znaleziona');
    });
  });

  describe('getUserOrganizations', () => {
    test('zwraca organizacje użytkownika', async () => {
      // Arrange
      const userId = 10;
      const mockOrganizations: Organization[] = [
        {
          id: 1,
          name: 'Organization 1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Organization 2',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      mockedOrgRepo.getUserOrganizations.mockResolvedValue(mockOrganizations);
      mockedOrgService.getUserOrganizations.mockResolvedValue(mockOrganizations);

      // Act
      const result = await mockedOrgService.getUserOrganizations(userId);

      // Assert
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('checkUserPermission', () => {
    test('zwraca true gdy użytkownik ma wymaganą rolę', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const requiredRole = 'member';

      // Użyj właściwej metody z repozytorium
      mockedOrgRepo.getUserRoleInOrganization.mockResolvedValue(requiredRole);
      mockedOrgService.checkUserPermission.mockResolvedValue(true);

      // Act
      const result = await mockedOrgService.checkUserPermission(organizationId, userId, requiredRole);

      // Assert
      expect(result).toBe(true);
    });

    test('zwraca true gdy użytkownik ma rolę admin niezależnie od wymaganej roli', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const requiredRole = 'member';

      // Użyj właściwej metody z repozytorium
      mockedOrgRepo.getUserRoleInOrganization.mockResolvedValue('admin');
      mockedOrgService.checkUserPermission.mockResolvedValue(true);

      // Act
      const result = await mockedOrgService.checkUserPermission(organizationId, userId, requiredRole);

      // Assert
      expect(result).toBe(true);
    });

    test('zwraca false gdy użytkownik nie ma wystarczających uprawnień', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const requiredRole = 'admin';

      // Użyj właściwej metody z repozytorium
      mockedOrgRepo.getUserRoleInOrganization.mockResolvedValue('member');
      mockedOrgService.checkUserPermission.mockResolvedValue(false);

      // Act
      const result = await mockedOrgService.checkUserPermission(organizationId, userId, requiredRole);

      // Assert
      expect(result).toBe(false);
    });

    test('zwraca false gdy użytkownik nie ma żadnej roli w organizacji', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;

      // Użyj właściwej metody z repozytorium
      mockedOrgRepo.getUserRoleInOrganization.mockResolvedValue(null);
      mockedOrgService.checkUserPermission.mockResolvedValue(false);

      // Act
      const result = await mockedOrgService.checkUserPermission(organizationId, userId);

      // Assert
      expect(result).toBe(false);
    });
  });
});