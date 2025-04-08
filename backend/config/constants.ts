/**
 * Stałe konfiguracyjne dla aplikacji
 * Author: KR0-N0S
 * Date: 2025-04-06
 */

// Konfiguracja paginacji
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

// Konfiguracja wyszukiwania
export const SEARCH = {
  MIN_SEARCH_LENGTH: 3,
};

// Typy zwierząt
export const ANIMAL_TYPES = {
  FARM: 'farm',
  COMPANION: 'companion',
};

// Płcie zwierząt
export const ANIMAL_SEXES = {
  MALE: 'male',
  FEMALE: 'female',
};

// Kody odpowiedzi HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
