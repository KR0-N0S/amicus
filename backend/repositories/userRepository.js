const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = ',
      [email]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await db.query(
      'SELECT id, email, first_name, last_name, street, house_number, city, postal_code, tax_id, status, created_at, updated_at, phone FROM users WHERE id = ',
      [id]
    );
    return result.rows[0];
  }

  async create(userData) {
    const { email, password, first_name, last_name, phone, street, house_number, city, postal_code, tax_id } = userData;
    
    const result = await db.query(
      `INSERT INTO users 
       (email, password, first_name, last_name, phone, street, house_number, city, postal_code, tax_id, status, updated_at) 
       VALUES (, , , , , , , , , 0, 'Active', NOW()) 
       RETURNING id, email, first_name, last_name, phone, street, house_number, city, postal_code, tax_id, status, created_at, updated_at`,
      [email, password, first_name, last_name, phone, street, house_number, city, postal_code, tax_id]
    );
    
    return result.rows[0];
  }

  async update(id, userData) {
    const { first_name, last_name, phone, street, house_number, city, postal_code, tax_id } = userData;
    
    const result = await db.query(
      `UPDATE users 
       SET first_name = , last_name = , phone = , street = , house_number = , 
           city = , postal_code = , tax_id = , updated_at = NOW() 
       WHERE id =  
       RETURNING id, email, first_name, last_name, phone, street, house_number, city, postal_code, tax_id, status, created_at, updated_at`,
      [first_name, last_name, phone, street, house_number, city, postal_code, tax_id, id]
    );
    
    return result.rows[0];
  }
}

module.exports = new UserRepository();
