const db = require('../config/db');

class VisitRepository {
  async findById(id) {
    const result = await db.query(
      `SELECT v.*, 
              f.first_name as farmer_first_name, f.last_name as farmer_last_name,
              vt.first_name as vet_first_name, vt.last_name as vet_last_name,
              e.first_name as employee_first_name, e.last_name as employee_last_name
       FROM visits v
       JOIN users f ON v.farmer_id = f.id
       LEFT JOIN users vt ON v.vet_id = vt.id
       LEFT JOIN users e ON v.employee_id = e.id
       WHERE v.id = `,
      [id]
    );
    return result.rows[0];
  }

  async findByFarmerId(farmerId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT v.*, 
              vt.first_name as vet_first_name, vt.last_name as vet_last_name,
              e.first_name as employee_first_name, e.last_name as employee_last_name
       FROM visits v
       LEFT JOIN users vt ON v.vet_id = vt.id
       LEFT JOIN users e ON v.employee_id = e.id
       WHERE v.farmer_id =  
       ORDER BY v.visit_date DESC LIMIT  OFFSET `,
      [farmerId, limit, offset]
    );
    return result.rows;
  }

  async findByVetId(vetId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT v.*, 
              f.first_name as farmer_first_name, f.last_name as farmer_last_name,
              e.first_name as employee_first_name, e.last_name as employee_last_name
       FROM visits v
       JOIN users f ON v.farmer_id = f.id
       LEFT JOIN users e ON v.employee_id = e.id
       WHERE v.vet_id =  
       ORDER BY v.visit_date DESC LIMIT  OFFSET `,
      [vetId, limit, offset]
    );
    return result.rows;
  }

  async countByFarmerId(farmerId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM visits WHERE farmer_id = ',
      [farmerId]
    );
    return parseInt(result.rows[0].count);
  }

  async countByVetId(vetId) {
    const result = await db.query(
      'SELECT COUNT(*) FROM visits WHERE vet_id = ',
      [vetId]
    );
    return parseInt(result.rows[0].count);
  }

  async create(visitData) {
    const { farmer_id, vet_id, visit_date, description, status, employee_id, channel } = visitData;
    
    const result = await db.query(
      `INSERT INTO visits 
       (farmer_id, vet_id, visit_date, description, status, employee_id, channel) 
       VALUES (, , , , , , ) 
       RETURNING *`,
      [farmer_id, vet_id, visit_date, description, status, employee_id, channel]
    );
    
    return result.rows[0];
  }

  async update(id, visitData) {
    const { visit_date, description, status, vet_id, employee_id, channel } = visitData;
    
    const result = await db.query(
      `UPDATE visits 
       SET visit_date = , description = , status = , vet_id = , employee_id = , channel = 
       WHERE id =  
       RETURNING *`,
      [visit_date, description, status, vet_id, employee_id, channel, id]
    );
    
    return result.rows[0];
  }

  async delete(id) {
    return await db.query('DELETE FROM visits WHERE id = ', [id]);
  }
}

module.exports = new VisitRepository();
