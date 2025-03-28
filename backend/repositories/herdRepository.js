const db = require('../config/db');

class HerdRepository {
  // Tworzenie nowego gospodarstwa
  async create(herdData) {
    try {
      // Przy założeniu, że herd_id to przychodzący registration_number
      const { 
        name,
        registration_number, 
        evaluation_number, 
        owner_type = 'user', 
        owner_id, 
        street,
        house_number,
        city,
        postal_code
      } = herdData;
      
      const query = `
        INSERT INTO herds (
          herd_id, 
          owner_type, 
          owner_id,
          street,
          house_number,
          city,
          postal_code,
          eval_herd_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
      `;
      
      const values = [
        registration_number,
        owner_type,
        owner_id,
        street || null,
        house_number || null,
        city || null,
        postal_code || null,
        evaluation_number || null
      ];
      
      const result = await db.query(query, values);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating herd:', error);
      throw error;
    }
  }
  
  // Pobieranie gospodarstw dla określonego właściciela
  async getByOwnerId(ownerId, ownerType = 'user') {
    try {
      const query = `
        SELECT * FROM herds 
        WHERE owner_id = $1 AND owner_type = $2
      `;
      
      const result = await db.query(query, [ownerId, ownerType]);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching herds by owner:', error);
      throw error;
    }
  }
  
  // Pobieranie gospodarstwa po ID
  async getById(herdId) {
    try {
      const query = 'SELECT * FROM herds WHERE id = $1';
      
      const result = await db.query(query, [herdId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching herd by ID:', error);
      throw error;
    }
  }
  
  // Sprawdzenie czy numer rejestracyjny stada już istnieje
  async checkHerdRegistrationNumberExists(registrationNumber) {
    try {
      const query = 'SELECT EXISTS(SELECT 1 FROM herds WHERE herd_id = $1)';
      
      const result = await db.query(query, [registrationNumber]);
      
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking herd registration number:', error);
      throw error;
    }
  }
}

module.exports = new HerdRepository();