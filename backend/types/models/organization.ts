/**
 * Interfejs reprezentujący organizację
 */
export interface Organization {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string; // Dodane brakujące pole
  created_at: Date;
  updated_at: Date;
  role?: string; // Dodatkowe pole z rolą użytkownika w organizacji
}

/**
 * Organizacja z rolą użytkownika
 */
export interface OrganizationWithRole extends Organization {
  role: string;
}

/**
 * Skrócona informacja o organizacji z rolą
 */
export interface OrganizationRole {
  id: number;
  role: string;
}