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
  let query;
  
  if (withDetails) {
    query = `
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
    query = 'SELECT * FROM users WHERE id = $1';
  }
  
  const result = await query(query, [userId]);
  return result.rows[0];
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
  getSingleUser
};