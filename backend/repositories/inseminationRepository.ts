import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs dla rekordu inseminacji
 */
export interface Insemination {
  id: number;
  animal_id: number;
  certificate_number?: string;
  file_number?: string;
  procedure_number?: string;
  re_insemination?: boolean;
  procedure_date: Date;
  herd_number?: string;
  herd_eval_number?: string;
  dam_owner?: string;
  ear_tag_number?: string;
  last_calving_date?: Date;
  name?: string;
  bull_type?: string;
  supplier?: string;
  inseminator?: string;
  symlek_status?: string;
  symlek_responsibility?: string;
  owner_id: number;
  bull_id?: number;
  created_at?: Date;
  updated_at?: Date;
  
  // Pola dołączane z relacji
  animal_number?: string;
  animal_breed?: string;
  sex?: string;
  bull_identification_number?: string;
  bull_breed?: string;
}

/**
 * Interfejs dla danych tworzenia inseminacji
 */
export interface InseminationCreateData {
  animal_id: number;
  certificate_number?: string;
  file_number?: string;
  procedure_number?: string;
  re_insemination?: boolean;
  procedure_date: Date | string;
  herd_number?: string;
  herd_eval_number?: string;
  dam_owner?: string;
  ear_tag_number?: string;
  last_calving_date?: Date | string;
  name?: string;
  bull_type?: string;
  supplier?: string;
  inseminator?: string;
  symlek_status?: string;
  symlek_responsibility?: string;
  owner_id: number;
  bull_id?: number;
}

/**
 * Interfejs dla filtrów inseminacji
 */
export interface InseminationFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  animalId?: number;
}

