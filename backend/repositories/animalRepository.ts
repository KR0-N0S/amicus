/**
 * Repozytorium zarządzające operacjami na zwierzętach w bazie danych
 * @author KR0-N0S
 * @date 2025-04-06
 */
import { QueryResult } from 'pg';
import { query } from '../config/db';

/**
 * Typy zwierząt
 */
export enum AnimalType {
  FARM = 'farm',
  COMPANION = 'companion'
}

/**
 * Płcie zwierząt
 */
export enum AnimalSex {
  MALE = 'male',
  FEMALE = 'female',
  UNKNOWN = 'unknown'
}

/**
 * Interfejs podstawowy dla zwierzęcia
 */
export interface Animal {
  id: number;
  owner_id: number;
  organization_id?: number;
  species?: string;
  animal_type: AnimalType | string;
  sex?: AnimalSex | string;
  breed?: string;
  birth_date?: Date;
  weight?: number;
  photo?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Opcjonalne pola dodawane po transformacji
  age?: number | null;
  animal_number?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  owner_city?: string;
  owner_street?: string;
  owner_house_number?: string;
  owner_name?: string;
  farm_animal?: FarmAnimal;
  companion_animal?: CompanionAnimal;
}

/**
 * Interfejs dla zwierzęcia gospodarskiego
 */
export interface FarmAnimal {
  id: number;
  animal_id: number;
  identifier?: string;
  additional_id?: string;
  registration_date?: Date;
  origin?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interfejs dla zwierzęcia domowego/towarzyszącego
 */
export interface CompanionAnimal {
  id: number;
  animal_id: number;
  chip_number?: string;
  sterilized?: boolean;
  passport_number?: string;
  special_needs?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interfejs dla danych wymaganych do utworzenia zwierzęcia
 */
export interface AnimalBaseData {
  owner_id: number;
  species?: string;
  sex?: AnimalSex | string;
  breed?: string;
  birth_date?: Date | string;
  weight?: number;
  photo?: string;
  notes?: string;
}

/**
 * Interfejs dla danych specyficznych dla zwierzęcia gospodarskiego
 */
export interface FarmAnimalData {
  identifier?: string;
  additional_id?: string;
  registration_date?: Date | string;
  origin?: string;
}

/**
 * Interfejs dla danych specyficznych dla zwierzęcia domowego
 */
export interface CompanionAnimalData {
  chip_number?: string;
  sterilized?: boolean;
  passport_number?: string;
  special_needs?: string;
}

/**
 * Interfejs dla wyników paginacji
 */
export interface Pagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Interfejs dla wyników zapytania z paginacją
 */
export interface PaginatedResult<T> {
  animals: T[];
  pagination: Pagination;
}

/**
 * Interfejs dla wpisu w cache rozszerzeń
 */
interface ExtensionCacheEntry {
  value: boolean;
  expires: number;
}

class AnimalRepository {
  // Cache dla dostępności rozszerzeń PostgreSQL
  private _extensionCache: Record<string, ExtensionCacheEntry>;
  private _extensionCacheDuration: number;

  constructor() {
    this._extensionCache = {};
    this._extensionCacheDuration = 3600000; // 1 godzina w ms
  }

  // -------------------- METODY POMOCNICZE -------------------- //

  /**
   * Oblicza wiek na podstawie daty urodzenia
   * @private
   */
  private _calculateAge(birthDate?: Date | string | null): number | null {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age < 0 ? 0 : age;
  }

