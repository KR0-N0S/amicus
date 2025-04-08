/**
 * Interfejs reprezentujący stado/gospodarstwo
 */
export interface Herd {
    id: number;
    name: string;
    registration_number: string;
    owner_id: number;
    owner_type: 'user' | 'organization';
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * Dane do utworzenia stada/gospodarstwa
   */
  export interface HerdCreateData {
    name: string;
    registration_number: string;
    owner_id: number;
    owner_type: 'user' | 'organization';
    address?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  }