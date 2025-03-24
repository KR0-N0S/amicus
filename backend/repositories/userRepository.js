const { query } = require('../config/db');

// Funkcje repozytorium użytkowników
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

async function getAllUsers() {
  const result = await query('SELECT * FROM users ORDER BY created_at DESC');
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
  getAllUsers
};
