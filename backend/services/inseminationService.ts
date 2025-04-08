import * as inseminationRepository from '../repositories/inseminationRepository';
import * as animalRepository from '../repositories/animalRepository';
import * as bullRepository from '../repositories/bullRepository';
import { 
  Insemination, 
  InseminationCreateData, 
  InseminationUpdateData,
  InseminationFilters,
  PaginatedInseminationsResult,
  AnimalInseminationsResult
} from '../types/models/insemination';

class InseminationService {
  /**
   * Pobiera inseminację po ID
   * @param inseminationId ID inseminacji
   */
  async getInsemination(inseminationId: number): Promise<Insemination> {
    const insemination = await (inseminationRepository as any).findById(inseminationId);
    if (!insemination) {
      throw new Error('Inseminacja nie znaleziona');
    }
    return insemination;
  }

  /**
   * Pobiera inseminacje dla zwierzęcia
   * @param animalId ID zwierzęcia
   * @param page Numer strony
   * @param limit Limit wyników
   */
  async getAnimalInseminations(animalId: number, page: number = 1, limit: number = 10): Promise<AnimalInseminationsResult> {
    // Sprawdź czy zwierzę istnieje
    const animal = await (animalRepository as any).findById(animalId);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    
    const offset = (page - 1) * limit;
    const inseminations = await (inseminationRepository as any).findByAnimalId(animalId, limit, offset);
    
    return {
      animal,
      inseminations
    };
  }

  /**
   * Pobiera inseminacje dla właściciela
   * @param ownerId ID właściciela
   * @param page Numer strony
   * @param limit Limit wyników
   * @param filters Filtry wyszukiwania
   */
  async getOwnerInseminations(
    ownerId: number, 
    page: number = 1, 
    limit: number = 10, 
    filters: InseminationFilters = {}
  ): Promise<PaginatedInseminationsResult> {
    const offset = (page - 1) * limit;
    
    const inseminations = await (inseminationRepository as any).findByOwnerId(ownerId, limit, offset, filters);
    const totalCount = await (inseminationRepository as any).countByOwnerId(ownerId, filters);
    
    return {
      inseminations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Tworzy nową inseminację
   * @param inseminationData Dane inseminacji
   */
  async createInsemination(inseminationData: InseminationCreateData): Promise<Insemination> {
    // Sprawdź czy zwierzę istnieje
    const animal = await (animalRepository as any).findById(inseminationData.animal_id);
    if (!animal) {
      throw new Error('Zwierzę nie znalezione');
    }
    
    // Sprawdź czy byk istnieje, jeśli podano
    if (inseminationData.bull_id) {
      const bull = await (bullRepository as any).findById(inseminationData.bull_id);
      if (!bull) {
        throw new Error('Byk nie znaleziony');
      }
    }
    
    return await (inseminationRepository as any).create(inseminationData);
  }

  /**
   * Aktualizuje inseminację
   * @param inseminationId ID inseminacji
   * @param inseminationData Dane do aktualizacji
   */
  async updateInsemination(inseminationId: number, inseminationData: InseminationUpdateData): Promise<Insemination> {
    // Sprawdź czy inseminacja istnieje
    const insemination = await (inseminationRepository as any).findById(inseminationId);
    if (!insemination) {
      throw new Error('Inseminacja nie znaleziona');
    }
    
    // Sprawdź czy byk istnieje, jeśli podano
    if (inseminationData.bull_id) {
      const bull = await (bullRepository as any).findById(inseminationData.bull_id);
      if (!bull) {
        throw new Error('Byk nie znaleziony');
      }
    }
    
    return await (inseminationRepository as any).update(inseminationId, inseminationData);
  }

  /**
   * Usuwa inseminację
   * @param inseminationId ID inseminacji
   */
  async deleteInsemination(inseminationId: number): Promise<{ success: boolean; message: string }> {
    const insemination = await (inseminationRepository as any).findById(inseminationId);
    if (!insemination) {
      throw new Error('Inseminacja nie znaleziona');
    }
    
    await (inseminationRepository as any).delete(inseminationId);
    return { success: true, message: 'Inseminacja została usunięta' };
  }
}

export default new InseminationService();