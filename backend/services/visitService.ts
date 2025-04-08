import * as visitRepository from '../repositories/visitRepository';
import * as userRepository from '../repositories/userRepository';
import { Visit, VisitCreateData, VisitUpdateData, PaginatedVisitsResult } from '../types/models/visit';

class VisitService {
  /**
   * Pobiera dane wizyty po ID
   * @param visitId ID wizyty
   */
  async getVisit(visitId: number): Promise<Visit> {
    const visit = await (visitRepository as any).findById(visitId);
    if (!visit) {
      throw new Error('Wizyta nie znaleziona');
    }
    return visit;
  }

  /**
   * Pobiera wizyty dla rolnika
   * @param farmerId ID rolnika
   * @param page Numer strony
   * @param limit Limit wyników
   */
  async getFarmerVisits(farmerId: number, page: number = 1, limit: number = 10): Promise<PaginatedVisitsResult> {
    // Sprawdź czy rolnik istnieje
    const farmer = await userRepository.findById(farmerId);
    if (!farmer) {
      throw new Error('Użytkownik nie znaleziony');
    }
    
    const offset = (page - 1) * limit;
    const visits = await (visitRepository as any).findByFarmerId(farmerId, limit, offset);
    const totalCount = await (visitRepository as any).countByFarmerId(farmerId);
    
    return {
      visits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Pobiera wizyty dla weterynarza
   * @param vetId ID weterynarza
   * @param page Numer strony
   * @param limit Limit wyników
   */
  async getVetVisits(vetId: number, page: number = 1, limit: number = 10): Promise<PaginatedVisitsResult> {
    // Sprawdź czy weterynarz istnieje
    const vet = await userRepository.findById(vetId);
    if (!vet) {
      throw new Error('Użytkownik nie znaleziony');
    }
    
    const offset = (page - 1) * limit;
    const visits = await (visitRepository as any).findByVetId(vetId, limit, offset);
    const totalCount = await (visitRepository as any).countByVetId(vetId);
    
    return {
      visits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Tworzy nową wizytę
   * @param visitData Dane wizyty
   */
  async createVisit(visitData: VisitCreateData): Promise<Visit> {
    // Sprawdzamy czy rolnik istnieje
    const farmer = await userRepository.findById(visitData.farmer_id);
    if (!farmer) {
      throw new Error('Rolnik nie znaleziony');
    }
    
    // Sprawdzamy czy weterynarz istnieje, jeśli podano
    if (visitData.vet_id) {
      const vet = await userRepository.findById(visitData.vet_id);
      if (!vet) {
        throw new Error('Weterynarz nie znaleziony');
      }
    }
    
    // Sprawdzamy czy pracownik istnieje, jeśli podano
    if (visitData.employee_id) {
      const employee = await userRepository.findById(visitData.employee_id);
      if (!employee) {
        throw new Error('Pracownik nie znaleziony');
      }
    }
    
    return await (visitRepository as any).create(visitData);
  }

  /**
   * Aktualizuje dane wizyty
   * @param visitId ID wizyty
   * @param visitData Dane wizyty do aktualizacji
   */
  async updateVisit(visitId: number, visitData: VisitUpdateData): Promise<Visit> {
    // Sprawdź czy wizyta istnieje
    const visit = await (visitRepository as any).findById(visitId);
    if (!visit) {
      throw new Error('Wizyta nie znaleziona');
    }
    
    // Sprawdzamy czy weterynarz istnieje, jeśli podano
    if (visitData.vet_id) {
      const vet = await userRepository.findById(visitData.vet_id);
      if (!vet) {
        throw new Error('Weterynarz nie znaleziony');
      }
    }
    
    // Sprawdzamy czy pracownik istnieje, jeśli podano
    if (visitData.employee_id) {
      const employee = await userRepository.findById(visitData.employee_id);
      if (!employee) {
        throw new Error('Pracownik nie znaleziony');
      }
    }
    
    return await (visitRepository as any).update(visitId, visitData);
  }

  /**
   * Usuwa wizytę
   * @param visitId ID wizyty
   */
  async deleteVisit(visitId: number): Promise<{ success: boolean; message: string }> {
    const visit = await (visitRepository as any).findById(visitId);
    if (!visit) {
      throw new Error('Wizyta nie znaleziona');
    }
    
    await (visitRepository as any).delete(visitId);
    return { success: true, message: 'Wizyta została usunięta' };
  }
}

export default new VisitService();