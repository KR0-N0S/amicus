const animalService = require('../services/animalService');
const { AppError } = require('../middleware/errorHandler');

exports.getAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    const animal = await animalService.getAnimal(animalId);
    
    // Sprawdzenie czy zwierzę należy do zalogowanego użytkownika
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
    const ownerId = req.userId; // Domyślnie pobieramy zwierzęta zalogowanego użytkownika
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await animalService.getOwnerAnimals(ownerId, page, limit);

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
      owner_id: req.userId, // Przypisujemy zwierzę do zalogowanego użytkownika
      animal_number: req.body.animal_number,
      age: req.body.age,
      sex: req.body.sex,
      breed: req.body.breed,
      photo: req.body.photo
    };

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
      age: req.body.age,
      sex: req.body.sex,
      breed: req.body.breed,
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
