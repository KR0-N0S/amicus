/**
 * Middleware do uwierzytelniania
 * @author KR0-N0S1
 * @date 2025-04-08 18:38:56
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository';

// Interfejs musi być zgodny ze strukturą JWT
interface JwtPayload {
  id: string | number;
  organizations?: Array<{
    id: string | number;
    role: string;
    name?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Definiujemy typ zgodny z wymaganiami Express.User.organizations
type UserOrganization = {
  id: number;
  name: string;
  role: string;
  city?: string;
  street?: string;
  house_number?: string;
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Pobierz token z nagłówka Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Unauthorized: Token required', 
        code: 'TOKEN_REQUIRED'
      });
    }

    const token = authHeader.split(' ')[1];

    // Weryfikuj token
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_ACCESS_SECRET || 'amicus_access_secret'
      ) as JwtPayload;
      
      // Zapisz ID użytkownika w obiekcie żądania
      req.userId = Number(decoded.id);
      
      // Zapisz informacje o organizacjach z zapewnieniem spójności typów
      // Konwersja do typu zgodnego z userOrganizations
      const jwtOrganizations = (decoded.organizations || []).map(org => ({
        id: Number(org.id),
        role: org.role,
        name: org.name || 'Unknown Organization'
      }));
      
      req.userOrganizations = jwtOrganizations;
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Unauthorized: Token expired', 
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid token', 
        code: 'INVALID_TOKEN'
      });
    }

    // Pobierz szczegółowe dane użytkownika włącznie z organizacjami
    try {
      // Użyj getSingleUser z parametrem withDetails=true, aby pobrać pełne dane użytkownika
      const userWithDetails = await userRepository.getSingleUser(req.userId as number, true);
      
      if (!userWithDetails) {
        return res.status(401).json({ 
          message: 'Unauthorized: User not found', 
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Usuń hasło z obiektu użytkownika
      const { password, ...userWithoutPassword } = userWithDetails;
      
      // Zapewnij, że organizations jest zawsze tablicą i zawiera wymagane pola
      const organizations: UserOrganization[] = Array.isArray(userWithoutPassword.organizations) 
        ? userWithoutPassword.organizations.map(org => ({
            id: Number(org.id),
            name: org.name || 'Unknown Organization',
            role: org.role,
            city: org.city,
            street: org.street,
            house_number: org.house_number
          }))
        : req.userOrganizations?.map(org => ({
            id: Number(org.id),
            name: org.name || 'Unknown Organization',
            role: org.role
          })) || [];
      
      // Zapisz pełny obiekt użytkownika z poprawnymi typami
      req.user = {
        ...userWithoutPassword,
        organizations: organizations
      };
      
    } catch (error) {
      console.error('[AUTH_MIDDLEWARE] Błąd podczas pobierania szczegółów użytkownika:', error);
      
      // W przypadku błędu, pobierz podstawowe dane użytkownika
      const user = await userRepository.findById(req.userId as number);
      if (!user) {
        return res.status(401).json({ 
          message: 'Unauthorized: User not found', 
          code: 'USER_NOT_FOUND'
        });
      }

      // Usuń hasło z obiektu użytkownika
      const { password, ...userWithoutPassword } = user;
      
      // Zapewnij, że organizations jest zawsze tablicą i zawiera wymagane pola
      const organizations: UserOrganization[] = req.userOrganizations?.map(org => ({
        id: Number(org.id),
        name: org.name || 'Unknown Organization',
        role: org.role
      })) || [];
      
      // Użyj organizacji z tokenu JWT jako fallback
      req.user = {
        ...userWithoutPassword,
        organizations: organizations
      };
    }

    next();
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Błąd:', error);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
};

export const checkOrganizationAccess = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Pobierz identyfikator organizacji z parametrów, zapytania lub ciała żądania
    const organizationId = req.params.organizationId || req.query.organizationId || req.body.organizationId;
    
    // Jeśli nie podano identyfikatora organizacji, próbujemy użyć domyślnej
    if (!organizationId) {
      // Sprawdź, czy użytkownik ma jakieś organizacje
      if (req.user?.organizations?.length > 0) {
        // Użyj pierwszej organizacji jako domyślnej
        const defaultOrg = req.user.organizations[0];
        req.organizationId = Number(defaultOrg.id);
        req.userRoleInOrg = defaultOrg.role.toLowerCase();
        
        console.log(`[ORG_ACCESS_MIDDLEWARE] Użyto domyślnej organizacji: ${req.organizationId}`);
        return next();
      }
      
      // Jeśli nie ma organizacji, pozwól żądaniu przejść dalej
      return next();
    }
    
    // Sprawdź, czy użytkownik ma organizacje
    if (!req.user?.organizations || req.user.organizations.length === 0) {
      return res.status(403).json({ 
        message: 'Brak dostępu do tej organizacji', 
        code: 'NO_ORGANIZATIONS'
      });
    }
    
    // Sprawdź, czy użytkownik należy do tej organizacji
    const numOrgId = Number(organizationId);
    const userBelongsToOrg = req.user.organizations.some(org => Number(org.id) === numOrgId);
    
    if (!userBelongsToOrg) {
      return res.status(403).json({ 
        message: 'Brak dostępu do tej organizacji', 
        code: 'ORGANIZATION_ACCESS_DENIED'
      });
    }
    
    // Opcjonalnie: sprawdź konkretne uprawnienia dla danej organizacji na podstawie ścieżki
    const adminPaths = ['/admin', '/settings', '/users/manage'];
    const medicalPaths = ['/medical', '/insemination', '/visit', '/animals'];
    
    let requiredRoles: string[] = [];
    
    // Sprawdź, czy ścieżka wymaga specjalnych uprawnień
    if (adminPaths.some(path => req.path.includes(path))) {
      requiredRoles = ['owner', 'superadmin', 'admin', 'officestaff'];
    } else if (medicalPaths.some(path => req.path.includes(path))) {
      requiredRoles = ['owner', 'superadmin', 'admin', 'vet', 'vettech', 'inseminator'];
    }
    
    // Jeśli zdefiniowano wymagane role, sprawdź uprawnienia
    if (requiredRoles.length > 0) {
      const userOrg = req.user.organizations.find(org => Number(org.id) === numOrgId);
      
      const hasRequiredRole = userOrg && 
                             userOrg.role && 
                             requiredRoles.includes(userOrg.role.toLowerCase());
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          message: 'Brak wymaganych uprawnień w tej organizacji', 
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }
    
    // Zapisz identyfikator organizacji i rolę w obiekcie żądania
    req.organizationId = numOrgId;
    
    // Zapisz rolę użytkownika w tej organizacji
    const userOrg = req.user.organizations.find(org => Number(org.id) === numOrgId);
    req.userRoleInOrg = userOrg?.role.toLowerCase();
    
    next();
  } catch (error) {
    console.error('[ORG_ACCESS_MIDDLEWARE] Błąd:', error);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
};