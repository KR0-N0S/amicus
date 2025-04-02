const { query } = require('../config/db');

class AnimalRepository {
  // Pomocnicza funkcja do obliczania wieku na podstawie daty urodzenia
  _calculateAge(birthDate) {
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

  // Pomocnicza funkcja do mapowania wiersza z bazy na obiekt zwierzęcia
  _mapAnimal(row) {
    const animal = { ...row };
    delete animal.animal_details;
    animal.age = animal.birth_date ? this._calculateAge(animal.birth_date) : null;

    if (animal.animal_type === 'farm' && row.animal_details) {
      animal.farm_animal = row.animal_details;
      animal.animal_number = row.animal_details.identifier;
    } else if (animal.animal_type === 'companion' && row.animal_details) {
      animal.companion_animal = row.animal_details;
    }
    return animal;
  }

  // Pomocnicza funkcja do bezpiecznego przetwarzania terminów wyszukiwania
  _processSearchTerms(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') return [];
    try {
      const trimmed = searchTerm.trim();
      if (!trimmed || trimmed.length < 3) return [];
      return trimmed
        .toLowerCase()
        .split(/\s+/)
        .filter(term => term.length > 0);
    } catch (error) {
      console.error('Error processing search terms:', error);
      return [];
    }
  }

  // Pomocnicza funkcja do budowania warunków wyszukiwania w zapytaniu SQL
  _applySearchTerms(sql, searchTerms, paramCounter, params, hasUnaccent) {
    if (searchTerms.length > 0) {
      sql += ' AND (';
      searchTerms.forEach((term, index) => {
        if (index > 0) sql += ' AND ';
        const likePattern = `%${term}%`;
        const likeCond = hasUnaccent ? `unaccent(lower($${paramCounter}))` : `lower($${paramCounter})`;
        sql += `(
          lower(COALESCE(fa.identifier, '')) LIKE ${likeCond} OR
          lower(COALESCE(u.first_name, '')) LIKE ${likeCond} OR
          lower(COALESCE(u.last_name, '')) LIKE ${likeCond} OR
          lower(COALESCE(u.city, '')) LIKE ${likeCond} OR
          lower(COALESCE(u.street, '')) LIKE ${likeCond} OR
          lower(COALESCE(u.house_number, '')) LIKE ${likeCond} OR
          lower(COALESCE(a.species, '')) LIKE ${likeCond} OR
          lower(COALESCE(a.breed, '')) LIKE ${likeCond}
        )`;
        params.push(likePattern);
        paramCounter++;
      });
      sql += ')';
    }
    return { sql, params, paramCounter };
  }

  // Sprawdzanie dostępności rozszerzenia PostgreSQL (np. unaccent)
  async _checkExtension(extensionName) {
    try {
      const extensionResult = await query(
        "SELECT 1 FROM pg_extension WHERE extname = $1",
        [extensionName]
      );
      return extensionResult && extensionResult.rows && extensionResult.rows.length > 0;
    } catch (error) {
      console.warn(`Could not check extension ${extensionName}:`, error.message);
      return false;
    }
  }

  async searchAnimalsByOwnerId(searchTerm, ownerId, animalType = null, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const params = [ownerId];
      let paramCounter = 2;
      let sql = `
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
        WHERE a.owner_id = $1
      `;
      if (animalType) {
        sql += ` AND a.animal_type = $${paramCounter}`;
        params.push(animalType);
        paramCounter++;
      }

      const processedTerms = this._processSearchTerms(searchTerm);
      if (processedTerms.length > 0) {
        const hasUnaccent = await this._checkExtension('unaccent');
        const result = this._applySearchTerms(sql, processedTerms, paramCounter, params, hasUnaccent);
        sql = result.sql;
        paramCounter = result.paramCounter;
      }

      sql += ` ORDER BY a.created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      const result = await query(sql, params);
      const animals = result && result.rows ? result.rows.map(row => this._mapAnimal(row)) : [];

      // Uwaga: zapytanie count nie uwzględnia warunków wyszukiwania – jeśli chcesz uzyskać count zgodny z wynikami,
      // trzeba rozbudować countSql o warunki wyszukiwania.
      const countSql = `
        SELECT COUNT(*) 
        FROM animals a
        WHERE a.owner_id = $1
        ${animalType ? ' AND a.animal_type = $2' : ''}
      `;
      const countParams = animalType ? [ownerId, animalType] : [ownerId];
      const countResult = await query(countSql, countParams);
      const totalCount = countResult && countResult.rows && countResult.rows[0]
        ? parseInt(countResult.rows[0].count)
        : 0;

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
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

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
        sql += ` AND a.animal_type = $${paramCounter}`;
        params.push(animalType);
        paramCounter++;
      }

      const processedTerms = this._processSearchTerms(searchTerm);
      if (processedTerms.length > 0) {
        const hasUnaccent = await this._checkExtension('unaccent');
        const result = this._applySearchTerms(sql, processedTerms, paramCounter, params, hasUnaccent);
        sql = result.sql;
        paramCounter = result.paramCounter;
      }

      sql += ` ORDER BY a.id, a.created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      const result = await query(sql, params);
      const animals = result && result.rows
        ? result.rows.map(row => {
            // Specjalna logika dla organizacji – usuwanie zdublowanych pól dla farm
            const animal = { ...row };
            animal.age = animal.birth_date ? this._calculateAge(animal.birth_date) : null;
            if (animal.animal_type === 'farm') {
              if (animal.identifier) {
                animal.animal_number = animal.identifier;
                animal.farm_animal = {
                  identifier: animal.identifier,
                  registration_date: animal.registration_date,
                  origin: animal.origin,
                  additional_id: animal.additional_id
                };
              }
              delete animal.identifier;
              delete animal.registration_date;
              delete animal.origin;
              delete animal.additional_id;
            }
            return animal;
          })
        : [];

      const countSql = `
        SELECT COUNT(DISTINCT a.id) 
        FROM animals a
        JOIN users u ON a.owner_id = u.id
        JOIN organization_user ou ON u.id = ou.user_id
        WHERE ou.organization_id = $1
        ${animalType ? ' AND a.animal_type = $2' : ''}
      `;
      const countParams = animalType ? [organizationId, animalType] : [organizationId];
      const countResult = await query(countSql, countParams);
      const totalCount = countResult && countResult.rows && countResult.rows[0]
        ? parseInt(countResult.rows[0].count)
        : 0;

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
        pagination: {
          totalCount: 0,
          totalPages: 1,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  async findById(id) {
    try {
      const sql = `
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
        WHERE a.id = $1
      `;
      const result = await query(sql, [id]);
      if (!result || !result.rows || result.rows.length === 0) return null;
      return this._mapAnimal(result.rows[0]);
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findByOwnerId(ownerId, limit = 10, offset = 0, animalType = null) {
    try {
      const params = [ownerId];
      let paramCounter = 2;
      let sql = `
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
        WHERE a.owner_id = $1
      `;
      if (animalType) {
        sql += ` AND a.animal_type = $${paramCounter}`;
        params.push(animalType);
        paramCounter++;
      }
      sql += ` ORDER BY a.created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      const result = await query(sql, params);
      return result && result.rows ? result.rows.map(row => this._mapAnimal(row)) : [];
    } catch (error) {
      console.error('Error in findByOwnerId:', error);
      return [];
    }
  }

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
        sql += ` AND a.animal_type = $${paramCounter}`;
        params.push(animalType);
        paramCounter++;
      }
      sql += ` ORDER BY a.id, a.created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      const result = await query(sql, params);
      const animals = result && result.rows
        ? result.rows.map(row => {
            const animal = { ...row };
            animal.age = animal.birth_date ? this._calculateAge(animal.birth_date) : null;
            if (animal.animal_type === 'farm') {
              if (animal.identifier) {
                animal.animal_number = animal.identifier;
                animal.farm_animal = {
                  identifier: animal.identifier,
                  registration_date: animal.registration_date,
                  origin: animal.origin,
                  additional_id: animal.additional_id
                };
              }
              delete animal.identifier;
              delete animal.registration_date;
              delete animal.origin;
              delete animal.additional_id;
            }
            return animal;
          })
        : [];
      return animals;
    } catch (error) {
      console.error('Error in findByOrganizationId:', error);
      return [];
    }
  }

  async countByOwnerId(ownerId, animalType = null) {
    try {
      let sql = `SELECT COUNT(*) FROM animals WHERE owner_id = $1`;
      const params = [ownerId];
      if (animalType) {
        sql += ` AND animal_type = $2`;
        params.push(animalType);
      }
      const result = await query(sql, params);
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countByOwnerId:', error);
      return 0;
    }
  }

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
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countByOrganizationId:', error);
      return 0;
    }
  }

  async create(animalBaseData, animalType, specificData) {
    try {
      await query('BEGIN');
      const animalSql = `
        INSERT INTO animals (
          owner_id, species, animal_type, age, sex, breed, birth_date, 
          weight, photo, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
      const animalParams = [
        animalBaseData.owner_id,
        animalBaseData.species || null,
        animalType,
        animalBaseData.age || null,
        animalBaseData.sex || null,
        animalBaseData.breed || null,
        animalBaseData.birth_date || null,
        animalBaseData.weight || null,
        animalBaseData.photo || null,
        animalBaseData.notes || null
      ];
      const animalResult = await query(animalSql, animalParams);
      if (!animalResult || !animalResult.rows || animalResult.rows.length === 0) {
        await query('ROLLBACK');
        throw new Error('Failed to create animal');
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
        if (farmResult && farmResult.rows && farmResult.rows.length > 0) {
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
        if (companionResult && companionResult.rows && companionResult.rows.length > 0) {
          animal.companion_animal = companionResult.rows[0];
        }
      }

      await query('COMMIT');
      return animal;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in create animal:', error);
      throw error;
    }
  }

  async update(id, animalBaseData, animalType, specificData) {
    try {
      await query('BEGIN');
      let updateFields = [];
      let updateParams = [];
      let paramCounter = 1;

      if (animalBaseData.species !== undefined) {
        updateFields.push(`species = $${paramCounter++}`);
        updateParams.push(animalBaseData.species);
      }
      if (animalBaseData.age !== undefined) {
        updateFields.push(`age = $${paramCounter++}`);
        updateParams.push(animalBaseData.age);
      }
      if (animalBaseData.sex !== undefined) {
        updateFields.push(`sex = $${paramCounter++}`);
        updateParams.push(animalBaseData.sex);
      }
      if (animalBaseData.breed !== undefined) {
        updateFields.push(`breed = $${paramCounter++}`);
        updateParams.push(animalBaseData.breed);
      }
      if (animalBaseData.birth_date !== undefined) {
        updateFields.push(`birth_date = $${paramCounter++}`);
        updateParams.push(animalBaseData.birth_date);
      }
      if (animalBaseData.weight !== undefined) {
        updateFields.push(`weight = $${paramCounter++}`);
        updateParams.push(animalBaseData.weight);
      }
      if (animalBaseData.photo !== undefined) {
        updateFields.push(`photo = $${paramCounter++}`);
        updateParams.push(animalBaseData.photo);
      }
      if (animalBaseData.notes !== undefined) {
        updateFields.push(`notes = $${paramCounter++}`);
        updateParams.push(animalBaseData.notes);
      }
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
        if (!animalResult || !animalResult.rows || animalResult.rows.length === 0) {
          await query('ROLLBACK');
          throw new Error('Animal not found');
        }
        animal = animalResult.rows[0];
      } else {
        const animalResult = await query('SELECT * FROM animals WHERE id = $1', [id]);
        if (!animalResult || !animalResult.rows || animalResult.rows.length === 0) {
          await query('ROLLBACK');
          throw new Error('Animal not found');
        }
        animal = animalResult.rows[0];
      }

      if (animalType === 'farm' && specificData) {
        const farmCheckResult = await query('SELECT id FROM farm_animals WHERE animal_id = $1', [id]);
        if (farmCheckResult.rows.length > 0) {
          let farmUpdateFields = [];
          let farmUpdateParams = [];
          let farmParamCounter = 1;
          if (specificData.identifier !== undefined) {
            farmUpdateFields.push(`identifier = $${farmParamCounter++}`);
            farmUpdateParams.push(specificData.identifier);
          }
          if (specificData.additional_id !== undefined) {
            farmUpdateFields.push(`additional_id = $${farmParamCounter++}`);
            farmUpdateParams.push(specificData.additional_id);
          }
          if (specificData.registration_date !== undefined) {
            farmUpdateFields.push(`registration_date = $${farmParamCounter++}`);
            farmUpdateParams.push(specificData.registration_date);
          }
          if (specificData.origin !== undefined) {
            farmUpdateFields.push(`origin = $${farmParamCounter++}`);
            farmUpdateParams.push(specificData.origin);
          }
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
            if (farmResult && farmResult.rows && farmResult.rows.length > 0) {
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
          if (farmResult && farmResult.rows && farmResult.rows.length > 0) {
            animal.farm_animal = farmResult.rows[0];
            animal.animal_number = farmResult.rows[0].identifier;
          }
        }
      } else if (animalType === 'companion' && specificData) {
        const companionCheckResult = await query('SELECT id FROM companion_animals WHERE animal_id = $1', [id]);
        if (companionCheckResult.rows.length > 0) {
          let companionUpdateFields = [];
          let companionUpdateParams = [];
          let companionParamCounter = 1;
          if (specificData.chip_number !== undefined) {
            companionUpdateFields.push(`chip_number = $${companionParamCounter++}`);
            companionUpdateParams.push(specificData.chip_number);
          }
          if (specificData.sterilized !== undefined) {
            companionUpdateFields.push(`sterilized = $${companionParamCounter++}`);
            companionUpdateParams.push(specificData.sterilized);
          }
          if (specificData.passport_number !== undefined) {
            companionUpdateFields.push(`passport_number = $${companionParamCounter++}`);
            companionUpdateParams.push(specificData.passport_number);
          }
          if (specificData.special_needs !== undefined) {
            companionUpdateFields.push(`special_needs = $${companionParamCounter++}`);
            companionUpdateParams.push(specificData.special_needs);
          }
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
            if (companionResult && companionResult.rows && companionResult.rows.length > 0) {
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
          if (companionResult && companionResult.rows && companionResult.rows.length > 0) {
            animal.companion_animal = companionResult.rows[0];
          }
        }
      }
      await query('COMMIT');
      return await this.findById(id);
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in update animal:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      await query('BEGIN');
      await query('DELETE FROM farm_animals WHERE animal_id = $1', [id]);
      await query('DELETE FROM companion_animals WHERE animal_id = $1', [id]);
      const result = await query('DELETE FROM animals WHERE id = $1 RETURNING id', [id]);
      await query('COMMIT');
      return result && result.rows && result.rows.length > 0;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in delete animal:', error);
      throw error;
    }
  }
}

module.exports = new AnimalRepository();
