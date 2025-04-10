/**
 * Opcje sortowania dla zapytań do bazy danych
 * @interface SortOptions
 */
export interface SortOptions {
    /** Nazwa kolumny do sortowania */
    column: string;
    /** Kierunek sortowania (asc - rosnąco, desc - malejąco) */
    direction: 'asc' | 'desc';
  }
  
  /**
   * Konfiguracja paginacji dla zapytań
   * @interface PaginationOptions
   */
  export interface PaginationOptions {
    /** Aktualna strona */
    page: number;
    /** Liczba elementów na stronę */
    limit: number;
  }