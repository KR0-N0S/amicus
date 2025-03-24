const inseminationRepository = require('../repositories/inseminationRepository');
const animalRepository = require('../repositories/animalRepository');
const bullRepository = require('../repositories/bullRepository');

class InseminationService {
  async getInsemination(inseminationId) {
    const insemination = await inseminationRepository.findById(inseminationId);
    if (!insemination) {
      throw new Error('Inseminacja nie znaleziona');
    }
    return insemination;
  }

  async getAnimalInseminations(animalId, page = 1, limit = 10) {
    // Sprawdź czy zwierzę istnieje
    const animal = await animalRepository.findById(animalId);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    
    const offset = (page - 1) * limit;
    const inseminations = await inseminationRepository.findByAnimalId(animalId, limit, offset);
    
    return {
      animal,
      inseminations
    };
  }

  async getOwnerInseminations(ownerId, page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    
    const inseminations = await inseminationRepository.findByOwnerId(ownerId, limit, offset, filters);
    const totalCount = await inseminationRepository.countByOwnerId(ownerId, filters);
    
    return {
      inseminations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async createInsemination(inseminationData) {
    // Sprawdź czy zwierzę istnieje
    const animal = await animalRepository.findById(inseminationData.animal_id);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    
    // Sprawdź czy byk istnieje, jeśli podano
    if (inseminationData.bull_id) {
      const bull = await bullRepository.findById(inseminationData.bull_id);
      if (!bull) {
        throw new Error('Byk nie znaleziony');
      }
    }
    
    return await inseminationRepository.create(inseminationData);
  }

  async updateInsemination(inseminationId, inseminationData) {
    // Sprawdź czy inseminacja istnieje
    const insemination = await inseminationRepository.findById(inseminationId);
    if (!insemination) {
      throw new Error('Inseminacja nie znaleziona');
    }
    
    // Sprawdź czy byk istnieje, jeśli podano
    if (inseminationData.bull_id) {
      const bull = await bullRepository.findById(inseminationData.bull_id);
      if (!bull) {
        throw new Error('Byk nie znaleziony');
      }
    }
    
    return await inseminationRepository.update(inseminationId, inseminationData);
  }

  async deleteInsemination(inseminationId) {
    const insemination = await inseminationRepository.findById(inseminationId);
    if (!insemination) {
      throw new Error('Inseminacja nie znaleziona');
    }
    
    await inseminationRepository.delete(inseminationId);
    return { success: true, message: 'Inseminacja została usunięta' };
  }
}

module.exports = new InseminationService();
