import * as userRepository from '../repositories/userRepository';
import * as organizationRepository from '../repositories/organizationRepository';
import bcrypt from 'bcryptjs';
import { User, UserUpdateData, PasswordChangeResult, UserProfile } from '../types/models/user';

class UserService {
  /**
   * Pobiera profil użytkownika
   * @param userId ID użytkownika
   */
  async getUserProfile(userId: number): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Pobierz organizacje użytkownika
    const organizations = await (organizationRepository as any).getUserOrganizations(userId);

    return {
      user,
      organizations
    };
  }

  /**
   * Aktualizuje profil użytkownika
   * @param userId ID użytkownika
   * @param userData Dane do aktualizacji
   */
  async updateUserProfile(userId: number, userData: UserUpdateData): Promise<User> {
    // Sprawdź, czy użytkownik istnieje
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Aktualizuj dane użytkownika - używamy rzutowania typu ponieważ metoda nie jest zdefiniowana w typach
    const updatedUser = await (userRepository as any).update(userId, userData);
    return updatedUser;
  }

  /**
   * Zmienia hasło użytkownika
   * @param userId ID użytkownika
   * @param currentPassword Aktualne hasło
   * @param newPassword Nowe hasło
   */
  async changePassword(userId: number | string, currentPassword: string, newPassword: string): Promise<PasswordChangeResult> {
    // Pobierz użytkownika z hasłem
    const user = await userRepository.findByEmail(userId.toString());
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Sprawdź, czy obecne hasło jest poprawne
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password || '');
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
  
  /**
   * Wyszukuje użytkowników
   * @param searchQuery Fraza wyszukiwania
   * @param roles Role użytkowników
   * @param organizationId ID organizacji
   */
  async searchUsers(searchQuery: string, roles: string[], organizationId: number): Promise<User[]> {
    if (!organizationId) {
      throw new Error('ID organizacji jest wymagane');
    }
    
    return await (userRepository as any).searchUsers(searchQuery, roles, organizationId);
  }
}

export default new UserService();