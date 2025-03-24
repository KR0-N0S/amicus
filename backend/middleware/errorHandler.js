const { ValidationError } = require('express-validator');
const winston = require('winston');

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
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware obsługi błędów
const errorHandler = (err, req, res, next) => {
  // Domyślny kod statusu i komunikat
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Wystąpił błąd serwera';

  // Logowanie błędu
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode
  });

  // Sprawdź, czy to błąd walidacji (express-validator)
  if (Array.isArray(err) && err.every(e => e instanceof ValidationError)) {
    statusCode = 400;
    message = err.map(e => ({ 
      field: e.param, 
      message: e.msg 
    }));
  }

  // Błąd JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Nieprawidłowy token uwierzytelniający';
  }

  // Błędy bazy danych
  if (err.code === '23505') {  // PostgreSQL unique violation
    statusCode = 409;
    message = 'Rekord już istnieje w bazie danych';
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
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Nie znaleziono - ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};
