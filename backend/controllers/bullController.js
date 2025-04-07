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

exports.getBulls = async (req, res, next) => {
  try {
    // Pobranie parametrów z zapytania
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const ownerId = req.query.owner_id;
    const userRoleInOrg = req.userRoleInOrg?.toLowerCase();
    
    // Filtry i sortowanie
    const filters = {
      bull_type: req.query.bull_type,
      breed: req.query.breed,
      owner_id: req.query.owner_id
    };
    
    const sorting = {
      field: req.query.sort_field || 'identification_number',
      direction: req.query.sort_direction || 'asc'
    };
    
    // Bezpieczne pobieranie parametru wyszukiwania
    const searchTerm = req.query.search || '';
    const trimmedSearchTerm = searchTerm.trim();
    
    // Sprawdzenie czy fraza ma co najmniej 2 znaki - tylko wtedy stosujemy wyszukiwanie
    const hasValidSearchTerm = trimmedSearchTerm.length >= 2;
    
    // Pobranie organizationId z różnych źródeł
    let organizationId = req.organizationId;
    
    // Jeśli brak organizationId w req, próbujemy pobrać z user.organizations
    if (!organizationId && req.user && req.user.organizations && req.user.organizations.length > 0) {
      organizationId = req.user.organizations[0].id;
      // Zapisz na req dla ewentualnego dalszego użycia
      req.organizationId = organizationId;
      console.log(`[BULL_CONTROLLER] Pobrano organizationId z user.organizations: ${organizationId}`);
    }
    
    // Wybór strategii pobierania buhajów w zależności od roli, parametrów oraz frazy wyszukiwania
    let result;
    
    // Używamy metod wyszukiwania tylko jeśli fraza ma co najmniej 2 znaki
    if (hasValidSearchTerm) {
      console.log(`[BULL_CONTROLLER] Wyszukiwanie buhajów dla frazy: "${trimmedSearchTerm}" (długość: ${trimmedSearchTerm.length})`);
      
      result = await bullService.searchBulls(trimmedSearchTerm, filters, sorting, page, limit);
    } else {
      // Jeśli fraza jest krótsza niż 2 znaki, używamy standardowych metod pobierania
      if (trimmedSearchTerm.length > 0 && trimmedSearchTerm.length < 2) {
        console.log(`[BULL_CONTROLLER] Fraza wyszukiwania "${trimmedSearchTerm}" jest za krótka (min. 2 znaki). Pobieranie wszystkich danych.`);
      }
      
      if (ownerId) {
        result = await bullService.getOwnerBulls(ownerId, page, limit);
      }
      else if (organizationId) {
        result = await bullService.getOrganizationBulls(organizationId, page, limit);
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
      result = { bulls: [], pagination: { totalCount: 0, totalPages: 0, currentPage: page, pageSize: limit } };
    }
    
    // Zabezpieczenie przed undefined bulls
    if (!result.bulls) {
      result.bulls = [];
    }
    
    // Zabezpieczenie przed undefined pagination
    if (!result.pagination) {
      result.pagination = { totalCount: 0, totalPages: 0, currentPage: page, pageSize: limit };
    }

    // Dodajemy logowanie po bezpiecznym sprawdzeniu result
    console.log(`[BULL_CONTROLLER] Pobrano ${result.bulls.length} buhajów`);

    res.status(200).json({
      status: 'success',
      data: result.bulls,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[BULL_CONTROLLER] Błąd podczas pobierania buhajów:', error);
    next(error);
  }
};

exports.createBull = async (req, res, next) => {
  try {
    // Przygotowujemy dane buhaja
    const bullData = {
      name: req.body.name,
      identification_number: req.body.identification_number,
      veterinary_number: req.body.veterinary_number,
      breed: req.body.breed,
      bull_type: req.body.bull_type,
      owner_id: req.body.owner_id || req.userId,
      sire_id: req.body.sire_id,
      dam_id: req.body.dam_id
    };

    // Jeśli próbujemy dodać buhaja dla innego użytkownika, sprawdź uprawnienia
    if (bullData.owner_id !== req.userId) {
      // Tutaj można dodać logikę sprawdzania uprawnień
    }

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
    
    // Sprawdzamy, czy buhaj istnieje
    const bull = await bullService.getBull(bullId);
    
    // Przygotowujemy dane do aktualizacji
    const bullData = {
      name: req.body.name,
      identification_number: req.body.identification_number,
      veterinary_number: req.body.veterinary_number,
      breed: req.body.breed,
      bull_type: req.body.bull_type,
      sire_id: req.body.sire_id,
      dam_id: req.body.dam_id
    };

    // Usuwamy undefined wartości
    Object.keys(bullData).forEach(key => bullData[key] === undefined && delete bullData[key]);

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
      message: 'Buhaj został usunięty'
    });
  } catch (error) {
    next(error);
  }
};

exports.getBullStats = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    const stats = await bullService.getBullStats(bullId);
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

exports.getBullDeliveries = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const deliveries = await bullService.getBullDeliveries(bullId, page, limit);
    
    res.status(200).json({
      status: 'success',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

exports.getBullInseminations = async (req, res, next) => {
  try {
    const bullId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const inseminations = await bullService.getBullInseminations(bullId, page, limit);
    
    res.status(200).json({
      status: 'success',
      data: inseminations
    });
  } catch (error) {
    next(error);
  }
};