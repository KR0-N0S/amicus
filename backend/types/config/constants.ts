export interface HttpStatus {
    OK: number;
    CREATED: number;
    BAD_REQUEST: number;
    UNAUTHORIZED: number;
    FORBIDDEN: number;
    NOT_FOUND: number;
    INTERNAL_SERVER_ERROR: number;
    [key: string]: number;
  }
  
  export interface Pagination {
    DEFAULT_PAGE: number;
    DEFAULT_PAGE_SIZE: number;
    MAX_PAGE_SIZE: number;
  }
  
  export interface AnimalTypes {
    FARM: string;
    COMPANION: string;
  }
  
  export interface Search {
    MIN_SEARCH_LENGTH: number;
  }
  
  export interface Constants {
    HTTP_STATUS: HttpStatus;
    PAGINATION: Pagination;
    ANIMAL_TYPES: AnimalTypes;
    SEARCH: Search;
  }