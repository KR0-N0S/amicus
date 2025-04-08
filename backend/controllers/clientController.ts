import { Response, NextFunction } from 'express';
import * as userRepository from '../repositories/userRepository';
import * as organizationRepository from '../repositories/organizationRepository';
import { AppError } from '../middleware/errorHandler';
import { Roles } from '../constants/roles';
import { RequestWithUser, ControllerFunction } from '../types/express';
import { User } from '../types/models/user';

// Helper do usuwania hasła z obiektu użytkownika
const excludePassword = (user: User | null): Omit<User, 'password'> | null => {
  if (!user) return null;
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Pobranie listy klientów w zależności od roli użytkownika
export const getClients: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, user } = req;
    
    if (!userId || !user) {
      throw new AppError('User ID or user object is missing', 400);
    }
    
    // Naprawione operatory logiczne z użyciem nawiasów
    let organizationId: number | undefined = 
      (req.query.organizationId ? parseInt(req.query.organizationId as string) : undefined) || 
      (req.params.organizationId ? parseInt(req.params.organizationId as string) : undefined) || 
      (user.organizations && user.organizations.length > 0 ? parseInt(user.organizations[0].id.toString()) : undefined);

    console.log(`[CLIENT_CONTROLLER] Pobieranie klientów dla użytkownika ${userId}, organizacja: ${organizationId}`);
    
    let clients: User[] = [];
    let userRoleInOrg: string | null = null;
    
    // Sprawdź rolę użytkownika w organizacji
    if (user.organizations && organizationId) {
      const userOrg = user.organizations.find(org => org.id && org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role?.toLowerCase(); // Konwertuj na małe litery
      }
    }
    
    console.log(`[CLIENT_CONTROLLER] Rola użytkownika ${userId} w organizacji ${organizationId}: ${userRoleInOrg}`);
    
    // Owner widzi wszystkich w swojej organizacji
    if (userRoleInOrg === 'owner' && organizationId) {
      console.log(`[CLIENT_CONTROLLER] Pobieranie wszystkich użytkowników dla właściciela organizacji ${organizationId}`);
      clients = await (userRepository as any).getUsersByOrganization(organizationId);
      console.log(`[CLIENT_CONTROLLER] Pobrano ${clients.length} użytkowników dla organizacji ${organizationId}`);
    }
    // SuperAdmin widzi wszystkich użytkowników
    else if (userRoleInOrg === 'superadmin') {
      clients = await (userRepository as any).getAllUsers();
    }
    // Employee, OfficeStaff itp. widzą wszystkich klientów (ale nie innych pracowników i właściciela)
    else if (['employee', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(userRoleInOrg || '') && organizationId) {
      clients = await (userRepository as any).getClientsInOrganization(
        organizationId, 
        ['owner', 'employee', 'superadmin', 'officestaff', 'inseminator', 'vettech', 'vet']
      );
    }
    // Client, Farmer widzą tylko siebie
    else if (['client', 'farmer'].includes(userRoleInOrg || '')) {
      const singleUser = await (userRepository as any).getSingleUser(userId);
      clients = singleUser ? [singleUser] : [];
    }
    // Domyślnie - jeśli nie znamy roli lub nie ma organizacji, użytkownik widzi tylko siebie
    else {
      console.log(`[CLIENT_CONTROLLER] Nieznana rola lub brak organizacji, zwracam tylko użytkownika ${userId}`);
      const singleUser = await (userRepository as any).getSingleUser(userId);
      clients = singleUser ? [singleUser] : [];
    }
    
    // Usuń hasła z wyników
    const clientsWithoutPassword = clients.map(client => excludePassword(client)).filter(client => client !== null) as Omit<User, 'password'>[];
    
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
export const getClientById: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, user } = req;
    
    if (!userId || !user) {
      throw new AppError('User ID or user object is missing', 400);
    }
    
    const clientId = parseInt(req.params.clientId);
    // Naprawione operatory logiczne z użyciem nawiasów
    const organizationId: number | undefined = 
      (req.query.organizationId ? parseInt(req.query.organizationId as string) : undefined) || 
      (req.params.organizationId ? parseInt(req.params.organizationId as string) : undefined) || 
      (user.organizations && user.organizations.length > 0 ? parseInt(user.organizations[0].id.toString()) : undefined);
    
    console.log(`[CLIENT_CONTROLLER] Pobieranie klienta ID ${clientId} dla użytkownika ${userId}, organizacja: ${organizationId}`);
    
    // Reszta funkcji pozostaje bez zmian...
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg: string | null = null;
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
        const clientRole = await (organizationRepository as any).getUserRole(organizationId, clientId);
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
      const client = await (userRepository as any).getSingleUser(clientId);
      
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

