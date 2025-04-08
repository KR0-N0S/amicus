import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs reprezentujący organizację
 */
export interface Organization {
  id: number;
  name: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane potrzebne do utworzenia organizacji
 */
export interface OrganizationCreateData {
  name: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
}

/**
 * Relacja użytkownik-organizacja
 */
export interface OrganizationUser {
  id: number;
  organization_id: number;
  user_id: number;
  role: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Organizacja z informacją o roli użytkownika
 */
export interface OrganizationWithRole extends Organization {
  role: string;
}

class OrganizationRepository {
  /**
   * Znajdź organizację po ID
   * @param id - Identyfikator organizacji
   * @returns Organizacja lub undefined jeśli nie znaleziono
   */
  async findById(id: number): Promise<Organization | undefined> {
    const result: QueryResult = await query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Utwórz nową organizację
   * @param organizationData - Dane organizacji
   * @returns Utworzona organizacja
   */
  async create(organizationData: OrganizationCreateData): Promise<Organization> {
    const { name, street, house_number, city, postal_code, tax_id } = organizationData;
    
    const result: QueryResult = await query(
      `INSERT INTO organizations 
       (name, street, house_number, city, postal_code, tax_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING *`,
      [name, street, house_number, city, postal_code, tax_id]
    );
    
    return result.rows[0];
  }

  /**
   * Dodaj użytkownika do organizacji
   * @param organizationId - Identyfikator organizacji
   * @param userId - Identyfikator użytkownika
   * @param role - Rola użytkownika w organizacji (domyślnie 'member')
   * @returns Utworzona relacja użytkownik-organizacja
   */
  async addUserToOrganization(organizationId: number, userId: number, role: string = 'member'): Promise<OrganizationUser> {
    const result: QueryResult = await query(
      `INSERT INTO organization_user 
       (organization_id, user_id, role, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [organizationId, userId, role]
    );
    
    return result.rows[0];
  }

  /**
   * Usuń powiązanie użytkownika z organizacją
   * @param organizationId - Identyfikator organizacji
   * @param userId - Identyfikator użytkownika
   * @returns Usunięta relacja lub undefined jeśli nie znaleziono
   */
  async removeUserFromOrganization(organizationId: number, userId: number): Promise<OrganizationUser | undefined> {
    console.log(`[ORG_REPO] Usuwanie powiązania użytkownika ${userId} z organizacją ${organizationId}`);
    
    const result: QueryResult = await query(
      `DELETE FROM organization_user 
       WHERE organization_id = $1 AND user_id = $2 
       RETURNING *`,
      [organizationId, userId]
    );
    
    return result.rows[0];
  }

  /**
   * Pobierz organizacje do których należy użytkownik
   * @param userId - Identyfikator użytkownika
   * @returns Lista organizacji
   */
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    const result: QueryResult = await query(
      `SELECT o.* FROM organizations o 
       JOIN organization_user ou ON o.id = ou.organization_id 
       WHERE ou.user_id = $1`,
      [userId]
    );
    
    return result.rows;
  }

  /**
   * Pobierz organizacje użytkownika wraz z rolami
   * @param userId - Identyfikator użytkownika
   * @returns Lista organizacji z rolami
   */
  async getUserOrganizationsWithRoles(userId: number): Promise<OrganizationWithRole[]> {
    const result: QueryResult = await query(
      `SELECT o.*, ou.role FROM organizations o 
       JOIN organization_user ou ON o.id = ou.organization_id 
       WHERE ou.user_id = $1`,
      [userId]
    );
    
    return result.rows;
  }

  /**
   * Pobierz rolę użytkownika w organizacji
   * @param organizationId - Identyfikator organizacji
   * @param userId - Identyfikator użytkownika
   * @returns Rola użytkownika lub undefined jeśli nie znaleziono
   */
  async getUserRole(organizationId: number, userId: number): Promise<string | undefined> {
    const result: QueryResult = await query(
      `SELECT role FROM organization_user 
       WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );
    
    return result.rows[0]?.role;
  }
}

export default new OrganizationRepository();