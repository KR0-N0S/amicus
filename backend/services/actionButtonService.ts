import * as actionButtonRepository from '../repositories/actionButtonRepository';
import { 
  ActionButton,
  ActionButtonCreateData,
  ActionButtonUpdateData 
} from '../types/models/actionButton';

class ActionButtonService {
  /**
   * Pobiera wszystkie przyciski akcji dla danego użytkownika
   * @param userId ID użytkownika
   * @returns Lista przycisków akcji
   */
  async getUserActionButtons(userId: number): Promise<ActionButton[]> {
    return await (actionButtonRepository as any).findByUserId(userId);
  }

  /**
   * Pobiera pojedynczy przycisk akcji po ID
   * @param buttonId ID przycisku
   * @param userId ID użytkownika (do weryfikacji uprawnień)
   * @returns Przycisk akcji
   */
  async getActionButtonById(buttonId: number, userId: number): Promise<ActionButton> {
    const button = await (actionButtonRepository as any).findById(buttonId);
    
    if (!button) {
      throw new Error('Przycisk akcji nie znaleziony');
    }
    
    // Sprawdź, czy przycisk należy do użytkownika
    if (button.user_id !== userId) {
      throw new Error('Brak dostępu do tego przycisku akcji');
    }
    
    return button;
  }

  /**
   * Tworzy nowy przycisk akcji
   * @param data Dane przycisku
   * @returns Utworzony przycisk
   */
  async createActionButton(data: ActionButtonCreateData): Promise<ActionButton> {
    // Inicjalizacja domyślnych wartości jeśli nie zostały podane
    data.default_values = data.default_values || {};
    
    // Dodaj przycisk do bazy danych
    return await (actionButtonRepository as any).create(data);
  }

  /**
   * Aktualizuje istniejący przycisk akcji
   * @param buttonId ID przycisku
   * @param data Nowe dane przycisku 
   * @returns Zaktualizowany przycisk
   */
  async updateActionButton(buttonId: number, data: ActionButtonUpdateData): Promise<ActionButton> {
    // Sprawdź czy przycisk istnieje i czy użytkownik ma do niego dostęp
    const button = await (actionButtonRepository as any).findById(buttonId);
    
    if (!button) {
      throw new Error('Przycisk akcji nie znaleziony');
    }
    
    // Sprawdź, czy przycisk należy do użytkownika
    if (button.user_id !== data.user_id) {
      throw new Error('Brak dostępu do tego przycisku akcji');
    }
    
    // Aktualizuj przycisk w bazie danych
    return await (actionButtonRepository as any).update(buttonId, data);
  }

  /**
   * Usuwa przycisk akcji
   * @param buttonId ID przycisku
   * @param userId ID użytkownika (do weryfikacji uprawnień)
   * @returns true jeśli usunięto pomyślnie
   */
  async deleteActionButton(buttonId: number, userId: number): Promise<boolean> {
    // Sprawdź czy przycisk istnieje i czy użytkownik ma do niego dostęp
    const button = await (actionButtonRepository as any).findById(buttonId);
    
    if (!button) {
      throw new Error('Przycisk akcji nie znaleziony');
    }
    
    // Sprawdź, czy przycisk należy do użytkownika
    if (button.user_id !== userId) {
      throw new Error('Brak dostępu do tego przycisku akcji');
    }
    
    // Usuń przycisk
    await (actionButtonRepository as any).delete(buttonId);
    return true;
  }
}

export default new ActionButtonService();