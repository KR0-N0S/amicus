// Definicje typów danych dla modeli z backendu

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: number;
  name: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Nowe interfejsy dla danych organizacji z rolą
export interface OrganizationWithRole {
  id: number;
  name: string;
  city?: string;
  street?: string;
  house_number?: string;
  role: string;
}

// Interfejs dla stad
export interface Herd {
  id: number;
  herd_id: string;
  eval_herd_no?: string;
}

// Rozszerzony interfejs użytkownika z dodatkowymi danymi
export interface UserWithDetails extends User {
  organizations?: OrganizationWithRole[];
  herds?: Herd[];
}

// Rozszerzony interfejs klienta z dodatkowymi polami formularza
export interface Client extends UserWithDetails {
  // Pola dla formularza dotyczące firmy
  has_company?: boolean;
  company_name?: string;
  company_tax_id?: string;
  company_street?: string;
  company_house_number?: string;
  company_city?: string;
  company_postal_code?: string;
  
  // Pola dla formularza dotyczące gospodarstwa rolnego
  has_farm?: boolean;
  farm_name?: string;
  herd_registration_number?: string;
  herd_evaluation_number?: string;
}

// Zaktualizowany interfejs FarmAnimal bez zbędnych pól
export interface FarmAnimal {
  id: number;
  animal_id: number;
  identifier?: string;         // Numer kolczyka
  // Usunięto additional_number i herd_number
  registration_date?: string;  // Data rejestracji
  origin?: string;             // Pochodzenie
  created_at?: string;
  updated_at?: string;
}

// Nowy interfejs dla zwierząt towarzyszących
export interface CompanionAnimal {
  id: number;
  animal_id: number;
  chip_number?: string;        // Numer chipa
  sterilized?: boolean;        // Czy wysterylizowane
  passport_number?: string;    // Numer paszportu
  special_needs?: string;      // Specjalne potrzeby
  created_at?: string;
  updated_at?: string;
}

// Zaktualizowany interfejs Animal dla tabeli głównej
// Zaktualizowany interfejs Animal bez wymaganego pola age
export interface Animal {
  id: number;
  owner_id: number;
  species: string;
  animal_type: 'farm' | 'companion';
  sex?: 'male' | 'female' | 'unknown';
  breed?: string;
  // age jest teraz właściwością wyliczaną, nie zapisywaną w bazie
  age?: number; // Pozostawiamy w interfejsie, ponieważ nadal jest zwracane w odpowiedziach API
  birth_date?: string;
  photo?: string;
  weight?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relacje do szczegółowych danych
  farm_animal?: FarmAnimal;       // Dla zwierząt gospodarskich
  companion_animal?: CompanionAnimal;  // Dla zwierząt towarzyszących
  
  // Pola specyficzne dla farm_animals (dla ułatwienia pracy z formularzem)
  identifier?: string;
  additional_number?: string;
  herd_number?: string;
  registration_date?: string;
  origin?: string;
  
  // Pola dla kompatybilności wstecznej
  animal_number?: string;
  
  // Pola dla kompanion animals (dodamy je później)
  name?: string;
  color?: string;
  microchip_number?: string;
  is_sterilized?: boolean;
  sterilization_date?: string;
  special_markings?: string;
  temperament?: string;
  special_needs?: string;
  
  // Pola dla kompatybilności z istniejącym kodem
  organization_id?: number;
}

export interface Bull {
  id: number;
  identification_number: string;
  vet_number?: string;
  breed?: string;
  semen_production_date?: string;
  supplier?: string;
  bull_type?: string;
  last_delivery_date?: string;
  straws_last_delivery?: number;
  current_straw_count?: number;
  suggested_price?: number;
  additional_info?: string;
  favorite: boolean;
  created_at: string;
  vet_id?: number;
}

export interface Insemination {
  id: number;
  animal_id: number;
  certificate_number: string;
  file_number: string;
  procedure_number: string;
  re_insemination?: string;
  procedure_date: string;
  herd_number?: string;
  herd_eval_number?: string;
  dam_owner?: string;
  ear_tag_number?: string;
  last_calving_date?: string;
  name?: string;
  bull_type?: string;
  supplier?: string;
  inseminator?: string;
  symlek_status?: string;
  symlek_responsibility?: string;
  created_at: string;
  owner_id: number;
  bull_id?: number;
}

export interface Visit {
  id: number;
  farmer_id: number;
  vet_id?: number;
  visit_date: string;
  description?: string;
  status?: string;
  employee_id?: number;
  channel?: string;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  pagination?: Pagination;
}

export interface AuthResponse {
  status: string;
  data: {
    user: UserWithDetails; 
    organizations?: Organization[];
    token: string;
  }
}

// Interfejsy dla odpowiedzi z API klientów
export interface ClientsResponse {
  status: string;
  results: number;
  data: {
    clients: Client[];
  }
}

export interface ClientResponse {
  status: string;
  data: {
    client: Client;
  }
}