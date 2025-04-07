// Interfejsy dla payloadów wysyłanych do API

// Payload dla danych zwierzęcia gospodarskiego
export interface FarmAnimalPayload {
    identifier: string;
    additional_number?: string;
    herd_number?: string;
    registration_date?: string | null;
    origin?: string;
  }
  
  // Payload dla danych zwierzęcia towarzyszącego
  export interface CompanionAnimalPayload {
    chip_number?: string;
    sterilized?: boolean;
    passport_number?: string;
    special_needs?: string;
  }
  
  // Główny payload dla tworzenia/aktualizacji zwierzęcia
  export interface AnimalCreatePayload {
    animal_type: 'farm' | 'companion';
    species: string;
    sex?: 'male' | 'female' | 'unknown';
    breed?: string;
    birth_date?: string | null;
    age?: number | undefined; // Zmiana z number | null na number | undefined
    weight?: number | undefined; // Zmiana z number | null na number | undefined
    notes?: string;
    organization_id?: number;
    owner_id: number;
    
    // Dane specyficzne dla typu zwierzęcia
    farm_animal?: FarmAnimalPayload;
    companion_animal?: CompanionAnimalPayload;
  }
  
  // Specialized interfaces
  export interface FarmAnimalCreatePayload extends Omit<AnimalCreatePayload, 'animal_type' | 'farm_animal' | 'companion_animal'> {
    animal_type: 'farm';
    farm_animal: FarmAnimalPayload;
  }
  
  export interface CompanionAnimalCreatePayload extends Omit<AnimalCreatePayload, 'animal_type' | 'farm_animal' | 'companion_animal'> {
    animal_type: 'companion';
    companion_animal: CompanionAnimalPayload;
  }
  export interface BullCreatePayload {
    identification_number: string;
    name: string;
    vet_number?: string;
    breed?: string;
    bull_type?: string;
    semen_production_date?: string;
    supplier?: string;
    straws_last_delivery?: number;
    current_straw_count?: number;
    suggested_price?: number;
    additional_info?: string;
    vet_id?: number;
    owner_id?: number;
  }
  
  /*** Payload do aktualizacji istniejącego buhaja*/
  export interface BullUpdatePayload extends Partial<BullCreatePayload> {
    id?: number;
  }
  // Dodajmy interfejsy dla payloadów do tworzenia i aktualizacji dostawców

export interface SemenProviderCreatePayload {
  name: string;
  vet_id_number: string;
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_province?: string;
  address_country?: string;
  contact_phone?: string;
  contact_email?: string;
}

export interface SemenProviderUpdatePayload extends Partial<SemenProviderCreatePayload> {
  id: number;
}

export interface SemenDeliveryCreatePayload {
  provider_id: number;
  delivery_date: string;
  invoice_number?: string;
  notes?: string;
  items: Array<{
    bull_id: number;
    straw_count: number;
    straw_price?: number;
    batch_number?: string;
    production_date?: string;
    expiration_date?: string;
    notes?: string;
  }>;
}

export interface SemenDeliveryUpdatePayload extends Partial<Omit<SemenDeliveryCreatePayload, 'items'>> {
  delivery_id: number;
  items?: Array<{
    item_id?: number;
    bull_id: number;
    straw_count: number;
    straw_price?: number;
    batch_number?: string;
    production_date?: string;
    expiration_date?: string;
    notes?: string;
  }>;
}