const db = require('../config/db');

class BullRepository {
  async findById(id) {
    const result = await db.query(
      'SELECT * FROM bulls WHERE id = ',
      [id]
    );
    return result.rows[0];
  }

  async findAll(limit = 100, offset = 0, searchTerm = '') {
    let query = 'SELECT * FROM bulls';
    const params = [];
    
    if (searchTerm) {
      query += ' WHERE identification_number ILIKE  OR breed ILIKE  OR bull_type ILIKE ';
      params.push(`%${searchTerm}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
  }

  async count(searchTerm = '') {
    let query = 'SELECT COUNT(*) FROM bulls';
    const params = [];
    
    if (searchTerm) {
      query += ' WHERE identification_number ILIKE  OR breed ILIKE  OR bull_type ILIKE ';
      params.push(`%${searchTerm}%`);
    }
    
    const result = await db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async create(bullData) {
    const { 
      identification_number, 
      vet_number, 
      breed, 
      semen_production_date, 
      supplier, 
      bull_type, 
      last_delivery_date, 
      straws_last_delivery, 
      current_straw_count, 
      suggested_price, 
      additional_info,
      favorite,
      vet_id
    } = bullData;
    
    const result = await db.query(
      `INSERT INTO bulls 
       (identification_number, vet_number, breed, semen_production_date, supplier, bull_type, 
        last_delivery_date, straws_last_delivery, current_straw_count, suggested_price, 
        additional_info, favorite, vet_id) 
       VALUES (, , , , , , , , , 0, 1, 2, 3) 
       RETURNING *`,
      [
        identification_number, 
        vet_number, 
        breed, 
        semen_production_date, 
        supplier, 
        bull_type, 
        last_delivery_date, 
        straws_last_delivery, 
        current_straw_count, 
        suggested_price, 
        additional_info,
        favorite || false,
        vet_id
      ]
    );
    
    return result.rows[0];
  }

  async update(id, bullData) {
    const { 
      identification_number, 
      vet_number, 
      breed, 
      semen_production_date, 
      supplier, 
      bull_type, 
      last_delivery_date, 
      straws_last_delivery, 
      current_straw_count, 
      suggested_price, 
      additional_info,
      favorite,
      vet_id
    } = bullData;
    
    const result = await db.query(
      `UPDATE bulls 
       SET identification_number = , vet_number = , breed = , semen_production_date = , 
           supplier = , bull_type = , last_delivery_date = , straws_last_delivery = , 
           current_straw_count = , suggested_price = 0, additional_info = 1, favorite = 2, vet_id = 3
       WHERE id = 4 
       RETURNING *`,
      [
        identification_number, 
        vet_number, 
        breed, 
        semen_production_date, 
        supplier, 
        bull_type, 
        last_delivery_date, 
        straws_last_delivery, 
        current_straw_count, 
        suggested_price, 
        additional_info,
        favorite || false,
        vet_id,
        id
      ]
    );
    
    return result.rows[0];
  }

  async delete(id) {
    return await db.query('DELETE FROM bulls WHERE id = ', [id]);
  }
}

module.exports = new BullRepository();
