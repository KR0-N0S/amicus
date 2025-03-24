const organizationRepository = require('../repositories/organizationRepository');

class OrganizationService {
  async getOrganization(organizationId) {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organizacja nie znaleziona');
    }
    return organization;
  }

  async createOrganization(organizationData, userId) {
    // Utwórz organizację
    const newOrganization = await organizationRepository.create(organizationData);
    
    // Przypisz użytkownika jako administratora
    await organizationRepository.addUserToOrganization(newOrganization.id, userId, 'admin');
    
    return newOrganization;
  }

  async addUserToOrganization(organizationId, userId, role = 'member') {
    // Sprawdź czy organizacja istnieje
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organizacja nie znaleziona');
    }
    
    // Dodaj użytkownika do organizacji
    return await organizationRepository.addUserToOrganization(organizationId, userId, role);
  }

  async getUserOrganizations(userId) {
    return await organizationRepository.getUserOrganizations(userId);
  }

  async checkUserPermission(organizationId, userId, requiredRole = null) {
    const userRole = await organizationRepository.getUserRole(organizationId, userId);
    
    if (!userRole) {
      return false;
    }
    
    if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
      return false;
    }
    
    return true;
  }
}

module.exports = new OrganizationService();
