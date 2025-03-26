const userRepository = require('../repositories/userRepository');
const organizationRepository = require('../repositories/organizationRepository');
const { AppError } = require('../middleware/errorHandler');
const ROLES = require('../constants/roles');

// Helper do usuwania hasła z obiektu użytkownika
const excludePassword = (user) => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Pobranie listy klientów w zależności od roli użytkownika
// Zmiana w getClients, gdzie sprawdzamy rolę
// W metodzie getClients, dodajmy więcej logów
exports.getClients = async (req, res, next) => {
  try {
    const { userId, user } = req;
    let organizationId = req.query.organizationId || 
                      req.params.organizationId || 
                      (user.organizations && user.organizations.length > 0 ? user.organizations[0].id : null);

    console.log(`[CLIENT_CONTROLLER] Pobieranie klientów dla użytkownika ${userId}, organizacja: ${organizationId}`);
    
    let clients = [];
    let userRoleInOrg = null;
    
    // Sprawdź rolę użytkownika w organizacji
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role.toLowerCase(); // Konwertuj na małe litery
      }
    }
    
    console.log(`[CLIENT_CONTROLLER] Rola użytkownika ${userId} w organizacji ${organizationId}: ${userRoleInOrg}`);
    
    // Owner widzi wszystkich w swojej organizacji
    if (userRoleInOrg === 'owner') {
      console.log(`[CLIENT_CONTROLLER] Pobieranie wszystkich użytkowników dla właściciela organizacji ${organizationId}`);
      clients = await userRepository.getUsersByOrganization(organizationId);
      console.log(`[CLIENT_CONTROLLER] Pobrano ${clients.length} użytkowników dla organizacji ${organizationId}`);
    }
    // SuperAdmin widzi wszystkich użytkowników
    else if (userRoleInOrg === 'superadmin') {
      clients = await userRepository.getAllUsers();
    }
    // Employee, OfficeStaff itp. widzą wszystkich klientów (ale nie innych pracowników i właściciela)
    else if (['employee', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(userRoleInOrg)) {
      clients = await userRepository.getClientsInOrganization(
        organizationId, 
        ['owner', 'employee', 'superadmin', 'officestaff', 'inseminator', 'vettech', 'vet']
      );
    }
    // Client, Farmer widzą tylko siebie
    else if (['client', 'farmer'].includes(userRoleInOrg)) {
      const singleUser = await userRepository.getSingleUser(userId);
      clients = singleUser ? [singleUser] : [];
    }
    // Domyślnie - jeśli nie znamy roli lub nie ma organizacji, użytkownik widzi tylko siebie
    else {
      console.log(`[CLIENT_CONTROLLER] Nieznana rola lub brak organizacji, zwracam tylko użytkownika ${userId}`);
      const singleUser = await userRepository.getSingleUser(userId);
      clients = singleUser ? [singleUser] : [];
    }
    
    // Usuń hasła z wyników
    const clientsWithoutPassword = clients.map(excludePassword);
    
    console.log(`[CLIENT_CONTROLLER] Zwracam ${clientsWithoutPassword.length} klientów`);
    
    res.status(200).json({
      status: 'success',
      results: clientsWithoutPassword.length,
      data: {
        clients: clientsWithoutPassword
      }
    });
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas pobierania listy klientów', 500));
  }
};

// Pobranie szczegółów klienta
exports.getClientById = async (req, res, next) => {
  try {
    const { userId, user } = req;
    const { clientId } = req.params;
    const organizationId = req.query.organizationId || 
                          req.params.organizationId || 
                          (user.organizations && user.organizations.length > 0 ? user.organizations[0].id : null);
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg = null;
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role;
      }
    }
    
    // Sprawdzenie czy użytkownik ma uprawnienia do wyświetlenia tego klienta
    let canViewClient = false;
    
    // SuperAdmin i Owner mogą oglądać wszystkich klientów
    if (['SuperAdmin', 'Owner'].includes(userRoleInOrg)) {
      canViewClient = true;
    } 
    // Employee, OfficeStaff itp. mogą oglądać klientów, ale nie innych pracowników
    else if (['Employee', 'OfficeStaff', 'Inseminator', 'VetTech', 'Vet'].includes(userRoleInOrg)) {
      // Sprawdź, czy oglądany klient nie jest pracownikiem/właścicielem
      const clientRole = await organizationRepository.getUserRole(organizationId, clientId);
      canViewClient = !['Owner', 'Employee', 'SuperAdmin', 'OfficeStaff', 'Inseminator', 'VetTech', 'Vet'].includes(clientRole);
    }
    // Client, Farmer mogą oglądać tylko siebie
    else if (['Client', 'Farmer'].includes(userRoleInOrg)) {
      canViewClient = userId.toString() === clientId.toString();
    }
    
    if (!canViewClient) {
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień do wyświetlenia tego klienta'
      });
    }
    
    // Pobierz dane klienta
    const client = await userRepository.getSingleUser(clientId);
    
    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Klient nie został znaleziony'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        client: excludePassword(client)
      }
    });
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas pobierania danych klienta', 500));
  }
};