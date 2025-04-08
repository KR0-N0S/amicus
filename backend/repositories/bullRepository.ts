import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs dla filtrów wyszukiwania buhajów
 */
export interface BullFilters {
  bull_type?: string;
  breed?: string;
  owner_id?: number;
  [key: string]: any;
}

/**
 * Interfejs dla parametrów sortowania
 */
export interface SortingParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Interfejs paginacji dla wyników zapytań
 */
export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Interfejs dla odpowiedzi zapytania z paginacją
 */
export interface PaginatedResponse<T> {
  bulls: T[];
  pagination: Pagination;
}

/**
 * Interfejs danych dostawy buhaja
 */
export interface BullDeliveryData {
  delivery_id: number;
  delivery_date: Date;
  provider_id: number;
  provider_name: string;
}

/**
 * Interfejs dla buhaja
 */
export interface Bull {
  bull_id?: number;
  id?: number;
  name: string;
  identification_number: string;
  veterinary_number?: string;
  breed?: string;
  bull_type: string;
  owner_id?: number;
  sire_id?: number;
  dam_id?: number;
  created_at?: Date;
  updated_at?: Date;
  last_delivery?: BullDeliveryData;
  current_straw_count?: number;
}

/**
 * Interfejs dla danych tworzenia buhaja
 */
export interface BullCreateData {
  name: string;
  identification_number: string;
  veterinary_number?: string;
  breed?: string;
  bull_type: string;
  owner_id?: number;
  sire_id?: number;
  dam_id?: number;
}

/**
 * Interfejs dla statystyk buhaja
 */
export interface BullStats {
  total_inseminations: number;
  total_straws_delivered: number;
  straws_used: number;
  current_straws: number;
}

/**
 * Interfejs dla dostawy nasienia
 */
export interface SemenDelivery {
  delivery_id: number;
  delivery_date: Date;
  invoice_number?: string;
  straw_count: number;
  straw_price?: number;
  batch_number?: string;
  production_date?: Date;
  expiration_date?: Date;
  provider_id?: number;
  provider_name?: string;
  vet_id_number?: string;
}

/**
 * Interfejs dla inseminacji
 */
export interface Insemination {
  id: number;
  animal_id: number;
  bull_id: number;
  procedure_date: Date;
  animal_name?: string;
  species?: string;
  animal_breed?: string;
  [key: string]: any;
}

class BullRepository {
  /**
   * Pomocnicza funkcja do mapowania wiersza z bazy na obiekt buhaja
   * @param row - Wiersz z bazy danych
   * @returns Zmapowany obiekt buhaja
   */
  private _mapBull(row: any): Bull {
    const bull: Bull = { ...row };
    // Mapowanie id na bardziej standardowy format dla frontendu
    if (bull.bull_id) {
      bull.id = bull.bull_id;
      delete bull.bull_id;
    }
    
    // Jeśli mamy dane o dostawach, dołączamy je do obiektu
    if (row.delivery_data) {
      bull.last_delivery = row.delivery_data as BullDeliveryData;
    }
    
    // Jeśli mamy dane o stanie magazynowym, dołączamy je
    if (typeof row.current_straw_count !== 'undefined') {
      bull.current_straw_count = parseInt(row.current_straw_count) || 0;
    }

    return bull;
  }

