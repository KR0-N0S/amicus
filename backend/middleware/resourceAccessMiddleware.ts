/**
 * Middleware do weryfikacji dostępu do zasobów na podstawie przynależności organizacyjnej
 * @author KR0-N0S1
 * @date 2025-04-08 18:26:57
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import * as db from '../config/db';

interface ResourceAccessOptions {
  resourceType: string;
  paramName?: string;
  orgParamName?: string;
  roleAccess?: Record<string, string[]>;
}

/**
 * Middleware weryfikujący, czy użytkownik ma dostęp do określonego zasobu
 * @param {Object} options - Opcje konfiguracyjne
 * @param {string} options.resourceType - Typ zasobu (np. 'user', 'animal', 'visit', 'insemination')
 * @param {string} [options.paramName] - Nazwa parametru URL zawierającego ID zasobu (domyślnie: ostatni segment URL)
 * @param {string} [options.orgParamName] - Nazwa parametru organizacji (domyślnie: 'organizationId')
 * @param {Object} [options.roleAccess] - Mapowanie ról z poziomami dostępu
 * @returns {Function} - Middleware Express
 */
export const verifyResourceAccess = (options: ResourceAccessOptions = { resourceType: '' }) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.userId || !req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Wymagane uwierzytelnienie',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Pobierz typ zasobu (wymagany)
      const resourceType = options.resourceType;
      if (!resourceType) {
        console.error('[RESOURCE_ACCESS_MIDDLEWARE] Brak określonego typu zasobu');
        return next(new AppError('Błąd konfiguracji middleware - brak typu zasobu', 500));
      }

      // Pobierz organizationId - priorytetowo używamy już ustawionej wartości
      const orgParamName = options.orgParamName || 'organizationId';
      let organizationId = req.organizationId;
      
      // Jeśli nie ma ustawionego organizationId, próbujemy znaleźć w różnych miejscach
      if (!organizationId) {
        organizationId = req.params[orgParamName] || 
                        req.query[orgParamName] || 
                        req.body[orgParamName];
      }
      
      // Jeśli nadal brak, sprawdzamy w organizacjach użytkownika
      if (!organizationId && req.user.organizations && req.user.organizations.length > 0) {
        organizationId = req.user.organizations[0].id;
        console.log(`[RESOURCE_ACCESS_MIDDLEWARE] Automatycznie wybrano organizację ${organizationId} z kontekstu użytkownika`);
      }

      if (!organizationId) {
        console.error('[RESOURCE_ACCESS_MIDDLEWARE] Brak ID organizacji w żądaniu');
        return res.status(400).json({
          status: 'error',
          message: 'Wymagane ID organizacji',
          code: 'ORGANIZATION_ID_REQUIRED'
        });
      }

      // Zapewniamy, że organizationId jest liczbą
      const numericOrganizationId = Number(organizationId);
      
      // Sprawdź czy użytkownik należy do tej organizacji
      let userBelongsToOrg = false;
      let userRoleInOrg: string | undefined = undefined;

      if (req.user.organizations) {
        const userOrg = req.user.organizations.find((org: any) => 
          Number(org.id) === numericOrganizationId
        );
        if (userOrg) {
          userBelongsToOrg = true;
          userRoleInOrg = userOrg.role ? userOrg.role.toLowerCase() : undefined;
        }
      }

      if (!userBelongsToOrg) {
        console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Użytkownik ${req.userId} nie należy do organizacji ${organizationId}`);
        return res.status(403).json({
          status: 'error',
          message: 'Brak dostępu do tej organizacji',
          code: 'ORGANIZATION_ACCESS_DENIED'
        });
      }

      // Pobierz ID zasobu z parametrów URL
      const paramName = options.paramName || getLastUrlParam(req);
      const resourceId = paramName && req.params[paramName];

      // Jeśli nie ma ID zasobu, przejdź dalej (może to być endpoint listowania)
      if (!resourceId) {
        // Zapisujemy kontekst organizacji i roli w req
        req.organizationId = numericOrganizationId;
        req.userRoleInOrg = userRoleInOrg;
        return next();
      }

      // Użyj odpowiedniej mapowania tabeli DB dla danego typu zasobu
      let tableName: string | undefined;
      let resourceColumn: string | undefined;
      let orgColumn: string | undefined;
      
      switch (resourceType.toLowerCase()) {
        case 'user':
        case 'client':
          // Dla użytkowników/klientów jest specjalna obsługa przez prawidłową tabelę organization_user
          try {
            const userQuery = await db.query(`
              SELECT ou.user_id, ou.organization_id, ou.role
              FROM organization_user ou
              WHERE ou.user_id = $1 AND ou.organization_id = $2
            `, [resourceId, numericOrganizationId]);

            // Jeśli użytkownik nie należy do organizacji
            if (userQuery.rows.length === 0) {
              // ZMIANA: Tylko superadmin może mieć dostęp do użytkowników niepowiązanych z organizacją
              if (userRoleInOrg === 'superadmin' && 
                  ['GET', 'POST', 'PUT', 'PATCH'].includes(req.method)) {
                console.log(`[RESOURCE_ACCESS_MIDDLEWARE] Superadmin ${req.userId} uzyskuje dostęp do użytkownika ${resourceId} spoza organizacji`);
                
                // Zapisujemy kontekst organizacji i roli w req
                req.organizationId = numericOrganizationId;
                req.userRoleInOrg = userRoleInOrg;
                return next();
              }
              
              console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Użytkownik ${resourceId} nie należy do organizacji ${numericOrganizationId}`);
              return res.status(404).json({
                status: 'error',
                message: 'Żądany zasób nie istnieje lub nie masz do niego dostępu',
                code: 'RESOURCE_NOT_FOUND'
              });
            }
            
            const targetUserRole = userQuery.rows[0].role.toLowerCase();
            
            // Sprawdzenie roli względem uprawnień użytkownika wykonującego zapytanie
            if (userRoleInOrg === 'client' || userRoleInOrg === 'farmer') {
              // Klient/farmer może zobaczyć tylko siebie
              if (req.userId.toString() !== resourceId.toString()) {
                console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Klient/farmer ${req.userId} próbuje uzyskać dostęp do innego użytkownika ${resourceId}`);
                return res.status(403).json({
                  status: 'error',
                  message: 'Brak uprawnień do wyświetlenia tego zasobu',
                  code: 'INSUFFICIENT_PERMISSIONS'
                });
              }
            } else if (['employee', 'officestaff', 'inseminator', 'vettech', 'vet'].includes(userRoleInOrg || '')) {
              // Pracownicy mogą widzieć tylko klientów/farmerów, nie innych pracowników
              if (!['client', 'farmer'].includes(targetUserRole)) {
                console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Pracownik ${req.userId} próbuje uzyskać dostęp do innego pracownika ${resourceId}`);
                return res.status(403).json({
                  status: 'error',
                  message: 'Brak uprawnień do wyświetlenia tego zasobu',
                  code: 'INSUFFICIENT_PERMISSIONS'
                });
              }
            }
            
            // Zapisujemy kontekst organizacji i roli w req
            req.organizationId = numericOrganizationId;
            req.userRoleInOrg = userRoleInOrg;
            return next();
          } catch (dbError) {
            console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Błąd bazy danych przy weryfikacji użytkownika:`, dbError);
            throw dbError; // Przekaż błąd dalej do głównej obsługi błędów
          }
          
        case 'animal':
          // Specjalna obsługa dla zwierząt - sprawdzanie przez właściciela
          try {
            // Pobierz właściciela zwierzęcia i sprawdź czy należy do tej organizacji
            const animalQuery = await db.query(`
              SELECT a.id, a.owner_id 
              FROM animals a
              WHERE a.id = $1
            `, [resourceId]);

            if (animalQuery.rows.length === 0) {
              console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Nie znaleziono zwierzęcia o ID ${resourceId}`);
              return res.status(404).json({
                status: 'error',
                message: 'Żądane zwierzę nie istnieje',
                code: 'ANIMAL_NOT_FOUND'
              });
            }

            const animal = animalQuery.rows[0];
            const ownerId = animal.owner_id;

            // Sprawdź, czy właściciel zwierzęcia należy do tej samej organizacji
            const ownerQuery = await db.query(`
              SELECT ou.user_id
              FROM organization_user ou
              WHERE ou.user_id = $1 AND ou.organization_id = $2
            `, [ownerId, numericOrganizationId]);

            // Jeśli brak relacji właściciela z organizacją i to nie jest sam właściciel
            if (ownerQuery.rows.length === 0 && Number(req.userId) !== Number(ownerId)) {
              console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Właściciel zwierzęcia (${ownerId}) nie należy do organizacji ${numericOrganizationId}`);
              return res.status(404).json({
                status: 'error',
                message: 'Żądane zwierzę nie należy do Twojej organizacji',
                code: 'ANIMAL_NOT_IN_ORGANIZATION'
              });
            }

            // Jeśli użytkownik jest klientem/farmerem, sprawdź czy jest właścicielem zwierzęcia
            if ((userRoleInOrg === 'client' || userRoleInOrg === 'farmer') && 
                Number(req.userId) !== Number(ownerId)) {
              console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Klient/farmer ${req.userId} próbuje uzyskać dostęp do zwierzęcia należącego do innego właściciela ${ownerId}`);
              return res.status(403).json({
                status: 'error',
                message: 'Brak uprawnień do tego zwierzęcia',
                code: 'INSUFFICIENT_PERMISSIONS'
              });
            }

            // Zapisujemy kontekst organizacji i roli w req
            req.organizationId = numericOrganizationId;
            req.userRoleInOrg = userRoleInOrg;
            return next();
          } catch (dbError) {
            console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Błąd bazy danych przy weryfikacji dostępu do zwierzęcia:`, dbError);
            throw dbError;
          }
          
        case 'visit':
          tableName = 'visits';
          resourceColumn = 'id';
          orgColumn = 'organization_id';
          break;
          
        case 'insemination':
          tableName = 'inseminations';
          resourceColumn = 'id';
          orgColumn = 'organization_id';
          break;
          
        case 'bull':
          tableName = 'bulls';
          resourceColumn = 'id';
          orgColumn = 'organization_id';
          break;
          
        case 'herd':
          tableName = 'herds';
          resourceColumn = 'id';
          orgColumn = 'organization_id';
          break;
          
        default:
          console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Nieznany typ zasobu: ${resourceType}`);
          return res.status(500).json({
            status: 'error',
            message: 'Błąd serwera: Nieznany typ zasobu',
            code: 'UNKNOWN_RESOURCE_TYPE'
          });
      }

      // Jeśli to nie była specjalna obsługa dla użytkowników lub zwierząt, wykonaj standardowe sprawdzenie
      if (tableName && resourceColumn && orgColumn) {
        try {
          const query = await db.query(`
            SELECT ${resourceColumn} FROM ${tableName}
            WHERE ${resourceColumn} = $1 AND ${orgColumn} = $2
          `, [resourceId, numericOrganizationId]);

          if (query.rows.length === 0) {
            console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Zasób ${resourceType} o ID ${resourceId} nie należy do organizacji ${numericOrganizationId}`);
            return res.status(404).json({
              status: 'error',
              message: 'Żądany zasób nie istnieje lub nie masz do niego dostępu',
              code: 'RESOURCE_NOT_FOUND'
            });
          }
        } catch (dbError) {
          console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Błąd bazy danych:`, dbError);
          return next(new AppError('Wystąpił błąd podczas weryfikacji dostępu do zasobu', 500));
        }
      }

      // Jeśli wszystko jest OK, dopisz organizationId i przechodź dalej
      req.organizationId = numericOrganizationId;
      req.userRoleInOrg = userRoleInOrg;
      
      next();
    } catch (error) {
      console.error(`[RESOURCE_ACCESS_MIDDLEWARE] Błąd:`, error);
      next(new AppError('Wystąpił błąd podczas weryfikacji dostępu do zasobu', 500));
    }
  };
};

/**
 * Zwraca nazwę ostatniego parametru w URL
 * @param {Object} req - Obiekt żądania Express
 * @returns {string|undefined} - Nazwa ostatniego parametru lub undefined
 */
function getLastUrlParam(req: Request): string | undefined {
  const path = req.route?.path;
  if (!path) return undefined;
  
  const segments = path.split('/');
  
  // Szukaj od końca pierwszego segmentu, który jest parametrem (zaczyna się od ":")
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i].startsWith(':')) {
      return segments[i].substring(1); // Usuń dwukropek
    }
  }
  return undefined;
}