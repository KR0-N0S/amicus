/**
 * Repozytorium organizacji
 * @author KR0-N0S1
 * @date 2025-04-08 19:29:41
 */

import { query } from '../config/db';
import { QueryResult } from 'pg';
import { Organization } from '../types/models/organization';

/**
 * Interfejsy dla danych wejściowych organizacji
 */
interface OrganizationCreateData {
  name: string;
  city?: string;
  street?: string;
  house_number?: string;
  tax_id?: string;
}

interface OrganizationUpdateData {
  name: string;
  city?: string;
  street?: string;
  house_number?: string;
  tax_id?: string;
}

/**
 * Pobiera wszystkie organizacje
 * @returns Lista wszystkich organizacji
 */
async function getAll(): Promise<Organization[]> {
  const result: QueryResult = await query('SELECT * FROM organizations ORDER BY name');
  return result.rows;
}

/**
 * Pobiera organizację po ID
 * @param id - ID organizacji
 * @returns Organizacja lub undefined jeśli nie znaleziono
 */
async function getById(id: number): Promise<Organization | undefined> {
  const result: QueryResult = await query('SELECT * FROM organizations WHERE id = $1', [id]);
  return result.rows[0];
}

/**
 * Pobiera organizację po nazwie
 * @param name - Nazwa organizacji
 * @returns Organizacja lub undefined jeśli nie znaleziono
 */
async function getByName(name: string): Promise<Organization | undefined> {
  const result: QueryResult = await query('SELECT * FROM organizations WHERE name = $1', [name]);
  return result.rows[0];
}

/**
 * Tworzy nową organizację
 * @param data - Dane organizacji
 * @returns Utworzona organizacja
 */
async function create(data: OrganizationCreateData): Promise<Organization> {
  const { name, city, street, house_number, tax_id } = data;
  
  const result: QueryResult = await query(
    'INSERT INTO organizations (name, city, street, house_number, tax_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, city, street, house_number, tax_id]
  );
  
  return result.rows[0];
}

/**
 * Aktualizuje organizację
 * @param id - ID organizacji
 * @param data - Dane do aktualizacji
 * @returns Zaktualizowana organizacja
 */
async function update(id: number, data: OrganizationUpdateData): Promise<Organization> {
  const { name, city, street, house_number, tax_id } = data;
  
  const result: QueryResult = await query(
    'UPDATE organizations SET name = $1, city = $2, street = $3, house_number = $4, tax_id = $5 WHERE id = $6 RETURNING *',
    [name, city, street, house_number, tax_id, id]
  );
  
  return result.rows[0];
}

/**
 * Usuwa organizację
 * @param id - ID organizacji
 * @returns true jeśli usunięto, false jeśli nie znaleziono
 */
async function remove(id: number): Promise<boolean> {
  const result: QueryResult = await query('DELETE FROM organizations WHERE id = $1', [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Dodaje użytkownika do organizacji
 * @param organizationId - ID organizacji
 * @param userId - ID użytkownika
 * @param role - Rola w organizacji (domyślnie 'client')
 * @returns Obiekt z relacją użytkownik-organizacja
 */
async function addUserToOrganization(
  organizationId: number, 
  userId: number, 
  role: string = 'client'
): Promise<any> {
  // Sprawdź czy relacja już istnieje
  const checkResult: QueryResult = await query(
    'SELECT * FROM organization_user WHERE organization_id = $1 AND user_id = $2',
    [organizationId, userId]
  );
  
  if (checkResult.rows.length > 0) {
    // Jeśli istnieje, zaktualizuj rolę
    const updateResult: QueryResult = await query(
      'UPDATE organization_user SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING *',
      [role, organizationId, userId]
    );
    return updateResult.rows[0];
  } else {
    // Jeśli nie istnieje, utwórz nową relację
    const insertResult: QueryResult = await query(
      'INSERT INTO organization_user (organization_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
      [organizationId, userId, role]
    );
    return insertResult.rows[0];
  }
}

/**
 * Usuwa użytkownika z organizacji
 * @param organizationId - ID organizacji
 * @param userId - ID użytkownika
 * @returns true jeśli usunięto, false jeśli nie znaleziono
 */
async function removeUserFromOrganization(organizationId: number, userId: number): Promise<boolean> {
  const result: QueryResult = await query(
    'DELETE FROM organization_user WHERE organization_id = $1 AND user_id = $2',
    [organizationId, userId]
  );
  
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Pobiera wszystkich użytkowników w organizacji
 * @param organizationId - ID organizacji
 * @returns Lista użytkowników w organizacji z ich rolami
 */
async function getOrganizationUsers(organizationId: number): Promise<any[]> {
  const result: QueryResult = await query(
    `SELECT u.*, ou.role
     FROM users u
     JOIN organization_user ou ON u.id = ou.user_id
     WHERE ou.organization_id = $1
     ORDER BY u.last_name, u.first_name`,
    [organizationId]
  );
  
  return result.rows;
}

/**
 * Pobiera organizacje użytkownika wraz z rolami
 * @param userId - ID użytkownika
 * @returns Lista organizacji użytkownika z rolami
 */
async function getUserOrganizationsWithRoles(userId: number): Promise<any[]> {
  try {
    const result: QueryResult = await query(`
      SELECT o.*, ou.role
      FROM organizations o
      JOIN organization_user ou ON o.id = ou.organization_id
      WHERE ou.user_id = $1
      ORDER BY o.name
    `, [userId]);
    
    return result.rows;
  } catch (error) {
    console.error(`[ORG_REPOSITORY] Błąd podczas pobierania organizacji użytkownika ${userId}:`, error);
    throw error;
  }
}

/**
 * Aktualizuje rolę użytkownika w organizacji
 * @param organizationId - ID organizacji
 * @param userId - ID użytkownika
 * @param role - Nowa rola
 * @returns Zaktualizowana relacja
 */
async function updateUserRole(organizationId: number, userId: number, role: string): Promise<any> {
  const result: QueryResult = await query(
    'UPDATE organization_user SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING *',
    [role, organizationId, userId]
  );
  
  return result.rows[0];
}

/**
 * Sprawdza czy użytkownik jest członkiem organizacji
 * @param organizationId - ID organizacji
 * @param userId - ID użytkownika
 * @returns true jeśli jest członkiem, false w przeciwnym razie
 */
async function isUserMemberOfOrganization(organizationId: number, userId: number): Promise<boolean> {
  const result: QueryResult = await query(
    'SELECT 1 FROM organization_user WHERE organization_id = $1 AND user_id = $2',
    [organizationId, userId]
  );
  
  return result.rows.length > 0;
}

/**
 * Pobiera rolę użytkownika w organizacji
 * @param organizationId - ID organizacji
 * @param userId - ID użytkownika
 * @returns Rola użytkownika lub null jeśli nie jest członkiem
 */
async function getUserRoleInOrganization(organizationId: number, userId: number): Promise<string | null> {
  const result: QueryResult = await query(
    'SELECT role FROM organization_user WHERE organization_id = $1 AND user_id = $2',
    [organizationId, userId]
  );
  
  return result.rows.length > 0 ? result.rows[0].role : null;
}

export {
  getAll,
  getById,
  getByName,
  create,
  update,
  remove,
  addUserToOrganization,
  removeUserFromOrganization,
  getOrganizationUsers,
  getUserOrganizationsWithRoles,
  updateUserRole,
  isUserMemberOfOrganization,
  getUserRoleInOrganization
};