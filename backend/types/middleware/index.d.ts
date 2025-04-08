// Deklaracja dla modułów middleware
declare module '../middleware/*' {
  const middleware: any;
  export = middleware;
}

// Deklaracja specyficzna dla authMiddleware.ts (który już jest w TS)
declare module '../middleware/authMiddleware' {
  import { Request, Response, NextFunction } from 'express';

  export function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
  export function checkOrganizationAccess(req: Request, res: Response, next: NextFunction): Promise<void | Response>;
}
