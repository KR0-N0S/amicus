/**
 * Bazowe repozytorium dostarczające metody zarządzania transakcjami
 * @author KR0-N0S
 * @date 2025-04-06 (zoptymalizowano: 2025-04-06)
 */

import { pool, query } from '../config/db';
import { QueryResult } from 'pg';

/**
 * Interfejs dla klienta transakcji
 */
export interface TransactionClient {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
  release: () => void;
  isPoolClient: boolean;
}

class BaseRepository {
  /**
   * Rozpoczyna nową transakcję i zwraca klienta transakcji
   * @returns Klient transakcji
   * @throws Error - W przypadku problemów z pozyskaniem klienta
   */
  async beginTransaction(): Promise<TransactionClient> {
    try {
      // Jeśli dostępny jest pool, pozyskaj dedykowanego klienta
      if (pool && typeof pool.connect === 'function') {
        const client = await pool.connect();
        await client.query('BEGIN');
        
        return {
          query: async (text: string, params?: any[]): Promise<QueryResult> => client.query(text, params),
          release: (): void => client.release(),
          isPoolClient: true
        };
      } 
      // Fallback dla globalnej funkcji query
      else {
        await query('BEGIN');
        
        return {
          query: async (text: string, params?: any[]): Promise<QueryResult> => query(text, params),
          release: (): boolean => true,
          isPoolClient: false
        };
      }
    } catch (error) {
      console.error('Error beginning transaction:', error);
      throw error;
    }
  }

  /**
   * Zatwierdza transakcję
   * @param client - Klient transakcji zwrócony przez beginTransaction
   * @throws Error - W przypadku problemów z commitowaniem
   */
  async commitTransaction(client?: TransactionClient): Promise<void> {
    try {
      if (!client) {
        // Kompatybilność wsteczna jeśli nie przekazano klienta
        await query('COMMIT');
      } 
      else {
        await client.query('COMMIT');
        
        // Zwolnij klienta tylko jeśli jest poolowym klientem
        if (client.isPoolClient) {
          client.release();
        }
      }
    } catch (error) {
      console.error('Error committing transaction:', error);
      throw error;
    }
  }

  /**
   * Wycofuje transakcję
   * @param client - Klient transakcji zwrócony przez beginTransaction
   * @throws Error - W przypadku problemów z rollbackiem
   */
  async rollbackTransaction(client?: TransactionClient): Promise<void> {
    try {
      if (!client) {
        // Kompatybilność wsteczna jeśli nie przekazano klienta
        await query('ROLLBACK');
      } 
      else {
        await client.query('ROLLBACK');
        
        // Zwolnij klienta tylko jeśli jest poolowym klientem
        if (client.isPoolClient) {
          client.release();
        }
      }
    } catch (error) {
      console.error('Error rolling back transaction:', error);
      throw error;
    }
  }
  
  /**
   * Wykonuje operację w ramach transakcji
   * @param callback - Funkcja wykonująca operacje w transakcji
   * @returns Wynik operacji
   */
  async executeTransaction<T>(callback: (client: TransactionClient) => Promise<T>): Promise<T> {
    const client = await this.beginTransaction();
    
    try {
      const result = await callback(client);
      await this.commitTransaction(client);
      return result;
    } catch (error) {
      await this.rollbackTransaction(client);
      throw error;
    }
  }
}

export default new BaseRepository();