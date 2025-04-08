import { Animal, Pagination } from '../models/animal';

/**
 * Opcje wyszukiwania zwierząt
 */
export interface AnimalSearchOptions {
  checkOwner?: boolean;
  ownerId?: number;
  currentUserId?: number;
}

/**
 * Wynik wyszukiwania zwierząt z paginacją
 */
export interface PaginatedResult {
  animals: Animal[];
  pagination: Pagination;
}

/**
 * Dane wejściowe dla tworzenia/aktualizacji zwierzęcia
 */
export interface AnimalInputData {
  owner_id?: number;
  species?: string;
  animal_type?: string;
  sex?: string;
  breed?: string;
  birth_date?: Date | string;
  weight?: number | null; // Dodano null jako możliwą wartość
  photo?: string;
  notes?: string;
  animal_number?: string;
  registration_date?: Date | string;
  organization_id?: number;
  farm_animal?: any;
  companion_animal?: any;
  checkOwnership?: boolean;
  currentUserId?: number;
}