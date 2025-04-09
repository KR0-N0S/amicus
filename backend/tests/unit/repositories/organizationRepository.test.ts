import * as organizationRepository from '../../../repositories/organizationRepository';
import * as db from '../../../config/db';
import { Organization } from '../../../types/models/organization';

// Definicje typów dla repozytoriów
interface OrganizationCreateData {
  name: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
}

// Interfejs dla metod repozytorium
interface OrganizationRepositoryInterface {
  findById(id: number): Promise<Organization | undefined>;
  create(data: OrganizationCreateData): Promise<Organization>;
  addUserToOrganization(organizationId: number, userId: number, role: string): Promise<any>;
  removeUserFromOrganization(organizationId: number, userId: number): Promise<any>;
  getUserOrganizations(userId: number): Promise<Organization[]>;
  getUserOrganizationsWithRoles(userId: number): Promise<any[]>;
  getUserRole(organizationId: number, userId: number): Promise<string | undefined>;
}

// Rzutowanie typu dla repozytorium
const typedOrgRepo = organizationRepository as unknown as OrganizationRepositoryInterface;

// Mockowanie modułu db
jest.mock('../../../config/db', () => ({
  query: jest.fn()
}));

describe('OrganizationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    test('zwraca organizację gdy została znaleziona', async () => {
      // Arrange
      const orgId = 5;
      const mockOrganization = {
        id: orgId,
        name: 'Test Organization',
        street: 'Test Street',
        city: 'Test City'
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [mockOrganization]
      });

      // Act
      const result = await typedOrgRepo.findById(orgId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM organizations WHERE id = $1',
        [orgId]
      );
      expect(result).toEqual(mockOrganization);
    });

    test('zwraca undefined gdy organizacja nie została znaleziona', async () => {
      // Arrange
      const orgId = 999;
      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Act
      const result = await typedOrgRepo.findById(orgId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM organizations WHERE id = $1',
        [orgId]
      );
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    test('tworzy nową organizację i zwraca jej dane', async () => {
      // Arrange
      const organizationData: OrganizationCreateData = {
        name: 'New Organization',
        street: 'New Street',
        house_number: '10',
        city: 'New City',
        postal_code: '00-000',
        tax_id: '1234567890'
      };

      const createdOrganization = {
        id: 5,
        ...organizationData,
        created_at: new Date(),
        updated_at: new Date()
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [createdOrganization]
      });

      // Act
      const result = await typedOrgRepo.create(organizationData);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO organizations'),
        [
          organizationData.name,
          organizationData.street,
          organizationData.house_number,
          organizationData.city,
          organizationData.postal_code,
          organizationData.tax_id
        ]
      );
      expect(result).toEqual(createdOrganization);
    });
  });

  describe('addUserToOrganization', () => {
    test('dodaje użytkownika do organizacji', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const role = 'member';

      const relation = {
        organization_id: organizationId,
        user_id: userId,
        role: role,
        created_at: new Date(),
        updated_at: new Date()
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [relation]
      });

      // Act
      const result = await typedOrgRepo.addUserToOrganization(organizationId, userId, role);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO organization_user'),
        [organizationId, userId, role]
      );
      expect(result).toEqual(relation);
    });
  });

  describe('removeUserFromOrganization', () => {
    test('usuwa powiązanie użytkownika z organizacją', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;

      const relation = {
        organization_id: organizationId,
        user_id: userId
      };

      (db.query as jest.Mock).mockResolvedValue({
        rows: [relation]
      });

      // Act
      const result = await typedOrgRepo.removeUserFromOrganization(organizationId, userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM organization_user'),
        [organizationId, userId]
      );
      expect(result).toEqual(relation);
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

      (db.query as jest.Mock).mockResolvedValue({
        rows: mockOrganizations
      });

      // Act
      const result = await typedOrgRepo.getUserOrganizations(userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT o.* FROM organizations o'),
        [userId]
      );
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('getUserOrganizationsWithRoles', () => {
    test('zwraca organizacje użytkownika wraz z rolami', async () => {
      // Arrange
      const userId = 10;
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

      (db.query as jest.Mock).mockResolvedValue({
        rows: mockOrganizations
      });

      // Act
      const result = await typedOrgRepo.getUserOrganizationsWithRoles(userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT o.*, ou.role FROM organizations o'),
        [userId]
      );
      expect(result).toEqual(mockOrganizations);
    });
  });

  describe('getUserRole', () => {
    test('zwraca rolę użytkownika w organizacji', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;
      const role = 'admin';

      (db.query as jest.Mock).mockResolvedValue({
        rows: [{ role }]
      });

      // Act
      const result = await typedOrgRepo.getUserRole(organizationId, userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT role FROM organization_user'),
        [organizationId, userId]
      );
      expect(result).toEqual(role);
    });

    test('zwraca undefined gdy użytkownik nie jest powiązany z organizacją', async () => {
      // Arrange
      const organizationId = 5;
      const userId = 10;

      (db.query as jest.Mock).mockResolvedValue({
        rows: []
      });

      // Act
      const result = await typedOrgRepo.getUserRole(organizationId, userId);

      // Assert
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT role FROM organization_user'),
        [organizationId, userId]
      );
      expect(result).toBeUndefined();
    });
  });
});