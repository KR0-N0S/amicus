const { query } = require('../config/db');

// Pobierz wszystkie przyciski akcji dla danego użytkownika
async function getUserActionButtons(userId) {
  const result = await query(
    `SELECT * FROM user_action_buttons 
     WHERE user_id = $1 
     ORDER BY name`,
    [userId]
  );
  return result.rows;
}

// Pobierz pojedynczy przycisk akcji
async function getActionButtonById(id, userId) {
  const result = await query(
    `SELECT * FROM user_action_buttons 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

// Utwórz nowy przycisk akcji
async function createActionButton(data) {
  console.log('Creating action button with data:', data);
  const { user_id, name, description, action_type, default_values } = data;
  
  try {
    const result = await query(
      `INSERT INTO user_action_buttons 
       (user_id, name, description, action_type, default_values) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, name, description, action_type, default_values]
    );
    
    console.log('Insert result:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error in createActionButton:', error);
    throw error;
  }
}

// Aktualizuj istniejący przycisk akcji
async function updateActionButton(id, data) {
  console.log('Updating action button with data:', data);
  const { user_id, name, description, action_type, default_values } = data;
  
  try {
    const result = await query(
      `UPDATE user_action_buttons 
       SET name = $1, 
           description = $2, 
           action_type = $3, 
           default_values = $4,
           updated_at = NOW() 
       WHERE id = $5 AND user_id = $6 
       RETURNING *`,
      [name, description, action_type, default_values, id, user_id]
    );
    
    if (!result.rows.length) {
      throw new Error(`Action button with ID ${id} not found or not owned by user ${user_id}`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in updateActionButton:', error);
    throw error;
  }
}

// Usuń przycisk akcji
async function deleteActionButton(id, userId) {
  const result = await query(
    `DELETE FROM user_action_buttons 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  getUserActionButtons,
  getActionButtonById,
  createActionButton,
  updateActionButton,
  deleteActionButton
};