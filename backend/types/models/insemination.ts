/**
 * Interfejs reprezentujący inseminację
 */
export interface Insemination {
    id: number;
    animal_id: number;
    bull_id?: number;
    insemination_date: Date;
    technician_id?: number;
    notes?: string;
    success?: boolean;
    pregnancy_check_date?: Date;
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * Dane do utworzenia inseminacji
   */
  export interface InseminationCreateData {
    animal_id: number;
    bull_id?: number;
    insemination_date: Date | string;
    technician_id?: number;
    notes?: string;
    success?: boolean;
    pregnancy_check_date?: Date | string;
  }
  
  /**
   * Dane do aktualizacji inseminacji
   */
  export interface InseminationUpdateData {
    bull_id?: number;
    insemination_date?: Date | string;
    technician_id?: number;
    notes?: string;
    success?: boolean;
    pregnancy_check_date?: Date | string;
  }
  
  /**
   * Filtry dla wyszukiwania inseminacji
   */
  export interface InseminationFilters {
    start_date?: Date | string;
    end_date?: Date | string;
    success?: boolean;
    animal_id?: number;
    bull_id?: number;
  }
  
  /**
   * Wynik z listą inseminacji i paginacją
   */
  export interface PaginatedInseminationsResult {
    inseminations: Insemination[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    }
  }
  
  /**
   * Wynik inseminacji dla zwierzęcia
   */
  export interface AnimalInseminationsResult {
    animal: any; // Można zastąpić typem Animal gdy będzie zdefiniowany
    inseminations: Insemination[];
  }