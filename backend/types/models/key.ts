/**
 * Interfejs reprezentujący klucz API
 */
export interface Key {
    id: number;
    user_id: number;
    public_key: string;
    backup_encrypted_private_key?: string;
    created_at: Date;
    updated_at: Date;
  }
  
  /**
   * Dane do utworzenia klucza API
   */
  export interface KeyCreateData {
    user_id: number;
    public_key: string;
    backup_encrypted_private_key?: string;
  }
  
  /**
   * Dane do aktualizacji klucza API
   */
  export interface KeyUpdateData {
    public_key?: string;
    backup_encrypted_private_key?: string;
  }