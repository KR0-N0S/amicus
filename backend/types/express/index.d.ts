import { Request, Response, NextFunction } from 'express';

// Zachowujemy globalne rozszerzenie Request
declare global {
  namespace Express {
    interface Request {
      userId?: string | number;
      user?: any;
      userOrganizations?: Array<{
        id: string | number;
        role: string;
        [key: string]: any;
      }>;
      organizationId?: string | number;
      userRoleInOrg?: string;
      organizationModules?: Array<{
        code: string;
        name: string;
        active: boolean;
        subscription_end_date?: Date;
        [key: string]: any;
      }>;
      userModulePermissions?: Record<string, any>;
      userRole?: string;
    }
  }
}

// Dodajemy eksportowane typy potrzebne w kontrolerach
export interface RequestWithUser extends Request {
  userId?: number;
  user?: any;
  userOrganizations?: Array<{
    id: number;
    role: string;
    [key: string]: any;
  }>;
  organizationId?: number;
  userRoleInOrg?: string;
}

export type ControllerFunction = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export {}; // Aby traktować plik jako moduł