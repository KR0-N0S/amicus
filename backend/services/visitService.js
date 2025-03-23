const visitRepository = require('../repositories/visitRepository');
const userRepository = require('../repositories/userRepository');

class VisitService {
  async getVisit(visitId) {
    const visit = await visitRepository.findById(visitId);
    if (!visit) {
      throw new Error('Wizyta nie znaleziona');
    }
    return visit;
  }

  async getFarmerVisits(farmerId, page = 1, limit = 10) {
    // Sprawdź czy rolnik istnieje
    const farmer = await userRepository.findById(farmerId);
    if (!farmer) {
      throw new Error('Użytkownik nie znaleziony');
    }
    
    const offset = (page - 1) * limit;
    const visits = await visitRepository.findByFarmerId(farmerId, limit, offset);
    const totalCount = await visitRepository.countByFarmerId(farmerId);
    
    return {
      visits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getVetVisits(vetId, page = 1, limit = 10) {
    // Sprawdź czy weterynarz istnieje
    const vet = await userRepository.findById(vetId);
    if (!vet) {
      throw new Error('Użytkownik nie znaleziony');
    }
    
    const offset = (page - 1) * limit;
    const visits = await visitRepository.findByVetId(vetId, limit, offset);
    const totalCount = await visitRepository.countByVetId(vetId);
    
    return {
      visits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async createVisit(visitData) {
    // Sprawdzamy czy rolnik istnieje
    const farmer = await userRepository.findById(visitData.farmer_id);
    if (!farmer) {
      throw new Error('Rolnik nie znaleziony');
    }
    
    // Sprawdzamy czy weterynarz istnieje, jeśli podano
    if (visitData.vet_id) {
      const vet = await userRepository.findById(visitData.vet_id);
      if (!vet) {
        throw new Error('Weterynarz nie znaleziony');
      }
    }
    
    // Sprawdzamy czy pracownik istnieje, jeśli podano
    if (visitData.employee_id) {
      const employee = await userRepository.findById(visitData.employee_id);
      if (!employee) {
        throw new Error('Pracownik nie znaleziony');
      }
    }
    
    return await visitRepository.create(visitData);
  }

  async updateVisit(visitId, visitData) {
    // Sprawdź czy wizyta istnieje
    const visit = await visitRepository.findById(visitId);
    if (!visit) {
      throw new Error('Wizyta nie znaleziona');
    }
    
    // Sprawdzamy czy weterynarz istnieje, jeśli podano
    if (visitData.vet_id) {
      const vet = await userRepository.findById(visitData.vet_id);
      if (!vet) {
        throw new Error('Weterynarz nie znaleziony');
      }
    }
    
    // Sprawdzamy czy pracownik istnieje, jeśli podano
    if (visitData.employee_id) {
      const employee = await userRepository.findById(visitData.employee_id);
      if (!employee) {
        throw new Error('Pracownik nie znaleziony');
      }
    }
    
    return await visitRepository.update(visitId, visitData);
  }

  async deleteVisit(visitId) {
    const visit = await visitRepository.findById(visitId);
    if (!visit) {
      throw new Error('Wizyta nie znaleziona');
    }
    
    await visitRepository.delete(visitId);
    return { success: true, message: 'Wizyta została usunięta' };
  }
}

module.exports = new VisitService();
