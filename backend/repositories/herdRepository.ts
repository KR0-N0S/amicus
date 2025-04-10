import { query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs reprezentujący gospodarstwo rolne
 */
export interface Herd {
  id: number;
  herd_id: string;
  owner_type: string;
  owner_id: number;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  eval_herd_no?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Interfejs dla danych potrzebnych do utworzenia gospodarstwa
 */
export interface HerdCreateData {
  herd_id: string;
  owner_type: string;
  owner_id: number;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  eval_herd_no?: string;
}

/**
 * Sprawdza czy gospodarstwo o podanym numerze identyfikacyjnym już istnieje
 * @param herdId - Numer identyfikacyjny gospodarstwa (herd_id)
 * @returns Promise<boolean> - True jeśli gospodarstwo istnieje, false w przeciwnym wypadku
 */
async function checkHerdRegistrationNumberExists(herdId: string): Promise<boolean> {
  console.log(`[HERD_REPO] Sprawdzanie czy gospodarstwo o numerze ${herdId} już istnieje`);
  
  if (!herdId || herdId.trim() === '') {
    console.log(`[HERD_REPO] Pusty numer identyfikacyjny, zwracam false`);
    return false;
  }
  
  try {
    const result: QueryResult = await query(
      'SELECT 1 FROM herds WHERE herd_id = $1 LIMIT 1',
      [herdId]
    );
    
    const exists = result.rows.length > 0;
    console.log(`[HERD_REPO] Gospodarstwo o numerze ${herdId} ${exists ? 'istnieje' : 'nie istnieje'}`);
    
    return exists;
  } catch (error) {
    console.error(`[HERD_REPO] Błąd podczas sprawdzania numeru gospodarstwa ${herdId}:`, error);
    // W przypadku błędu zwracamy false, aby nie blokować rejestracji
    return false;
  }
}

/**
 * Tworzy nowe gospodarstwo
 * @param herdData - Dane gospodarstwa
 * @returns Promise<Herd> - Utworzone gospodarstwo
 */
async function create(herdData: HerdCreateData): Promise<Herd> {
  console.log('[HERD_REPO] Tworzenie nowego gospodarstwa:', herdData);
  
  const { herd_id, owner_type, owner_id, street, house_number, city, postal_code, eval_herd_no } = herdData;
  
  try {
    const result: QueryResult = await query(
      `INSERT INTO herds (
        herd_id, owner_type, owner_id, street, house_number, city, 
        postal_code, eval_herd_no, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        herd_id, 
        owner_type, 
        owner_id, 
        street, 
        house_number, 
        city, 
        postal_code, 
        eval_herd_no, 
        new Date(), 
        new Date()
      ]
    );
    
    console.log('[HERD_REPO] Gospodarstwo utworzone pomyślnie, ID:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('[HERD_REPO] Błąd podczas tworzenia gospodarstwa:', error);
    throw new Error(`Nie udało się utworzyć gospodarstwa: ${(error as Error).message}`);
  }
}

/**
 * Pobiera gospodarstwo po ID
 * @param id - ID gospodarstwa
 * @returns Promise<Herd | undefined> - Gospodarstwo lub undefined jeśli nie znaleziono
 */
async function getById(id: number): Promise<Herd | undefined> {
  console.log(`[HERD_REPO] Pobieranie gospodarstwa o ID ${id}`);
  
  try {
    const result: QueryResult = await query('SELECT * FROM herds WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error) {
    console.error(`[HERD_REPO] Błąd podczas pobierania gospodarstwa ID ${id}:`, error);
    throw new Error(`Nie udało się pobrać gospodarstwa: ${(error as Error).message}`);
  }
}

/**
 * Pobiera gospodarstwa należące do właściciela
 * @param ownerId - ID właściciela
 * @param ownerType - Typ właściciela (domyślnie 'user')
 * @returns Promise<Herd[]> - Lista gospodarstw
 */
async function getByOwner(ownerId: number, ownerType: string = 'user'): Promise<Herd[]> {
  console.log(`[HERD_REPO] Pobieranie gospodarstw dla właściciela ID ${ownerId}, typ ${ownerType}`);
  
  try {
    const result: QueryResult = await query(
      'SELECT * FROM herds WHERE owner_id = $1 AND owner_type = $2 ORDER BY herd_id',
      [ownerId, ownerType]
    );
    
    console.log(`[HERD_REPO] Znaleziono ${result.rows.length} gospodarstw dla właściciela ID ${ownerId}`);
    return result.rows;
  } catch (error) {
    console.error(`[HERD_REPO] Błąd podczas pobierania gospodarstw dla właściciela ID ${ownerId}:`, error);
    throw new Error(`Nie udało się pobrać gospodarstw: ${(error as Error).message}`);
  }
}

/**
 * Aktualizuje dane gospodarstwa
 * @param id - ID gospodarstwa
 * @param herdData - Dane do aktualizacji
 * @returns Promise<Herd> - Zaktualizowane gospodarstwo
 */
async function update(id: number, herdData: Partial<HerdCreateData>): Promise<Herd> {
  console.log(`[HERD_REPO] Aktualizacja gospodarstwa o ID ${id}:`, herdData);
  
  // Dynamiczne budowanie zapytania aktualizacji
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  // Iterujemy po wszystkich możliwych polach do aktualizacji
  const updateableFields: (keyof HerdCreateData)[] = [
    'herd_id', 'owner_type', 'owner_id', 'street', 
    'house_number', 'city', 'postal_code', 'eval_herd_no'
  ];
  
  // Dodajemy do zapytania tylko te pola, które zostały przekazane
  for (const field of updateableFields) {
    if (field in herdData && herdData[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(herdData[field]);
      paramIndex++;
    }
  }
  
  // Dodajemy updated_at
  updates.push(`updated_at = $${paramIndex}`);
  values.push(new Date());
  paramIndex++;
  
  // ID jako ostatni parametr
  values.push(id);
  
  if (updates.length === 0) {
    throw new Error('Brak danych do aktualizacji');
  }
  
  try {
    const result: QueryResult = await query(
      `UPDATE herds SET ${updates.join(', ')} WHERE id = $${paramIndex - 1} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Nie znaleziono gospodarstwa o ID ${id}`);
    }
    
    console.log(`[HERD_REPO] Gospodarstwo o ID ${id} zaktualizowane pomyślnie`);
    return result.rows[0];
  } catch (error) {
    console.error(`[HERD_REPO] Błąd podczas aktualizacji gospodarstwa ID ${id}:`, error);
    throw new Error(`Nie udało się zaktualizować gospodarstwa: ${(error as Error).message}`);
  }
}

/**
 * Usuwa gospodarstwo
 * @param id - ID gospodarstwa
 * @returns Promise<boolean> - True jeśli usunięto, false jeśli nie znaleziono
 */
async function remove(id: number): Promise<boolean> {
  console.log(`[HERD_REPO] Usuwanie gospodarstwa o ID ${id}`);
  
  try {
    const result: QueryResult = await query('DELETE FROM herds WHERE id = $1 RETURNING id', [id]);
    
    const success = result.rows.length > 0;
    console.log(`[HERD_REPO] Gospodarstwo o ID ${id} ${success ? 'usunięte pomyślnie' : 'nie znaleziono'}`);
    
    return success;
  } catch (error) {
    console.error(`[HERD_REPO] Błąd podczas usuwania gospodarstwa ID ${id}:`, error);
    throw new Error(`Nie udało się usunąć gospodarstwa: ${(error as Error).message}`);
  }
}

// Eksport funkcji
export {
  create,
  getById,
  getByOwner,
  update,
  remove,
  checkHerdRegistrationNumberExists
};