import { AppError } from '../middleware/errorHandler';
import * as bullRepository from '../repositories/bullRepository';
import {
  Bull,
  BullCreateData,
  BullFilters,
  BullSorting,
  PaginatedBullsResult,
  BullStats,
  BullDelivery,
  BullInsemination
} from '../types/models/bull';

class BullService {
  /**
   * Wyszukiwanie buhajów z filtrowaniem i paginacją
   */
  async searchBulls(
    searchTerm?: string, 
    filters: BullFilters = {}, 
    sorting: BullSorting = { field: 'created_at', direction: 'DESC' }, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedBullsResult> {
    try {
      // Zabezpieczamy parametr wyszukiwania przed null/undefined
      const safeSearchTerm = searchTerm || '';
      
      console.log(`[BULL_SERVICE] Wyszukiwanie buhajów dla frazy: "${safeSearchTerm}"`);
      const result = await (bullRepository as any).searchBulls(safeSearchTerm, filters, sorting, page, limit);
      
      // Zabezpieczenie przed nieprawidłową strukturą wyniku
      if (!result) {
        return {
          bulls: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit
          }
        };
      }
      
      // Upewniamy się, że bulls istnieje
      if (!result.bulls) {
        result.bulls = [];
      }
      
      // Upewniamy się, że pagination istnieje
      if (!result.pagination) {
        result.pagination = {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        };
      }
      
      return result;
    } catch (error) {
      console.error('[BULL_SERVICE] Błąd podczas wyszukiwania buhajów:', error);
      // Zwracamy domyślny obiekt zamiast rzucać wyjątek
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobiera konkretnego buhaja po ID
   */
  async getBull(id: number): Promise<Bull> {
    const bull = await (bullRepository as any).findById(id);
    if (!bull) {
      throw new AppError('Nie znaleziono buhaja o podanym ID', 404);
    }
    return bull;
  }

  /**
   * Pobiera buhaje należące do właściciela
   */
  async getOwnerBulls(
    ownerId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedBullsResult> {
    try {
      const offset = (page - 1) * limit;
      const bulls = await (bullRepository as any).findByOwnerId(ownerId, limit, offset);
      const totalCount = await (bullRepository as any).countByOwnerId(ownerId);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        bulls: bulls || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[BULL_SERVICE] Błąd podczas pobierania buhajów właściciela ${ownerId}:`, error);
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Pobiera buhaje należące do organizacji
   */
  async getOrganizationBulls(
    organizationId: number, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedBullsResult> {
    try {
      const offset = (page - 1) * limit;
      const bulls = await (bullRepository as any).findByOrganizationId(organizationId, limit, offset);
      const totalCount = await (bullRepository as any).countByOrganizationId(organizationId);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        bulls: bulls || [], // Zabezpieczenie przed undefined
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit
        }
      };
    } catch (error) {
      console.error(`[BULL_SERVICE] Błąd podczas pobierania buhajów organizacji ${organizationId}:`, error);
      return {
        bulls: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: page,
          pageSize: limit
        }
      };
    }
  }

  /**
   * Tworzy nowego buhaja
   */
  async createBull(bullData: BullCreateData): Promise<Bull> {
    try {
      // Walidacja numeru identyfikacyjnego
      if (!bullData.identification_number) {
        throw new AppError('Numer identyfikacyjny buhaja jest wymagany', 400);
      }

      const idNumberRegex = /^[A-Z]{2}[0-9]+$/;
      if (!idNumberRegex.test(bullData.identification_number)) {
        throw new AppError('Niepoprawny format numeru identyfikacyjnego. Wymagany format: 2 duże litery + cyfry', 400);
      }

      // Walidacja typu buhaja
      if (!bullData.bull_type) {
        throw new AppError('Typ buhaja jest wymagany', 400);
      }

      // Jeśli nie podano nazwy, użyj numeru identyfikacyjnego
      if (!bullData.name) {
        bullData.name = bullData.identification_number;
      }

      const bull = await (bullRepository as any).create(bullData);
      return bull;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas tworzenia buhaja:', error);
      throw new AppError('Nie udało się utworzyć buhaja', 500);
    }
  }

  /**
   * Aktualizuje dane buhaja
   */
  async updateBull(id: number, bullData: Partial<BullCreateData>): Promise<Bull> {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      // Walidacja numeru identyfikacyjnego
      if (bullData.identification_number) {
        const idNumberRegex = /^[A-Z]{2}[0-9]+$/;
        if (!idNumberRegex.test(bullData.identification_number)) {
          throw new AppError('Niepoprawny format numeru identyfikacyjnego. Wymagany format: 2 duże litery + cyfry', 400);
        }
      }
      
      const bull = await (bullRepository as any).update(id, bullData);
      return bull;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas aktualizacji buhaja:', error);
      throw new AppError('Nie udało się zaktualizować buhaja', 500);
    }
  }

  /**
   * Usuwa buhaja
   */
  async deleteBull(id: number): Promise<boolean> {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const result = await (bullRepository as any).delete(id);
      if (!result) {
        throw new AppError('Nie udało się usunąć buhaja', 500);
      }
      return true;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas usuwania buhaja:', error);
      throw new AppError('Nie udało się usunąć buhaja', 500);
    }
  }

  /**
   * Pobiera statystyki dla buhaja
   */
  async getBullStats(id: number): Promise<BullStats> {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const stats = await (bullRepository as any).getBullStats(id);
      return stats;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas pobierania statystyk buhaja:', error);
      throw new AppError('Nie udało się pobrać statystyk buhaja', 500);
    }
  }

  /**
   * Pobiera historię dostaw nasienia dla buhaja
   */
  async getBullDeliveries(id: number, page: number = 1, limit: number = 10): Promise<BullDelivery[]> {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const offset = (page - 1) * limit;
      const deliveries = await (bullRepository as any).getBullDeliveries(id, limit, offset);
      return deliveries;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas pobierania historii dostaw buhaja:', error);
      throw new AppError('Nie udało się pobrać historii dostaw buhaja', 500);
    }
  }

  /**
   * Pobiera historię inseminacji dla buhaja
   */
  async getBullInseminations(id: number, page: number = 1, limit: number = 10): Promise<BullInsemination[]> {
    try {
      // Sprawdź czy buhaj istnieje
      const existingBull = await this.getBull(id);
      
      const offset = (page - 1) * limit;
      const inseminations = await (bullRepository as any).getBullInseminations(id, limit, offset);
      return inseminations;
    } catch (error) {
      // Jeśli to jest już AppError, przekaż go dalej
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[BULL_SERVICE] Błąd podczas pobierania historii inseminacji buhaja:', error);
      throw new AppError('Nie udało się pobrać historii inseminacji buhaja', 500);
    }
  }
}

export default new BullService();