  /**
   * Konwertuje wiersz z bazy danych na obiekt zwierzęcia
   * @private
   */
  private _mapAnimal(row: any): Animal | null {
    if (!row) return null;
    // Tworzymy kopię obiektu, aby nie modyfikować oryginału
    const animal: Animal = { ...row };
    animal.age = animal.birth_date ? this._calculateAge(animal.birth_date) : null;

    // Obsługa typów zwierząt
    if (animal.animal_type === AnimalType.FARM) {
      if (row.animal_details) {
        animal.farm_animal = row.animal_details as FarmAnimal;
        animal.animal_number = row.animal_details.identifier;
      } else if (row.identifier) {
        animal.farm_animal = {
          identifier: row.identifier,
          registration_date: row.registration_date,
          origin: row.origin,
          additional_id: row.additional_id
        } as FarmAnimal;
        animal.animal_number = row.identifier;
        // Usuwamy zduplikowane pola
        delete (animal as any).identifier;
        delete (animal as any).registration_date;
        delete (animal as any).origin;
        delete (animal as any).additional_id;
      }
    } else if (animal.animal_type === AnimalType.COMPANION && row.animal_details) {
      animal.companion_animal = row.animal_details as CompanionAnimal;
    }
    // Usuwamy pole ze szczegółami, które zostały już przetworzone
    delete (animal as any).animal_details;
    return animal;
  }

  /**
   * Przetwarza frazy wyszukiwania na tablicę termów
   * @private
   */
  private _processSearchTerms(searchTerm?: string): string[] {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 3) return [];
    return trimmed.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  }

  /**
   * Dodaje warunki wyszukiwania do zapytania SQL
   * @private
   */
  private async _applySearchConditions(
    sql: string, 
    searchTerm?: string, 
    params: any[] = [], 
    paramCounter: number = 1
  ): Promise<{ sql: string; params: any[]; paramCounter: number }> {
    const terms = this._processSearchTerms(searchTerm);
    if (terms.length === 0) return { sql, params, paramCounter };

    const hasUnaccent = await this._checkExtension('unaccent');
    // Definiujemy pola, w których będziemy wyszukiwać
    const fields = [
      "fa.identifier",
      "u.first_name",
      "u.last_name",
      "u.city",
      "u.street",
      "u.house_number",
      "a.species",
      "a.breed"
    ];

    // Dla każdego termu budujemy grupę warunków połączonych operatorem OR
    const termConditions = terms.map(term => {
      const likePattern = `%${term}%`;
      // Dla danego termu budujemy warunki dla każdego pola
      const fieldConditions = fields.map(field => {
        const expr = hasUnaccent
          ? `unaccent(lower(COALESCE(${field},'')))`
          : `lower(COALESCE(${field},''))`;
        return `${expr} LIKE $${paramCounter}`;
      });
      params.push(likePattern);
      paramCounter++;
      return `(${fieldConditions.join(' OR ')})`;
    });
    // Łączymy warunki dla poszczególnych termów operatorem AND
    sql += ' AND (' + termConditions.join(' AND ') + ')';
    return { sql, params, paramCounter };
  }

  /**
   * Sprawdza czy rozszerzenie PostgreSQL jest dostępne z wykorzystaniem cache
   * @private
   */
  private async _checkExtension(extensionName: string): Promise<boolean> {
    const now = Date.now();
    if (
      this._extensionCache[extensionName] &&
      now < this._extensionCache[extensionName].expires
    ) {
      return this._extensionCache[extensionName].value;
    }
    try {
      const result = await query(
        "SELECT 1 FROM pg_extension WHERE extname = $1",
        [extensionName]
      );
      const available = result?.rows?.length > 0;
      this._extensionCache[extensionName] = { value: available, expires: now + this._extensionCacheDuration };
      return available;
    } catch (error) {
      this._extensionCache[extensionName] = { value: false, expires: now + this._extensionCacheDuration };
      return false;
    }
  }

