import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } // Akceptuje certyfikaty self-signed
      : false,
});

// Test połączenia
pool.connect(
  (
    err: Error | undefined,
    client: PoolClient | undefined,
    release: (release?: any) => void
  ) => {
    if (err) {
      console.error('Błąd połączenia z bazą danych:', err.stack);
      return;
    }
    if (client) {
      console.log('Połączenie z bazą danych ustanowione pomyślnie');
    }
    release();
  }
);

/**
 * Wykonuje zapytanie do bazy danych
 * @param text Zapytanie SQL
 * @param params Parametry zapytania
 * @returns Wynik zapytania
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Wykonuje serię zapytań w ramach jednej transakcji
 * @param callback Funkcja zawierająca zapytania do wykonania w transakcji
 * @returns Wynik ostatniego zapytania z transakcji
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    // Rozpoczęcie transakcji
    await client.query('BEGIN');
    
    // Wykonanie callback z przekazaniem klienta
    const result = await callback(client);
    
    // Potwierdzenie transakcji
    await client.query('COMMIT');
    
    return result;
  } catch (error) {
    // W przypadku błędu - wycofanie transakcji
    await client.query('ROLLBACK');
    console.error('Transaction rolled back due to error:', error);
    throw error;
  } finally {
    // Zwolnienie klienta z powrotem do puli
    client.release();
  }
};

/**
 * Wykonuje pojedyncze zapytanie w ramach transakcji
 * @param client Klient połączenia
 * @param text Zapytanie SQL
 * @param params Parametry zapytania
 * @returns Wynik zapytania
 */
export const queryWithinTransaction = (
  client: PoolClient, 
  text: string, 
  params?: any[]
) => {
  return client.query(text, params);
};

export { pool };