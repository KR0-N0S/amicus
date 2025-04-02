const animalService = require('../services/animalService');
const { AppError } = require('../middleware/errorHandler');

exports.getAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    const animal = await animalService.getAnimal(animalId);
    
    res.status(200).json({
      status: 'success',
      data: animal
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserAnimals = async (req, res, next) => {
  try {
    // Pobranie parametrów z zapytania
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const animalType = req.query.type; // 'companion' lub 'farm'
    const ownerId = req.query.owner_id;
    const userRoleInOrg = req.userRoleInOrg?.toLowerCase();
    
    // Bezpieczne pobieranie parametru wyszukiwania
    const searchTerm = req.query.search || '';
    const trimmedSearchTerm = searchTerm.trim();
    
    // Sprawdzenie czy fraza ma co najmniej 3 znaki - tylko wtedy stosujemy wyszukiwanie
    const hasValidSearchTerm = trimmedSearchTerm.length >= 3;
    
    // Pobranie organizationId z różnych źródeł
    let organizationId = req.organizationId;
    
    // Jeśli brak organizationId w req, próbujemy pobrać z user.organizations
    if (!organizationId && req.user && req.user.organizations && req.user.organizations.length > 0) {
      organizationId = req.user.organizations[0].id;
      // Zapisz na req dla ewentualnego dalszego użycia
      req.organizationId = organizationId;
      console.log(`[ANIMAL_CONTROLLER] Pobrano organizationId z user.organizations: ${organizationId}`);
    }
    
    // Wybór strategii pobierania zwierząt w zależności od roli, parametrów oraz frazy wyszukiwania
    let result;
    
    // Używamy metod wyszukiwania tylko jeśli fraza ma co najmniej 3 znaki
    if (hasValidSearchTerm) {
      console.log(`[ANIMAL_CONTROLLER] Wyszukiwanie zwierząt dla frazy: "${trimmedSearchTerm}" (długość: ${trimmedSearchTerm.length})`);
      
      // Wybieramy metodę wyszukiwania w zależności od uprawnień i parametrów
      if (userRoleInOrg === 'client' || userRoleInOrg === 'farmer') {
        // Klient/farmer może przeszukiwać tylko swoje zwierzęta
        result = await animalService.searchAnimalsByOwnerId(trimmedSearchTerm, req.userId, animalType, page, limit);
      }
      else if (ownerId) {
        // Wyszukiwanie w zwierzętach konkretnego właściciela
        result = await animalService.searchAnimalsByOwnerId(trimmedSearchTerm, ownerId, animalType, page, limit);
      }
      else if (organizationId) {
        // Wyszukiwanie w zwierzętach całej organizacji
        result = await animalService.searchAnimalsByOrganizationId(trimmedSearchTerm, organizationId, animalType, page, limit);
      }
      else {
        return res.status(400).json({
          status: 'error',
          message: 'Nie można określić organizacji - proszę wybrać organizację'
        });
      }
    } else {
      // Jeśli fraza jest krótsza niż 3 znaki, używamy standardowych metod pobierania
      if (trimmedSearchTerm.length > 0 && trimmedSearchTerm.length < 3) {
        console.log(`[ANIMAL_CONTROLLER] Fraza wyszukiwania "${trimmedSearchTerm}" jest za krótka (min. 3 znaki). Pobieranie wszystkich danych.`);
      }
      
      if (userRoleInOrg === 'client' || userRoleInOrg === 'farmer') {
        result = await animalService.getOwnerAnimals(req.userId, page, limit, animalType);
      }
      else if (ownerId) {
        result = await animalService.getOwnerAnimals(ownerId, page, limit, animalType);
      }
      else if (organizationId) {
        result = await animalService.getOrganizationAnimals(organizationId, page, limit, animalType);
      }
      else {
        return res.status(400).json({
          status: 'error',
          message: 'Nie można określić organizacji - proszę wybrać organizację'
        });
      }
    }

    // Zabezpieczenie przed undefined result
    if (!result) {
      result = { animals: [], pagination: { page, limit, totalCount: 0, totalPages: 0 } };
    }
    
    // Zabezpieczenie przed undefined animals
    if (!result.animals) {
      result.animals = [];
    }
    
    // Zabezpieczenie przed undefined pagination
    if (!result.pagination) {
      result.pagination = { page, limit, totalCount: 0, totalPages: 0 };
    }

    // Dodajemy logowanie po bezpiecznym sprawdzeniu result
    console.log(`[ANIMAL_CONTROLLER] Pobrano ${result.animals.length} zwierząt`);

    res.status(200).json({
      status: 'success',
      data: result.animals,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[ANIMAL_CONTROLLER] Błąd podczas pobierania zwierząt:', error);
    next(error);
  }
};

exports.createAnimal = async (req, res, next) => {
  try {
    // Przygotowujemy dane zgodnie z nową strukturą bazy danych
    const animalData = {
      // Dane podstawowe zwierzęcia
      owner_id: req.body.owner_id || req.userId,
      species: req.body.species,
      animal_type: req.body.animal_type,
      age: req.body.age,
      sex: req.body.sex,
      breed: req.body.breed,
      birth_date: req.body.birth_date,
      weight: req.body.weight,
      photo: req.body.photo,
      notes: req.body.notes
    };

    // Dane specyficzne dla typu zwierzęcia
    if (req.body.animal_type === 'farm' && req.body.farm_animal) {
      animalData.farm_animal = req.body.farm_animal;
    } else if (req.body.animal_type === 'companion' && req.body.companion_animal) {
      animalData.companion_animal = req.body.companion_animal;
    }

    // Jeśli próbujemy dodać zwierzę innemu użytkownikowi, sprawdź uprawnienia
    if (animalData.owner_id !== req.userId) {
      // Tutaj można dodać logikę sprawdzania uprawnień
    }

    const animal = await animalService.createAnimal(animalData);

    res.status(201).json({
      status: 'success',
      data: animal
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    
    const animal = await animalService.getAnimal(animalId);
    
    // Przygotowujemy dane zgodnie z nową strukturą bazy danych
    const animalData = {
      // Dane podstawowe zwierzęcia - nie aktualizujemy owner_id
      species: req.body.species,
      animal_type: req.body.animal_type || animal.animal_type, // Zachowujemy typ zwierzęcia jeśli nie podano
      age: req.body.age,
      sex: req.body.sex,
      breed: req.body.breed,
      birth_date: req.body.birth_date,
      weight: req.body.weight,
      photo: req.body.photo,
      notes: req.body.notes
    };

    // Dane specyficzne dla typu zwierzęcia
    if (animal.animal_type === 'farm' && req.body.farm_animal) {
      animalData.farm_animal = req.body.farm_animal;
    } else if (animal.animal_type === 'companion' && req.body.companion_animal) {
      animalData.companion_animal = req.body.companion_animal;
    }

    const updatedAnimal = await animalService.updateAnimal(animalId, animalData);

    res.status(200).json({
      status: 'success',
      data: updatedAnimal
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    
    // Sprawdzamy, czy zwierzę należy do zalogowanego użytkownika
    const animal = await animalService.getAnimal(animalId);
    if (animal.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tego zwierzęcia', 403));
    }

    await animalService.deleteAnimal(animalId);

    res.status(200).json({
      status: 'success',
      message: 'Zwierzę zostało usunięte'
    });
  } catch (error) {
    next(error);
  }
};