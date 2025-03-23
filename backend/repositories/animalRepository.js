const db = require('../config/db');

class AnimalRepository {
  async findById(id) {
    const result = await db.query(
      'SELECT * FROM animals WHERE id = ',
      [id]
    );
    return result.rows[0];
  }

  async findByOwnerId(ownerId, limit = 10, offset = 0) {
    const result = await db.query(
      'SELECT * FROM animals WHERE owner_id =  ORDER BY created_at DESC LIMIT  OFFSET ',
      [ownerId, limit, offset]
    );
    return result.rows;
  }

  async countByOwnerId(ownerId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM animals WHERE owner_id = ',
      [ownerId]
    );
    return parseInt(result.rows[0].count);
  }

  async create(animalData) {
    const { owner_id, animal_number, age, sex, breed, photo } = animalData;
    
    const result = await db.query(
      `INSERT INTO animals 
       (owner_id, animal_number, age, sex, breed, photo) 
       VALUES (, , , , , ) 
       RETURNING *`,
      [owner_id, animal_number, age, sex, breed, photo]
    );
    
    return result.rows[0];
  }

  async update(id, animalData) {
    const { animal_number, age, sex, breed, photo } = animalData;
    
    const result = await db.query(
      `UPDATE animals 
       SET animal_number = , age = , sex = , breed = , photo = 
       WHERE id =  
       RETURNING *`,
      [animal_number, age, sex, breed, photo, id]
    );
    
    return result.rows[0];
  }

  async delete(id) {
    return await db.query('DELETE FROM animals WHERE id = ', [id]);
  }
}

module.exports = new AnimalRepository();
