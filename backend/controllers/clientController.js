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
    
    console.log(`[CLIENT_CONTROLLER] Pobieranie klienta ID ${clientId} dla użytkownika ${userId}, organizacja: ${organizationId}`);
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg = null;
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id && org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role ? userOrg.role.toLowerCase() : null; // Bezpieczne pobranie i konwersja roli
        console.log(`[CLIENT_CONTROLLER] Rola użytkownika ${userId} w organizacji ${organizationId}: ${userRoleInOrg}`);
      }
    }
    
    // Jeśli nie udało się określić roli, zwróć błąd
    if (!userRoleInOrg) {
      console.log(`[CLIENT_CONTROLLER] Nie znaleziono roli użytkownika ${userId} w organizacji ${organizationId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień - nie znaleziono roli w organizacji'
      });
    }
    
    // Sprawdzenie czy użytkownik ma uprawnienia do wyświetlenia tego klienta
    let canViewClient = false;
    
    // Superadmin i Owner mogą oglądać wszystkich klientów - używamy małych liter w porównaniu
    if (['superadmin', 'owner'].includes(userRoleInOrg)) {
      canViewClient = true;
      console.log(`[CLIENT_CONTROLLER] Użytkownik ${userId} ma rolę ${userRoleInOrg} - może oglądać wszystkich klientów`);
    } 
    // Employee, OfficeStaff itp. mogą oglądać klientów, ale nie innych pracowników - używamy małych liter
    else if (['employee', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(userRoleInOrg)) {
      try {
        // Dodajemy obsługę błędu przy pobieraniu roli klienta
        const clientRole = await organizationRepository.getUserRole(organizationId, clientId);
        const clientRoleLower = clientRole ? clientRole.toLowerCase() : null;
        
        console.log(`[CLIENT_CONTROLLER] Rola oglądanego klienta ${clientId}: ${clientRoleLower}`);
        
        // Jeśli nie udało się określić roli klienta, domyślnie zezwalamy na wyświetlenie
        if (!clientRoleLower) {
          canViewClient = true;
          console.log(`[CLIENT_CONTROLLER] Brak roli dla klienta ${clientId}, domyślnie pozwalamy na dostęp`);
        } else {
          canViewClient = !['owner', 'employee', 'superadmin', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(clientRoleLower);
          console.log(`[CLIENT_CONTROLLER] Czy użytkownik ${userId} może oglądać klienta ${clientId}: ${canViewClient}`);
        }
      } catch (roleError) {
        // Jeśli wystąpi błąd przy pobieraniu roli, logujemy go i domyślnie zezwalamy na wyświetlenie
        console.error(`[CLIENT_CONTROLLER] Błąd przy pobieraniu roli klienta ${clientId}:`, roleError);
        canViewClient = true;
        console.log(`[CLIENT_CONTROLLER] Błąd przy pobieraniu roli, domyślnie pozwalamy na dostęp`);
      }
    }
    // Client, Farmer mogą oglądać tylko siebie - używamy małych liter
    else if (['client', 'farmer'].includes(userRoleInOrg)) {
      canViewClient = userId.toString() === clientId.toString();
      console.log(`[CLIENT_CONTROLLER] Klient/Farmer: sprawdzanie czy ${userId} == ${clientId}: ${canViewClient}`);
    }
    
    if (!canViewClient) {
      console.log(`[CLIENT_CONTROLLER] Odmowa dostępu: użytkownik ${userId} (rola: ${userRoleInOrg}) próbował zobaczyć klienta ${clientId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień do wyświetlenia tego klienta'
      });
    }
    
    // Pobierz dane klienta
    try {
      console.log(`[CLIENT_CONTROLLER] Pobieranie danych klienta ${clientId}`);
      const client = await userRepository.getSingleUser(clientId);
      
      if (!client) {
        console.log(`[CLIENT_CONTROLLER] Nie znaleziono klienta o ID ${clientId}`);
        return res.status(404).json({
          status: 'error',
          message: 'Klient nie został znaleziony'
        });
      }
      
      console.log(`[CLIENT_CONTROLLER] Sukces: Pobrano dane klienta ${clientId}`);
      res.status(200).json({
        status: 'success',
        data: {
          client: excludePassword(client)
        }
      });
    } catch (dbError) {
      console.error(`[CLIENT_CONTROLLER] Błąd przy pobieraniu danych klienta ${clientId}:`, dbError);
      next(new AppError('Wystąpił błąd podczas pobierania danych klienta z bazy danych', 500));
    }
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas pobierania danych klienta', 500));
  }
};

// Deaktywacja klienta
exports.deactivateClient = async (req, res, next) => {
  try {
    const { userId, user } = req;
    const { clientId } = req.params;
    const organizationId = req.query.organizationId || 
                          req.params.organizationId || 
                          (user.organizations && user.organizations.length > 0 ? user.organizations[0].id : null);
    
    console.log(`[CLIENT_CONTROLLER] Próba deaktywacji klienta ID ${clientId} przez użytkownika ${userId}, organizacja: ${organizationId}`);
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg = null;
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id && org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role ? userOrg.role.toLowerCase() : null;
        console.log(`[CLIENT_CONTROLLER] Rola użytkownika ${userId} w organizacji ${organizationId}: ${userRoleInOrg}`);
      }
    }
    
    // Tylko owner i officestaff mogą deaktywować klientów
    if (!['owner', 'officestaff'].includes(userRoleInOrg)) {
      console.log(`[CLIENT_CONTROLLER] Odmowa dostępu: użytkownik ${userId} (rola: ${userRoleInOrg}) próbował dezaktywować klienta ${clientId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień do dezaktywacji tego klienta'
      });
    }
    
    // Sprawdź czy klient istnieje i czy należy do organizacji
    const client = await userRepository.getSingleUser(clientId);
    
    if (!client) {
      console.log(`[CLIENT_CONTROLLER] Nie znaleziono klienta o ID ${clientId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Klient nie został znaleziony'
      });
    }
    
    // Sprawdź czy klient należy do organizacji
    const belongsToOrg = client.organizations && client.organizations.some(org => 
      org.id && org.id.toString() === organizationId.toString()
    );
    
    if (!belongsToOrg) {
      console.log(`[CLIENT_CONTROLLER] Klient ${clientId} nie należy do organizacji ${organizationId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Klient nie należy do podanej organizacji'
      });
    }
    
    // Sprawdź czy klient nie jest właścicielem lub pracownikiem (tych nie można dezaktywować)
    const clientRoleInOrg = client.organizations.find(org => 
      org.id && org.id.toString() === organizationId.toString()
    )?.role?.toLowerCase();
    
    if (['owner', 'employee', 'superadmin', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(clientRoleInOrg)) {
      console.log(`[CLIENT_CONTROLLER] Nie można deaktywować użytkownika o roli ${clientRoleInOrg}`);
      return res.status(403).json({
        status: 'error',
        message: `Nie można dezaktywować użytkownika o roli ${clientRoleInOrg}`
      });
    }
    
    // Deaktywuj klienta
    await userRepository.deactivateUser(clientId);
    
    console.log(`[CLIENT_CONTROLLER] Klient ${clientId} został pomyślnie dezaktywowany`);
    
    res.status(200).json({
      status: 'success',
      message: 'Klient został pomyślnie dezaktywowany'
    });
    
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas dezaktywacji klienta', 500));
  }
};