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
    const animalType = req.query.type; // 'small' lub 'large'
    
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
    const animalData = {
      owner_id: req.body.owner_id || req.userId,
      animal_number: req.body.animal_number,
      identifier: req.body.identifier,
      age: req.body.age,
      sex: req.body.sex,
      breed: req.body.breed,
      species: req.body.species,
      animal_type: req.body.animal_type,
      birth_date: req.body.birth_date,
      photo: req.body.photo
    };

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
    
    const animalData = {
      animal_number: req.body.animal_number,
      identifier: req.body.identifier,
      age: req.body.age,
      sex: req.body.sex,
      breed: req.body.breed,
      species: req.body.species,
      animal_type: req.body.animal_type,
      birth_date: req.body.birth_date,
      photo: req.body.photo
    };

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