/**
 * Kontroler obsługujący operacje na dostawcach nasienia
 * @author KR0-N0S
 * @date 2025-04-04
 */

const semenProviderService = require('../services/semenProviderService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Pobieranie jednego dostawcy nasienia po ID
 */
exports.getProvider = async (req, res, next) => {
  try {
    const providerId = req.params.id;
    const provider = await semenProviderService.getProvider(providerId);
    
    res.status(200).json({
      status: 'success',
      data: provider
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pobieranie listy publicznych dostawców nasienia
 */
exports.getPublicProviders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Pobieramy publiczne dostawcy
    const result = await semenProviderService.getPublicProviders(page, limit);
    
    res.status(200).json({
      status: 'success',
      data: result.providers,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[PROVIDER_CONTROLLER] Błąd podczas pobierania publicznych dostawców nasienia:', error);
    next(error);
  }
};

/**
 * Pobieranie listy dostawców nasienia
 */
exports.getProviders = async (req, res, next) => {
  try {
    // Pobranie parametrów z zapytania
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const ownerId = req.query.owner_id;
    const includePublic = req.query.include_public !== 'false'; // Domyślnie true
    const userRoleInOrg = req.userRoleInOrg?.toLowerCase();
    
    // Bezpieczne pobieranie parametru wyszukiwania
    const searchTerm = req.query.search || '';
    const trimmedSearchTerm = searchTerm.trim();
    
    // Sprawdzenie czy fraza ma co najmniej 3 znaki - tylko wtedy stosujemy wyszukiwanie
    const hasValidSearchTerm = trimmedSearchTerm.length >= 3;
    
    // Pobranie organizationId
    const organizationId = req.organizationId;
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie można określić organizacji - proszę wybrać organizację'
      });
    }
    
    // Wybór strategii pobierania dostawców w zależności od roli, parametrów oraz frazy wyszukiwania
    let result;
    
    // Używamy metod wyszukiwania tylko jeśli fraza ma co najmniej 3 znaki
    if (hasValidSearchTerm) {
      console.log(`[PROVIDER_CONTROLLER] Wyszukiwanie dostawców dla frazy: "${trimmedSearchTerm}" (długość: ${trimmedSearchTerm.length})`);
      
      // Wybieramy metodę wyszukiwania w zależności od uprawnień i parametrów
      if (userRoleInOrg === 'client' || userRoleInOrg === 'farmer') {
        // Klient/farmer może przeszukiwać tylko swoich dostawców
        result = await semenProviderService.searchProvidersByOwnerId(trimmedSearchTerm, req.userId, page, limit);
      }
      else if (ownerId) {
        // Wyszukiwanie w dostawcach konkretnego właściciela
        result = await semenProviderService.searchProvidersByOwnerId(trimmedSearchTerm, ownerId, page, limit);
      }
      else {
        // Wyszukiwanie w dostawcach całej organizacji z uwzględnieniem publicznych
        result = await semenProviderService.searchProvidersByOrganizationId(trimmedSearchTerm, organizationId, page, limit, includePublic);
      }
    } else {
      // Jeśli fraza jest krótsza niż 3 znaki, używamy standardowych metod pobierania
      if (trimmedSearchTerm.length > 0 && trimmedSearchTerm.length < 3) {
        console.log(`[PROVIDER_CONTROLLER] Fraza wyszukiwania "${trimmedSearchTerm}" jest za krótka (min. 3 znaki). Pobieranie wszystkich danych.`);
      }
      
      if (userRoleInOrg === 'client' || userRoleInOrg === 'farmer') {
        result = await semenProviderService.getOwnerProviders(req.userId, page, limit);
      }
      else if (ownerId) {
        result = await semenProviderService.getOwnerProviders(ownerId, page, limit);
      }
      else {
        result = await semenProviderService.getOrganizationProviders(organizationId, page, limit, includePublic);
      }
    }

    // Zabezpieczenie przed undefined result
    if (!result) {
      result = { providers: [], pagination: { currentPage: page, pageSize: limit, totalCount: 0, totalPages: 0 } };
    }
    
    // Zabezpieczenie przed undefined providers
    if (!result.providers) {
      result.providers = [];
    }
    
    // Zabezpieczenie przed undefined pagination
    if (!result.pagination) {
      result.pagination = { currentPage: page, pageSize: limit, totalCount: 0, totalPages: 0 };
    }

    console.log(`[PROVIDER_CONTROLLER] Pobrano ${result.providers.length} dostawców nasienia`);

    // Dodanie flagi is_public na podstawie organization_id
    result.providers = result.providers.map(provider => ({
      ...provider,
      is_public: provider.organization_id === null
    }));

    res.status(200).json({
      status: 'success',
      data: result.providers,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[PROVIDER_CONTROLLER] Błąd podczas pobierania dostawców nasienia:', error);
    next(error);
  }
};

/**
 * Tworzenie dostawcy nasienia
 */
exports.createProvider = async (req, res, next) => {
  try {
    // Przygotowujemy dane 
    const providerData = {
      owner_id: req.body.owner_id || req.userId,
      name: req.body.name,
      vet_id_number: req.body.vet_id_number,
      address_street: req.body.address_street,
      address_city: req.body.address_city,
      address_postal_code: req.body.address_postal_code,
      address_province: req.body.address_province,
      address_country: req.body.address_country,
      contact_phone: req.body.contact_phone,
      contact_email: req.body.contact_email,
      is_public: req.body.is_public === true,
      organization_id: req.body.is_public === true ? null : req.organizationId
    };

    // Jeśli próbujemy dodać dostawcę innemu użytkownikowi, sprawdź uprawnienia
    if (providerData.owner_id !== req.userId) {
      // Użytkownik musi mieć uprawnienia administracyjne w organizacji
      const userRole = req.userRoleInOrg?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'vet') {
        return next(new AppError('Brak uprawnień do tworzenia dostawców dla innych użytkowników', 403));
      }
    }

    // Sprawdzenie uprawnień do tworzenia publicznego dostawcy
    if (providerData.is_public === true) {
      const userRole = req.userRoleInOrg?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'manager') {
        return next(new AppError('Tylko administrator lub manager może tworzyć publicznych dostawców', 403));
      }
    }

    const provider = await semenProviderService.createProvider(providerData);

    res.status(201).json({
      status: 'success',
      data: {
        ...provider,
        is_public: provider.organization_id === null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualizacja dostawcy nasienia
 */
exports.updateProvider = async (req, res, next) => {
  try {
    const providerId = req.params.id;
    
    // Sprawdzamy czy dostawca istnieje
    const provider = await semenProviderService.getProvider(providerId);
    
    // Przygotowujemy dane do aktualizacji
    const providerData = {
      name: req.body.name,
      vet_id_number: req.body.vet_id_number,
      address_street: req.body.address_street,
      address_city: req.body.address_city,
      address_postal_code: req.body.address_postal_code,
      address_province: req.body.address_province,
      address_country: req.body.address_country,
      contact_phone: req.body.contact_phone,
      contact_email: req.body.contact_email,
      is_public: req.body.is_public === true,
      organization_id: req.body.is_public === true ? null : req.organizationId
    };

    // Sprawdzamy uprawnienia użytkownika
    if (provider.owner_id !== req.userId) {
      const userRole = req.userRoleInOrg?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'vet') {
        return next(new AppError('Brak uprawnień do edycji tego dostawcy nasienia', 403));
      }
      
      // Sprawdzamy czy dostawca należy do tej samej organizacji
      const belongsToOrg = await semenProviderService.belongsToOrganization(providerId, req.organizationId);
      if (!belongsToOrg) {
        return next(new AppError('Dostawca nasienia nie należy do twojej organizacji', 403));
      }
    }

    // Jeśli zmienia się status na publiczny, sprawdź uprawnienia
    if (req.body.is_public === true && provider.organization_id !== null) {
      const userRole = req.userRoleInOrg?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'manager') {
        return next(new AppError('Tylko administrator lub manager może ustawić dostawcę jako publicznego', 403));
      }
    }

    const updatedProvider = await semenProviderService.updateProvider(providerId, providerData);

    res.status(200).json({
      status: 'success',
      data: {
        ...updatedProvider,
        is_public: updatedProvider.organization_id === null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Usuwanie dostawcy nasienia
 */
exports.deleteProvider = async (req, res, next) => {
  try {
    const providerId = req.params.id;
    
    // Sprawdzamy czy dostawca istnieje
    const provider = await semenProviderService.getProvider(providerId);
    
    // Sprawdzamy uprawnienia użytkownika
    if (provider.owner_id !== req.userId) {
      const userRole = req.userRoleInOrg?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'manager') {
        return next(new AppError('Brak uprawnień do usunięcia tego dostawcy nasienia', 403));
      }
      
      // Sprawdzamy czy dostawca należy do tej samej organizacji
      // Dla publicznych dostawców, tylko admin/manager może je usuwać
      if (provider.organization_id !== null) {
        const belongsToOrg = await semenProviderService.belongsToOrganization(providerId, req.organizationId);
        if (!belongsToOrg) {
          return next(new AppError('Dostawca nasienia nie należy do twojej organizacji', 403));
        }
      }
    }

    await semenProviderService.deleteProvider(providerId);

    res.status(200).json({
      status: 'success',
      message: 'Dostawca nasienia został usunięty'
    });
  } catch (error) {
    next(error);
  }
};