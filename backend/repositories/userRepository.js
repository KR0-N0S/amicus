const { query } = require('../config/db');

// Istniejące funkcje
async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  console.log("[REPO] Znaleziono użytkownika:", !!result.rows[0]);
  return result.rows[0];
}

async function create(userData) {
  const { email, password, first_name, last_name, phone, street, house_number, city, postal_code, tax_id } = userData;
  
  const result = await query(
    `INSERT INTO users (
      email, password, first_name, last_name, phone, street, 
      house_number, city, postal_code, tax_id, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      email, password, first_name, last_name, phone, street, 
      house_number, city, postal_code, tax_id, 'active', new Date(), new Date()
    ]
  );
  
  return result.rows[0];
}

async function updateUser(id, userData) {
  const { email, first_name, last_name, phone, street, house_number, city, postal_code, tax_id } = userData;
  
  const result = await query(
    `UPDATE users SET 
      email = $1, first_name = $2, last_name = $3, phone = $4, 
      street = $5, house_number = $6, city = $7, postal_code = $8, 
      tax_id = $9, updated_at = $10
    WHERE id = $11 RETURNING *`,
    [
      email, first_name, last_name, phone, street, 
      house_number, city, postal_code, tax_id, new Date(), id
    ]
  );
  
  return result.rows[0];
}

async function updatePassword(id, password) {
  const result = await query(
    'UPDATE users SET password = $1, updated_at = $2 WHERE id = $3 RETURNING *',
    [password, new Date(), id]
  );
  
  return result.rows[0];
}

// Nowa funkcja do deaktywacji użytkownika
async function deactivateUser(userId) {
  console.log(`[USER_REPO] Deaktywacja użytkownika o ID ${userId}`);
  
  const result = await query(
    `UPDATE users 
     SET status = 'inactive', updated_at = $1
     WHERE id = $2 
     RETURNING *`,
    [new Date(), userId]
  );
  
  return result.rows[0];
}

// Pobranie wszystkich użytkowników (dla SuperAdmin)
async function getAllUsers() {
  const result = await query(
    `SELECT u.*, 
            array_agg(DISTINCT jsonb_build_object(
              'id', o.id,
              'name', o.name,
              'city', o.city,
              'street', o.street,
              'house_number', o.house_number,
              'role', ou.role
            )) FILTER (WHERE o.id IS NOT NULL) as organizations,
            array_agg(DISTINCT jsonb_build_object(
              'id', h.id,
              'herd_id', h.herd_id,
              'eval_herd_no', h.eval_herd_no
            )) FILTER (WHERE h.id IS NOT NULL) as herds
     FROM users u
     LEFT JOIN organization_user ou ON u.id = ou.user_id
     LEFT JOIN organizations o ON ou.organization_id = o.id
     LEFT JOIN herds h ON h.owner_id = u.id
     GROUP BY u.id
     ORDER BY u.last_name, u.first_name`
  );
  return result.rows;
}

// Pobranie użytkowników należących do konkretnej organizacji (dla Owner)
async function getUsersByOrganization(organizationId) {
  console.log(`[USER_REPO] Pobieranie użytkowników dla organizacji ${organizationId}`);
  
  const result = await query(
    `SELECT u.*, 
            array_agg(DISTINCT jsonb_build_object(
              'id', o.id,
              'name', o.name,
              'city', o.city,
              'street', o.street,
              'house_number', o.house_number,
              'role', ou.role
            )) FILTER (WHERE o.id IS NOT NULL) as organizations,
            array_agg(DISTINCT jsonb_build_object(
              'id', h.id,
              'herd_id', h.herd_id,
              'eval_herd_no', h.eval_herd_no
            )) FILTER (WHERE h.id IS NOT NULL) as herds
     FROM users u
     JOIN organization_user ou ON u.id = ou.user_id
     LEFT JOIN organizations o ON ou.organization_id = o.id 
     LEFT JOIN herds h ON h.owner_id = u.id
     WHERE ou.organization_id = $1
     GROUP BY u.id
     ORDER BY u.last_name, u.first_name`,
    [organizationId]
  );
  
  console.log(`[USER_REPO] Znaleziono ${result.rows.length} użytkowników w organizacji ${organizationId}`);
  
  return result.rows;
}

// Pobranie użytkowników należących do konkretnej organizacji z wyjątkiem właścicieli i innych pracowników
async function getClientsInOrganization(organizationId, excludedRoles = ['Owner', 'Employee', 'SuperAdmin', 'OfficeStaff', 'Inseminator', 'VetTech', 'Vet']) {
  const placeholders = excludedRoles.map((_, index) => `$${index + 2}`).join(', ');
  
  const result = await query(
    `SELECT u.*, 
            array_agg(DISTINCT jsonb_build_object(
              'id', o.id,
              'name', o.name,
              'city', o.city,
              'street', o.street,
              'house_number', o.house_number,
              'role', ou.role
            )) FILTER (WHERE o.id IS NOT NULL) as organizations,
            array_agg(DISTINCT jsonb_build_object(
              'id', h.id,
              'herd_id', h.herd_id,
              'eval_herd_no', h.eval_herd_no
            )) FILTER (WHERE h.id IS NOT NULL) as herds
     FROM users u
     JOIN organization_user ou ON u.id = ou.user_id
     LEFT JOIN organizations o ON ou.organization_id = o.id AND o.id = $1
     LEFT JOIN herds h ON h.owner_id = u.id
     WHERE ou.organization_id = $1
     AND ou.role NOT IN (${placeholders})
     GROUP BY u.id
     ORDER BY u.last_name, u.first_name`,
    [organizationId, ...excludedRoles]
  );
  return result.rows;
}

// Pobranie jednego użytkownika (dla Client i Farmer)
async function getSingleUser(userId, withDetails = true) {
  let sqlQuery;
  
  if (withDetails) {
    sqlQuery = `
      SELECT u.*, 
            array_agg(DISTINCT jsonb_build_object(
              'id', o.id,
              'name', o.name,
              'city', o.city,
              'street', o.street,
              'house_number', o.house_number,
              'role', ou.role
            )) FILTER (WHERE o.id IS NOT NULL) as organizations,
            array_agg(DISTINCT jsonb_build_object(
              'id', h.id,
              'herd_id', h.herd_id,
              'eval_herd_no', h.eval_herd_no
            )) FILTER (WHERE h.id IS NOT NULL) as herds
      FROM users u
      LEFT JOIN organization_user ou ON u.id = ou.user_id
      LEFT JOIN organizations o ON ou.organization_id = o.id
      LEFT JOIN herds h ON h.owner_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `;
  } else {
    sqlQuery = 'SELECT * FROM users WHERE id = $1';
  }
  
  const result = await query(sqlQuery, [userId]);
  return result.rows[0];
}

// Cache dla rozszerzeń PostgreSQL
const _extensionCache = {};
const _extensionCacheDuration = 3600000; // 1 godzina w ms

/**
 * Sprawdza czy rozszerzenie PostgreSQL jest dostępne
 * @private
 */
async function _checkExtension(extensionName) {
  const now = Date.now();
  if (_extensionCache[extensionName] && now < _extensionCache[extensionName].expires) {
    return _extensionCache[extensionName].value;
  }
  
  try {
    const result = await query(
      "SELECT 1 FROM pg_extension WHERE extname = $1",
      [extensionName]
    );
    const available = result?.rows?.length > 0;
    _extensionCache[extensionName] = { value: available, expires: now + _extensionCacheDuration };
    
    console.log(`[USER_REPO] Rozszerzenie ${extensionName} dostępne: ${available}`);
    return available;
  } catch (error) {
    console.error(`[USER_REPO] Błąd przy sprawdzaniu rozszerzenia ${extensionName}:`, error);
    _extensionCache[extensionName] = { value: false, expires: now + _extensionCacheDuration };
    return false;
  }
}

/**
 * Funkcja wyszukiwania użytkowników z obsługą literówek i paginacją
 * Kompletnie przepisana, aby rozwiązać problem z parametrami
 */
async function searchUsers(searchQuery, roles, organizationId, limit = 20, offset = 0) {
  console.log(`[USER_REPO] Wyszukiwanie użytkowników: query=${searchQuery}, roles=${roles}, organizationId=${organizationId}, limit=${limit}, offset=${offset}`);
  
  try {
    // Sprawdzamy czy dostępne są rozszerzenia PostgreSQL, które ułatwią wyszukiwanie
    const hasTrgm = await _checkExtension('pg_trgm');
    const hasUnaccent = await _checkExtension('unaccent');
    
    // Rozpoczynamy budowę zapytania bazowego
    let sqlQuery = `
      SELECT u.*, 
              array_agg(DISTINCT jsonb_build_object(
                'id', o.id,
                'name', o.name,
                'city', o.city,
                'street', o.street,
                'house_number', o.house_number,
                'role', ou.role
              )) FILTER (WHERE o.id IS NOT NULL) as organizations,
              array_agg(DISTINCT jsonb_build_object(
                'id', h.id,
                'herd_id', h.herd_id,
                'eval_herd_no', h.eval_herd_no
              )) FILTER (WHERE h.id IS NOT NULL) as herds
      FROM users u
      JOIN organization_user ou ON u.id = ou.user_id
      LEFT JOIN organizations o ON ou.organization_id = o.id 
      LEFT JOIN herds h ON h.owner_id = u.id
      WHERE ou.organization_id = $1
    `;
    
    // Parametry zapytania zaczynamy od organizationId
    const params = [organizationId];
    let paramIndex = 2; // Następny indeks parametru
    
    // Filtrowanie po rolach jeśli określone
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const roleParams = roles.map((_, idx) => `$${paramIndex + idx}`).join(', ');
      sqlQuery += ` AND ou.role IN (${roleParams})`;
      params.push(...roles);
      paramIndex += roles.length;
    } else if (roles && typeof roles === 'string' && roles.trim()) {
      const roleArray = roles.split(',').map(r => r.trim()).filter(r => r);
      if (roleArray.length > 0) {
        const roleParams = roleArray.map((_, idx) => `$${paramIndex + idx}`).join(', ');
        sqlQuery += ` AND ou.role IN (${roleParams})`;
        params.push(...roleArray);
        paramIndex += roleArray.length;
      }
    }
    
    // Filtrowanie po frazie wyszukiwania
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      // Dzielimy frazę na osobne słowa do wyszukania
      const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(term => term.length >= 2);
      
      if (terms.length > 0) {
        // Definiujemy pola, w których będziemy szukać
        const fields = [
          "u.first_name",
          "u.last_name", 
          "u.email",
          "CONCAT(u.first_name, ' ', u.last_name)",
          "u.city", 
          "u.street",
          "u.house_number", 
          "u.postal_code",
          "u.tax_id", 
          "u.phone"
        ];
        
        // Budujemy warunki dla każdego termu
        const searchConditions = [];
        
        for (const term of terms) {
          const termConditions = [];
          
          // Dla każdego pola budujemy warunek bazowy (ILIKE)
          for (const field of fields) {
            // Używamy unaccent jeśli dostępne
            const fieldExpr = hasUnaccent 
              ? `unaccent(lower(COALESCE(${field},'')))`
              : `lower(COALESCE(${field},''))`;
            
            const searchParam = `%${term}%`;
            params.push(searchParam);
            termConditions.push(`${fieldExpr} ILIKE $${paramIndex}`);
            paramIndex++;
          }
          
          // Jeśli mamy dostępne pg_trgm i term ma minimum 3 znaki, dodajemy warunki podobieństwa
          if (hasTrgm && term.length >= 3) {
            for (const field of fields) {
              const fieldExpr = hasUnaccent 
                ? `unaccent(lower(COALESCE(${field},'')))`
                : `lower(COALESCE(${field},''))`;
              
              // Dodajemy warunek podobieństwa
              params.push(term);
              termConditions.push(`similarity(${fieldExpr}, $${paramIndex}) > 0.3`);
              paramIndex++;
            }
          }
          
          // Łączymy warunki dla tego termu z OR
          if (termConditions.length > 0) {
            searchConditions.push(`(${termConditions.join(' OR ')})`);
          }
        }
        
        // Łączymy warunki dla wszystkich termów z AND
        if (searchConditions.length > 0) {
          sqlQuery += ` AND (${searchConditions.join(' AND ')})`;
        }
      }
    }
    
    // Dodanie zapytania zliczającego dla paginacji
    const countQuery = sqlQuery.replace(/SELECT u\.\*.*FROM/s, 'SELECT COUNT(DISTINCT u.id) AS total FROM');
    const countResult = await query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Dodanie sortowania i paginacji
    sqlQuery += `
      GROUP BY u.id
      ORDER BY u.last_name, u.first_name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    // Logowanie zapytania (tylko początek dla czytelności)
    console.log(`[USER_REPO] SQL Query:`, sqlQuery.substring(0, 200) + "...");
    console.log(`[USER_REPO] Params:`, params);
    
    // Wykonanie zapytania
    const result = await query(sqlQuery, params);
    
    return {
      users: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    };
  } catch (error) {
    console.error(`[USER_REPO] Błąd podczas wyszukiwania użytkowników:`, error);
    throw error; // Przepuszczamy błąd dalej, aby controller mógł go obsłużyć
  }
}

// Dostarczamy metody dla API
module.exports = {
  getUserById: findById,
  getUserByEmail: findByEmail,
  findById,
  findByEmail,
  create,
  updateUser,
  updatePassword,
  getAllUsers,
  getUsersByOrganization,
  getClientsInOrganization,
  getSingleUser,
  deactivateUser,
  searchUsers
};