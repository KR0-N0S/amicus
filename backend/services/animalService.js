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
    // Walidacja podstawowych danych
    if (!animalData.owner_id) {
      throw new AppError('Brak ID właściciela zwierzęcia', 400);
    }
    
    if (!animalData.species) {
      throw new AppError('Gatunek zwierzęcia jest wymagany', 400);
    }
    
    if (!animalData.animal_type) {
      throw new AppError('Typ zwierzęcia jest wymagany', 400);
    }

    // Sprawdzamy typ zwierzęcia i odpowiednio walidujemy
    if (animalData.animal_type === 'farm') {
      // Dla zwierząt gospodarskich wymagany jest identyfikator (kolczyk)
      if (!animalData.farm_animal?.identifier) {
        throw new AppError('Numer identyfikacyjny (kolczyk) jest wymagany dla zwierząt gospodarskich', 400);
      }
    } else if (animalData.animal_type === 'companion') {
      // Dla zwierząt towarzyszących możemy mieć inne wymagania
      // np. chip_number lub passport_number
    }
    
    // Rozdzielamy dane na te dla tabeli animals i dla tabeli specyficznej dla typu
    const animalBaseData = {
      owner_id: animalData.owner_id,
      species: animalData.species,
      animal_type: animalData.animal_type,
      age: animalData.age,
      sex: animalData.sex,
      breed: animalData.breed,
      birth_date: animalData.birth_date,
      photo: animalData.photo,
      weight: animalData.weight,
      notes: animalData.notes
    };
    
    // Dane specyficzne dla typu zostają w odpowiedniej właściwości
    const specificData = animalData.animal_type === 'farm' 
      ? animalData.farm_animal 
      : animalData.companion_animal;
    
    return await animalRepository.create(animalBaseData, animalData.animal_type, specificData);
  }

  async updateAnimal(id, animalData) {
    const animal = await this.getAnimal(id);
    
    // Rozdzielamy dane na te dla tabeli animals i dla tabeli specyficznej dla typu
    const animalBaseData = {
      species: animalData.species,
      age: animalData.age,
      sex: animalData.sex,
      breed: animalData.breed,
      birth_date: animalData.birth_date,
      photo: animalData.photo,
      weight: animalData.weight,
      notes: animalData.notes
      // Nie aktualizujemy owner_id ani animal_type - to są stałe wartości
    };
    
    // Dane specyficzne dla typu zostają w odpowiedniej właściwości
    const specificData = animalData.animal_type === 'farm' 
      ? animalData.farm_animal 
      : animalData.companion_animal;
    
    return await animalRepository.update(id, animalBaseData, animalData.animal_type, specificData);
  }

  async deleteAnimal(id) {
    const animal = await this.getAnimal(id);
    // Usuwamy tylko z głównej tabeli, kaskadowe usuwanie zajmie się resztą
    return await animalRepository.delete(id);
  }
}

module.exports = new AnimalService();