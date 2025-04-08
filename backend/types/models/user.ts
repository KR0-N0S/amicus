/**
 * Interfejs reprezentujący użytkownika
 */
export interface User {
  id: number;
  email: string;
  password?: string;
  first_name?: string; // zmienione z `string` na `string?` dla zgodności
  last_name?: string; // zmienione z `string` na `string?` dla zgodności
  phone?: string;
  avatar?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
  created_at: Date;
  updated_at: Date;
  status?: string;
  organizations?: any[]; // dodane dla zgodności
  herds?: any[]; // dodane dla zgodności
}

/**
 * Dane do utworzenia użytkownika
 */
export interface UserCreateData {
  email: string;
  password: string;
  first_name?: string; // zmienione dla zgodności
  last_name?: string; // zmienione dla zgodności
  phone?: string;
  avatar?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
}

/**
 * Dane do aktualizacji użytkownika
 */
export interface UserUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
}

/**
 * Rezultat zmiany hasła
 */
export interface PasswordChangeResult {
  success: boolean;
  message: string;
}

/**
 * Profil użytkownika z organizacjami
 */
export interface UserProfile {
  user: User;
  organizations: any[];
}