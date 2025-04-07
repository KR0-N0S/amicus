/**
 * Kontroler operacji na zwierzętach
 * @author KR0-N0S
 * @date 2025-04-06
 */

const animalService = require('../services/animalService');
const { AppError } = require('../middleware/errorHandler');
const { HTTP_STATUS, PAGINATION, ANIMAL_TYPES, SEARCH } = require('../config/constants');
const ROLES = require('../constants/roles');
const { verifyResourceAccess } = require('../middleware/resourceAccessMiddleware');

// Uwaga: w tym podejściu, middleware weryfikujący dostęp powinien być użyty
// w definicjach tras (routes) przed wywołaniem kontrolerów

exports.getAnimal = async (req, res, next) => {
  try {
    const animalId = req.params.id;
    const animal = await animalService.getAnimal(animalId);
    
    res.status(HTTP_STATUS.OK).json({
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
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_PAGE_SIZE, PAGINATION.MAX_PAGE_SIZE);
    const animalType = req.query.type; // 'companion' lub 'farm'
    const ownerId = req.query.owner_id;
    const userRoleInOrg = req.userRoleInOrg?.toLowerCase();
    
    // Bezpieczne pobieranie parametru wyszukiwania
    const searchTerm = req.query.search || '';
    const trimmedSearchTerm = searchTerm.trim();
    
    // Sprawdzenie czy fraza ma co najmniej 3 znaki - tylko wtedy stosujemy wyszukiwanie
    const hasValidSearchTerm = trimmedSearchTerm.length >= SEARCH.MIN_SEARCH_LENGTH;
    
    // Pobranie organizationId - sprawdzamy różne źródła
    let organizationId = req.organizationId || req.params.organizationId || req.query.organizationId || req.body.organizationId;
    
    // Jeśli nie znaleziono, próbujemy pobrać z tokenu (req.userOrganizations)
    if (!organizationId && req.userOrganizations && req.userOrganizations.length > 0) {
      organizationId = req.userOrganizations[0].id;
      console.log(`[ANIMAL_CONTROLLER] Automatycznie wybrano organizację ${organizationId} z tokenu JWT`);
      
      // Zapisujemy wybraną organizację w req dla ewentualnego dalszego użycia
      req.organizationId = organizationId;
    }
    
    // Wybór strategii pobierania zwierząt w zależności od roli, parametrów oraz frazy wyszukiwania
    let result;
    
    try {
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
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'Nie można określić organizacji - proszę wybrać organizację'
          });
        }
      } else {
        // Jeśli fraza jest krótsza niż 3 znaki, używamy standardowych metod pobierania
        if (trimmedSearchTerm.length > 0 && trimmedSearchTerm.length < SEARCH.MIN_SEARCH_LENGTH) {
          console.log(`[ANIMAL_CONTROLLER] Fraza wyszukiwania "${trimmedSearchTerm}" jest za krótka (min. ${SEARCH.MIN_SEARCH_LENGTH} znaki). Pobieranie wszystkich danych.`);
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
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            status: 'error',
            message: 'Nie można określić organizacji - proszę wybrać organizację'
          });
        }
      }
    } catch (error) {
      console.error('[ANIMAL_CONTROLLER] Błąd podczas operacji wyszukiwania/pobierania zwierząt:', error);
      
      // Fallback do pustego wyniku w przypadku błędu
      result = { 
        animals: [], 
        pagination: { 
          page, 
          limit, 
          totalCount: 0, 
          totalPages: 1 
        } 
      };
    }

    // Zabezpieczenia w przypadku nieprawidłowej struktury wyniku
    if (!result) {
      result = { 
        animals: [], 
        pagination: { 
          page, 
          limit, 
          totalCount: 0, 
          totalPages: 1 
        } 
      };
    }
    
    if (!result.animals) {
      result.animals = [];
    }
    
    if (!result.pagination) {
      result.pagination = { 
        page, 
        limit, 
        totalCount: 0, 
        totalPages: 1 
      };
    }

    // Dodajemy logowanie po bezpiecznym sprawdzeniu result
    console.log(`[ANIMAL_CONTROLLER] Pobrano ${result.animals.length} zwierząt`);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      data: result.animals,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[ANIMAL_CONTROLLER] Błąd podczas przetwarzania żądania:', error);
    next(error);
  }
};

