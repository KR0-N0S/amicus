/**
 * Repozytorium zarządzające operacjami na zwierzętach w bazie danych
 * @author KR0-N0S
 * @date 2025-04-06
 */
const { query } = require('../config/db');

class AnimalRepository {
  constructor() {
    // Cache dla dostępności rozszerzeń PostgreSQL
    this._extensionCache = {};
    this._extensionCacheDuration = 3600000; // 1 godzina w ms
  }

  // -------------------- METODY POMOCNICZE -------------------- //

  /**
   * Oblicza wiek na podstawie daty urodzenia
   * @private
   */
  _calculateAge(birthDate) {
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
  _mapAnimal(row) {
    if (!row) return null;
    // Tworzymy kopię obiektu, aby nie modyfikować oryginału
    const animal = { ...row };
    animal.age = animal.birth_date ? this._calculateAge(animal.birth_date) : null;

    // Obsługa typów zwierząt
    if (animal.animal_type === 'farm') {
      if (row.animal_details) {
        animal.farm_animal = row.animal_details;
        animal.animal_number = row.animal_details.identifier;
      } else if (row.identifier) {
        animal.farm_animal = {
          identifier: row.identifier,
          registration_date: row.registration_date,
          origin: row.origin,
          additional_id: row.additional_id
        };
        animal.animal_number = row.identifier;
        // Usuwamy zduplikowane pola
        delete animal.identifier;
        delete animal.registration_date;
        delete animal.origin;
        delete animal.additional_id;
      }
    } else if (animal.animal_type === 'companion' && row.animal_details) {
      animal.companion_animal = row.animal_details;
    }
    // Usuwamy pole ze szczegółami, które zostały już przetworzone
    delete animal.animal_details;
    return animal;
  }

  /**
   * Przetwarza frazy wyszukiwania na tablicę termów
   * @private
   */
  _processSearchTerms(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 3) return [];
    return trimmed.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  }