  /**
   * Tworzy podstawowe zapytanie SQL dla pobierania zwierząt
   * @private
   */
  private _createBaseAnimalQuery(): string {
    return `
      SELECT a.*,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.city as owner_city,
        u.street as owner_street,
        u.house_number as owner_house_number,
        CONCAT(u.first_name, ' ', u.last_name) as owner_name,
        CASE 
          WHEN a.animal_type = 'farm' THEN json_build_object(
            'id', fa.id,
            'identifier', fa.identifier,
            'additional_id', fa.additional_id,
            'registration_date', fa.registration_date,
            'origin', fa.origin
          )
          WHEN a.animal_type = 'companion' THEN json_build_object(
            'id', ca.id,
            'chip_number', ca.chip_number,
            'sterilized', ca.sterilized,
            'passport_number', ca.passport_number,
            'special_needs', ca.special_needs
          )
        END AS animal_details
      FROM animals a
      LEFT JOIN users u ON a.owner_id = u.id
      LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
      LEFT JOIN companion_animals ca ON a.id = ca.animal_id AND a.animal_type = 'companion'
    `;
  }

  /**
   * Wykonuje transakcję z obsługą błędów
   * @private
   */
  private async _executeTransaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      await query('BEGIN');
      const result = await callback();
      await query('COMMIT');
      return result;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  // -------------------- METODY GŁÓWNE -------------------- //

