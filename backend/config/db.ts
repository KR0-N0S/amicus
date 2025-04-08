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

export const query = (text: string, params?: any[]) => pool.query(text, params);
export { pool };