// Aktualizacja danych klienta
export const updateClient: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, user } = req;
    
    if (!userId || !user) {
      throw new AppError('User ID or user object is missing', 400);
    }
    
    const clientId = parseInt(req.params.clientId);
const organizationId: number | undefined = 
  (req.query.organizationId ? parseInt(req.query.organizationId as string) : undefined) || 
  (req.params.organizationId ? parseInt(req.params.organizationId as string) : undefined) || 
  (user.organizations && user.organizations.length > 0 ? parseInt(user.organizations[0].id.toString()) : undefined);
    
    console.log(`[CLIENT_CONTROLLER] Aktualizacja klienta ID ${clientId} dla użytkownika ${userId}, organizacja: ${organizationId}`);
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg: string | null = null;
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id && org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role ? userOrg.role.toLowerCase() : null;
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
    
    // Sprawdzenie czy użytkownik ma uprawnienia do aktualizacji tego klienta
    let canEditClient = false;
    
    // SuperAdmin, Owner i OfficeStaff mogą aktualizować dane klientów
    if (['superadmin', 'owner', 'officestaff'].includes(userRoleInOrg)) {
      canEditClient = true;
      console.log(`[CLIENT_CONTROLLER] Użytkownik ${userId} ma rolę ${userRoleInOrg} - może aktualizować dane klientów`);
    } 
    // Użytkownik może aktualizować swoje własne dane
    else if (userId.toString() === clientId.toString()) {
      canEditClient = true;
      console.log(`[CLIENT_CONTROLLER] Użytkownik aktualizuje swoje własne dane`);
    }
    
    if (!canEditClient) {
      console.log(`[CLIENT_CONTROLLER] Odmowa dostępu: użytkownik ${userId} (rola: ${userRoleInOrg}) próbował zaktualizować klienta ${clientId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień do aktualizacji danych tego klienta'
      });
    }
    
    // Pobierz dane klienta aby sprawdzić czy istnieje
    const existingClient = await (userRepository as any).getSingleUser(clientId);
    
    if (!existingClient) {
      console.log(`[CLIENT_CONTROLLER] Nie znaleziono klienta o ID ${clientId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Klient nie został znaleziony'
      });
    }
    
    // Walidacja danych wejściowych
    const updateData = {
      email: req.body.email || existingClient.email,
      first_name: req.body.first_name || existingClient.first_name,
      last_name: req.body.last_name || existingClient.last_name,
      phone: req.body.phone || existingClient.phone,
      street: req.body.street || existingClient.street,
      house_number: req.body.house_number || existingClient.house_number,
      city: req.body.city || existingClient.city,
      postal_code: req.body.postal_code || existingClient.postal_code,
      tax_id: req.body.tax_id || existingClient.tax_id
    };
    
    // Sprawdź, czy email już istnieje (jeśli został zmieniony)
    if (updateData.email !== existingClient.email) {
      const emailExists = await userRepository.findByEmail(updateData.email);
      if (emailExists) {
        console.log(`[CLIENT_CONTROLLER] Email ${updateData.email} jest już używany przez innego użytkownika`);
        return res.status(409).json({
          status: 'error',
          message: 'Adres email jest już używany przez innego użytkownika'
        });
      }
    }
    
    console.log(`[CLIENT_CONTROLLER] Aktualizacja danych klienta ${clientId}`);
    const updatedClient = await (userRepository as any).updateUser(clientId, updateData);
    
    console.log(`[CLIENT_CONTROLLER] Sukces: Zaktualizowano dane klienta ${clientId}`);
    res.status(200).json({
      status: 'success',
      data: {
        client: excludePassword(updatedClient)
      }
    });
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas aktualizacji danych klienta', 500));
  }
};