exports.createAnimal = async (req, res, next) => {
  try {
    // Przygotowujemy dane do zapisania - usuwamy pola nieistniejące w tabeli animals
    const animalData = {
      // Dane podstawowe zwierzęcia
      owner_id: req.body.owner_id || req.userId,
      organization_id: req.organizationId, // Już zweryfikowane przez middleware
      species: req.body.species,
      animal_type: req.body.animal_type,
      sex: req.body.sex,
      breed: req.body.breed,
      birth_date: req.body.birth_date,
      weight: req.body.weight ? Number(req.body.weight) : null,
      photo: req.body.photo,
      notes: req.body.notes
      // Usunięto pola registration_date i age, które nie istnieją w tabeli animals
    };

    // Dane specyficzne dla typu zwierzęcia - zachowujemy registration_date tylko w farm_animal
    if (req.body.animal_type === ANIMAL_TYPES.FARM) {
      const farmAnimal = req.body.farm_animal || {};
      
      // Jeśli registration_date jest w głównym obiekcie, przenieś do farm_animal
      if (req.body.registration_date && !farmAnimal.registration_date) {
        farmAnimal.registration_date = req.body.registration_date;
      }
      
      // Zapewniamy, że mamy identifier
      if (!farmAnimal.identifier && req.body.animal_number) {
        farmAnimal.identifier = req.body.animal_number;
      }
      
      animalData.farm_animal = farmAnimal;
      animalData.animal_number = farmAnimal.identifier; // Pomocnicze pole, nie zapisywane do DB
    } else if (req.body.animal_type === ANIMAL_TYPES.COMPANION && req.body.companion_animal) {
      animalData.companion_animal = req.body.companion_animal;
    }

    const animal = await animalService.createAnimal(animalData);

    res.status(HTTP_STATUS.CREATED).json({
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
    
    // Pobierz aktualne dane zwierzęcia
    const animal = await animalService.getAnimal(animalId);
    
    // Middleware verifyResourceAccess już sprawdził uprawnienia na poziomie organizacji
    // Nie musimy dodatkowo sprawdzać uprawnień właściciela
    
    // Przygotowujemy dane do aktualizacji
    const animalData = {
      // Dane podstawowe zwierzęcia - nie aktualizujemy owner_id
      species: req.body.species,
      animal_type: req.body.animal_type || animal.animal_type,
      sex: req.body.sex,
      breed: req.body.breed,
      birth_date: req.body.birth_date,
      registration_date: req.body.registration_date,
      age: req.body.age,
      weight: req.body.weight,
      photo: req.body.photo,
      notes: req.body.notes,
      // Dane dla logiki biznesowej
      currentUserId: req.userId
    };

    // Dane specyficzne dla typu zwierzęcia
    if (animal.animal_type === ANIMAL_TYPES.FARM && req.body.farm_animal) {
      animalData.farm_animal = req.body.farm_animal;
    } else if (animal.animal_type === ANIMAL_TYPES.COMPANION && req.body.companion_animal) {
      animalData.companion_animal = req.body.companion_animal;
    }

    const updatedAnimal = await animalService.updateAnimal(animalId, animalData);

    res.status(HTTP_STATUS.OK).json({
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
    
    // Pobranie informacji o zwierzęciu - middleware już zweryfikował uprawnienia
    await animalService.getAnimal(animalId);
    
    await animalService.deleteAnimal(animalId);

    res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Zwierzę zostało usunięte'
    });
  } catch (error) {
    next(error);
  }
};