  /**
   * Znajduje zwierzę po ID
   * @param id Identyfikator zwierzęcia
   */
  async findById(id: number): Promise<Animal | null> {
    try {
      const sql = `
        ${this._createBaseAnimalQuery()}
        WHERE a.id = $1
      `;
      const result: QueryResult = await query(sql, [id]);
      return result?.rows?.length > 0 ? this._mapAnimal(result.rows[0]) : null;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  /**
   * Znajduje zwierzę po identyfikatorze (kolczyku)
   * @param identifier Identyfikator zwierzęcia (kolczyk)
   */
  async findByIdentifier(identifier?: string): Promise<Animal[]> {
    if (!identifier) return [];
    try {
      const sql = `
        SELECT a.*, 
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name,
          fa.identifier, fa.registration_date, fa.origin, fa.additional_id
        FROM animals a
        JOIN farm_animals fa ON a.id = fa.animal_id
        LEFT JOIN users u ON a.owner_id = u.id
        WHERE fa.identifier = $1
      `;
      const result: QueryResult = await query(sql, [identifier]);
      return (result?.rows || []).map(row => this._mapAnimal(row)).filter((a): a is Animal => a !== null);
    } catch (error) {
      console.error('Error in findByIdentifier:', error);
      return [];
    }
  }

  /**
   * Pobiera zwierzęta dla właściciela
   * @param ownerId ID właściciela
   * @param limit Limit wyników na stronę
   * @param offset Przesunięcie (dla paginacji)
   * @param animalType Typ zwierzęcia (opcjonalny)
   */
  async findByOwnerId(
    ownerId: number, 
    limit: number = 10, 
    offset: number = 0, 
    animalType?: string | null
  ): Promise<Animal[]> {
    try {
      const params: any[] = [ownerId];
      let paramCounter: number = 2;
      let sql = `
        ${this._createBaseAnimalQuery()}
        WHERE a.owner_id = $1
      `;
      if (animalType) {
        sql += ` AND a.animal_type = $${paramCounter++}`;
        params.push(animalType);
      }
      sql += ` ORDER BY a.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);
      const result: QueryResult = await query(sql, params);
      return (result?.rows || []).map(row => this._mapAnimal(row)).filter((a): a is Animal => a !== null);
    } catch (error) {
      console.error('Error in findByOwnerId:', error);
      return [];
    }
  }

  /**
   * Pobiera zwierzęta dla organizacji
   * @param organizationId ID organizacji
   * @param limit Limit wyników na stronę
   * @param offset Przesunięcie (dla paginacji)
   * @param animalType Typ zwierzęcia (opcjonalny)
   */
  async findByOrganizationId(
    organizationId: number, 
    limit: number = 10, 
    offset: number = 0, 
    animalType?: string | null
  ): Promise<Animal[]> {
    try {
      const params: any[] = [organizationId];
      let paramCounter: number = 2;
      let sql = `
        SELECT DISTINCT ON (a.id) a.*,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          u.city as owner_city,
          u.street as owner_street,
          u.house_number as owner_house_number,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name,
          fa.identifier, fa.registration_date, fa.origin, fa.additional_id
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
        LEFT JOIN companion_animals ca ON a.id = ca.animal_id AND a.animal_type = 'companion'
        WHERE ou.organization_id = $1
      `;
      if (animalType) {
        sql += ` AND a.animal_type = $${paramCounter++}`;
        params.push(animalType);
      }
      sql += ` ORDER BY a.id, a.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);
      const result: QueryResult = await query(sql, params);
      return (result?.rows || []).map(row => this._mapAnimal(row)).filter((a): a is Animal => a !== null);
    } catch (error) {
      console.error('Error in findByOrganizationId:', error);
      return [];
    }
  }

  /**
   * Wyszukuje zwierzęta dla właściciela
   * @param searchTerm Wyszukiwana fraza
   * @param ownerId ID właściciela
   * @param animalType Typ zwierzęcia (opcjonalny)
   * @param page Numer strony
   * @param limit Limit wyników na stronę
   */
  async searchAnimalsByOwnerId(
    searchTerm: string | undefined,
    ownerId: number, 
    animalType: string | null = null, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<Animal>> {
    try {
      const offset = (page - 1) * limit;
      let params: any[] = [ownerId];
      let paramCounter: number = 2;
      let sql = this._createBaseAnimalQuery() + ' WHERE a.owner_id = $1';
      if (animalType) {
        sql += ` AND a.animal_type = $${paramCounter++}`;
        params.push(animalType);
      }
      const searchApplied = await this._applySearchConditions(sql, searchTerm, params, paramCounter);
      sql = searchApplied.sql;
      params = searchApplied.params;
      paramCounter = searchApplied.paramCounter;
      sql += ` ORDER BY a.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);
      const result: QueryResult = await query(sql, params);
      const animals = (result?.rows || [])
        .map(row => this._mapAnimal(row))
        .filter((a): a is Animal => a !== null);
        
      // Pobranie liczby wszystkich wyników (bez paginacji)
      const countSql = `
        SELECT COUNT(*) FROM animals a 
        LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
        LEFT JOIN users u ON a.owner_id = u.id
        WHERE a.owner_id = $1 ${animalType ? 'AND a.animal_type = $2' : ''}
      `;
      const countParams = animalType ? [ownerId, animalType] : [ownerId];
      const countResult: QueryResult = await query(countSql, countParams);
      const totalCount = parseInt(countResult?.rows?.[0]?.count) || 0;
      
      return {
        animals,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error('Error in searchAnimalsByOwnerId:', error);
      return {
        animals: [],
        pagination: { totalCount: 0, totalPages: 1, currentPage: page, pageSize: limit }
      };
    }
  }

  /**
   * Wyszukuje zwierzęta dla organizacji
   * @param searchTerm Wyszukiwana fraza
   * @param organizationId ID organizacji
   * @param animalType Typ zwierzęcia (opcjonalny)
   * @param page Numer strony
   * @param limit Limit wyników na stronę
   */
  async searchAnimalsByOrganizationId(
    searchTerm: string | undefined, 
    organizationId: number, 
    animalType: string | null = null, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedResult<Animal>> {
    try {
      const offset = (page - 1) * limit;
      let params: any[] = [organizationId];
      let paramCounter: number = 2;
      let sql = `
        SELECT DISTINCT ON (a.id) a.*,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name,
          u.city as owner_city,
          u.street as owner_street,
          u.house_number as owner_house_number,
          CONCAT(u.first_name, ' ', u.last_name) as owner_name,
          fa.identifier, fa.registration_date, fa.origin, fa.additional_id
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
        LEFT JOIN companion_animals ca ON a.id = ca.animal_id AND a.animal_type = 'companion'
        WHERE ou.organization_id = $1
      `;
      if (animalType) {
        sql += ` AND a.animal_type = $${paramCounter++}`;
        params.push(animalType);
      }
      const searchApplied = await this._applySearchConditions(sql, searchTerm, params, paramCounter);
      sql = searchApplied.sql;
      params = searchApplied.params;
      paramCounter = searchApplied.paramCounter;
      sql += ` ORDER BY a.id, a.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      params.push(limit, offset);
      const result: QueryResult = await query(sql, params);
      const animals = (result?.rows || [])
        .map(row => this._mapAnimal(row))
        .filter((a): a is Animal => a !== null);
        
      const countSql = `
        SELECT COUNT(DISTINCT a.id) 
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        WHERE ou.organization_id = $1 ${animalType ? 'AND a.animal_type = $2' : ''}
      `;
      const countParams = animalType ? [organizationId, animalType] : [organizationId];
      const countResult: QueryResult = await query(countSql, countParams);
      const totalCount = parseInt(countResult?.rows?.[0]?.count) || 0;
      
      return {
        animals,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error('Error in searchAnimalsByOrganizationId:', error);
      return {
        animals: [],
        pagination: { totalCount: 0, totalPages: 1, currentPage: page, pageSize: limit }
      };
    }
  }

  /**
   * Liczy zwierzęta dla właściciela
   * @param ownerId ID właściciela
   * @param animalType Typ zwierzęcia (opcjonalny)
   */
  async countByOwnerId(ownerId: number, animalType?: string | null): Promise<number> {
    try {
      let sql = `SELECT COUNT(*) FROM animals WHERE owner_id = $1`;
      const params: any[] = [ownerId];
      if (animalType) {
        sql += ` AND animal_type = $2`;
        params.push(animalType);
      }
      const result: QueryResult = await query(sql, params);
      return parseInt(result?.rows?.[0]?.count) || 0;
    } catch (error) {
      console.error('Error in countByOwnerId:', error);
      return 0;
    }
  }

  /**
   * Liczy zwierzęta dla organizacji
   * @param organizationId ID organizacji
   * @param animalType Typ zwierzęcia (opcjonalny)
   */
  async countByOrganizationId(organizationId: number, animalType?: string | null): Promise<number> {
    try {
      let sql = `
        SELECT COUNT(DISTINCT a.id) 
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        WHERE ou.organization_id = $1
      `;
      const params: any[] = [organizationId];
      if (animalType) {
        sql += ` AND a.animal_type = $2`;
        params.push(animalType);
      }
      const result: QueryResult = await query(sql, params);
      return parseInt(result?.rows?.[0]?.count) || 0;
    } catch (error) {
      console.error('Error in countByOrganizationId:', error);
      return 0;
    }
  }

  /**
   * Tworzy nowe zwierzę
   * @param animalBaseData Podstawowe dane zwierzęcia
   * @param animalType Typ zwierzęcia (farm lub companion)
   * @param specificData Dane specyficzne dla typu zwierzęcia
   */
  async create(
    animalBaseData: AnimalBaseData, 
    animalType: string, 
    specificData?: FarmAnimalData | CompanionAnimalData
  ): Promise<Animal> {
    return this._executeTransaction(async () => {
      if (!animalBaseData || !animalType) {
        throw new Error('Missing required data for animal creation');
      }
      const animalSql = `
        INSERT INTO animals (
          owner_id, species, animal_type, sex, breed, birth_date, 
          weight, photo, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      const animalParams = [
        animalBaseData.owner_id,
        animalBaseData.species || null,
        animalType,
        animalBaseData.sex || null,
        animalBaseData.breed || null,
        animalBaseData.birth_date || null,
        animalBaseData.weight || null,
        animalBaseData.photo || null,
        animalBaseData.notes || null
      ];
      const animalResult: QueryResult = await query(animalSql, animalParams);
      if (!animalResult?.rows?.[0]) {
        throw new Error('Failed to create animal record');
      }
      const animal: Animal = animalResult.rows[0];
      if (animalType === 'farm' && specificData) {
        const farmSql = `
          INSERT INTO farm_animals (
            animal_id, identifier, additional_id, registration_date, origin, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `;
        const farmParams = [
          animal.id,
          (specificData as FarmAnimalData).identifier || null,
          (specificData as FarmAnimalData).additional_id || null,
          (specificData as FarmAnimalData).registration_date || null,
          (specificData as FarmAnimalData).origin || null
        ];
        const farmResult: QueryResult = await query(farmSql, farmParams);
        if (farmResult?.rows?.[0]) {
          animal.farm_animal = farmResult.rows[0];
          animal.animal_number = farmResult.rows[0].identifier;
        }
      } else if (animalType === 'companion' && specificData) {
        const companionSql = `
          INSERT INTO companion_animals (
            animal_id, chip_number, sterilized, passport_number, special_needs, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `;
        const companionParams = [
          animal.id,
          (specificData as CompanionAnimalData).chip_number || null,
          (specificData as CompanionAnimalData).sterilized || false,
          (specificData as CompanionAnimalData).passport_number || null,
          (specificData as CompanionAnimalData).special_needs || null
        ];
        const companionResult: QueryResult = await query(companionSql, companionParams);
        if (companionResult?.rows?.[0]) {
          animal.companion_animal = companionResult.rows[0];
        }
      }
      return animal;
    });
  }

  /**
   * Aktualizuje istniejące zwierzę
   * @param id ID zwierzęcia do aktualizacji
   * @param animalBaseData Podstawowe dane zwierzęcia
   * @param animalType Typ zwierzęcia (farm lub companion)
   * @param specificData Dane specyficzne dla typu zwierzęcia
   */
  async update(
    id: number, 
    animalBaseData: Partial<AnimalBaseData>, 
    animalType: string, 
    specificData?: Partial<FarmAnimalData> | Partial<CompanionAnimalData>
  ): Promise<Animal | null> {
    return this._executeTransaction(async () => {
      const updateFields: string[] = [];
      const updateParams: any[] = [];
      let paramCounter: number = 1;
      const fieldsToUpdate = ['species', 'sex', 'breed', 'birth_date', 'weight', 'photo', 'notes'];
      fieldsToUpdate.forEach(field => {
        if (animalBaseData[field as keyof typeof animalBaseData] !== undefined) {
          updateFields.push(`${field} = $${paramCounter++}`);
          updateParams.push(animalBaseData[field as keyof typeof animalBaseData]);
        }
      });
      updateFields.push(`updated_at = NOW()`);
      
      let animal: Animal;
      if (updateFields.length > 0) {
        const animalSql = `
          UPDATE animals
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCounter}
          RETURNING *
        `;
        updateParams.push(id);
        const animalResult: QueryResult = await query(animalSql, updateParams);
        if (!animalResult?.rows?.[0]) {
          throw new Error('Animal not found');
        }
        animal = animalResult.rows[0];
      } else {
        const animalResult: QueryResult = await query('SELECT * FROM animals WHERE id = $1', [id]);
        if (!animalResult?.rows?.[0]) {
          throw new Error('Animal not found');
        }
        animal = animalResult.rows[0];
      }
      
      if (animalType === 'farm' && specificData) {
        const farmCheckResult: QueryResult = await query('SELECT id FROM farm_animals WHERE animal_id = $1', [id]);
        if (farmCheckResult?.rows?.length > 0) {
          const farmUpdateFields: string[] = [];
          const farmUpdateParams: any[] = [];
          let farmParamCounter: number = 1;
          const farmFieldsToUpdate = ['identifier', 'additional_id', 'registration_date', 'origin'];
          farmFieldsToUpdate.forEach(field => {
            if (specificData[field as keyof typeof specificData] !== undefined) {
              farmUpdateFields.push(`${field} = $${farmParamCounter++}`);
              farmUpdateParams.push(specificData[field as keyof typeof specificData]);
            }
          });
          farmUpdateFields.push(`updated_at = NOW()`);
          
          if (farmUpdateFields.length > 0) {
            const farmSql = `
              UPDATE farm_animals
              SET ${farmUpdateFields.join(', ')}
              WHERE animal_id = $${farmParamCounter}
              RETURNING *
            `;
            farmUpdateParams.push(id);
            const farmResult: QueryResult = await query(farmSql, farmUpdateParams);
            if (farmResult?.rows?.[0]) {
              animal.farm_animal = farmResult.rows[0];
              animal.animal_number = farmResult.rows[0].identifier;
            }
          }
        } else {
          const farmSql = `
            INSERT INTO farm_animals (
              animal_id, identifier, additional_id, registration_date, origin, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
          `;
          const farmParams = [
            id,
            (specificData as FarmAnimalData).identifier || null,
            (specificData as FarmAnimalData).additional_id || null,
            (specificData as FarmAnimalData).registration_date || null,
            (specificData as FarmAnimalData).origin || null
          ];
          const farmResult: QueryResult = await query(farmSql, farmParams);
          if (farmResult?.rows?.[0]) {
            animal.farm_animal = farmResult.rows[0];
            animal.animal_number = farmResult.rows[0].identifier;
          }
        }
      } else if (animalType === 'companion' && specificData) {
        const companionCheckResult: QueryResult = await query('SELECT id FROM companion_animals WHERE animal_id = $1', [id]);
        if (companionCheckResult?.rows?.length > 0) {
          const companionUpdateFields: string[] = [];
          const companionUpdateParams: any[] = [];
          let companionParamCounter: number = 1;
          const companionFieldsToUpdate = ['chip_number', 'sterilized', 'passport_number', 'special_needs'];
          companionFieldsToUpdate.forEach(field => {
            if (specificData[field as keyof typeof specificData] !== undefined) {
              companionUpdateFields.push(`${field} = $${companionParamCounter++}`);
              companionUpdateParams.push(specificData[field as keyof typeof specificData]);
            }
          });
          companionUpdateFields.push(`updated_at = NOW()`);
          
          if (companionUpdateFields.length > 0) {
            const companionSql = `
              UPDATE companion_animals
              SET ${companionUpdateFields.join(', ')}
              WHERE animal_id = $${companionParamCounter}
              RETURNING *
            `;
            companionUpdateParams.push(id);
            const companionResult: QueryResult = await query(companionSql, companionUpdateParams);
            if (companionResult?.rows?.[0]) {
              animal.companion_animal = companionResult.rows[0];
            }
          }
        } else {
          const companionSql = `
            INSERT INTO companion_animals (
              animal_id, chip_number, sterilized, passport_number, special_needs, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
          `;
          const companionParams = [
            id,
            (specificData as CompanionAnimalData).chip_number || null,
            (specificData as CompanionAnimalData).sterilized || false,
            (specificData as CompanionAnimalData).passport_number || null,
            (specificData as CompanionAnimalData).special_needs || null
          ];
          const companionResult: QueryResult = await query(companionSql, companionParams);
          if (companionResult?.rows?.[0]) {
            animal.companion_animal = companionResult.rows[0];
          }
        }
      }
      return this.findById(id);
    });
  }

  /**
   * Usuwa zwierzę
   * @param id ID zwierzęcia do usunięcia
   */
  async delete(id: number): Promise<boolean> {
    return this._executeTransaction(async () => {
      await query('DELETE FROM farm_animals WHERE animal_id = $1', [id]);
      await query('DELETE FROM companion_animals WHERE animal_id = $1', [id]);
      const result: QueryResult = await query('DELETE FROM animals WHERE id = $1 RETURNING id', [id]);
      return result?.rows?.length > 0;
    });
  }
}

export default new AnimalRepository();