import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Middleware sprawdzające rolę użytkownika w organizacji
 * @param {string|string[]} allowedRoles - Pojedyncza rola lub tablica ról, które mają dostęp
 * @param {boolean} requireOrganization - Czy wymagana jest organizacja w zapytaniu
 */
export const requireRole = (allowedRoles: string | string[], requireOrganization: boolean = true) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.userId || !req.user) {
        return res.status(401).json({
          message: 'Unauthorized: Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Pobierz organizację z parametrów, query lub body
      const organizationId = req.params.organizationId || 
                            req.query.organizationId || 
                            req.body.organizationId;

      // Sprawdź czy organizacja jest wymagana i czy została podana
      if (requireOrganization && !organizationId) {
        return res.status(400).json({
          message: 'Bad Request: Organization ID is required',
          code: 'ORGANIZATION_REQUIRED'
        });
      }

      // Jeśli organizacja nie jest wymagana, przepuść dalej
      if (!requireOrganization) {
        return next();
      }

      // Pobierz informacje o rolach użytkownika z tokenu JWT
      const userOrganizations = req.user.organizations || [];
      
      // Znajdź organizację użytkownika
      const userOrg = userOrganizations.find((org: any) => 
        org.id.toString() === organizationId.toString()
      );
      
      // Sprawdź czy użytkownik należy do tej organizacji
      if (!userOrg) {
        return res.status(403).json({
          message: 'Forbidden: You do not have access to this organization',
          code: 'ORGANIZATION_ACCESS_DENIED'
        });
      }

      // Sprawdź czy użytkownik ma odpowiednią rolę
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      if (!roles.includes(userOrg.role)) {
        return res.status(403).json({
          message: 'Forbidden: Your role does not have permission to perform this action',
          code: 'ROLE_PERMISSION_DENIED'
        });
      }

      // Dodaj informację o roli użytkownika w tej organizacji do obiektu żądania
      req.userRole = userOrg.role;
      req.organizationId = organizationId;

      next();
    } catch (error) {
      next(new AppError('Server error while checking permissions', 500));
    }
  };
};

/**
 * Middleware sprawdzające czy użytkownik należy do organizacji (bez sprawdzania roli)
 */
export const requireOrganizationMembership = () => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    try {
      // Sprawdź czy użytkownik jest zalogowany
      if (!req.userId || !req.user) {
        return res.status(401).json({
          message: 'Unauthorized: Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Pobierz organizację z parametrów, query lub body
      const organizationId = req.params.organizationId || 
                            req.query.organizationId || 
                            req.body.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          message: 'Bad Request: Organization ID is required',
          code: 'ORGANIZATION_REQUIRED'
        });
      }

      // Pobierz informacje o organizacjach użytkownika z tokenu JWT
      const userOrganizations = req.user.organizations || [];
      
      // Sprawdź czy użytkownik należy do tej organizacji
      const isMember = userOrganizations.some((org: any) => 
        org.id.toString() === organizationId.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({
          message: 'Forbidden: You are not a member of this organization',
          code: 'NOT_ORGANIZATION_MEMBER'
        });
      }

      // Znajdź rolę użytkownika w tej organizacji
      const userOrg = userOrganizations.find((org: any) => 
        org.id.toString() === organizationId.toString()
      );

      // Dodaj informację o roli użytkownika do obiektu żądania
      req.userRole = userOrg?.role;
      req.organizationId = organizationId;

      next();
    } catch (error) {
      next(new AppError('Server error while checking organization membership', 500));
    }
  };
};