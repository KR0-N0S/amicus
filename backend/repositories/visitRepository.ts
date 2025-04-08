import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs dla wizyt
 */
export interface Visit {
  id: number;
  farmer_id: number;
  vet_id?: number;
  visit_date: Date;
  description?: string;
  status: string;
  employee_id?: number;
  channel?: string;
  created_at: Date;
  updated_at: Date;
  
  // Pola dołączane z relacji
  farmer_first_name?: string;
  farmer_last_name?: string;
  vet_first_name?: string;
  vet_last_name?: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

/**
 * Interfejs dla danych potrzebnych do utworzenia wizyty
 */
export interface VisitCreateData {
  farmer_id: number;
  vet_id?: number;
  visit_date: Date | string;
  description?: string;
  status: string;
  employee_id?: number;
  channel?: string;
}

/**
 * Interfejs dla danych do aktualizacji wizyty
 */
export interface VisitUpdateData {
  visit_date?: Date | string;
  description?: string;
  status?: string;
  vet_id?: number;
  employee_id?: number;
  channel?: string;
}

class VisitRepository {
  /**
   * Znajdź wizytę po ID
   * @param id - ID wizyty
   */
  async findById(id: number): Promise<Visit | undefined> {
    const result: QueryResult = await query(
      `SELECT v.*, 
              f.first_name as farmer_first_name, f.last_name as farmer_last_name,
              vt.first_name as vet_first_name, vt.last_name as vet_last_name,
              e.first_name as employee_first_name, e.last_name as employee_last_name
       FROM visits v
       JOIN users f ON v.farmer_id = f.id
       LEFT JOIN users vt ON v.vet_id = vt.id
       LEFT JOIN users e ON v.employee_id = e.id
       WHERE v.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Znajdź wizyty dla danego rolnika
   * @param farmerId - ID rolnika
   * @param limit - Limit wyników
   * @param offset - Offset dla paginacji
   */
  async findByFarmerId(farmerId: number, limit: number = 10, offset: number = 0): Promise<Visit[]> {
    const result: QueryResult = await query(
      `SELECT v.*, 
              vt.first_name as vet_first_name, vt.last_name as vet_last_name,
              e.first_name as employee_first_name, e.last_name as employee_last_name
       FROM visits v
       LEFT JOIN users vt ON v.vet_id = vt.id
       LEFT JOIN users e ON v.employee_id = e.id
       WHERE v.farmer_id = $1  
       ORDER BY v.visit_date DESC LIMIT $2 OFFSET $3`,
      [farmerId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Znajdź wizyty dla danego weterynarza
   * @param vetId - ID weterynarza
   * @param limit - Limit wyników
   * @param offset - Offset dla paginacji
   */
  async findByVetId(vetId: number, limit: number = 10, offset: number = 0): Promise<Visit[]> {
    const result: QueryResult = await query(
      `SELECT v.*, 
              f.first_name as farmer_first_name, f.last_name as farmer_last_name,
              e.first_name as employee_first_name, e.last_name as employee_last_name
       FROM visits v
       JOIN users f ON v.farmer_id = f.id
       LEFT JOIN users e ON v.employee_id = e.id
       WHERE v.vet_id = $1  
       ORDER BY v.visit_date DESC LIMIT $2 OFFSET $3`,
      [vetId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Policz wizyty dla danego rolnika
   * @param farmerId - ID rolnika
   */
  async countByFarmerId(farmerId: number): Promise<number> {
    const result: QueryResult = await query(
      'SELECT COUNT(*) FROM visits WHERE farmer_id = $1',
      [farmerId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Policz wizyty dla danego weterynarza
   * @param vetId - ID weterynarza
   */
  async countByVetId(vetId: number): Promise<number> {
    const result: QueryResult = await query(
      'SELECT COUNT(*) FROM visits WHERE vet_id = $1',
      [vetId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Utwórz nową wizytę
   * @param visitData - Dane wizyty
   */
  async create(visitData: VisitCreateData): Promise<Visit> {
    const { farmer_id, vet_id, visit_date, description, status, employee_id, channel } = visitData;
    
    const result: QueryResult = await query(
      `INSERT INTO visits 
       (farmer_id, vet_id, visit_date, description, status, employee_id, channel) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [farmer_id, vet_id, visit_date, description, status, employee_id, channel]
    );
    
    return result.rows[0];
  }

  /**
   * Aktualizuj istniejącą wizytę
   * @param id - ID wizyty
   * @param visitData - Dane do aktualizacji
   */
  async update(id: number, visitData: VisitUpdateData): Promise<Visit> {
    const { visit_date, description, status, vet_id, employee_id, channel } = visitData;
    
    const result: QueryResult = await query(
      `UPDATE visits 
       SET visit_date = $1, description = $2, status = $3, vet_id = $4, employee_id = $5, channel = $6
       WHERE id = $7  
       RETURNING *`,
      [visit_date, description, status, vet_id, employee_id, channel, id]
    );
    
    return result.rows[0];
  }

  /**
   * Usuń wizytę
   * @param id - ID wizyty
   */
  async delete(id: number): Promise<QueryResult> {
    return await query('DELETE FROM visits WHERE id = $1', [id]);
  }
}

export default new VisitRepository();