const db = require('../config/db');

class OrganizationRepository {
  async findById(id) {
    const result = await db.query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async create(organizationData) {
    const { name, street, house_number, city, postal_code, tax_id } = organizationData;
    
    const result = await db.query(
      `INSERT INTO organizations 
       (name, street, house_number, city, postal_code, tax_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING *`,
      [name, street, house_number, city, postal_code, tax_id]
    );
    
    return result.rows[0];
  }

  async addUserToOrganization(organizationId, userId, role = 'member') {
    const result = await db.query(
      `INSERT INTO organization_user 
       (organization_id, user_id, role, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [organizationId, userId, role]
    );
    
    return result.rows[0];
  }

  async getUserOrganizations(userId) {
    const result = await db.query(
      `SELECT o.* FROM organizations o 
       JOIN organization_user ou ON o.id = ou.organization_id 
       WHERE ou.user_id = $1`,
      [userId]
    );
    
    return result.rows;
  }

  async getUserRole(organizationId, userId) {
    const result = await db.query(
      `SELECT role FROM organization_user 
       WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId]
    );
    
    return result.rows[0]?.role;
  }
}

module.exports = new OrganizationRepository();