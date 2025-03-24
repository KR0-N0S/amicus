const animalRepository = require('../repositories/animalRepository');

class AnimalService {
  async getAnimal(animalId) {
    const animal = await animalRepository.findById(animalId);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    return animal;
  }

  async getOwnerAnimals(ownerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const animals = await animalRepository.findByOwnerId(ownerId, limit, offset);
    const totalCount = await animalRepository.countByOwnerId(ownerId);
    
    return {
      animals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async createAnimal(animalData) {
    return await animalRepository.create(animalData);
  }

  async updateAnimal(animalId, animalData) {
    const animal = await animalRepository.findById(animalId);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    
    return await animalRepository.update(animalId, animalData);
  }

  async deleteAnimal(animalId) {
    const animal = await animalRepository.findById(animalId);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    
    await animalRepository.delete(animalId);
    return { success: true, message: 'Zwierzę zostało usunięte' };
  }
}

module.exports = new AnimalService();
