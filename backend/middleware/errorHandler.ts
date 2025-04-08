import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Konfiguracja loggera
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    new winston.transports.Console()
  ]
});

// Niestandardowa klasa błędu aplikacji
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware obsługi błędów
export const errorHandler = (
  err: any, 
  req: Request, 
  res: Response, 
  _next: NextFunction
): Response => {
  // Domyślny kod statusu i komunikat
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Wystąpił błąd serwera';

  // Logowanie błędu
  logger.error({
    message: err.message || 'Nieznany błąd',
    stack: err.stack || 'Brak informacji o stacktrace',
    path: req.path,
    method: req.method,
    statusCode
  });

  // Sprawdź, czy to błąd walidacji (express-validator)
  if (Array.isArray(err) && err.length > 0 && err[0] && 'param' in err[0] && 'msg' in err[0]) {
    return res.status(400).json({ 
      status: 'error',
      errors: err.map(e => ({ field: e.param, message: e.msg }))
    });
  }

  // Błąd JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Nieprawidłowy token uwierzytelniający'
    });
  }

  // Błędy bazy danych
  if (err.code === '23505') {  // PostgreSQL unique violation
    return res.status(409).json({
      status: 'error',
      message: 'Rekord już istnieje w bazie danych'
    });
  }

  // Błędy operacyjne mogą ujawniać szczegóły
  // Błędy programistyczne powinny pokazywać ogólny komunikat w produkcji
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!err.isOperational && isProduction) {
    message = 'Wystąpił błąd serwera';
  }

  // W trybie deweloperskim zwracamy więcej informacji
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && !err.isOperational && { 
      stack: err.stack 
    })
  });
};

// Middleware obsługi nieistniejących tras
export const notFoundHandler = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const error = new AppError(`Nie znaleziono - ${req.originalUrl}`, 404);
  next(error);
};