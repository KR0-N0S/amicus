const db = require('../config/db');

class KeyRepository {
  async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM user_keys WHERE user_id = ',
      [userId]
    );
    return result.rows[0];
  }

  async create(keyData) {
    const { user_id, public_key, backup_encrypted_private_key } = keyData;
    
    const result = await db.query(
      `INSERT INTO user_keys 
       (user_id, public_key, backup_encrypted_private_key) 
       VALUES (, , ) 
       RETURNING *`,
      [user_id, public_key, backup_encrypted_private_key]
    );
    
    return result.rows[0];
  }

  async update(userId, keyData) {
    const { public_key, backup_encrypted_private_key } = keyData;
    
    const result = await db.query(
      `UPDATE user_keys 
       SET public_key = , backup_encrypted_private_key = 
       WHERE user_id =  
       RETURNING *`,
      [public_key, backup_encrypted_private_key, userId]
    );
    
    return result.rows[0];
  }
}

module.exports = new KeyRepository();
