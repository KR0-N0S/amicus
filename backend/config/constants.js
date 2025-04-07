/**
 * Stałe konfiguracyjne dla aplikacji
 * @author KR0-N0S
 * @date 2025-04-06
 */

// Konfiguracja paginacji
const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  };
  
  // Konfiguracja wyszukiwania
  const SEARCH = {
    MIN_SEARCH_LENGTH: 3
  };
  
  // Typy zwierząt
  const ANIMAL_TYPES = {
    FARM: 'farm',
    COMPANION: 'companion'
  };
  
  // Płcie zwierząt
  const ANIMAL_SEXES = {
    MALE: 'male',
    FEMALE: 'female'
  };
  
  // Kody odpowiedzi HTTP
  const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  };
  
  module.exports = {
    PAGINATION,
    SEARCH,
    ANIMAL_TYPES,
    ANIMAL_SEXES,
    HTTP_STATUS
  };