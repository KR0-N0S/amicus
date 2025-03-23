#!/bin/bash

# Przejdź do katalogu backendu
cd /var/www/amicus/backend

# Dodanie kontrolera użytkownika
cat > controllers/userController.js << 'USERCONTROLLERJS'
const userService = require('../services/userService');
const { AppError } = require('../middleware/errorHandler');

exports.getProfile = async (req, res, next) => {
  try {
    const result = await userService.getUserProfile(req.userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const updatedUser = await userService.updateUserProfile(req.userId, userData);

    res.status(200).json({
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return next(new AppError('Bieżące i nowe hasło są wymagane', 400));
    }

    const result = await userService.changePassword(req.userId, current_password, new_password);

    res.status(200).json({
      status: 'success',
      message: 'Hasło zostało zmienione'
    });
  } catch (error) {
    next(error);
  }
};
USERCONTROLLERJS

# Dodanie kontrolera organizacji
cat > controllers/organizationController.js << 'ORGCONTROLLERJS'
const organizationService = require('../services/organizationService');
const { AppError } = require('../middleware/errorHandler');

exports.getOrganization = async (req, res, next) => {
  try {
    const organizationId = req.params.id;
    
    // Sprawdź czy użytkownik ma dostęp do tej organizacji
    const hasAccess = await organizationService.checkUserPermission(organizationId, req.userId);
    if (!hasAccess) {
      return next(new AppError('Brak dostępu do tej organizacji', 403));
    }
    
    const organization = await organizationService.getOrganization(organizationId);

    res.status(200).json({
      status: 'success',
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrganization = async (req, res, next) => {
  try {
    const organizationData = {
      name: req.body.name,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const organization = await organizationService.createOrganization(organizationData, req.userId);

    res.status(201).json({
      status: 'success',
      data: organization
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserOrganizations = async (req, res, next) => {
  try {
    const organizations = await organizationService.getUserOrganizations(req.userId);

    res.status(200).json({
      status: 'success',
      data: organizations
    });
  } catch (error) {
    next(error);
  }
};

exports.addUserToOrganization = async (req, res, next) => {
  try {
    const { organizationId, userId, role } = req.body;
    
    // Sprawdź czy użytkownik jest administratorem organizacji
    const isAdmin = await organizationService.checkUserPermission(organizationId, req.userId, 'admin');
    if (!isAdmin) {
      return next(new AppError('Tylko administrator może dodawać użytkowników do organizacji', 403));
    }
    
    const result = await organizationService.addUserToOrganization(organizationId, userId, role);

    res.status(201).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
ORGCONTROLLERJS

# Dodanie kontrolera zwierząt
cat > controllers/animalController.js << 'ANIMALCONTROLLERJS'
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
ANIMALCONTROLLERJS

# Dodanie kontrolera byków
cat > controllers/bullController.js << 'BULLCONTROLLERJS'
const bullService = require('../services/bullService');
const { AppError } = require('../middleware/errorHandler');

exports.getBull = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    const bull = await bullService.getBull(bullId);

    res.status(200).json({
      status: 'success',
      data: bull
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllBulls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.search || '';
    
    const result = await bullService.getAllBulls(page, limit, searchTerm);

    res.status(200).json({
      status: 'success',
      data: result.bulls,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.createBull = async (req, res, next) => {
  try {
    const bullData = {
      identification_number: req.body.identification_number,
      vet_number: req.body.vet_number,
      breed: req.body.breed,
      semen_production_date: req.body.semen_production_date,
      supplier: req.body.supplier,
      bull_type: req.body.bull_type,
      last_delivery_date: req.body.last_delivery_date,
      straws_last_delivery: req.body.straws_last_delivery,
      current_straw_count: req.body.current_straw_count,
      suggested_price: req.body.suggested_price,
      additional_info: req.body.additional_info,
      favorite: req.body.favorite,
      vet_id: req.body.vet_id
    };

    const bull = await bullService.createBull(bullData);

    res.status(201).json({
      status: 'success',
      data: bull
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBull = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    
    const bullData = {
      identification_number: req.body.identification_number,
      vet_number: req.body.vet_number,
      breed: req.body.breed,
      semen_production_date: req.body.semen_production_date,
      supplier: req.body.supplier,
      bull_type: req.body.bull_type,
      last_delivery_date: req.body.last_delivery_date,
      straws_last_delivery: req.body.straws_last_delivery,
      current_straw_count: req.body.current_straw_count,
      suggested_price: req.body.suggested_price,
      additional_info: req.body.additional_info,
      favorite: req.body.favorite,
      vet_id: req.body.vet_id
    };

    const updatedBull = await bullService.updateBull(bullId, bullData);

    res.status(200).json({
      status: 'success',
      data: updatedBull
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBull = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    
    await bullService.deleteBull(bullId);

    res.status(200).json({
      status: 'success',
      message: 'Byk został usunięty'
    });
  } catch (error) {
    next(error);
  }
};
BULLCONTROLLERJS

# Dodanie kontrolera inseminacji
cat > controllers/inseminationController.js << 'INSEMCONTROLLERJS'
const inseminationService = require('../services/inseminationService');
const { AppError } = require('../middleware/errorHandler');

exports.getInsemination = async (req, res, next) => {
  try {
    const inseminationId = req.params.id;
    const insemination = await inseminationService.getInsemination(inseminationId);
    
    // Sprawdzenie czy inseminacja należy do zalogowanego użytkownika
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tego wpisu inseminacji', 403));
    }

    res.status(200).json({
      status: 'success',
      data: insemination
    });
  } catch (error) {
    next(error);
  }
};

exports.getAnimalInseminations = async (req, res, next) => {
  try {
    const animalId = req.params.animalId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await inseminationService.getAnimalInseminations(animalId, page, limit);
    
    // Tutaj można dodać sprawdzenie czy zwierzę należy do użytkownika
    // W tym przypadku zakładamy, że walidacja jest w serwisie

    res.status(200).json({
      status: 'success',
      data: {
        animal: result.animal,
        inseminations: result.inseminations
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserInseminations = async (req, res, next) => {
  try {
    const ownerId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Obsługa filtrów
    const filters = {};
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (req.query.animalId) filters.animalId = req.query.animalId;
    
    const result = await inseminationService.getOwnerInseminations(ownerId, page, limit, filters);

    res.status(200).json({
      status: 'success',
      data: result.inseminations,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.createInsemination = async (req, res, next) => {
  try {
    // Przypisujemy inseminację do zalogowanego użytkownika
    const inseminationData = {
      animal_id: req.body.animal_id,
      certificate_number: req.body.certificate_number,
      file_number: req.body.file_number,
      procedure_number: req.body.procedure_number,
      re_insemination: req.body.re_insemination,
      procedure_date: req.body.procedure_date,
      herd_number: req.body.herd_number,
      herd_eval_number: req.body.herd_eval_number,
      dam_owner: req.body.dam_owner,
      ear_tag_number: req.body.ear_tag_number,
      last_calving_date: req.body.last_calving_date,
      name: req.body.name,
      bull_type: req.body.bull_type,
      supplier: req.body.supplier,
      inseminator: req.body.inseminator,
      symlek_status: req.body.symlek_status,
      symlek_responsibility: req.body.symlek_responsibility,
      owner_id: req.userId,
      bull_id: req.body.bull_id
    };

    const insemination = await inseminationService.createInsemination(inseminationData);

    res.status(201).json({
      status: 'success',
      data: insemination
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInsemination = async (req, res, next) => {
  try {
    const inseminationId = req.params.id;
    
    // Sprawdzamy, czy inseminacja należy do zalogowanego użytkownika
    const insemination = await inseminationService.getInsemination(inseminationId);
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tego wpisu inseminacji', 403));
    }
    
    const inseminationData = {
      certificate_number: req.body.certificate_number,
      file_number: req.body.file_number,
      procedure_number: req.body.procedure_number,
      re_insemination: req.body.re_insemination,
      procedure_date: req.body.procedure_date,
      herd_number: req.body.herd_number,
      herd_eval_number: req.body.herd_eval_number,
      dam_owner: req.body.dam_owner,
      ear_tag_number: req.body.ear_tag_number,
      last_calving_date: req.body.last_calving_date,
      name: req.body.name,
      bull_type: req.body.bull_type,
      supplier: req.body.supplier,
      inseminator: req.body.inseminator,
      symlek_status: req.body.symlek_status,
      symlek_responsibility: req.body.symlek_responsibility,
      bull_id: req.body.bull_id
    };

    const updatedInsemination = await inseminationService.updateInsemination(
      inseminationId, 
      inseminationData
    );

    res.status(200).json({
      status: 'success',
      data: updatedInsemination
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteInsemination = async (req, res, next) => {
  try {
    const inseminationId = req.params.id;
    
    // Sprawdzamy, czy inseminacja należy do zalogowanego użytkownika
    const insemination = await inseminationService.getInsemination(inseminationId);
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tego wpisu inseminacji', 403));
    }

    await inseminationService.deleteInsemination(inseminationId);

    res.status(200).json({
      status: 'success',
      message: 'Wpis inseminacji został usunięty'
    });
  } catch (error) {
    next(error);
  }
};
INSEMCONTROLLERJS

# Dodanie kontrolera kluczy
cat > controllers/keyController.js << 'KEYCONTROLLERJS'
const keyService = require('../services/keyService');
const { AppError } = require('../middleware/errorHandler');

exports.getUserKey = async (req, res, next) => {
  try {
    const userId = req.userId;
    const key = await keyService.getUserKey(userId);
    
    if (!key) {
      return res.status(404).json({
        status: 'fail',
        message: 'Klucz nie znaleziony'
      });
    }

    res.status(200).json({
      status: 'success',
      data: key
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrUpdateUserKey = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { public_key, backup_encrypted_private_key } = req.body;
    
    if (!public_key) {
      return next(new AppError('Klucz publiczny jest wymagany', 400));
    }
    
    const keyData = {
      public_key,
      backup_encrypted_private_key
    };
    
    const key = await keyService.createOrUpdateUserKey(userId, keyData);

    res.status(200).json({
      status: 'success',
      data: key
    });
  } catch (error) {
    next(error);
  }
};
KEYCONTROLLERJS

# Dodanie kontrolera wizyt
cat > controllers/visitController.js << 'VISITCONTROLLERJS'
const visitService = require('../services/visitService');
const { AppError } = require('../middleware/errorHandler');

exports.getVisit = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    const visit = await visitService.getVisit(visitId);
    
    // Sprawdzenie czy wizyta dotyczy zalogowanego użytkownika
    // Może być farmerId, vetId lub employeeId
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tej wizyty', 403));
    }

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

exports.getFarmerVisits = async (req, res, next) => {
  try {
    const farmerId = req.userId; // Pobieramy wizyty zalogowanego użytkownika
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await visitService.getFarmerVisits(farmerId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result.visits,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.getVetVisits = async (req, res, next) => {
  try {
    const vetId = req.userId; // Pobieramy wizyty zalogowanego weterynarza
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await visitService.getVetVisits(vetId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result.visits,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

exports.createVisit = async (req, res, next) => {
  try {
    const visitData = {
      farmer_id: req.body.farmer_id,
      vet_id: req.body.vet_id,
      visit_date: req.body.visit_date,
      description: req.body.description,
      status: req.body.status || 'Scheduled',
      employee_id: req.body.employee_id,
      channel: req.body.channel
    };

    const visit = await visitService.createVisit(visitData);

    res.status(201).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

exports.updateVisit = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    
    // Sprawdzamy, czy wizyta dotyczy zalogowanego użytkownika
    const visit = await visitService.getVisit(visitId);
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tej wizyty', 403));
    }
    
    const visitData = {
      visit_date: req.body.visit_date,
      description: req.body.description,
      status: req.body.status,
      vet_id: req.body.vet_id,
      employee_id: req.body.employee_id,
      channel: req.body.channel
    };

    const updatedVisit = await visitService.updateVisit(visitId, visitData);

    res.status(200).json({
      status: 'success',
      data: updatedVisit
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteVisit = async (req, res, next) => {
  try {
    const visitId = req.params.id;
    
    // Sprawdzamy, czy wizyta dotyczy zalogowanego użytkownika
    const visit = await visitService.getVisit(visitId);
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tej wizyty', 403));
    }

    await visitService.deleteVisit(visitId);

    res.status(200).json({
      status: 'success',
      message: 'Wizyta została usunięta'
    });
  } catch (error) {
    next(error);
  }
};
VISITCONTROLLERJS

# Dodanie pozostałych serwisów
cat > services/organizationService.js << 'ORGSERVICEJS'
const organizationRepository = require('../repositories/organizationRepository');

class OrganizationService {
  async getOrganization(organizationId) {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organizacja nie znaleziona');
    }
    return organization;
  }

  async createOrganization(organizationData, userId) {
    // Utwórz organizację
    const newOrganization = await organizationRepository.create(organizationData);
    
    // Przypisz użytkownika jako administratora
    await organizationRepository.addUserToOrganization(newOrganization.id, userId, 'admin');
    
    return newOrganization;
  }

  async addUserToOrganization(organizationId, userId, role = 'member') {
    // Sprawdź czy organizacja istnieje
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organizacja nie znaleziona');
    }
    
    // Dodaj użytkownika do organizacji
    return await organizationRepository.addUserToOrganization(organizationId, userId, role);
  }

  async getUserOrganizations(userId) {
    return await organizationRepository.getUserOrganizations(userId);
  }

  async checkUserPermission(organizationId, userId, requiredRole = null) {
    const userRole = await organizationRepository.getUserRole(organizationId, userId);
    
    if (!userRole) {
      return false;
    }
    
    if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
      return false;
    }
    
    return true;
  }
}

module.exports = new OrganizationService();
ORGSERVICEJS

# Dodanie pozostałych tras
cat > routes/userRoutes.js << 'USERROUTESJS'
const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Wszystkie trasy wymagają uwierzytelnienia
router.use(verifyToken);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Pobieranie profilu użytkownika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil użytkownika
 *       401:
 *         description: Brak autentykacji
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Aktualizacja profilu użytkownika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil zaktualizowany
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji
 */
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Zmiana hasła użytkownika
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hasło zmienione
 *       400:
 *         description: Błędne dane wejściowe
 *       401:
 *         description: Brak autentykacji lub nieprawidłowe hasło
 */
router.post('/change-password', userController.changePassword);

module.exports = router;
USERROUTESJS

# Aktualizacja głównego pliku aplikacji
cat > app.js << 'APPJS'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Konfiguracja zmiennych środowiskowych
dotenv.config();

// Import tras
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
// Pozostałe trasy można dodać później

// Import middleware
const { defaultLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Inicjalizacja aplikacji Express
const app = express();

// Konfiguracja Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AmicusApp API',
      version: '1.0.0',
      description: 'API dla aplikacji AmicusApp do zarządzania inseminacją i hodowlą',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Serwer deweloperski',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(cors()); // Pozwala na żądania CORS
app.use(helmet()); // Zabezpieczenia nagłówków HTTP
app.use(express.json()); // Parsowanie JSON w ciele żądania
app.use(express.urlencoded({ extended: true })); // Parsowanie danych formularzy

// Aplikowanie limitera domyślnego
app.use(defaultLimiter);

// Trasy API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Pozostałe trasy można dodać później

// Dokumentacja Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Obsługa nieznanych tras
app.use(notFoundHandler);

// Obsługa błędów
app.use(errorHandler);

// Ustawienia portu i uruchomienie serwera
const PORT = process.env.PORT || 4000;

module.exports = app;
APPJS

# Nadaj uprawnienia wykonywania do skryptu
chmod +x "$0"

echo "Dodatkowe kontrolery i trasy zostały utworzone!"
echo "Teraz zrestartuj serwer, aby wprowadzić zmiany w życie."
