import * as organizationRepository from '../repositories/organizationRepository';
import { Organization } from '../types/models/organization';

class OrganizationService {
  /**
   * Pobiera organizację po ID
   * @param organizationId ID organizacji
   * @returns Obiekt organizacji
   */
  async getOrganization(organizationId: number): Promise<Organization> {
    const organization = await (organizationRepository as any).findById(organizationId);
    if (!organization) {
      throw new Error('Organizacja nie znaleziona');
    }
    return organization;
  }

  /**
   * Tworzy nową organizację
   * @param organizationData Dane organizacji
   * @param userId ID użytkownika tworzącego organizację
   * @returns Utworzona organizacja
   */
  async createOrganization(organizationData: Partial<Organization>, userId: number): Promise<Organization> {
    // Utwórz organizację
    const newOrganization = await (organizationRepository as any).create(organizationData);
    
    // Przypisz użytkownika jako administratora
    await (organizationRepository as any).addUserToOrganization(newOrganization.id, userId, 'admin');
    
    return newOrganization;
  }

  /**
   * Dodaje użytkownika do organizacji
   * @param organizationId ID organizacji
   * @param userId ID użytkownika
   * @param role Rola użytkownika w organizacji
   * @returns Wynik operacji
   */
  async addUserToOrganization(organizationId: number, userId: number, role: string = 'member'): Promise<any> {
    // Sprawdź czy organizacja istnieje
    const organization = await (organizationRepository as any).findById(organizationId);
    if (!organization) {
      throw new Error('Organizacja nie znaleziona');
    }
    
    // Dodaj użytkownika do organizacji
    return await (organizationRepository as any).addUserToOrganization(organizationId, userId, role);
  }

  /**
   * Pobiera organizacje użytkownika
   * @param userId ID użytkownika
   * @returns Lista organizacji
   */
  async getUserOrganizations(userId: number): Promise<Organization[]> {
    return await (organizationRepository as any).getUserOrganizations(userId);
  }

  /**
   * Sprawdza uprawnienia użytkownika w organizacji
   * @param organizationId ID organizacji
   * @param userId ID użytkownika
   * @param requiredRole Wymagana rola (opcjonalnie)
   * @returns Czy użytkownik ma uprawnienia
   */
  async checkUserPermission(organizationId: number, userId: number, requiredRole: string | null = null): Promise<boolean> {
    const userRole = await (organizationRepository as any).getUserRole(organizationId, userId);
    
    if (!userRole) {
      return false;
    }
    
    if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
      return false;
    }
    
    return true;
  }
}

export default new OrganizationService();