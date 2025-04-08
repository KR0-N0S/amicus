import rateLimit from 'express-rate-limit';

// Typ dla opcji rate-limitera
interface RateLimitOptions {
  windowMs: number;
  max: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  message: {
    status: string;
    message: string;
  };
}

// Domyślny limiter dla wszystkich tras
export const defaultLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minuty
  max: 100, // limit każdego IP do 100 zapytań na 'window'
  standardHeaders: true, // Zwraca info o limicie w nagłówkach `RateLimit-*`
  legacyHeaders: false, // Dezaktywuje nagłówki `X-RateLimit-*`
  message: {
    status: 'error',
    message: 'Zbyt wiele zapytań, spróbuj ponownie później.'
  }
} as RateLimitOptions);

// Bardziej restrykcyjny limiter dla tras autoryzacji
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 30, // 30 zapytań w oknie czasowym
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Zbyt wiele zapytań związanych z autoryzacją, spróbuj ponownie później.'
  }
} as RateLimitOptions);