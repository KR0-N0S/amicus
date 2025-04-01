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