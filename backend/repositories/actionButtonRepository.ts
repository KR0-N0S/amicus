import { QueryResult } from 'pg';
import { query } from '../config/db';

/**
 * Interfejs reprezentujący przycisk akcji
 */
export interface ActionButton {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  action_type: string;
  default_values: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane potrzebne do utworzenia przycisku akcji
 */
export interface ActionButtonCreateData {
  user_id: number;
  name: string;
  description?: string;
  action_type: string;
  default_values: Record<string, any>;
}

/**
 * Dane aktualizacji przycisku akcji
 */
export interface ActionButtonUpdateData extends ActionButtonCreateData {
  user_id: number;
}

/**
 * Pobierz wszystkie przyciski akcji dla danego użytkownika
 * @param userId - Identyfikator użytkownika
 * @returns Lista przycisków akcji
 */
export async function getUserActionButtons(userId: number): Promise<ActionButton[]> {
  const result: QueryResult = await query(
    `SELECT * FROM user_action_buttons 
     WHERE user_id = $1 
     ORDER BY name`,
    [userId]
  );
  return result.rows;
}

/**
 * Pobierz pojedynczy przycisk akcji
 * @param id - Identyfikator przycisku
 * @param userId - Identyfikator użytkownika
 * @returns Przycisk akcji lub undefined jeśli nie znaleziono
 */
export async function getActionButtonById(id: number, userId: number): Promise<ActionButton | undefined> {
  const result: QueryResult = await query(
    `SELECT * FROM user_action_buttons 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

/**
 * Utwórz nowy przycisk akcji
 * @param data - Dane nowego przycisku akcji
 * @returns Utworzony przycisk akcji
 */
export async function createActionButton(data: ActionButtonCreateData): Promise<ActionButton> {
  console.log('Creating action button with data:', data);
  const { user_id, name, description, action_type, default_values } = data;
  
  try {
    const result: QueryResult = await query(
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

/**
 * Aktualizuj istniejący przycisk akcji
 * @param id - Identyfikator przycisku do aktualizacji
 * @param data - Nowe dane przycisku
 * @returns Zaktualizowany przycisk akcji
 */
export async function updateActionButton(id: number, data: ActionButtonUpdateData): Promise<ActionButton> {
  console.log('Updating action button with data:', data);
  const { user_id, name, description, action_type, default_values } = data;
  
  try {
    const result: QueryResult = await query(
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

/**
 * Usuń przycisk akcji
 * @param id - Identyfikator przycisku do usunięcia
 * @param userId - Identyfikator właściciela przycisku
 * @returns Usunięty przycisk akcji lub undefined jeśli nie znaleziono
 */
export async function deleteActionButton(id: number, userId: number): Promise<ActionButton | undefined> {
  const result: QueryResult = await query(
    `DELETE FROM user_action_buttons 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [id, userId]
  );
  return result.rows[0];
}