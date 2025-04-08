/**
 * Interfejs reprezentujący dostawcę nasienia
 */
export interface SemenProvider {
  id: number;
  name: string;
  vet_id_number: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  owner_id: number;
  organization_id?: number | null;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane do utworzenia/aktualizacji dostawcy nasienia
 */
export interface SemenProviderData {
  name: string;
  vet_id_number: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  owner_id: number;
  organization_id?: number | null;
  is_public?: boolean;
}

/**
 * Obiekt paginacji
 */
export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Wynik wyszukiwania dostawców nasienia z paginacją
 */
export interface PaginatedProvidersResult {
  providers: SemenProvider[];
  pagination: Pagination;
}