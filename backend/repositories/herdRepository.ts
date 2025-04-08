import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs reprezentujący gospodarstwo rolne
 */
export interface Herd {
  id: number;
  herd_id: string;          // Numer rejestracyjny gospodarstwa
  owner_type: string;       // Typ właściciela ('user' lub 'organization')
  owner_id: number;         // Identyfikator właściciela
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  eval_herd_no?: string;    // Numer ewaluacyjny stada
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane potrzebne do utworzenia gospodarstwa
 */
export interface HerdCreateData {
  name?: string;
  registration_number: string;
  evaluation_number?: string;
  owner_type?: string;
  owner_id: number;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
}

class HerdRepository {
  /**
   * Tworzenie nowego gospodarstwa
   * @param herdData - Dane nowego gospodarstwa
   * @returns Utworzone gospodarstwo
   */
  async create(herdData: HerdCreateData): Promise<Herd> {
    try {
      // Przy założeniu, że herd_id to przychodzący registration_number
      const { 
        name,
        registration_number, 
        evaluation_number, 
        owner_type = 'user', 
        owner_id, 
        street,
        house_number,
        city,
        postal_code
      } = herdData;
      
      const sql = `
        INSERT INTO herds (
          herd_id, 
          owner_type, 
          owner_id,
          street,
          house_number,
          city,
          postal_code,
          eval_herd_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `;
      
      const values = [
        registration_number,
        owner_type,
        owner_id,
        street || null,
        house_number || null,
        city || null,
        postal_code || null,
        evaluation_number || null
      ];
      
      const result: QueryResult = await query(sql, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating herd:', error);
      throw error;
    }
  }
  
  /**
   * Pobieranie gospodarstw dla określonego właściciela
   * @param ownerId - Identyfikator właściciela
   * @param ownerType - Typ właściciela ('user' lub 'organization')
   * @returns Lista gospodarstw
   */
  async getByOwnerId(ownerId: number, ownerType: string = 'user'): Promise<Herd[]> {
    try {
      const sql = `
        SELECT * FROM herds 
        WHERE owner_id = $1 AND owner_type = $2
      `;
      
      const result: QueryResult = await query(sql, [ownerId, ownerType]);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching herds by owner:', error);
      throw error;
    }
  }
  
  /**
   * Pobieranie gospodarstwa po ID
   * @param herdId - Identyfikator gospodarstwa
   * @returns Gospodarstwo lub null jeśli nie znaleziono
   */
  async getById(herdId: number): Promise<Herd | null> {
    try {
      const sql = 'SELECT * FROM herds WHERE id = $1';
      
      const result: QueryResult = await query(sql, [herdId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching herd by ID:', error);
      throw error;
    }
  }
  
  /**
   * Sprawdzenie czy numer rejestracyjny stada już istnieje
   * @param registrationNumber - Numer rejestracyjny gospodarstwa
   * @returns True jeśli numer rejestracyjny istnieje, false w przeciwnym przypadku
   */
  async checkHerdRegistrationNumberExists(registrationNumber: string): Promise<boolean> {
    try {
      const sql = 'SELECT EXISTS(SELECT 1 FROM herds WHERE herd_id = $1)';
      
      const result: QueryResult = await query(sql, [registrationNumber]);
      
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking herd registration number:', error);
      throw error;
    }
  }
}

export default new HerdRepository();