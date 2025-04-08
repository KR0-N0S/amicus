import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs reprezentujący klucz użytkownika
 */
export interface UserKey {
  id: number;
  user_id: number;
  public_key: string;
  backup_encrypted_private_key: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane potrzebne do utworzenia klucza
 */
export interface UserKeyCreateData {
  user_id: number;
  public_key: string;
  backup_encrypted_private_key: string;
}

/**
 * Dane potrzebne do aktualizacji klucza
 */
export interface UserKeyUpdateData {
  public_key: string;
  backup_encrypted_private_key: string;
}

class KeyRepository {
  /**
   * Znajdź klucz użytkownika po ID użytkownika
   * @param userId - Identyfikator użytkownika
   * @returns Klucz użytkownika lub undefined jeśli nie znaleziono
   */
  async findByUserId(userId: number): Promise<UserKey | undefined> {
    const result: QueryResult = await query(
      'SELECT * FROM user_keys WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Utwórz nowy klucz dla użytkownika
   * @param keyData - Dane klucza
   * @returns Utworzony klucz
   */
  async create(keyData: UserKeyCreateData): Promise<UserKey> {
    const { user_id, public_key, backup_encrypted_private_key } = keyData;
    
    const result: QueryResult = await query(
      `INSERT INTO user_keys 
       (user_id, public_key, backup_encrypted_private_key) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [user_id, public_key, backup_encrypted_private_key]
    );
    
    return result.rows[0];
  }

  /**
   * Aktualizuj istniejący klucz użytkownika
   * @param userId - Identyfikator użytkownika
   * @param keyData - Nowe dane klucza
   * @returns Zaktualizowany klucz
   */
  async update(userId: number, keyData: UserKeyUpdateData): Promise<UserKey> {
    const { public_key, backup_encrypted_private_key } = keyData;
    
    const result: QueryResult = await query(
      `UPDATE user_keys 
       SET public_key = $1, backup_encrypted_private_key = $2 
       WHERE user_id = $3 
       RETURNING *`,
      [public_key, backup_encrypted_private_key, userId]
    );
    
    return result.rows[0];
  }
}

export default new KeyRepository();