  /**
   * Dodaje warunki wyszukiwania do zapytania SQL
   * @private
   */
  async _applySearchConditions(sql, searchTerm, params = [], paramCounter = 1) {
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
  async _checkExtension(extensionName) {
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
  _createBaseAnimalQuery() {
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
  async _executeTransaction(callback) {
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
   */
  async findById(id) {
    try {
      const sql = `
        ${this._createBaseAnimalQuery()}
        WHERE a.id = $1
      `;
      const result = await query(sql, [id]);
      return result?.rows?.length > 0 ? this._mapAnimal(result.rows[0]) : null;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  /**
   * Znajduje zwierzę po identyfikatorze (kolczyku)
   */
  async findByIdentifier(identifier) {
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
      const result = await query(sql, [identifier]);
      return (result?.rows || []).map(row => this._mapAnimal(row));
    } catch (error) {
      console.error('Error in findByIdentifier:', error);
      return [];
    }
  }

  /**
   * Pobiera zwierzęta dla właściciela
   */
  async findByOwnerId(ownerId, limit = 10, offset = 0, animalType = null) {
    try {
      const params = [ownerId];
      let paramCounter = 2;
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
      const result = await query(sql, params);
      return (result?.rows || []).map(row => this._mapAnimal(row));
    } catch (error) {
      console.error('Error in findByOwnerId:', error);
      return [];
    }
  }

  /**
   * Pobiera zwierzęta dla organizacji
   */
  async findByOrganizationId(organizationId, limit = 10, offset = 0, animalType = null) {
    try {
      const params = [organizationId];
      let paramCounter = 2;
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
      const result = await query(sql, params);
      return (result?.rows || []).map(row => this._mapAnimal(row));
    } catch (error) {
      console.error('Error in findByOrganizationId:', error);
      return [];
    }
  }

  /**
   * Wyszukuje zwierzęta dla właściciela
   */
  async searchAnimalsByOwnerId(searchTerm, ownerId, animalType = null, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const params = [ownerId];
      let paramCounter = 2;
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
      const result = await query(sql, params);
      const animals = (result?.rows || []).map(row => this._mapAnimal(row));
      // Pobranie liczby wszystkich wyników (bez paginacji)
      const countSql = `
        SELECT COUNT(*) FROM animals a 
        LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
        LEFT JOIN users u ON a.owner_id = u.id
        WHERE a.owner_id = $1 ${animalType ? 'AND a.animal_type = $2' : ''}
      `;
      const countParams = animalType ? [ownerId, animalType] : [ownerId];
      const countResult = await query(countSql, countParams);
      const totalCount = countResult?.rows?.[0]?.count || 0;
      return {
        animals,
        pagination: {
          totalCount: parseInt(totalCount),
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
   */
  async searchAnimalsByOrganizationId(searchTerm, organizationId, animalType = null, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const params = [organizationId];
      let paramCounter = 2;
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
      const result = await query(sql, params);
      const animals = (result?.rows || []).map(row => this._mapAnimal(row));
      const countSql = `
        SELECT COUNT(DISTINCT a.id) 
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        WHERE ou.organization_id = $1 ${animalType ? 'AND a.animal_type = $2' : ''}
      `;
      const countParams = animalType ? [organizationId, animalType] : [organizationId];
      const countResult = await query(countSql, countParams);
      const totalCount = countResult?.rows?.[0]?.count || 0;
      return {
        animals,
        pagination: {
          totalCount: parseInt(totalCount),
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
   */
  async countByOwnerId(ownerId, animalType = null) {
    try {
      let sql = `SELECT COUNT(*) FROM animals WHERE owner_id = $1`;
      const params = [ownerId];
      if (animalType) {
        sql += ` AND animal_type = $2`;
        params.push(animalType);
      }
      const result = await query(sql, params);
      return result?.rows?.[0]?.count || 0;
    } catch (error) {
      console.error('Error in countByOwnerId:', error);
      return 0;
    }
  }

  /**
   * Liczy zwierzęta dla organizacji
   */
  async countByOrganizationId(organizationId, animalType = null) {
    try {
      let sql = `
        SELECT COUNT(DISTINCT a.id) 
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        WHERE ou.organization_id = $1
      `;
      const params = [organizationId];
      if (animalType) {
        sql += ` AND a.animal_type = $2`;
        params.push(animalType);
      }
      const result = await query(sql, params);
      return result?.rows?.[0]?.count || 0;
    } catch (error) {
      console.error('Error in countByOrganizationId:', error);
      return 0;
    }
  }

  /**
   * Tworzy nowe zwierzę
   */
  async create(animalBaseData, animalType, specificData) {
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
      const animalResult = await query(animalSql, animalParams);
      if (!animalResult?.rows?.[0]) {
        throw new Error('Failed to create animal record');
      }
      const animal = animalResult.rows[0];
      if (animalType === 'farm' && specificData) {
        const farmSql = `
          INSERT INTO farm_animals (
            animal_id, identifier, additional_id, registration_date, origin, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `;
        const farmParams = [
          animal.id,
          specificData.identifier || null,
          specificData.additional_id || null,
          specificData.registration_date || null,
          specificData.origin || null
        ];
        const farmResult = await query(farmSql, farmParams);
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
          specificData.chip_number || null,
          specificData.sterilized || false,
          specificData.passport_number || null,
          specificData.special_needs || null
        ];
        const companionResult = await query(companionSql, companionParams);
        if (companionResult?.rows?.[0]) {
          animal.companion_animal = companionResult.rows[0];
        }
      }
      return animal;
    });
  }

  /**
   * Aktualizuje istniejące zwierzę
   */
  async update(id, animalBaseData, animalType, specificData) {
    return this._executeTransaction(async () => {
      const updateFields = [];
      const updateParams = [];
      let paramCounter = 1;
      const fieldsToUpdate = ['species', 'sex', 'breed', 'birth_date', 'weight', 'photo', 'notes'];
      fieldsToUpdate.forEach(field => {
        if (animalBaseData[field] !== undefined) {
          updateFields.push(`${field} = $${paramCounter++}`);
          updateParams.push(animalBaseData[field]);
        }
      });
      updateFields.push(`updated_at = NOW()`);
      let animal;
      if (updateFields.length > 0) {
        const animalSql = `
          UPDATE animals
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCounter}
          RETURNING *
        `;
        updateParams.push(id);
        const animalResult = await query(animalSql, updateParams);
        if (!animalResult?.rows?.[0]) {
          throw new Error('Animal not found');
        }
        animal = animalResult.rows[0];
      } else {
        const animalResult = await query('SELECT * FROM animals WHERE id = $1', [id]);
        if (!animalResult?.rows?.[0]) {
          throw new Error('Animal not found');
        }
        animal = animalResult.rows[0];
      }
      if (animalType === 'farm' && specificData) {
        const farmCheckResult = await query('SELECT id FROM farm_animals WHERE animal_id = $1', [id]);
        if (farmCheckResult?.rows?.length > 0) {
          const farmUpdateFields = [];
          const farmUpdateParams = [];
          let farmParamCounter = 1;
          const farmFieldsToUpdate = ['identifier', 'additional_id', 'registration_date', 'origin'];
          farmFieldsToUpdate.forEach(field => {
            if (specificData[field] !== undefined) {
              farmUpdateFields.push(`${field} = $${farmParamCounter++}`);
              farmUpdateParams.push(specificData[field]);
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
            const farmResult = await query(farmSql, farmUpdateParams);
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
            specificData.identifier || null,
            specificData.additional_id || null,
            specificData.registration_date || null,
            specificData.origin || null
          ];
          const farmResult = await query(farmSql, farmParams);
          if (farmResult?.rows?.[0]) {
            animal.farm_animal = farmResult.rows[0];
            animal.animal_number = farmResult.rows[0].identifier;
          }
        }
      } else if (animalType === 'companion' && specificData) {
        const companionCheckResult = await query('SELECT id FROM companion_animals WHERE animal_id = $1', [id]);
        if (companionCheckResult?.rows?.length > 0) {
          const companionUpdateFields = [];
          const companionUpdateParams = [];
          let companionParamCounter = 1;
          const companionFieldsToUpdate = ['chip_number', 'sterilized', 'passport_number', 'special_needs'];
          companionFieldsToUpdate.forEach(field => {
            if (specificData[field] !== undefined) {
              companionUpdateFields.push(`${field} = $${companionParamCounter++}`);
              companionUpdateParams.push(specificData[field]);
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
            const companionResult = await query(companionSql, companionUpdateParams);
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
            specificData.chip_number || null,
            specificData.sterilized || false,
            specificData.passport_number || null,
            specificData.special_needs || null
          ];
          const companionResult = await query(companionSql, companionParams);
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
   */
  async delete(id) {
    return this._executeTransaction(async () => {
      await query('DELETE FROM farm_animals WHERE animal_id = $1', [id]);
      await query('DELETE FROM companion_animals WHERE animal_id = $1', [id]);
      const result = await query('DELETE FROM animals WHERE id = $1 RETURNING id', [id]);
      return result?.rows?.length > 0;
    });
  }
}

module.exports = new AnimalRepository();
