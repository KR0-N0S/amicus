const animalRepository = require('../repositories/animalRepository');
const { AppError } = require('../middleware/errorHandler');

class AnimalService {
  async getAnimal(id) {
    const animal = await animalRepository.findById(id);
    if (!animal) {
      throw new AppError('Nie znaleziono zwierzęcia o podanym ID', 404);
    }
    return animal;
  }

  async getOwnerAnimals(ownerId, page = 1, limit = 10, animalType = null) {
    const offset = (page - 1) * limit;
    const animals = await animalRepository.findByOwnerId(ownerId, limit, offset, animalType);
    const totalCount = await animalRepository.countByOwnerId(ownerId, animalType);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      animals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    };
  }

  async createAnimal(animalData) {
    // Walidacja danych (można rozszerzyć)
    if (!animalData.owner_id) {
      throw new AppError('Brak ID właściciela zwierzęcia', 400);
    }
    
    if (!animalData.animal_number && !animalData.identifier) {
      throw new AppError('Wymagany jest numer zwierzęcia lub identyfikator', 400);
    }
    
    if (!animalData.species) {
      throw new AppError('Gatunek zwierzęcia jest wymagany', 400);
    }
    
    if (!animalData.animal_type) {
      throw new AppError('Typ zwierzęcia jest wymagany', 400);
    }
    
    return await animalRepository.create(animalData);
  }

  async updateAnimal(id, animalData) {
    const animal = await this.getAnimal(id);
    return await animalRepository.update(id, animalData);
  }

  async deleteAnimal(id) {
    const animal = await this.getAnimal(id);
    return await animalRepository.delete(id);
  }
}

module.exports = new AnimalService();