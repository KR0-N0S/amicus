const animalRepository = require('../repositories/animalRepository');
const { AppError } = require('../middleware/errorHandler');

class AnimalService {
  /**
   * Wylicza wiek na podstawie daty urodzenia
   * @param {Date|string} birthDate - Data urodzenia
   * @returns {number|null} - Wyliczony wiek lub null jeśli brak daty urodzenia
   */
  calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    
    // Korekta wieku jeśli urodziny jeszcze nie nastąpiły w tym roku
    if (
      today.getMonth() < birthDateObj.getMonth() || 
      (today.getMonth() === birthDateObj.getMonth() && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }
    
    return age < 0 ? 0 : age;
  }

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

  /**
   * Pobiera zwierzęta należące do wszystkich użytkowników w danej organizacji
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (paginacja)
   * @param {number} limit - Liczba elementów na stronę
   * @param {string} animalType - Opcjonalny filtr typu zwierzęcia ('farm' lub 'companion')
   * @returns {Object} - Obiekt zawierający listę zwierząt i dane paginacji
   */
  async getOrganizationAnimals(organizationId, page = 1, limit = 10, animalType = null) {
    const offset = (page - 1) * limit;
    const animals = await animalRepository.findByOrganizationId(organizationId, limit, offset, animalType);
    const totalCount = await animalRepository.countByOrganizationId(organizationId, animalType);
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

// Funkcja create z poprawioną obsługą identyfikatora kolczyka
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

  // Dla wstecznej kompatybilności - jeśli mamy animal_number, ale nie mamy farm_animal.identifier
  if (animalData.animal_type === 'farm') {
    // Jeśli nie ma obiektu farm_animal, tworzymy go
    if (!animalData.farm_animal) {
      animalData.farm_animal = {};
    }
    
    // Sprawdzamy czy mamy identifier w farm_animal, jeśli nie, używamy animal_number
    if (!animalData.farm_animal.identifier && animalData.animal_number) {
      animalData.farm_animal.identifier = animalData.animal_number;
    }
    
    // Dla zwierząt gospodarskich wymagany jest identyfikator (kolczyk)
    if (!animalData.farm_animal.identifier) {
      throw new AppError('Numer identyfikacyjny (kolczyk) jest wymagany dla zwierząt gospodarskich', 400);
    }
  }
    
    // Rozdzielamy dane na te dla tabeli animals i dla tabeli specyficznej dla typu
    const animalBaseData = {
      owner_id: animalData.owner_id,
      species: animalData.species,
      animal_type: animalData.animal_type,
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
      sex: animalData.sex,
      breed: animalData.breed,
      birth_date: animalData.birth_date,
      photo: animalData.photo,
      weight: animalData.weight,
      notes: animalData.notes
      // Pole age zostało usunięte - wiek będzie wyliczany dynamicznie
    };
    
    // Dane specyficzne dla typu zostają w odpowiedniej właściwości
    const specificData = animalData.animal_type === 'farm' 
      ? animalData.farm_animal 
      : animalData.companion_animal;
    
    return await animalRepository.update(id, animalBaseData, animalData.animal_type, specificData);
  }

  async deleteAnimal(id) {
    const animal = await this.getAnimal(id);
    return await animalRepository.delete(id);
  }
}

module.exports = new AnimalService();