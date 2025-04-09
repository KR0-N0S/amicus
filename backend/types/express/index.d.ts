/**
 * Rozszerzenie typów dla Express Request
 * @author KR0-N0S1
 * @date 2025-04-08 19:00:56
 */

import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      street?: string;
      house_number?: string;
      city?: string;
      postal_code?: string;
      tax_id?: string;
      status: 'active' | 'inactive';
      created_at: Date;
      updated_at: Date;
      organizations: Array<{
        id: number;
        name: string;
        role: string;
        city?: string;
        street?: string;
        house_number?: string;
      }>;
    }

    interface Request {
      userId: number;
      user: User;
      userOrganizations?: Array<{
        id: number;
        role: string;
        [key: string]: any;
      }>;
      organizationId?: number;
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

// Eksportowane typy dla kontrolerów
export interface RequestWithUser extends Request {}
export type ControllerFunction = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export {}; // To make it a module and avoid TS1064 error