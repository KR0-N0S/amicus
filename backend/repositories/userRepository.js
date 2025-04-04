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
  let sqlQuery; // Zmieniono nazwę zmiennej z 'query' na 'sqlQuery'
  
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
    sqlQuery = 'SELECT * FROM users WHERE id = $1'; // Zmieniono nazwę zmiennej z 'query' na 'sqlQuery'
  }
  
  const result = await query(sqlQuery, [userId]); // Zmieniono nazwę zmiennej z 'query' na 'sqlQuery'
  return result.rows[0];
}

// Funkcja wyszukiwania użytkowników 
async function searchUsers(searchQuery, roles, organizationId) {
  console.log(`[USER_REPO] Wyszukiwanie użytkowników: query=${searchQuery}, roles=${roles}, organizationId=${organizationId}`);
  
  // Budowanie zapytania SQL
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
  
  const params = [organizationId];
  let paramIndex = 2;
  
  // Filtrowanie po rolach
  if (roles && roles.length > 0) {
    // Konwersja na tablicę jeśli to string
    const roleArray = typeof roles === 'string' ? roles.split(',') : roles;
    if (roleArray.length > 0) {
      const rolePlaceholders = roleArray.map((_, idx) => `$${paramIndex + idx}`).join(', ');
      sqlQuery += ` AND ou.role IN (${rolePlaceholders})`;
      params.push(...roleArray);
      paramIndex += roleArray.length;
    }
  }
  
  // Filtrowanie po frazie wyszukiwania
  if (searchQuery && searchQuery.trim() !== '') {
    sqlQuery += ` 
      AND (
        u.first_name ILIKE $${paramIndex} 
        OR u.last_name ILIKE $${paramIndex} 
        OR u.email ILIKE $${paramIndex}
        OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex}
        OR u.street ILIKE $${paramIndex}
        OR u.house_number ILIKE $${paramIndex}
        OR u.city ILIKE $${paramIndex}
        OR u.postal_code ILIKE $${paramIndex}
        OR u.tax_id ILIKE $${paramIndex}
        OR u.phone ILIKE $${paramIndex}
      )
    `;
    params.push(`%${searchQuery.trim()}%`);
  }
  
  // Grupowanie i sortowanie
  sqlQuery += ` 
    GROUP BY u.id
    ORDER BY u.last_name, u.first_name
  `;
  
  console.log(`[USER_REPO] SQL Query: ${sqlQuery}`);
  console.log(`[USER_REPO] Params:`, params);
  
  const result = await query(sqlQuery, params);
  return result.rows;
}

// Dostarczamy obydwie wersje nazw metod dla kompatybilności
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
  searchUsers // Dodajemy nową funkcję do eksportu
};