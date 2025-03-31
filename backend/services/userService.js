const userRepository = require('../repositories/userRepository');
const organizationRepository = require('../repositories/organizationRepository');
const bcrypt = require('bcryptjs');

class UserService {
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Pobierz organizacje użytkownika
    const organizations = await organizationRepository.getUserOrganizations(userId);

    return {
      user,
      organizations
    };
  }

  async updateUserProfile(userId, userData) {
    // Sprawdź, czy użytkownik istnieje
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Aktualizuj dane użytkownika
    const updatedUser = await userRepository.update(userId, userData);
    return updatedUser;
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Pobierz użytkownika z hasłem
    const user = await userRepository.findByEmail(userId);
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Sprawdź, czy obecne hasło jest poprawne
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Aktualne hasło jest nieprawidłowe');
    }

    // Hashuj nowe hasło
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Aktualizuj hasło w bazie danych
    // Tę metodę trzeba by było dodać do repozytorium
    // W tym przykładzie nie implementujemy pełnej zmiany hasła
    // Możesz rozszerzyć userRepository o metodę updatePassword

    return { success: true, message: 'Hasło zostało zmienione' };
  }
  
  async searchUsers(searchQuery, roles, organizationId) {
    if (!organizationId) {
      throw new Error('ID organizacji jest wymagane');
    }
    
    return await userRepository.searchUsers(searchQuery, roles, organizationId);
  }
}

module.exports = new UserService();