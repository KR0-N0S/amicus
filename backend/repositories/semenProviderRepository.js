/**
 * Repozytorium dla dostawców nasienia (semen_providers)
 * @author KR0-N0S
 * @date 2025-04-04
 */

const { query } = require('../config/db');

class SemenProviderRepository {
  // Pomocnicza funkcja do przetwarzania terminów wyszukiwania
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

  // Pomocnicza funkcja do sprawdzania dostępności rozszerzeń PostgreSQL
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

  // Pomocnicza funkcja do budowania warunków wyszukiwania w zapytaniu SQL
  async _applySearchConditions(sql, searchTerms, paramCounter, params) {
    if (searchTerms.length === 0) return { sql, paramCounter, params };
    
    const hasUnaccent = await this._checkExtension('unaccent');
    
    sql += ' AND (';
    searchTerms.forEach((term, index) => {
      if (index > 0) sql += ' AND ';
      const likePattern = `%${term}%`;
      const likeCond = hasUnaccent ? 
        `unaccent(lower($${paramCounter}))` : 
        `lower($${paramCounter})`;
      
      sql += `(
        lower(sp.name) LIKE ${likeCond} OR
        lower(sp.vet_id_number) LIKE ${likeCond} OR
        lower(COALESCE(sp.address_street, '')) LIKE ${likeCond} OR
        lower(COALESCE(sp.address_city, '')) LIKE ${likeCond} OR
        lower(COALESCE(sp.address_postal_code, '')) LIKE ${likeCond} OR
        lower(COALESCE(sp.address_province, '')) LIKE ${likeCond} OR
        lower(COALESCE(sp.address_country, '')) LIKE ${likeCond} OR
        lower(COALESCE(sp.contact_phone, '')) LIKE ${likeCond} OR
        lower(COALESCE(sp.contact_email, '')) LIKE ${likeCond}
      )`;
      
      params.push(likePattern);
      paramCounter++;
    });
    
    sql += ')';
    return { sql, paramCounter, params };
  }