class InseminationRepository {
  /**
   * Znajduje inseminację po ID
   * @param id - ID inseminacji
   * @returns Obiekt inseminacji lub undefined
   */
  async findById(id: number): Promise<Insemination | undefined> {
    const result: QueryResult = await query(
      `SELECT ir.*, a.animal_number, a.breed as animal_breed, a.sex, 
              b.identification_number as bull_identification_number, b.breed as bull_breed 
       FROM insemination_register ir
       LEFT JOIN animals a ON ir.animal_id = a.id
       LEFT JOIN bulls b ON ir.bull_id = b.id
       WHERE ir.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Znajduje inseminacje dla danego zwierzęcia
   * @param animalId - ID zwierzęcia
   * @param limit - Limit wyników
   * @param offset - Offset dla paginacji
   * @returns Lista inseminacji
   */
  async findByAnimalId(animalId: number, limit: number = 10, offset: number = 0): Promise<Insemination[]> {
    const result: QueryResult = await query(
      `SELECT ir.*, b.identification_number as bull_identification_number, b.breed as bull_breed
       FROM insemination_register ir
       LEFT JOIN bulls b ON ir.bull_id = b.id
       WHERE ir.animal_id = $1  
       ORDER BY ir.procedure_date DESC LIMIT $2 OFFSET $3`,
      [animalId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Znajduje inseminacje dla danego właściciela
   * @param ownerId - ID właściciela
   * @param limit - Limit wyników
   * @param offset - Offset dla paginacji
   * @param filters - Filtry zapytania
   * @returns Lista inseminacji
   */
  async findByOwnerId(
    ownerId: number, 
    limit: number = 10, 
    offset: number = 0, 
    filters: InseminationFilters = {}
  ): Promise<Insemination[]> {
    let sql = `
      SELECT ir.*, a.animal_number, a.breed as animal_breed, 
            b.identification_number as bull_identification_number, b.breed as bull_breed 
      FROM insemination_register ir
      JOIN animals a ON ir.animal_id = a.id
      LEFT JOIN bulls b ON ir.bull_id = b.id
      WHERE ir.owner_id = $1
    `;
    
    const queryParams: any[] = [ownerId];
    let paramIndex = 2;
    
    if (filters.startDate) {
      sql += ` AND ir.procedure_date >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      sql += ` AND ir.procedure_date <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    if (filters.animalId) {
      sql += ` AND ir.animal_id = $${paramIndex}`;
      queryParams.push(filters.animalId);
      paramIndex++;
    }
    
    sql += ` ORDER BY ir.procedure_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result: QueryResult = await query(sql, queryParams);
    return result.rows;
  }

  /**
   * Zlicza inseminacje dla danego właściciela
   * @param ownerId - ID właściciela
   * @param filters - Filtry zapytania
   * @returns Liczba inseminacji
   */
  async countByOwnerId(ownerId: number, filters: InseminationFilters = {}): Promise<number> {
    let sql = `
      SELECT COUNT(*) 
      FROM insemination_register ir
      JOIN animals a ON ir.animal_id = a.id
      WHERE ir.owner_id = $1
    `;
    
    const queryParams: any[] = [ownerId];
    let paramIndex = 2;
    
    if (filters.startDate) {
      sql += ` AND ir.procedure_date >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      sql += ` AND ir.procedure_date <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    if (filters.animalId) {
      sql += ` AND ir.animal_id = $${paramIndex}`;
      queryParams.push(filters.animalId);
      paramIndex++;
    }
    
    const result: QueryResult = await query(sql, queryParams);
    return parseInt(result.rows[0].count);
  }

  /**
   * Tworzy nową inseminację
   * @param inseminationData - Dane inseminacji
   * @returns Utworzona inseminacja
   */
  async create(inseminationData: InseminationCreateData): Promise<Insemination> {
    const { 
      animal_id, 
      certificate_number, 
      file_number, 
      procedure_number, 
      re_insemination, 
      procedure_date, 
      herd_number, 
      herd_eval_number, 
      dam_owner, 
      ear_tag_number, 
      last_calving_date, 
      name, 
      bull_type, 
      supplier, 
      inseminator, 
      symlek_status, 
      symlek_responsibility,
      owner_id,
      bull_id
    } = inseminationData;
    
    const result: QueryResult = await query(
      `INSERT INTO insemination_register 
       (animal_id, certificate_number, file_number, procedure_number, re_insemination, 
        procedure_date, herd_number, herd_eval_number, dam_owner, ear_tag_number, 
        last_calving_date, name, bull_type, supplier, inseminator, symlek_status, 
        symlek_responsibility, owner_id, bull_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
       RETURNING *`,
      [
        animal_id, 
        certificate_number, 
        file_number, 
        procedure_number, 
        re_insemination, 
        procedure_date, 
        herd_number, 
        herd_eval_number, 
        dam_owner, 
        ear_tag_number, 
        last_calving_date, 
        name, 
        bull_type, 
        supplier, 
        inseminator, 
        symlek_status, 
        symlek_responsibility,
        owner_id,
        bull_id
      ]
    );
    
    return result.rows[0];
  }

  /**
   * Aktualizuje istniejącą inseminację
   * @param id - ID inseminacji
   * @param inseminationData - Dane do aktualizacji
   * @returns Zaktualizowana inseminacja
   */
  async update(id: number, inseminationData: Partial<Insemination>): Promise<Insemination> {
    const { 
      certificate_number, 
      file_number, 
      procedure_number, 
      re_insemination, 
      procedure_date, 
      herd_number, 
      herd_eval_number, 
      dam_owner, 
      ear_tag_number, 
      last_calving_date, 
      name, 
      bull_type, 
      supplier, 
      inseminator, 
      symlek_status, 
      symlek_responsibility,
      bull_id
    } = inseminationData;
    
    const result: QueryResult = await query(
      `UPDATE insemination_register 
       SET certificate_number = $1, file_number = $2, procedure_number = $3, re_insemination = $4, 
           procedure_date = $5, herd_number = $6, herd_eval_number = $7, dam_owner = $8, 
           ear_tag_number = $9, last_calving_date = $10, name = $11, bull_type = $12, 
           supplier = $13, inseminator = $14, symlek_status = $15, symlek_responsibility = $16,
           bull_id = $17
       WHERE id = $18 
       RETURNING *`,
      [
        certificate_number, 
        file_number, 
        procedure_number, 
        re_insemination, 
        procedure_date, 
        herd_number, 
        herd_eval_number, 
        dam_owner, 
        ear_tag_number, 
        last_calving_date, 
        name, 
        bull_type, 
        supplier, 
        inseminator, 
        symlek_status, 
        symlek_responsibility,
        bull_id,
        id
      ]
    );
    
    return result.rows[0];
  }

  /**
   * Usuwa inseminację
   * @param id - ID inseminacji
   * @returns Wynik operacji
   */
  async delete(id: number): Promise<QueryResult> {
    return await query('DELETE FROM insemination_register WHERE id = $1', [id]);
  }
}

export default new InseminationRepository();