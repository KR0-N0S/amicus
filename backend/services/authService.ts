/**
 * Serwis uwierzytelniania
 * @author KR0-N0S1
 * @date 2025-04-09 17:18:30
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository';
import * as organizationRepository from '../repositories/organizationRepository';
import * as herdRepository from '../repositories/herdRepository';
import { User, UserCreateData } from '../types/models/user';
import { Organization, OrganizationRole } from '../types/models/organization';
import { Herd } from '../types/models/herd';
import {
  RegisterResult,
  LoginResult,
  TokenResult,
  UserProfileResult
} from '../types/services/authService';
import { SignOptions } from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import { withTransaction } from '../config/db';

// Używamy interfejsów bezpośrednio z repozytorium
import type { Herd as HerdType, HerdCreateData } from '../repositories/herdRepository';

class AuthService {
  /**
   * Rejestruje nowego użytkownika
   * @param userData Dane użytkownika
   * @param organizationData Opcjonalne dane organizacji do utworzenia
   * @param herdData Opcjonalne dane stada/gospodarstwa do utworzenia
   * @param addToOrganizationId Opcjonalne ID organizacji do której dodać użytkownika
   * @param userRole Rola użytkownika w dodawanej organizacji
   * @param skipTokenGeneration Czy pominąć generowanie tokenów JWT (optymalizacja)
   * @returns Dane zarejestrowanego użytkownika wraz z tokenami
   */
  async register(
    userData: UserCreateData, 
    organizationData: Partial<Organization> | null = null, 
    herdData: any | null = null, 
    addToOrganizationId: number | null = null, 
    userRole: string = 'client',
    skipTokenGeneration: boolean = false
  ): Promise<RegisterResult> {
    console.log('[AUTH_SERVICE] Rozpoczęcie rejestracji użytkownika:', userData.email);
    console.log('[AUTH_SERVICE] Dodanie do organizacji:', addToOrganizationId);
    
    // Wykonaj rejestrację w transakcji
    return withTransaction(async (client) => {
      // Sprawdź, czy użytkownik o takim emailu już istnieje
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('Użytkownik o takim adresie email już istnieje', 400);
      }

      // Sprawdź, czy podany numer stada już istnieje w systemie (jeśli podano)
      if (herdData) {
        // Ustalamy numer siedziby stada - używamy herd_id lub registration_number
        const herdId = herdData.herd_id || herdData.registration_number;
        if (herdId) {
          const checkExists = herdRepository.checkHerdRegistrationNumberExists;
          // Sprawdzamy czy funkcja istnieje i wywołujemy ją
          if (typeof checkExists === 'function') {
            const herdExists = await checkExists(herdId);
            if (herdExists) {
              throw new AppError('Gospodarstwo o podanym numerze rejestracyjnym już istnieje w systemie', 400);
            }
          } else {
            console.warn('[AUTH_SERVICE] Funkcja checkHerdRegistrationNumberExists nie jest dostępna');
          }
        }
      }

      // Hashuj hasło
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Zastąp hasło jawne hashem
      userData.password = hashedPassword;

      // Utwórz użytkownika
      const newUser = await userRepository.create(userData);
      console.log('[AUTH_SERVICE] Utworzono nowego użytkownika, ID:', newUser.id);

      let organizationResult: Organization | null = null;
      
      // Jeśli przekazano dane organizacji, utwórz ją i przypisz użytkownika jako administratora
      if (organizationData && organizationData.name) {
        console.log('[AUTH_SERVICE] Tworzenie organizacji:', organizationData.name);
        const newOrganization = await organizationRepository.create(organizationData as any);
        await organizationRepository.addUserToOrganization(newOrganization.id, newUser.id, 'owner');
        organizationResult = newOrganization;
        console.log('[AUTH_SERVICE] Utworzono organizację, ID:', newOrganization.id);
      }

      // Dodajemy obsługę tworzenia gospodarstwa rolnego
      let herdResult: HerdType | null = null;
      if (herdData) {
        // Ustalamy numer gospodarstwa - używamy herd_id lub registration_number
        const herdId = herdData.herd_id || herdData.registration_number;
        
        if (herdId) {
          console.log('[AUTH_SERVICE] Tworzenie gospodarstwa rolnego:', herdId);
          
          // Tworzymy obiekt dla gospodarstwa
          const herdToCreate = {
            owner_id: newUser.id,
            owner_type: 'user',
            herd_id: herdId,
            street: herdData.street,
            house_number: herdData.house_number,
            city: herdData.city,
            postal_code: herdData.postal_code,
            eval_herd_no: herdData.eval_herd_no || herdData.evaluation_number
          };
          
          // Bezpieczne wywołanie metody create z repozytorium
          const createHerd = herdRepository.create;
          if (typeof createHerd === 'function') {
            herdResult = await createHerd(herdToCreate as HerdCreateData);
            console.log(`[AUTH_SERVICE] Utworzono gospodarstwo, ID: ${herdResult?.id}`);
          } else {
            console.error('[AUTH_SERVICE] Funkcja create w herdRepository nie jest dostępna');
            throw new AppError('Błąd podczas tworzenia gospodarstwa', 500);
          }
        }
      }

      // Jeśli podano ID organizacji, do której należy dodać użytkownika, dodaj go
      if (addToOrganizationId) {
        try {
          console.log(`[AUTH_SERVICE] Dodawanie użytkownika ${newUser.id} do organizacji ${addToOrganizationId} z rolą ${userRole}`);
          await organizationRepository.addUserToOrganization(addToOrganizationId, newUser.id, userRole);
          console.log(`[AUTH_SERVICE] Użytkownik dodany do organizacji ${addToOrganizationId}`);
        } catch (linkError) {
          console.error('[AUTH_SERVICE] Błąd podczas dodawania użytkownika do organizacji:', linkError);
          throw new AppError('Nie udało się dodać użytkownika do organizacji', 500);
        }
      }

      // Pobierz wszystkie organizacje i role użytkownika (uwzględniając nowo dodane)
      let userOrganizations: OrganizationRole[] = [];
      if (organizationResult) {
        userOrganizations.push({ id: organizationResult.id, role: 'owner' });
      }
      
      // Jeśli użytkownik został dodany do organizacji, dodaj również tę informację
      if (addToOrganizationId) {
        // Sprawdź, czy ta organizacja już nie została dodana (aby uniknąć duplikatów)
        const alreadyAdded = userOrganizations.some(org => 
          org.id && org.id.toString() === addToOrganizationId.toString()
        );
        
        if (!alreadyAdded) {
          userOrganizations.push({ id: addToOrganizationId, role: userRole });
        }
      }

      // Generuj tokeny tylko jeśli nie wybrano opcji pomijania
      let accessToken = '';
      let refreshToken = '';
      
      if (!skipTokenGeneration) {
        const tokens = this.generateTokens(newUser.id, userOrganizations);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
      }

      return {
        user: newUser as User,
        organization: organizationResult,
        herd: herdResult as any,
        accessToken,
        refreshToken
      };
    });
  }

  /**
   * Logowanie użytkownika
   * @param email Email użytkownika
   * @param password Hasło
   * @returns Dane zalogowanego użytkownika z tokenami
   */
  async login(email: string, password: string): Promise<LoginResult> {
    console.log('[AUTH] Rozpoczęcie logowania dla:', email);
    
    try {
      // Znajdź użytkownika
      console.log('[AUTH] Szukanie użytkownika w bazie...');
      const user = await userRepository.findByEmail(email);
      
      if (!user) {
        console.log('[AUTH] ❌ Użytkownik nie znaleziony');
        throw new AppError('Nieprawidłowe dane logowania', 401);
      }
      
      console.log('[AUTH] ✅ Użytkownik znaleziony, ID:', user.id);

      // Sprawdź hasło
      console.log('[AUTH] Weryfikacja hasła...');
      const isPasswordValid = await bcrypt.compare(password, user.password || '');
      
      if (!isPasswordValid) {
        console.log('[AUTH] ❌ Nieprawidłowe hasło');
        throw new AppError('Nieprawidłowe dane logowania', 401);
      }
      
      console.log('[AUTH] ✅ Hasło zweryfikowane poprawnie');

      // Pobierz organizacje użytkownika wraz z rolami jednym zapytaniem
      console.log('[AUTH] Pobieranie organizacji użytkownika z rolami...');
      let organizations: Organization[] = [];
      let userOrganizationsWithRoles: OrganizationRole[] = [];
      
      try {
        // Używamy poprawionej metody
        organizations = await organizationRepository.getUserOrganizationsWithRoles(user.id);
        console.log('[AUTH] ✅ Pobrano organizacje z rolami:', organizations.length);
        
        // Przygotowanie danych o organizacjach z rolami do tokenu
        userOrganizationsWithRoles = organizations.map(org => ({
          id: org.id,
          role: org.role || 'user'
        }));
      } catch (orgError) {
        console.log('[AUTH] ⚠️ Błąd podczas pobierania organizacji:', (orgError as Error).message);
        // Kontynuuj mimo błędu organizacji
        organizations = [];
        userOrganizationsWithRoles = [];
      }

      // Generuj tokeny z uwzględnieniem organizacji i ról
      console.log('[AUTH] Generowanie tokenów JWT...');
      const { accessToken, refreshToken } = this.generateTokens(user.id, userOrganizationsWithRoles);
      console.log('[AUTH] ✅ Tokeny wygenerowane');

      // Usuń hasło z danych użytkownika przed zwróceniem
      const userToReturn = { ...user };
      delete userToReturn.password;
      
      console.log('[AUTH] 🎉 Logowanie zakończone sukcesem');
      return {
        user: userToReturn as Omit<User, 'password'>,
        organizations, // Teraz organizacje zawierają również role
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.log('[AUTH] ❌ Błąd podczas logowania:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Wystąpił błąd podczas logowania', 500);
    }
  }

  /**
   * Generuje tokeny JWT (access i refresh)
   * @param userId ID użytkownika
   * @param userOrganizations Lista organizacji użytkownika z rolami
   * @returns Tokeny dostępowe
   */
  generateTokens(userId: number, userOrganizations: OrganizationRole[] = []): TokenResult {
    const tokenPayload = {
      id: userId,
      // Dodajemy informacje o organizacjach i rolach do tokenu
      organizations: userOrganizations
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_ACCESS_SECRET || 'amicus_access_secret',
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m' } as SignOptions
    );
    
    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || 'amicus_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as SignOptions
    );
    
    return { accessToken, refreshToken };
  }

  /**
   * Stara metoda dla kompatybilności wstecznej
   * @param userId ID użytkownika
   * @returns Token dostępu
   */
  generateToken(userId: number): string {
    return this.generateTokens(userId).accessToken;
  }

  /**
   * Generuje token odświeżania
   * @param userId ID użytkownika
   * @returns Token odświeżania
   */
  generateRefreshToken(userId: number): string {
    return this.generateTokens(userId).refreshToken;
  }

  /**
   * Odświeża token dostępu na podstawie refresh tokenu
   * @param refreshToken Token odświeżania
   * @returns Nowe tokeny
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResult> {
    try {
      // Weryfikuj refresh token
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'amicus_refresh_secret'
      ) as { id: number; organizations: OrganizationRole[] };
      
      const userId = decoded.id;
      const userOrganizations = decoded.organizations || [];
      
      // Sprawdź czy użytkownik istnieje
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('Użytkownik nie znaleziony', 401);
      }
      
      // Generuj nowy access token z zachowaniem informacji o organizacjach i rolach
      const tokens = this.generateTokens(userId, userOrganizations);
      
      return tokens;
    } catch (error) {
      throw new AppError('Nieprawidłowy refresh token', 401);
    }
  }

  /**
   * Pobiera profil użytkownika wraz z organizacjami i uprawnieniami
   * @param userId - ID użytkownika
   * @returns Dane użytkownika wraz z organizacjami i uprawnieniami
   */
  async getUserProfile(userId: number): Promise<UserProfileResult> {
    try {
      // Pobierz podstawowe informacje o użytkowniku
      const user = await userRepository.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Pobieranie organizacji użytkownika
      const organizations = await organizationRepository.getUserOrganizationsWithRoles(userId);
      
      // Dodaj organizacje do obiektu użytkownika
      const userWithOrgs = {
        ...user,
        organizations: organizations.map(org => ({
          id: org.id,
          name: org.name || 'Unknown Organization',
          role: org.role,
          city: org.city,
          street: org.street,
          house_number: org.house_number
        }))
      };

      // Usuń hasło z obiektu użytkownika
      delete userWithOrgs.password;
      
      return {
        user: userWithOrgs as Omit<User, 'password'>,
        organizations
      };
    } catch (error) {
      console.error('[AUTH_SERVICE] Error in getUserProfile:', error);
      throw error;
    }
  }
  
  /**
   * Zmienia hasło użytkownika
   * @param userId ID użytkownika
   * @param currentPassword Aktualne hasło
   * @param newPassword Nowe hasło
   * @returns Informacja o powodzeniu operacji
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
    // Pobierz użytkownika
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Sprawdź aktualne hasło
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password || '');
    if (!isPasswordValid) {
      throw new AppError('Aktualne hasło jest nieprawidłowe', 401);
    }
    
    // Hashuj nowe hasło
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Aktualizuj hasło w bazie
    await userRepository.updatePassword(userId, hashedPassword);
    
    return { success: true };
  }

  /**
   * Resetuje hasło użytkownika na podstawie tokenu
   * @param resetToken Token resetowania
   * @param newPassword Nowe hasło
   * @returns Informacja o powodzeniu operacji
   */
  async resetPassword(resetToken: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      // Weryfikuj token
      const decoded = jwt.verify(
        resetToken,
        process.env.JWT_RESET_SECRET || 'amicus_reset_secret'
      ) as { id: number };
      
      const userId = decoded.id;
      
      // Pobierz użytkownika
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('Użytkownik nie znaleziony', 404);
      }
      
      // Hashuj nowe hasło
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Aktualizuj hasło w bazie
      await userRepository.updatePassword(userId, hashedPassword);
      
      return { success: true };
    } catch (error) {
      throw new AppError('Nieprawidłowy token resetowania hasła', 401);
    }
  }
  
  /**
   * Weryfikuje poprawność tokenu JWT
   * @param token Token do weryfikacji
   * @returns Zdekodowane dane z tokenu lub null
   */
  verifyToken(token: string): { id: number; organizations: OrganizationRole[] } | null {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'amicus_access_secret'
      ) as { id: number; organizations: OrganizationRole[] };
      
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();