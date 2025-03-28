const { query } = require('../config/db');

class AnimalRepository {
  async findById(id) {
    const result = await query(
      'SELECT * FROM animals WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async findByOwnerId(ownerId, limit = 10, offset = 0, animalType = null) {
    let sql = 'SELECT * FROM animals WHERE owner_id = $1';
    const params = [ownerId];
    
    // Filtrowanie według typu zwierzęcia jeśli podano
    if (animalType) {
      sql += ' AND animal_type = $2';
      params.push(animalType);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    return result.rows;
  }

  async countByOwnerId(ownerId, animalType = null) {
    let sql = 'SELECT COUNT(*) FROM animals WHERE owner_id = $1';
    const params = [ownerId];
    
    // Filtrowanie według typu zwierzęcia jeśli podano
    if (animalType) {
      sql += ' AND animal_type = $2';
      params.push(animalType);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  async create(animalData) {
    const { 
      owner_id, 
      animal_number, 
      identifier,
      age, 
      sex, 
      breed, 
      species,
      animal_type,
      birth_date,
      photo 
    } = animalData;
    
    const result = await query(
      `INSERT INTO animals 
       (owner_id, animal_number, identifier, age, sex, breed, species, animal_type, birth_date, photo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [owner_id, animal_number, identifier, age, sex, breed, species, animal_type, birth_date, photo]
    );
    
    return result.rows[0];
  }

  async update(id, animalData) {
    const { 
      animal_number, 
      identifier,
      age, 
      sex, 
      breed, 
      species,
      animal_type,
      birth_date,
      photo 
    } = animalData;
    
    const result = await query(
      `UPDATE animals 
       SET animal_number = $1, identifier = $2, age = $3, sex = $4, breed = $5, 
           species = $6, animal_type = $7, birth_date = $8, photo = $9
       WHERE id = $10
       RETURNING *`,
      [animal_number, identifier, age, sex, breed, species, animal_type, birth_date, photo, id]
    );
    
    return result.rows[0];
  }

  async delete(id) {
    return await query('DELETE FROM animals WHERE id = $1', [id]);
  }
}

module.exports = new AnimalRepository();