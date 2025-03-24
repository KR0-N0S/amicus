const rateLimit = require('express-rate-limit');

// Domyślny limiter dla wszystkich tras
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100, // limit każdego IP do 100 zapytań na 'window'
  standardHeaders: true, // Zwraca info o limicie w nagłówkach `RateLimit-*`
  legacyHeaders: false, // Dezaktywuje nagłówki `X-RateLimit-*`
  trustProxy: true, // Zaufaj nagłówkom przekazywanym przez proxy (np. Nginx)
  message: {
    status: 'error',
    message: 'Zbyt wiele zapytań, spróbuj ponownie później.'
  }
});

// Bardziej restrykcyjny limiter dla tras autoryzacji
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 10, // limit każdego IP do 10 zapytań na 'window'
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Zaufaj nagłówkom przekazywanym przez proxy
  message: {
    status: 'error',
    message: 'Zbyt wiele zapytań związanych z autoryzacją, spróbuj ponownie później.'
  }
});

module.exports = {
  defaultLimiter,
  authLimiter
};
