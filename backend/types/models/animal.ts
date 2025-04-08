/**
 * Typy zwierząt
 */
export enum AnimalType {
  FARM = 'farm',
  COMPANION = 'companion'
}

/**
 * Interfejs reprezentujący zwierzę
 */
export interface Animal {
  id: number;
  owner_id: number;
  organization_id?: number; // Zmieniono na opcjonalne
  species?: string; // Zmieniono na opcjonalne dla zgodności z repozytorium
  animal_type: AnimalType;
  sex?: string; // Zmieniono na opcjonalne dla zgodności z repozytorium
  breed?: string;
  birth_date?: Date | string;
  weight?: number;
  photo?: string;
  notes?: string;
  animal_number?: string;
  farm_animal?: FarmAnimal;
  companion_animal?: CompanionAnimal;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane specyficzne dla zwierząt hodowlanych
 */
export interface FarmAnimal {
  id?: number;
  animal_id?: number;
  identifier?: string;
  registration_number?: string;
  registration_date?: Date | string;
  mother_id?: number;
  father_id?: number;
  origin?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Dane specyficzne dla zwierząt towarzyszących
 */
export interface CompanionAnimal {
  id?: number;
  animal_id?: number;
  microchip_number?: string;
  neutered?: boolean;
  pedigree_number?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface dla podstawowych danych zwierzęcia (używane przy tworzeniu/aktualizacji)
 */
export interface AnimalBaseData {
  owner_id: number;
  organization_id?: number;
  species?: string; // Zmieniono na opcjonalne 
  animal_type: AnimalType | string;
  sex?: string; // Zmieniono na opcjonalne
  breed?: string;
  birth_date?: Date | string;
  weight?: number | null; // Dopuszcza null dla zgodności z repozytorium
  photo?: string;
  notes?: string;
}

/**
 * Dane do utworzenia/aktualizacji zwierzęcia
 */
export interface AnimalCreateData {
  owner_id: number;
  organization_id?: number;
  species?: string;
  animal_type: AnimalType | string;
  sex?: string;
  breed?: string;
  birth_date?: Date | string;
  weight?: number | null;
  photo?: string;
  notes?: string;
  farm_animal?: Partial<FarmAnimal>;
  companion_animal?: Partial<CompanionAnimal>;
  animal_number?: string;
}

/**
 * Dane do aktualizacji zwierzęcia
 */
export interface AnimalUpdateData {
  species?: string;
  animal_type?: AnimalType | string;
  sex?: string;
  breed?: string;
  birth_date?: Date | string;
  registration_date?: Date | string;
  age?: number;
  weight?: number | null;
  photo?: string;
  notes?: string;
  farm_animal?: Partial<FarmAnimal>;
  companion_animal?: Partial<CompanionAnimal>;
  currentUserId?: number;
}

/**
 * Interfejs paginacji
 */
export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Wynik operacji na zwierzętach z paginacją
 */
export interface PaginatedAnimalResult {
  animals: Animal[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  }
}