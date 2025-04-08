/**
 * Interfejs reprezentujący buhaja
 */
export interface Bull {
    id: number;
    name: string;
    identification_number: string;
    bull_type: string;
    breed?: string;
    birth_date?: Date;
    owner_id: number;
    organization_id?: number;
    availability?: boolean;
    photo?: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * Dane do utworzenia buhaja
   */
  export interface BullCreateData {
    name: string;
    identification_number: string;
    bull_type: string;
    breed?: string;
    birth_date?: Date | string;
    owner_id: number;
    organization_id?: number;
    availability?: boolean;
    photo?: string;
    description?: string;
  }
  
  /**
   * Filtry do wyszukiwania buhajów
   */
  export interface BullFilters {
    bull_type?: string;
    breed?: string;
    owner_id?: number;
    organization_id?: number;
    availability?: boolean;
  }
  
  /**
   * Parametry sortowania buhajów
   */
  export interface BullSorting {
    field: string;
    direction: 'ASC' | 'DESC';
  }
  
  /**
   * Paginacja dla wyników wyszukiwania
   */
  export interface Pagination {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }
  
  /**
   * Wynik wyszukiwania buhajów z paginacją
   */
  export interface PaginatedBullsResult {
    bulls: Bull[];
    pagination: Pagination;
  }
  
  /**
   * Statystyki dla buhaja
   */
  export interface BullStats {
    insemination_count: number;
    success_rate: number;
    average_gestation: number;
    offspring_count: number;
  }
  
  /**
   * Dostawa nasienia buhaja
   */
  export interface BullDelivery {
    id: number;
    bull_id: number;
    delivery_date: Date;
    quantity: number;
    batch_number: string;
    expiration_date?: Date;
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * Inseminacja z użyciem nasienia buhaja
   */
  export interface BullInsemination {
    id: number;
    bull_id: number;
    animal_id: number;
    insemination_date: Date;
    success?: boolean;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    animal?: any; // Można zastąpić typem Animal, jeśli jest zdefiniowany
  }
  export interface BullUpdateData {
    name?: string;
    identification_number?: string;
    bull_type?: string;
    breed?: string;
    birth_date?: Date | string;
    veterinary_number?: string;
    availability?: boolean;
    photo?: string;
    description?: string;
    organization_id?: number;
  }