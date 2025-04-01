const animalService = require('../services/animalService');
const { AppError } = require('../middleware/errorHandler');

exports.getAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    const animal = await animalService.getAnimal(animalId);
    
    // Usunięto nadmiarowe sprawdzenie uprawnień - middleware verifyResourceAccess już to zrobił
    
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
    
    // ZMIANA: Pobranie organizationId z różnych źródeł
    let organizationId = req.organizationId;
    
    // Jeśli brak organizationId w req, próbujemy pobrać z user.organizations
    if (!organizationId && req.user && req.user.organizations && req.user.organizations.length > 0) {
      organizationId = req.user.organizations[0].id;
      // Zapisz na req dla ewentualnego dalszego użycia
      req.organizationId = organizationId;
      console.log(`[ANIMAL_CONTROLLER] Pobrano organizationId z user.organizations: ${organizationId}`);
    }
    
    // Wybór strategii pobierania zwierząt w zależności od roli i parametrów
    let result;
    
    // 1. Jeśli użytkownik jest klientem/farmerem, może widzieć tylko swoje zwierzęta
    if (userRoleInOrg === 'client' || userRoleInOrg === 'farmer') {
      result = await animalService.getOwnerAnimals(req.userId, page, limit, animalType);
      console.log(`[ANIMAL_CONTROLLER] Klient/farmer ${req.userId} pobiera swoje zwierzęta (${result.animals.length})`);
    }
    // 2. Jeśli podano konkretnego właściciela (owner_id), pobieramy jego zwierzęta
    else if (ownerId) {
      result = await animalService.getOwnerAnimals(ownerId, page, limit, animalType);
      console.log(`[ANIMAL_CONTROLLER] Pobieranie zwierząt właściciela ${ownerId} (${result.animals.length})`);
    }
    // 3. W przeciwnym razie (np. dla admina/weta) pobieramy wszystkie zwierzęta w organizacji
    else if (organizationId) {
      result = await animalService.getOrganizationAnimals(organizationId, page, limit, animalType);
      console.log(`[ANIMAL_CONTROLLER] Pobieranie wszystkich zwierząt w organizacji ${organizationId} (${result.animals.length})`);
    }
    // 4. Jeśli nadal brak organizationId, próbujemy użyć pierwszej organizacji użytkownika
    else {
      return res.status(400).json({
        status: 'error',
        message: 'Nie można określić organizacji - proszę wybrać organizację'
      });
    }

    res.status(200).json({
      status: 'success',
      data: result.animals,
      pagination: result.pagination
    });
  } catch (error) {
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
    
    // Usunięto zbędne sprawdzanie uprawnień - middleware verifyResourceAccess już to zrobił
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
    
    // Usunięto zbędne sprawdzanie uprawnień - middleware verifyResourceAccess już to zrobił
    const animal = await animalService.getAnimal(animalId);

    await animalService.deleteAnimal(animalId);

    res.status(200).json({
      status: 'success',
      message: 'Zwierzę zostało usunięte'
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