const rateLimit = require('express-rate-limit');

// Domyślny limiter dla API
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit 100 zapytań z jednego IP
  standardHeaders: true, // zwracanie informacji o limicie w nagłówkach 
  legacyHeaders: false, // wyłączenie starych nagłówków 
  message: {
    status: 'error',
    message: 'Zbyt wiele zapytań, spróbuj ponownie później'
  }
});

// Limiter dla uwierzytelniania (login/rejestracja)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 10, // limit 10 zapytań z jednego IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Zbyt wiele prób logowania, spróbuj ponownie później'
  }
});

module.exports = {
  defaultLimiter,
  authLimiter
};