  /**
   * Pomocnicza funkcja do bezpiecznego przetwarzania terminów wyszukiwania
   * @param searchTerm - Termin wyszukiwania
   * @returns Przetworzone terminy wyszukiwania
   */
  private _processSearchTerms(searchTerm?: string): string[] {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    try {
      const trimmed = searchTerm.trim();
      if (!trimmed || trimmed.length < 2) return []; // Minimalna długość 2 znaki dla wyszukiwania buhajów
      return trimmed
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 0);
    } catch (error) {
      console.error('Error processing search terms:', error);
      return [];
    }
  }

  /**
   * Pomocnicza funkcja do budowania warunków wyszukiwania w zapytaniu SQL
   * @param sql - Bazowe zapytanie SQL
   * @param searchTerms - Terminy wyszukiwania
   * @param paramCounter - Licznik parametrów
   * @param params - Parametry zapytania
   * @param hasUnaccent - Czy dostępna jest funkcja unaccent
   * @returns Zaktualizowane zapytanie i parametry
   */
  private _applySearchTerms(
    sql: string, 
    searchTerms: string[], 
    paramCounter: number, 
    params: any[], 
    hasUnaccent: boolean
  ): { sql: string; params: any[]; paramCounter: number } {
    if (searchTerms.length > 0) {
      sql += ' AND (';
      searchTerms.forEach((term, index) => {
        if (index > 0) sql += ' AND ';
        const likePattern = `%${term}%`;
        const likeCond = hasUnaccent ? `unaccent(lower($${paramCounter}))` : `lower($${paramCounter})`;
        sql += `(
          lower(COALESCE(b.name, '')) LIKE ${likeCond} OR
          lower(COALESCE(b.identification_number, '')) LIKE ${likeCond} OR
          lower(COALESCE(b.veterinary_number, '')) LIKE ${likeCond} OR
          lower(COALESCE(b.breed, '')) LIKE ${likeCond}
        )`;
        params.push(likePattern);
        paramCounter++;
      });
      sql += ')';
    }
    return { sql, params, paramCounter };
  }

  /**
   * Sprawdzanie dostępności rozszerzenia PostgreSQL (np. unaccent)
   * @param extensionName - Nazwa rozszerzenia
   * @returns Czy rozszerzenie jest dostępne
   */
  private async _checkExtension(extensionName: string): Promise<boolean> {
    try {
      const extensionResult = await query(
        "SELECT 1 FROM pg_extension WHERE extname = $1",
        [extensionName]
      );
      return extensionResult && extensionResult.rows && extensionResult.rows.length > 0;
    } catch (error) {
      console.warn(`Could not check extension ${extensionName}:`, (error as Error).message);
      return false;
    }
  }

  /**
   * Wyszukiwanie buhajów z filtrowaniem i paginacją
   * @param searchTerm - Termin wyszukiwania
   * @param filters - Filtry (typ, rasa itp.)
   * @param sorting - Parametry sortowania
   * @param page - Numer strony
   * @param limit - Limit wyników na stronę
   * @returns Wyniki wyszukiwania z paginacją
   */
  async searchBulls(
    searchTerm?: string, 
    filters: BullFilters = {}, 
    sorting: SortingParams = { field: 'name', direction: 'asc' }, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResponse<Bull>> {
    try {
      const offset = (page - 1) * limit;
      const params: any[] = [];
      let paramCounter = 1;
      
      let sql = `
        SELECT b.*,
          (SELECT json_build_object(
            'delivery_id', sd.delivery_id,
            'delivery_date', sd.delivery_date,
            'provider_id', sd.provider_id,
            'provider_name', sp.name
          )
          FROM semen_deliveries sd
          JOIN semen_delivery_items sdi ON sd.delivery_id = sdi.delivery_id
          LEFT JOIN semen_providers sp ON sd.provider_id = sp.id
          WHERE sdi.bull_id = b.bull_id
          ORDER BY sd.delivery_date DESC
          LIMIT 1) AS delivery_data,
          
          (SELECT COALESCE(SUM(sdi.straw_count), 0) 
           FROM semen_delivery_items sdi
           WHERE sdi.bull_id = b.bull_id) - 
          (SELECT COALESCE(COUNT(*), 0) 
           FROM insemination_register ir
           WHERE ir.bull_id = b.bull_id) AS current_straw_count
           
        FROM bulls b
        WHERE 1=1
      `;

      // Zastosuj filtry
      if (filters.bull_type) {
        sql += ` AND b.bull_type = $${paramCounter}`;
        params.push(filters.bull_type);
        paramCounter++;
      }

      if (filters.breed) {
        sql += ` AND b.breed = $${paramCounter}`;
        params.push(filters.breed);
        paramCounter++;
      }

      if (filters.owner_id) {
        sql += ` AND b.owner_id = $${paramCounter}`;
        params.push(filters.owner_id);
        paramCounter++;
      }

      // Wyszukiwanie
      const processedTerms = this._processSearchTerms(searchTerm);
      if (processedTerms.length > 0) {
        const hasUnaccent = await this._checkExtension('unaccent');
        const result = this._applySearchTerms(sql, processedTerms, paramCounter, params, hasUnaccent);
        sql = result.sql;
        paramCounter = result.paramCounter;
      }

      // Sortowanie
      const sortField = sorting.field || 'name';
      const sortDirection = sorting.direction || 'asc';
      sql += ` ORDER BY b.${sortField} ${sortDirection}`;
      
      // Paginacja
      sql += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      
      const result = await query(sql, params);
      const bulls = result && result.rows ? result.rows.map(row => this._mapBull(row)) : [];
      
      // Pobieranie liczby wyników
      let countSql = `SELECT COUNT(*) FROM bulls b WHERE 1=1`;
      const countParams: any[] = [];
      let countParamCounter = 1;
      
      if (filters.bull_type) {
        countSql += ` AND b.bull_type = $${countParamCounter}`;
        countParams.push(filters.bull_type);
        countParamCounter++;
      }

      if (filters.breed) {
        countSql += ` AND b.breed = $${countParamCounter}`;
        countParams.push(filters.breed);
        countParamCounter++;
      }

      if (filters.owner_id) {
        countSql += ` AND b.owner_id = $${countParamCounter}`;
        countParams.push(filters.owner_id);
        countParamCounter++;
      }
      
      if (processedTerms.length > 0) {
        const hasUnaccent = await this._checkExtension('unaccent');
        const result = this._applySearchTerms(countSql, processedTerms, countParamCounter, countParams, hasUnaccent);
        countSql = result.sql;
      }
      
      const countResult = await query(countSql, countParams);
      const totalCount = countResult && countResult.rows && countResult.rows[0]
        ? parseInt(countResult.rows[0].count)
        : 0;

      return {
        bulls,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error('Error in searchBulls:', error);
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobieranie buhaja po ID
   * @param id - ID buhaja
   * @returns Dane buhaja lub null
   */
  async findById(id: number): Promise<Bull | null> {
    try {
      const sql = `
        SELECT b.*,
          (SELECT json_build_object(
            'delivery_id', sd.delivery_id,
            'delivery_date', sd.delivery_date,
            'provider_id', sd.provider_id,
            'provider_name', sp.name
          )
          FROM semen_deliveries sd
          JOIN semen_delivery_items sdi ON sd.delivery_id = sdi.delivery_id
          LEFT JOIN semen_providers sp ON sd.provider_id = sp.id
          WHERE sdi.bull_id = b.bull_id
          ORDER BY sd.delivery_date DESC
          LIMIT 1) AS delivery_data,
          
          (SELECT COALESCE(SUM(sdi.straw_count), 0) 
           FROM semen_delivery_items sdi
           WHERE sdi.bull_id = b.bull_id) - 
          (SELECT COALESCE(COUNT(*), 0) 
           FROM insemination_register ir
           WHERE ir.bull_id = b.bull_id) AS current_straw_count
        FROM bulls b
        WHERE b.bull_id = $1
      `;
      
      const result = await query(sql, [id]);
      if (!result || !result.rows || result.rows.length === 0) return null;
      return this._mapBull(result.rows[0]);
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  /**
   * Pobieranie buhajów po ID właściciela
   * @param ownerId - ID właściciela
   * @param limit - Limit wyników
   * @param offset - Offset wyników
   * @returns Lista buhajów
   */
  async findByOwnerId(ownerId: number, limit: number = 10, offset: number = 0): Promise<Bull[]> {
    try {
      const sql = `
        SELECT b.*,
          (SELECT json_build_object(
            'delivery_id', sd.delivery_id,
            'delivery_date', sd.delivery_date,
            'provider_id', sd.provider_id,
            'provider_name', sp.name
          )
          FROM semen_deliveries sd
          JOIN semen_delivery_items sdi ON sd.delivery_id = sdi.delivery_id
          LEFT JOIN semen_providers sp ON sd.provider_id = sp.id
          WHERE sdi.bull_id = b.bull_id
          ORDER BY sd.delivery_date DESC
          LIMIT 1) AS delivery_data,
          
          (SELECT COALESCE(SUM(sdi.straw_count), 0) 
           FROM semen_delivery_items sdi
           WHERE sdi.bull_id = b.bull_id) - 
          (SELECT COALESCE(COUNT(*), 0) 
           FROM insemination_register ir
           WHERE ir.bull_id = b.bull_id) AS current_straw_count
        FROM bulls b
        WHERE b.owner_id = $1
        ORDER BY b.name
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(sql, [ownerId, limit, offset]);
      return result && result.rows ? result.rows.map(row => this._mapBull(row)) : [];
    } catch (error) {
      console.error('Error in findByOwnerId:', error);
      return [];
    }
  }

  /**
   * Pobieranie buhajów po ID organizacji
   * @param organizationId - ID organizacji
   * @param limit - Limit wyników
   * @param offset - Offset wyników
   * @returns Lista buhajów
   */
  async findByOrganizationId(organizationId: number, limit: number = 10, offset: number = 0): Promise<Bull[]> {
    try {
      const sql = `
        SELECT DISTINCT ON (b.bull_id) b.*,
          (SELECT json_build_object(
            'delivery_id', sd.delivery_id,
            'delivery_date', sd.delivery_date,
            'provider_id', sd.provider_id,
            'provider_name', sp.name
          )
          FROM semen_deliveries sd
          JOIN semen_delivery_items sdi ON sd.delivery_id = sdi.delivery_id
          LEFT JOIN semen_providers sp ON sd.provider_id = sp.id
          WHERE sdi.bull_id = b.bull_id
          ORDER BY sd.delivery_date DESC
          LIMIT 1) AS delivery_data,
          
          (SELECT COALESCE(SUM(sdi.straw_count), 0) 
           FROM semen_delivery_items sdi
           WHERE sdi.bull_id = b.bull_id) - 
          (SELECT COALESCE(COUNT(*), 0) 
           FROM insemination_register ir
           WHERE ir.bull_id = b.bull_id) AS current_straw_count
        FROM bulls b
        JOIN organization_user ou ON b.owner_id = ou.user_id
        WHERE ou.organization_id = $1
        ORDER BY b.bull_id, b.name
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(sql, [organizationId, limit, offset]);
      return result && result.rows ? result.rows.map(row => this._mapBull(row)) : [];
    } catch (error) {
      console.error('Error in findByOrganizationId:', error);
      return [];
    }
  }

  /**
   * Zliczanie buhajów po właścicielu
   * @param ownerId - ID właściciela
   * @returns Liczba buhajów
   */
  async countByOwnerId(ownerId: number): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) FROM bulls WHERE owner_id = $1`;
      const result = await query(sql, [ownerId]);
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countByOwnerId:', error);
      return 0;
    }
  }

  /**
   * Zliczanie buhajów po organizacji
   * @param organizationId - ID organizacji
   * @returns Liczba buhajów
   */
  async countByOrganizationId(organizationId: number): Promise<number> {
    try {
      const sql = `
        SELECT COUNT(DISTINCT b.bull_id)
        FROM bulls b
        JOIN organization_user ou ON b.owner_id = ou.user_id
        WHERE ou.organization_id = $1
      `;
      const result = await query(sql, [organizationId]);
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countByOrganizationId:', error);
      return 0;
    }
  }

  /**
   * Tworzenie nowego buhaja
   * @param bullData - Dane buhaja
   * @returns Utworzony buhaj
   */
  async create(bullData: BullCreateData): Promise<Bull> {
    try {
      // Sprawdzenie wymaganych pól
      if (!bullData.name) throw new Error('Bull name is required');
      if (!bullData.identification_number) throw new Error('Bull identification number is required');
      if (!bullData.bull_type) throw new Error('Bull type is required');
      
      // Sprawdzenie formatu numeru identyfikacyjnego
      const idNumberRegex = /^[A-Z]{2}[0-9]+$/;
      if (!idNumberRegex.test(bullData.identification_number)) {
        throw new Error('Invalid identification number format. Expected format: 2 uppercase letters followed by numbers');
      }

      await query('BEGIN');
      
      const bullSql = `
        INSERT INTO bulls (
          name, identification_number, veterinary_number, breed, bull_type,
          owner_id, sire_id, dam_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const bullParams = [
        bullData.name,
        bullData.identification_number,
        bullData.veterinary_number || null,
        bullData.breed || null,
        bullData.bull_type,
        bullData.owner_id || null,
        bullData.sire_id || null,
        bullData.dam_id || null
      ];
      
      const result = await query(bullSql, bullParams);
      await query('COMMIT');
      
      if (!result || !result.rows || !result.rows.length) {
        throw new Error('Failed to create bull record');
      }
      
      return this._mapBull(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in create bull:', error);
      throw error;
    }
  }

  /**
   * Aktualizacja buhaja
   * @param id - ID buhaja
   * @param bullData - Dane do aktualizacji
   * @returns Zaktualizowany buhaj
   */
  async update(id: number, bullData: Partial<Bull>): Promise<Bull> {
    try {
      // Sprawdzenie formatu numeru identyfikacyjnego jeśli został podany
      if (bullData.identification_number) {
        const idNumberRegex = /^[A-Z]{2}[0-9]+$/;
        if (!idNumberRegex.test(bullData.identification_number)) {
          throw new Error('Invalid identification number format. Expected format: 2 uppercase letters followed by numbers');
        }
      }
      
      await query('BEGIN');
      
      let updateFields: string[] = [];
      let updateParams: any[] = [];
      let paramCounter = 1;
      
      if (bullData.name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        updateParams.push(bullData.name);
      }
      
      if (bullData.identification_number !== undefined) {
        updateFields.push(`identification_number = $${paramCounter++}`);
        updateParams.push(bullData.identification_number);
      }
      
      if (bullData.veterinary_number !== undefined) {
        updateFields.push(`veterinary_number = $${paramCounter++}`);
        updateParams.push(bullData.veterinary_number);
      }
      
      if (bullData.breed !== undefined) {
        updateFields.push(`breed = $${paramCounter++}`);
        updateParams.push(bullData.breed);
      }
      
      if (bullData.bull_type !== undefined) {
        updateFields.push(`bull_type = $${paramCounter++}`);
        updateParams.push(bullData.bull_type);
      }
      
      if (bullData.owner_id !== undefined) {
        updateFields.push(`owner_id = $${paramCounter++}`);
        updateParams.push(bullData.owner_id);
      }
      
      if (bullData.sire_id !== undefined) {
        updateFields.push(`sire_id = $${paramCounter++}`);
        updateParams.push(bullData.sire_id);
      }
      
      if (bullData.dam_id !== undefined) {
        updateFields.push(`dam_id = $${paramCounter++}`);
        updateParams.push(bullData.dam_id);
      }
      
      if (updateFields.length === 0) {
        await query('ROLLBACK');
        const bull = await this.findById(id);
        if (!bull) throw new Error('Bull not found');
        return bull;
      }
      
      const sql = `
        UPDATE bulls
        SET ${updateFields.join(', ')}
        WHERE bull_id = $${paramCounter}
        RETURNING *
      `;
      
      updateParams.push(id);
      const result = await query(sql, updateParams);
      await query('COMMIT');
      
      if (!result || !result.rows || !result.rows.length) {
        throw new Error('Bull not found or update failed');
      }
      
      return this._mapBull(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in update bull:', error);
      throw error;
    }
  }

  /**
   * Usuwanie buhaja
   * @param id - ID buhaja
   * @returns Czy operacja się powiodła
   */
  async delete(id: number): Promise<boolean> {
    try {
      await query('BEGIN');
      
      // Sprawdzenie czy buhaj jest używany w inseminacjach
      const inseminationCheck = await query(
        'SELECT COUNT(*) FROM insemination_register WHERE bull_id = $1',
        [id]
      );
      
      if (inseminationCheck.rows[0].count > 0) {
        await query('ROLLBACK');
        throw new Error('Cannot delete bull that is used in insemination records');
      }
      
      // Usunięcie powiązanych elementów dostaw
      await query('DELETE FROM semen_delivery_items WHERE bull_id = $1', [id]);
      
      // Usunięcie buhaja
      const result = await query('DELETE FROM bulls WHERE bull_id = $1 RETURNING bull_id', [id]);
      await query('COMMIT');
      
      return result && result.rows && result.rows.length > 0;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in delete bull:', error);
      throw error;
    }
  }

  /**
   * Pobieranie statystyk dla buhaja
   * @param id - ID buhaja
   * @returns Statystyki buhaja
   */
  async getBullStats(id: number): Promise<BullStats> {
    try {
      const statsSql = `
        SELECT
          (SELECT COUNT(*) FROM insemination_register WHERE bull_id = $1) AS total_inseminations,
          (SELECT COALESCE(SUM(sdi.straw_count), 0) 
           FROM semen_delivery_items sdi
           WHERE sdi.bull_id = $1) AS total_straws_delivered,
          (SELECT COALESCE(COUNT(*), 0) 
           FROM insemination_register ir
           WHERE ir.bull_id = $1) AS straws_used,
          (SELECT COALESCE(SUM(sdi.straw_count), 0) 
           FROM semen_delivery_items sdi
           WHERE sdi.bull_id = $1) - 
          (SELECT COALESCE(COUNT(*), 0) 
           FROM insemination_register ir
           WHERE ir.bull_id = $1) AS current_straws
      `;
      
      const result = await query(statsSql, [id]);
      return result && result.rows && result.rows.length > 0 
        ? result.rows[0] as BullStats
        : {
            total_inseminations: 0,
            total_straws_delivered: 0,
            straws_used: 0,
            current_straws: 0
          };
    } catch (error) {
      console.error('Error in getBullStats:', error);
      return {
        total_inseminations: 0,
        total_straws_delivered: 0,
        straws_used: 0,
        current_straws: 0
      };
    }
  }

  /**
   * Pobieranie historii dostaw nasienia dla buhaja
   * @param id - ID buhaja
   * @param limit - Limit wyników
   * @param offset - Offset wyników
   * @returns Historia dostaw
   */
  async getBullDeliveries(id: number, limit: number = 10, offset: number = 0): Promise<SemenDelivery[]> {
    try {
      const sql = `
        SELECT sd.delivery_id, sd.delivery_date, sd.invoice_number,
               sdi.straw_count, sdi.straw_price, sdi.batch_number,
               sdi.production_date, sdi.expiration_date,
               sp.id as provider_id, sp.name as provider_name, sp.vet_id_number
        FROM semen_deliveries sd
        JOIN semen_delivery_items sdi ON sd.delivery_id = sdi.delivery_id
        LEFT JOIN semen_providers sp ON sd.provider_id = sp.id
        WHERE sdi.bull_id = $1
        ORDER BY sd.delivery_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(sql, [id, limit, offset]);
      return result && result.rows ? result.rows as SemenDelivery[] : [];
    } catch (error) {
      console.error('Error in getBullDeliveries:', error);
      return [];
    }
  }

  /**
   * Pobieranie historii inseminacji z wykorzystaniem buhaja
   * @param id - ID buhaja
   * @param limit - Limit wyników
   * @param offset - Offset wyników
   * @returns Historia inseminacji
   */
  async getBullInseminations(id: number, limit: number = 10, offset: number = 0): Promise<Insemination[]> {
    try {
      const sql = `
        SELECT ir.*, a.name as animal_name, a.species, a.breed as animal_breed
        FROM insemination_register ir
        LEFT JOIN animals a ON ir.animal_id = a.id
        WHERE ir.bull_id = $1
        ORDER BY ir.procedure_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(sql, [id, limit, offset]);
      return result && result.rows ? result.rows as Insemination[] : [];
    } catch (error) {
      console.error('Error in getBullInseminations:', error);
      return [];
    }
  }
}

export default new BullRepository();