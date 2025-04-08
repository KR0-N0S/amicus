/**
 * Typy i interfejsy dla Express
 * @author KR0-N0S
 * @date 2025-04-08 16:13:19
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Interfejs organizacji użytkownika w żądaniu
 */
interface UserOrganization {
  [key: string]: any; // Pozwala na dowolne dodatkowe pola
  id: number;
  name?: string;
  role: string; // Role jest wymagane, nie opcjonalne
}

/**
 * Rozszerzony interfejs Request zawierający dane użytkownika
 */
export interface RequestWithUser extends Request {
  userId?: number;
  user?: any;
  userRoleInOrg?: string;
  organizationId?: number;
  userOrganizations?: UserOrganization[] | undefined;
}

/**
 * Typ funkcji kontrolera Express
 */
export type ControllerFunction = (
  req: RequestWithUser, 
  res: Response, 
  next: NextFunction
) => Promise<any>;