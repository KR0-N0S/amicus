/**
 * Interfejs reprezentujący wizytę
 */
export interface Visit {
    id: number;
    farmer_id: number;
    vet_id?: number;
    employee_id?: number;
    visit_date: Date;
    status: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * Dane do utworzenia wizyty
   */
  export interface VisitCreateData {
    farmer_id: number;
    vet_id?: number;
    employee_id?: number;
    visit_date: Date | string;
    status: string;
    notes?: string;
  }
  
  /**
   * Dane do aktualizacji wizyty
   */
  export interface VisitUpdateData {
    vet_id?: number;
    employee_id?: number;
    visit_date?: Date | string;
    status?: string;
    notes?: string;
  }
  
  /**
   * Wynik z listą wizyt i paginacją
   */
  export interface PaginatedVisitsResult {
    visits: Visit[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    }
  }