  /**
   * Wyszukiwanie dostawców nasienia na podstawie ID organizacji z paginacją i filtrowaniem
   * @param {string} searchTerm - Termin wyszukiwania (opcjonalny)
   * @param {number} organizationId - ID organizacji
   * @param {number} page - Numer strony (domyślnie 1)
   * @param {number} limit - Liczba wyników na stronę (domyślnie 10)
   * @param {boolean} includePublic - Czy dołączyć dostawców publicznych (domyślnie true)
   * @returns {Object} Obiekt zawierający listę dostawców i informacje o paginacji
   */
  async searchByOrganizationId(searchTerm, organizationId, page = 1, limit = 10, includePublic = true) {
    try {
      const offset = (page - 1) * limit;
      let params = [organizationId];
      let paramCounter = 2;
      
      // Bazowe zapytanie SQL z uwzględnieniem dostawców publicznych i przypisanych do organizacji
      let sql = `
        SELECT DISTINCT sp.*
        FROM semen_providers sp
        WHERE (sp.organization_id = $1 ${includePublic ? 'OR sp.organization_id IS NULL' : ''})
      `;
      
      // Dodanie warunków wyszukiwania
      const searchTerms = this._processSearchTerms(searchTerm);
      if (searchTerms.length > 0) {
        const result = await this._applySearchConditions(sql, searchTerms, paramCounter, params);
        sql = result.sql;
        paramCounter = result.paramCounter;
        params = result.params;
      }
      
      // Dodanie sortowania, limitu i offsetu
      sql += ` ORDER BY sp.name LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      
      // Wykonanie zapytania
      const result = await query(sql, params);
      const providers = result && result.rows ? result.rows : [];
      
      // Zapytanie o całkowitą liczbę wyników
      const countSql = `
        SELECT COUNT(DISTINCT sp.id) 
        FROM semen_providers sp
        WHERE (sp.organization_id = $1 ${includePublic ? 'OR sp.organization_id IS NULL' : ''})
        ${searchTerms.length > 0 ? 'AND (' + searchTerms.map((_, i) => `
          lower(sp.name) LIKE lower($${i + 2}) OR
          lower(sp.vet_id_number) LIKE lower($${i + 2}) OR
          lower(COALESCE(sp.address_city, '')) LIKE lower($${i + 2})
        `).join(' AND ') + ')' : ''}
      `;
      
      const countParams = [organizationId, ...searchTerms.map(term => `%${term}%`)];
      const countResult = await query(countSql, countParams);
      const totalCount = countResult && countResult.rows && countResult.rows[0]
        ? parseInt(countResult.rows[0].count)
        : 0;
      
      return {
        providers,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error('Error in searchByOrganizationId:', error);
      return {
        providers: [],
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
   * Wyszukiwanie dostawców nasienia na podstawie ID właściciela z paginacją i filtrowaniem
   * @param {string} searchTerm - Termin wyszukiwania (opcjonalny)
   * @param {number} ownerId - ID właściciela
   * @param {number} page - Numer strony (domyślnie 1)
   * @param {number} limit - Liczba wyników na stronę (domyślnie 10)
   * @returns {Object} Obiekt zawierający listę dostawców i informacje o paginacji
   */
  async searchByOwnerId(searchTerm, ownerId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      let params = [ownerId];
      let paramCounter = 2;
      
      // Bazowe zapytanie SQL
      let sql = `
        SELECT sp.*
        FROM semen_providers sp
        WHERE sp.owner_id = $1
      `;
      
      // Dodanie warunków wyszukiwania
      const searchTerms = this._processSearchTerms(searchTerm);
      if (searchTerms.length > 0) {
        const result = await this._applySearchConditions(sql, searchTerms, paramCounter, params);
        sql = result.sql;
        paramCounter = result.paramCounter;
        params = result.params;
      }
      
      // Dodanie sortowania, limitu i offsetu
      sql += ` ORDER BY sp.name LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(limit, offset);
      
      // Wykonanie zapytania
      const result = await query(sql, params);
      const providers = result && result.rows ? result.rows : [];
      
      // Zapytanie o całkowitą liczbę wyników
      const countSql = `
        SELECT COUNT(*) 
        FROM semen_providers sp
        WHERE sp.owner_id = $1
        ${searchTerms.length > 0 ? 'AND (' + searchTerms.map((_, i) => `
          lower(sp.name) LIKE lower($${i + 2}) OR
          lower(sp.vet_id_number) LIKE lower($${i + 2}) OR
          lower(COALESCE(sp.address_city, '')) LIKE lower($${i + 2})
        `).join(' AND ') + ')' : ''}
      `;
      
      const countParams = [ownerId, ...searchTerms.map(term => `%${term}%`)];
      const countResult = await query(countSql, countParams);
      const totalCount = countResult && countResult.rows && countResult.rows[0]
        ? parseInt(countResult.rows[0].count)
        : 0;
      
      return {
        providers,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error('Error in searchByOwnerId:', error);
      return {
        providers: [],
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
   * Znajdowanie dostawcy nasienia po ID
   * @param {number} id - ID dostawcy
   * @returns {Object|null} Obiekt dostawcy lub null jeśli nie znaleziono
   */
  async findById(id) {
    try {
      const sql = `SELECT * FROM semen_providers WHERE id = $1`;
      const result = await query(sql, [id]);
      return result && result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  /**
   * Sprawdzenie czy dostawca nasienia należy do danej organizacji
   * @param {number} id - ID dostawcy
   * @param {number} organizationId - ID organizacji
   * @returns {boolean} True jeśli dostawca należy do organizacji lub jest publiczny
   */
  async belongsToOrganization(id, organizationId) {
    try {
      const sql = `
        SELECT 1 
        FROM semen_providers sp
        WHERE sp.id = $1 AND (sp.organization_id = $2 OR sp.organization_id IS NULL)
        LIMIT 1
      `;
      const result = await query(sql, [id, organizationId]);
      return result && result.rows && result.rows.length > 0;
    } catch (error) {
      console.error('Error in belongsToOrganization:', error);
      return false;
    }
  }

  /**
   * Tworzenie nowego dostawcy nasienia
   * @param {Object} providerData - Dane nowego dostawcy
   * @returns {Object|null} Utworzony dostawca lub null w przypadku błędu
   */
  async create(providerData) {
    try {
      await query('BEGIN');
      
      const sql = `
        INSERT INTO semen_providers(
          owner_id, name, vet_id_number, address_street, address_city, 
          address_postal_code, address_province, address_country,
          contact_phone, contact_email, organization_id, created_at, updated_at
        ) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;
      
      const params = [
        providerData.owner_id,
        providerData.name,
        providerData.vet_id_number,
        providerData.address_street || null,
        providerData.address_city || null,
        providerData.address_postal_code || null,
        providerData.address_province || null,
        providerData.address_country || 'Polska',
        providerData.contact_phone || null,
        providerData.contact_email || null,
        providerData.organization_id // Może być null dla dostawców publicznych
      ];
      
      const result = await query(sql, params);
      await query('COMMIT');
      
      return result && result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in create provider:', error);
      throw error;
    }
  }

  /**
   * Aktualizacja istniejącego dostawcy nasienia
   * @param {number} id - ID dostawcy do aktualizacji
   * @param {Object} providerData - Nowe dane dostawcy
   * @returns {Object|null} Zaktualizowany dostawca lub null w przypadku błędu
   */
  async update(id, providerData) {
    try {
      await query('BEGIN');
      
      let updateFields = [];
      let updateParams = [];
      let paramCounter = 1;
      
      // Dynamiczne budowanie zapytania aktualizacji na podstawie przekazanych danych
      if (providerData.name !== undefined) {
        updateFields.push(`name = $${paramCounter++}`);
        updateParams.push(providerData.name);
      }
      
      if (providerData.vet_id_number !== undefined) {
        updateFields.push(`vet_id_number = $${paramCounter++}`);
        updateParams.push(providerData.vet_id_number);
      }
      
      if (providerData.address_street !== undefined) {
        updateFields.push(`address_street = $${paramCounter++}`);
        updateParams.push(providerData.address_street);
      }
      
      if (providerData.address_city !== undefined) {
        updateFields.push(`address_city = $${paramCounter++}`);
        updateParams.push(providerData.address_city);
      }
      
      if (providerData.address_postal_code !== undefined) {
        updateFields.push(`address_postal_code = $${paramCounter++}`);
        updateParams.push(providerData.address_postal_code);
      }
      
      if (providerData.address_province !== undefined) {
        updateFields.push(`address_province = $${paramCounter++}`);
        updateParams.push(providerData.address_province);
      }
      
      if (providerData.address_country !== undefined) {
        updateFields.push(`address_country = $${paramCounter++}`);
        updateParams.push(providerData.address_country);
      }
      
      if (providerData.contact_phone !== undefined) {
        updateFields.push(`contact_phone = $${paramCounter++}`);
        updateParams.push(providerData.contact_phone);
      }
      
      if (providerData.contact_email !== undefined) {
        updateFields.push(`contact_email = $${paramCounter++}`);
        updateParams.push(providerData.contact_email);
      }
      
      if (providerData.organization_id !== undefined) {
        updateFields.push(`organization_id = $${paramCounter++}`);
        updateParams.push(providerData.organization_id);
      }
      
      // Zawsze aktualizujemy timestamp
      updateFields.push(`updated_at = NOW()`);
      
      // Jeśli nie ma co aktualizować, zwracamy istniejący rekord
      if (updateFields.length <= 1) {
        const existingProvider = await this.findById(id);
        await query('COMMIT');
        return existingProvider;
      }
      
      const sql = `
        UPDATE semen_providers
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCounter}
        RETURNING *
      `;
      updateParams.push(id);
      
      const result = await query(sql, updateParams);
      await query('COMMIT');
      
      return result && result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in update provider:', error);
      throw error;
    }
  }

  /**
   * Usuwanie dostawcy nasienia
   * @param {number} id - ID dostawcy do usunięcia
   * @returns {boolean} True jeśli usuwanie powiodło się
   */
  async delete(id) {
    try {
      await query('BEGIN');
      
      // Sprawdzenie czy dostawca jest używany w dostawach nasienia
      const deliveryCheck = await query(
        'SELECT 1 FROM semen_deliveries WHERE provider_id = $1 LIMIT 1',
        [id]
      );
      
      if (deliveryCheck && deliveryCheck.rows && deliveryCheck.rows.length > 0) {
        throw new Error('Cannot delete provider that has associated deliveries');
      }
      
      const result = await query(
        'DELETE FROM semen_providers WHERE id = $1 RETURNING id',
        [id]
      );
      
      await query('COMMIT');
      return result && result.rows && result.rows.length > 0;
    } catch (error) {
      await query('ROLLBACK');
      console.error('Error in delete provider:', error);
      throw error;
    }
  }

  /**
   * Pobieranie listy dostawców nasienia dla organizacji
   * @param {number} organizationId - ID organizacji
   * @param {number} limit - Maksymalna liczba wyników
   * @param {number} offset - Offset dla paginacji
   * @param {boolean} includePublic - Czy dołączyć dostawców publicznych
   * @returns {Array} Lista dostawców
   */
  async findByOrganizationId(organizationId, limit = 10, offset = 0, includePublic = true) {
    try {
      const sql = `
        SELECT *
        FROM semen_providers sp
        WHERE (sp.organization_id = $1 ${includePublic ? 'OR sp.organization_id IS NULL' : ''})
        ORDER BY sp.name
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(sql, [organizationId, limit, offset]);
      return result && result.rows ? result.rows : [];
    } catch (error) {
      console.error('Error in findByOrganizationId:', error);
      return [];
    }
  }

  /**
   * Pobieranie listy dostawców nasienia dla właściciela
   * @param {number} ownerId - ID właściciela
   * @param {number} limit - Maksymalna liczba wyników
   * @param {number} offset - Offset dla paginacji
   * @returns {Array} Lista dostawców
   */
  async findByOwnerId(ownerId, limit = 10, offset = 0) {
    try {
      const sql = `
        SELECT *
        FROM semen_providers
        WHERE owner_id = $1
        ORDER BY name
        LIMIT $2 OFFSET $3
      `;
      
      const result = await query(sql, [ownerId, limit, offset]);
      return result && result.rows ? result.rows : [];
    } catch (error) {
      console.error('Error in findByOwnerId:', error);
      return [];
    }
  }

  /**
   * Pobieranie publicznych dostawców nasienia
   * @param {number} limit - Maksymalna liczba wyników
   * @param {number} offset - Offset dla paginacji
   * @returns {Array} Lista dostawców publicznych
   */
  async findPublicProviders(limit = 10, offset = 0) {
    try {
      const sql = `
        SELECT *
        FROM semen_providers
        WHERE organization_id IS NULL
        ORDER BY name
        LIMIT $1 OFFSET $2
      `;
      
      const result = await query(sql, [limit, offset]);
      return result && result.rows ? result.rows : [];
    } catch (error) {
      console.error('Error in findPublicProviders:', error);
      return [];
    }
  }

  /**
   * Sprawdzanie czy istnieje dostawca z danym numerem weterynaryjnym dla danego właściciela
   * @param {string} vetIdNumber - Numer weterynaryjny
   * @param {number} ownerId - ID właściciela
   * @param {number} excludeId - ID dostawcy do wykluczenia ze sprawdzenia (np. przy aktualizacji)
   * @returns {boolean} True jeśli istnieje dostawca z takim numerem
   */
  async existsWithVetIdNumber(vetIdNumber, ownerId, excludeId = null) {
    try {
      let sql = 'SELECT 1 FROM semen_providers WHERE vet_id_number = $1 AND owner_id = $2';
      const params = [vetIdNumber, ownerId];
      
      if (excludeId) {
        sql += ' AND id != $3';
        params.push(excludeId);
      }
      
      sql += ' LIMIT 1';
      
      const result = await query(sql, params);
      return result && result.rows && result.rows.length > 0;
    } catch (error) {
      console.error('Error in existsWithVetIdNumber:', error);
      return false;
    }
  }

  /**
   * Liczenie wszystkich dostawców nasienia dla organizacji (włącznie z publicznymi)
   * @param {number} organizationId - ID organizacji
   * @param {boolean} includePublic - Czy uwzględniać dostawców publicznych
   * @returns {number} Liczba dostawców
   */
  async countByOrganizationId(organizationId, includePublic = true) {
    try {
      const sql = `
        SELECT COUNT(*) 
        FROM semen_providers sp
        WHERE (sp.organization_id = $1 ${includePublic ? 'OR sp.organization_id IS NULL' : ''})
      `;
      
      const result = await query(sql, [organizationId]);
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countByOrganizationId:', error);
      return 0;
    }
  }

  /**
   * Liczenie dostawców nasienia dla właściciela
   * @param {number} ownerId - ID właściciela
   * @returns {number} Liczba dostawców
   */
  async countByOwnerId(ownerId) {
    try {
      const sql = 'SELECT COUNT(*) FROM semen_providers WHERE owner_id = $1';
      const result = await query(sql, [ownerId]);
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countByOwnerId:', error);
      return 0;
    }
  }

  /**
   * Liczenie publicznych dostawców nasienia
   * @returns {number} Liczba publicznych dostawców
   */
  async countPublicProviders() {
    try {
      const sql = 'SELECT COUNT(*) FROM semen_providers WHERE organization_id IS NULL';
      const result = await query(sql);
      return result && result.rows && result.rows[0] ? parseInt(result.rows[0].count) : 0;
    } catch (error) {
      console.error('Error in countPublicProviders:', error);
      return 0;
    }
  }
}

module.exports = new SemenProviderRepository();