/**
 * Bazowe repozytorium dostarczające metody zarządzania transakcjami
 * @author KR0-N0S
 * @date 2025-04-06 (zoptymalizowano: 2025-04-06)
 */

const { pool, query } = require('../config/db');

class BaseRepository {
  /**
   * Rozpoczyna nową transakcję i zwraca klienta transakcji
   * @returns {Object} - Klient transakcji
   * @throws {Error} - W przypadku problemów z pozyskaniem klienta
   */
  async beginTransaction() {
    try {
      // Jeśli dostępny jest pool, pozyskaj dedykowanego klienta
      if (pool && typeof pool.connect === 'function') {
        const client = await pool.connect();
        await client.query('BEGIN');
        
        return {
          query: async (text, params) => client.query(text, params),
          release: () => client.release(),
          isPoolClient: true
        };
      } 
      // Fallback dla globalnej funkcji query
      else {
        await query('BEGIN');
        
        return {
          query: async (text, params) => query(text, params),
          release: () => true,
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
   * @param {Object} client - Klient transakcji zwrócony przez beginTransaction
   * @throws {Error} - W przypadku problemów z commitowaniem
   */
  async commitTransaction(client) {
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
   * @param {Object} client - Klient transakcji zwrócony przez beginTransaction
   * @throws {Error} - W przypadku problemów z rollbackiem
   */
  async rollbackTransaction(client) {
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
   * @param {Function} callback - Funkcja wykonująca operacje w transakcji
   * @returns {Promise<any>} - Wynik operacji
   */
  async executeTransaction(callback) {
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

module.exports = new BaseRepository();