const bullRepository = require('../repositories/bullRepository');

class BullService {
  async getBull(bullId) {
    const bull = await bullRepository.findById(bullId);
    if (!bull) {
      throw new Error('Byk nie znaleziony');
    }
    return bull;
  }

  async getAllBulls(page = 1, limit = 10, searchTerm = '') {
    const offset = (page - 1) * limit;
    
    const bulls = await bullRepository.findAll(limit, offset, searchTerm);
    const totalCount = await bullRepository.count(searchTerm);
    
    return {
      bulls,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async createBull(bullData) {
    return await bullRepository.create(bullData);
  }

  async updateBull(bullId, bullData) {
    const bull = await bullRepository.findById(bullId);
    if (!bull) {
      throw new Error('Byk nie znaleziony');
    }
    
    return await bullRepository.update(bullId, bullData);
  }

  async deleteBull(bullId) {
    const bull = await bullRepository.findById(bullId);
    if (!bull) {
      throw new Error('Byk nie znaleziony');
    }
    
    await bullRepository.delete(bullId);
    return { success: true, message: 'Byk został usunięty' };
  }
}

module.exports = new BullService();
