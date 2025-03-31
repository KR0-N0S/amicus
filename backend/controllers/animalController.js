const animalService = require('../services/animalService');
const { AppError } = require('../middleware/errorHandler');

exports.getAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    const animal = await animalService.getAnimal(animalId);
    
    // Sprawdzenie czy zwierzę należy do zalogowanego użytkownika lub organizacji
    if (animal.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tego zwierzęcia', 403));
    }

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
    const ownerId = req.query.owner_id || req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const animalType = req.query.type; // 'companion' lub 'farm'
    
    // Jeśli próbujemy pobrać zwierzęta innego użytkownika, sprawdź uprawnienia
    if (ownerId !== req.userId) {
      // Tutaj można dodać logikę sprawdzania uprawnień do przeglądania zwierząt innych użytkowników
      // np. dla weterynarzów, administratorów itp.
    }
    
    const result = await animalService.getOwnerAnimals(ownerId, page, limit, animalType);

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
    
    // Sprawdzamy, czy zwierzę należy do zalogowanego użytkownika
    const animal = await animalService.getAnimal(animalId);
    if (animal.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tego zwierzęcia', 403));
    }
    
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