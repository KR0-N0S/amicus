const db = require('../config/db');

class InseminationRepository {
  async findById(id) {
    const result = await db.query(
      `SELECT ir.*, a.animal_number, a.breed as animal_breed, a.sex, 
              b.identification_number as bull_identification_number, b.breed as bull_breed 
       FROM insemination_register ir
       LEFT JOIN animals a ON ir.animal_id = a.id
       LEFT JOIN bulls b ON ir.bull_id = b.id
       WHERE ir.id = `,
      [id]
    );
    return result.rows[0];
  }

  async findByAnimalId(animalId, limit = 10, offset = 0) {
    const result = await db.query(
      `SELECT ir.*, b.identification_number as bull_identification_number, b.breed as bull_breed
       FROM insemination_register ir
       LEFT JOIN bulls b ON ir.bull_id = b.id
       WHERE ir.animal_id =  
       ORDER BY ir.procedure_date DESC LIMIT  OFFSET `,
      [animalId, limit, offset]
    );
    return result.rows;
  }

  async findByOwnerId(ownerId, limit = 10, offset = 0, filters = {}) {
    let query = `
      SELECT ir.*, a.animal_number, a.breed as animal_breed, 
            b.identification_number as bull_identification_number, b.breed as bull_breed 
      FROM insemination_register ir
      JOIN animals a ON ir.animal_id = a.id
      LEFT JOIN bulls b ON ir.bull_id = b.id
      WHERE ir.owner_id = 
    `;
    
    const queryParams = [ownerId];
    let paramIndex = 2;
    
    if (filters.startDate) {
      query += ` AND ir.procedure_date >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      query += ` AND ir.procedure_date <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    if (filters.animalId) {
      query += ` AND ir.animal_id = $${paramIndex}`;
      queryParams.push(filters.animalId);
      paramIndex++;
    }
    
    query += ` ORDER BY ir.procedure_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    return result.rows;
  }

  async countByOwnerId(ownerId, filters = {}) {
    let query = `
      SELECT COUNT(*) 
      FROM insemination_register ir
      JOIN animals a ON ir.animal_id = a.id
      WHERE ir.owner_id = 
    `;
    
    const queryParams = [ownerId];
    let paramIndex = 2;
    
    if (filters.startDate) {
      query += ` AND ir.procedure_date >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters.endDate) {
      query += ` AND ir.procedure_date <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    if (filters.animalId) {
      query += ` AND ir.animal_id = $${paramIndex}`;
      queryParams.push(filters.animalId);
      paramIndex++;
    }
    
    const result = await db.query(query, queryParams);
    return parseInt(result.rows[0].count);
  }

  async create(inseminationData) {
    const { 
      animal_id, 
      certificate_number, 
      file_number, 
      procedure_number, 
      re_insemination, 
      procedure_date, 
      herd_number, 
      herd_eval_number, 
      dam_owner, 
      ear_tag_number, 
      last_calving_date, 
      name, 
      bull_type, 
      supplier, 
      inseminator, 
      symlek_status, 
      symlek_responsibility,
      owner_id,
      bull_id
    } = inseminationData;
    
    const result = await db.query(
      `INSERT INTO insemination_register 
       (animal_id, certificate_number, file_number, procedure_number, re_insemination, 
        procedure_date, herd_number, herd_eval_number, dam_owner, ear_tag_number, 
        last_calving_date, name, bull_type, supplier, inseminator, symlek_status, 
        symlek_responsibility, owner_id, bull_id) 
       VALUES (, , , , , , , , , 0, 1, 2, 3, 4, 5, 6, 7, 8, 9) 
       RETURNING *`,
      [
        animal_id, 
        certificate_number, 
        file_number, 
        procedure_number, 
        re_insemination, 
        procedure_date, 
        herd_number, 
        herd_eval_number, 
        dam_owner, 
        ear_tag_number, 
        last_calving_date, 
        name, 
        bull_type, 
        supplier, 
        inseminator, 
        symlek_status, 
        symlek_responsibility,
        owner_id,
        bull_id
      ]
    );
    
    return result.rows[0];
  }

  async update(id, inseminationData) {
    const { 
      certificate_number, 
      file_number, 
      procedure_number, 
      re_insemination, 
      procedure_date, 
      herd_number, 
      herd_eval_number, 
      dam_owner, 
      ear_tag_number, 
      last_calving_date, 
      name, 
      bull_type, 
      supplier, 
      inseminator, 
      symlek_status, 
      symlek_responsibility,
      bull_id
    } = inseminationData;
    
    const result = await db.query(
      `UPDATE insemination_register 
       SET certificate_number = , file_number = , procedure_number = , re_insemination = , 
           procedure_date = , herd_number = , herd_eval_number = , dam_owner = , 
           ear_tag_number = , last_calving_date = 0, name = 1, bull_type = 2, 
           supplier = 3, inseminator = 4, symlek_status = 5, symlek_responsibility = 6,
           bull_id = 7
       WHERE id = 8 
       RETURNING *`,
      [
        certificate_number, 
        file_number, 
        procedure_number, 
        re_insemination, 
        procedure_date, 
        herd_number, 
        herd_eval_number, 
        dam_owner, 
        ear_tag_number, 
        last_calving_date, 
        name, 
        bull_type, 
        supplier, 
        inseminator, 
        symlek_status, 
        symlek_responsibility,
        bull_id,
        id
      ]
    );
    
    return result.rows[0];
  }

  async delete(id) {
    return await db.query('DELETE FROM insemination_register WHERE id = ', [id]);
  }
}

module.exports = new InseminationRepository();
