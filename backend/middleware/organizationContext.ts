/**
 * Unified Organization Context Middleware
 * @author KR0-N0S1
 * @date 2025-04-08 19:33:25
 */

import { Request, Response, NextFunction } from 'express';
import * as organizationRepository from '../repositories/organizationRepository';
import { verifyToken } from './authMiddleware';

/**
 * Middleware zapewniający spójny kontekst organizacji
 * Automatycznie ustawia req.organizationId na podstawie różnych źródeł
 */
export const ensureOrganizationContext = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // Ignoruj ścieżki uwierzytelniania (oprócz /me)
    if (req.path.startsWith('/api/auth/') && !req.path.includes('/me')) {
      return next();
    }

    // 1. Sprawdź, czy mamy już organizationId (mogło być ustawione przez inne middleware)
    if (req.organizationId) {
      return next();
    }

    // 2. Pobierz organizationId z parametrów, query lub ciała żądania
    let organizationId: number | undefined;
    
    // Sprawdź parametry URL
    if (req.params.organizationId) {
      organizationId = Number(req.params.organizationId);
    }
    // Sprawdź query parameters
    else if (req.query.organizationId) {
      organizationId = Number(req.query.organizationId);
    }
    // Sprawdź body żądania
    else if (req.body?.organizationId) {
      organizationId = Number(req.body.organizationId);
    }
    // Sprawdź specjalne nagłówki
    else if (req.headers['x-organization-id']) {
      organizationId = Number(req.headers['x-organization-id']);
    }

    // 3. Jeśli znaleziono organizationId, weryfikuj dostęp i ustaw kontekst
    if (organizationId && !isNaN(organizationId)) {
      // Sprawdź, czy użytkownik ma dostęp do tej organizacji
      if (req.user?.organizations) {
        const userOrg = req.user.organizations.find(
          (org) => Number(org.id) === organizationId
        );
        
        if (userOrg) {
          req.organizationId = organizationId;
          req.userRoleInOrg = userOrg.role?.toLowerCase();
          console.log(`[ORG_CONTEXT] Ustawiono organizację ${organizationId}, rola: ${req.userRoleInOrg}`);
          return next();
        }
      }
      
      // Jeśli nie ma dostępu, pobieramy organizacje użytkownika z bazy
      if (req.userId) {
        try {
          // Jawne konwertowanie req.userId do typu number
          const userOrgs = await organizationRepository.getUserOrganizationsWithRoles(Number(req.userId));
          const hasAccess = userOrgs.some(org => Number(org.id) === organizationId);
          
          if (hasAccess) {
            const userOrg = userOrgs.find(org => Number(org.id) === organizationId);
            req.organizationId = organizationId;
            req.userRoleInOrg = userOrg?.role?.toLowerCase();
            console.log(`[ORG_CONTEXT] Dostęp do organizacji ${organizationId} zweryfikowany przez bazę, rola: ${req.userRoleInOrg}`);
            
            // Aktualizujemy też req.user.organizations dla spójności
            if (req.user && !req.user.organizations) {
              req.user.organizations = userOrgs.map(org => ({
                id: org.id,
                name: org.name || 'Unknown Organization',
                role: org.role,
                city: org.city,
                street: org.street,
                house_number: org.house_number
              }));
            }
            
            return next();
          }
        } catch (error) {
          console.error('[ORG_CONTEXT] Błąd podczas weryfikacji dostępu z bazy:', error);
        }
      }
      
      console.warn(`[ORG_CONTEXT] Użytkownik ${req.userId} nie ma dostępu do organizacji ${organizationId}`);
    }

    // 4. Jeśli nie znaleziono organizationId, próbuj użyć domyślnej z kontekstu użytkownika
    if (req.user?.organizations && req.user.organizations.length > 0) {
      const defaultOrg = req.user.organizations[0];
      req.organizationId = Number(defaultOrg.id);
      req.userRoleInOrg = defaultOrg.role?.toLowerCase();
      console.log(`[ORG_CONTEXT] Użyto domyślnej organizacji z req.user: ${req.organizationId}, rola: ${req.userRoleInOrg}`);
      return next();
    } 
    else if (req.userOrganizations && req.userOrganizations.length > 0) {
      // Kompatybilność z JWT gdzie organizacje są w userOrganizations
      const defaultOrg = req.userOrganizations[0];
      req.organizationId = Number(defaultOrg.id);
      req.userRoleInOrg = defaultOrg.role?.toLowerCase();
      console.log(`[ORG_CONTEXT] Użyto domyślnej organizacji z JWT: ${req.organizationId}, rola: ${req.userRoleInOrg}`);
      return next();
    }
    
    // 5. Ostatnia szansa - próbujemy pobrać organizacje z bazy
    if (req.userId) {
      try {
        // Jawne konwertowanie req.userId do typu number
        const userOrgs = await organizationRepository.getUserOrganizationsWithRoles(Number(req.userId));
        
        if (userOrgs && userOrgs.length > 0) {
          const defaultOrg = userOrgs[0];
          req.organizationId = Number(defaultOrg.id);
          req.userRoleInOrg = defaultOrg.role?.toLowerCase();
          
          // Aktualizujemy też req.user.organizations dla spójności
          if (req.user) {
            req.user.organizations = userOrgs.map(org => ({
              id: org.id,
              name: org.name || 'Unknown Organization',
              role: org.role,
              city: org.city,
              street: org.street,
              house_number: org.house_number
            }));
          }
          
          console.log(`[ORG_CONTEXT] Pobrano organizację z bazy danych: ${req.organizationId}, rola: ${req.userRoleInOrg}`);
          return next();
        } else {
          console.warn(`[ORG_CONTEXT] Użytkownik ${req.userId} nie jest przypisany do żadnej organizacji`);
        }
      } catch (error) {
        console.error('[ORG_CONTEXT] Błąd podczas pobierania organizacji z bazy:', error);
      }
    }
    
    next();
  } catch (error) {
    console.error('[ORG_CONTEXT] Błąd:', error);
    // Nie zatrzymujemy przetwarzania żądania, ustawiamy kontekst jeśli to możliwe
    next();
  }
};