// Zmieniona funkcja deactivateClient - teraz usuwa powiązanie zamiast dezaktywacji konta
export const deactivateClient: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, user } = req;
    
    if (!userId || !user) {
      throw new AppError('User ID or user object is missing', 400);
    }
    
    const clientId = parseInt(req.params.clientId);
    const organizationId: number | undefined = 
  (req.query.organizationId ? parseInt(req.query.organizationId as string) : undefined) || 
  (req.params.organizationId ? parseInt(req.params.organizationId as string) : undefined) || 
  (user.organizations && user.organizations.length > 0 ? parseInt(user.organizations[0].id.toString()) : undefined);
    
    console.log(`[CLIENT_CONTROLLER] Próba usunięcia powiązania klienta ID ${clientId} z organizacją ${organizationId} przez użytkownika ${userId}`);
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg: string | null = null;
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id && org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role ? userOrg.role.toLowerCase() : null;
        console.log(`[CLIENT_CONTROLLER] Rola użytkownika ${userId} w organizacji ${organizationId}: ${userRoleInOrg}`);
      }
    }
    
    // Tylko owner i officestaff mogą usuwać powiązania klientów
    if (!userRoleInOrg || !['owner', 'officestaff'].includes(userRoleInOrg)) {
      console.log(`[CLIENT_CONTROLLER] Odmowa dostępu: użytkownik ${userId} (rola: ${userRoleInOrg}) próbował usunąć powiązanie klienta ${clientId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień do usunięcia powiązania klienta z organizacją'
      });
    }
    
    // Sprawdź czy klient istnieje i czy należy do organizacji
    const client = await (userRepository as any).getSingleUser(clientId);
    
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
    
    // Sprawdź czy klient nie jest właścicielem organizacji (nie można usunąć ownera)
    const clientRoleInOrg = client.organizations.find(org => 
      org.id && org.id.toString() === organizationId.toString()
    )?.role?.toLowerCase();
    
    if (clientRoleInOrg === 'owner' && userRoleInOrg !== 'superadmin') {
      console.log(`[CLIENT_CONTROLLER] Nie można usunąć powiązania właściciela organizacji`);
      return res.status(403).json({
        status: 'error',
        message: 'Nie można usunąć powiązania właściciela organizacji'
      });
    }
    
    // Właściciel nie może usunąć sam siebie
    if (userId.toString() === clientId.toString() && clientRoleInOrg === 'owner') {
      console.log(`[CLIENT_CONTROLLER] Właściciel nie może usunąć sam siebie z organizacji`);
      return res.status(403).json({
        status: 'error',
        message: 'Właściciel nie może usunąć sam siebie z organizacji'
      });
    }
    
    // Usuwamy powiązanie zamiast dezaktywacji konta
    await (organizationRepository as any).removeUserFromOrganization(organizationId, clientId);
    
    console.log(`[CLIENT_CONTROLLER] Powiązanie klienta ${clientId} z organizacją ${organizationId} zostało pomyślnie usunięte`);
    
    res.status(200).json({
      status: 'success',
      message: 'Powiązanie klienta z organizacją zostało pomyślnie usunięte'
    });
    
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas usuwania powiązania klienta z organizacją', 500));
  }
};

// Funkcja do wyszukiwania klientów z obsługą literówek
export const searchClients: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, user } = req;
    
    if (!userId || !user) {
      throw new AppError('User ID or user object is missing', 400);
    }
    
    const query = req.query.query as string;
    const roles = req.query.roles as string || 'client,farmer';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const organizationId: number | undefined = 
  (req.query.organizationId ? parseInt(req.query.organizationId as string) : undefined) || 
  (req.params.organizationId ? parseInt(req.params.organizationId as string) : undefined) || 
  (user.organizations && user.organizations.length > 0 ? parseInt(user.organizations[0].id.toString()) : undefined);
    
    console.log(`[CLIENT_CONTROLLER] Wyszukiwanie klientów dla użytkownika ${userId}, fraza: "${query}", role: ${roles}, organizacja: ${organizationId}`);
    
    if (!organizationId) {
      return res.status(400).json({
        status: 'error',
        message: 'Nie podano identyfikatora organizacji'
      });
    }
    
    // Sprawdź rolę użytkownika w organizacji
    let userRoleInOrg: string | null = null;
    if (user.organizations) {
      const userOrg = user.organizations.find(org => org.id && org.id.toString() === organizationId.toString());
      if (userOrg) {
        userRoleInOrg = userOrg.role ? userOrg.role.toLowerCase() : null;
        console.log(`[CLIENT_CONTROLLER] Rola użytkownika ${userId} w organizacji ${organizationId}: ${userRoleInOrg}`);
      }
    }
    
    if (!userRoleInOrg) {
      console.log(`[CLIENT_CONTROLLER] Nie znaleziono roli użytkownika ${userId} w organizacji ${organizationId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Brak uprawnień - nie znaleziono roli w organizacji'
      });
    }
    
    // Określenie, jakie role mogą być wyszukiwane w zależności od roli użytkownika
    let allowedRolesToSearch: string[] = [];
    
    // Owner i SuperAdmin mogą wyszukiwać wszystkich
    if (['owner', 'superadmin'].includes(userRoleInOrg)) {
      allowedRolesToSearch = roles ? roles.split(',') : ['client', 'farmer'];
      console.log(`[CLIENT_CONTROLLER] Użytkownik ${userId} ma rolę ${userRoleInOrg} - może wyszukiwać wszystkich klientów`);
    }
    // Employee, OfficeStaff itp. mogą wyszukiwać tylko klientów
    else if (['employee', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(userRoleInOrg)) {
      allowedRolesToSearch = ['client', 'farmer'];
      console.log(`[CLIENT_CONTROLLER] Użytkownik ${userId} ma rolę ${userRoleInOrg} - może wyszukiwać tylko klientów i rolników`);
    }
    // Client, Farmer nie mogą wyszukiwać innych, tylko siebie
    else if (['client', 'farmer'].includes(userRoleInOrg)) {
      // Jeśli klient/rolnik szuka samego siebie, pozwalamy na to
      if (query && (
        user.first_name?.toLowerCase().includes(query.toLowerCase()) || 
        user.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(query.toLowerCase())
      )) {
        console.log(`[CLIENT_CONTROLLER] Klient/rolnik ${userId} wyszukuje samego siebie`);
        
        const singleUser = await (userRepository as any).getSingleUser(userId);
        const usersWithoutPassword = singleUser ? [excludePassword(singleUser)].filter(Boolean) : [];
        
        return res.status(200).json({
          status: 'success',
          results: usersWithoutPassword.length,
          data: {
            clients: usersWithoutPassword,
            pagination: {
              total: usersWithoutPassword.length,
              limit: limit,
              offset: offset,
              pages: 1
            }
          }
        });
      } else {
        console.log(`[CLIENT_CONTROLLER] Użytkownik ${userId} ma rolę ${userRoleInOrg} - nie może wyszukiwać innych użytkowników`);
        return res.status(403).json({
          status: 'error',
          message: 'Brak uprawnień do wyszukiwania innych użytkowników'
        });
      }
    }
    
    // Sprawdź czy fraza wyszukiwania ma co najmniej 3 znaki
    if (query && typeof query === 'string' && query.trim().length < 3) {
      console.log(`[CLIENT_CONTROLLER] Fraza wyszukiwania za krótka (${query.trim().length} znaków)`);
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          clients: [],
          pagination: {
            total: 0,
            limit: limit,
            offset: offset,
            pages: 0
          }
        },
        message: 'Fraza wyszukiwania musi mieć co najmniej 3 znaki'
      });
    }
    
    // Wykonaj wyszukiwanie z nową funkcją
    console.log(`[CLIENT_CONTROLLER] Wykonuję wyszukiwanie z parametrami: query=${query}, roles=${allowedRolesToSearch.join(',')}`);
    
    try {
      const result = await (userRepository as any).searchUsers(
        query, 
        allowedRolesToSearch, 
        organizationId,
        limit,
        offset
      );
      
      // Usuń hasła z wyników
      const usersWithoutPassword = result.users ? 
        result.users.map((user: User) => excludePassword(user)).filter((user: any) => user !== null) : 
        [];
      
      console.log(`[CLIENT_CONTROLLER] Znaleziono ${usersWithoutPassword.length} wyników wyszukiwania (łącznie ${result.pagination ? result.pagination.total : 0})`);
      
      res.status(200).json({
        status: 'success',
        results: usersWithoutPassword.length,
        data: {
          clients: usersWithoutPassword,
          pagination: result.pagination || {
            total: usersWithoutPassword.length,
            limit: limit,
            offset: offset,
            pages: Math.ceil(usersWithoutPassword.length / limit)
          }
        }
      });
    } catch (error) {
      console.error('[CLIENT_CONTROLLER] Błąd podczas wyszukiwania:', error);
      next(new AppError(`Wystąpił błąd podczas wyszukiwania klientów: ${(error as Error).message}`, 500));
    }
  } catch (error) {
    console.error('[CLIENT_CONTROLLER] Error:', error);
    next(new AppError('Wystąpił błąd podczas wyszukiwania klientów', 500));
  }
};