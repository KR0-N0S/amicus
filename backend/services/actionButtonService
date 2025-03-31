const actionButtonRepository = require('../repositories/actionButtonRepository');

class ActionButtonService {
  // Pobierz wszystkie przyciski akcji dla użytkownika
  async getUserActionButtons(userId) {
    return await actionButtonRepository.getUserActionButtons(userId);
  }
  
  // Pobierz pojedynczy przycisk akcji
  async getActionButtonById(id, userId) {
    const actionButton = await actionButtonRepository.getActionButtonById(id, userId);
    if (!actionButton) {
      throw new Error('Przycisk akcji nie został znaleziony');
    }
    return actionButton;
  }
  
  // Utwórz nowy przycisk akcji
  async createActionButton(data) {
    // Walidacja danych
    if (!data.name) {
      throw new Error('Nazwa przycisku jest wymagana');
    }
    
    if (!data.default_values || typeof data.default_values !== 'object') {
      throw new Error('Domyślne wartości muszą być obiektem');
    }
    
    return await actionButtonRepository.createActionButton(data);
  }
  
  // Aktualizuj istniejący przycisk akcji
  async updateActionButton(id, data) {
    // Sprawdź czy przycisk istnieje
    await this.getActionButtonById(id, data.user_id);
    
    // Walidacja danych
    if (!data.name) {
      throw new Error('Nazwa przycisku jest wymagana');
    }
    
    return await actionButtonRepository.updateActionButton(id, data);
  }
  
  // Usuń przycisk akcji
  async deleteActionButton(id, userId) {
    // Sprawdź czy przycisk istnieje
    await this.getActionButtonById(id, userId);
    
    return await actionButtonRepository.deleteActionButton(id, userId);
  }
}

module.exports = new ActionButtonService();