const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const organizationRepository = require('../repositories/organizationRepository');

class AuthService {
  async register(userData, organizationData = null) {
    // Sprawdź, czy użytkownik o takim emailu już istnieje
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Użytkownik o takim adresie email już istnieje');
    }

    // Hashuj hasło
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Zastąp hasło jawne hashem
    userData.password = hashedPassword;

    // Utwórz użytkownika
    const newUser = await userRepository.create(userData);

    let organizationResult = null;
    
    // Jeśli przekazano dane organizacji, utwórz ją i przypisz użytkownika jako administratora
    if (organizationData && organizationData.name) {
      const newOrganization = await organizationRepository.create(organizationData);
      await organizationRepository.addUserToOrganization(newOrganization.id, newUser.id, 'admin');
      organizationResult = newOrganization;
    }

    // Generuj token JWT
    const token = this.generateToken(newUser.id);

    return {
      user: newUser,
      organization: organizationResult,
      token
    };
  }

  async login(email, password) {
    console.log('[AUTH] Rozpoczęcie logowania dla:', email);
    
    try {
      // Znajdź użytkownika
      console.log('[AUTH] Szukanie użytkownika w bazie...');
      const user = await userRepository.findByEmail(email);
      
      if (!user) {
        console.log('[AUTH] ❌ Użytkownik nie znaleziony');
        throw new Error('Nieprawidłowe dane logowania');
      }
      
      console.log('[AUTH] ✅ Użytkownik znaleziony, ID:', user.id);

      // Sprawdź hasło
      console.log('[AUTH] Weryfikacja hasła...');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log('[AUTH] ❌ Nieprawidłowe hasło');
        throw new Error('Nieprawidłowe dane logowania');
      }
      
      console.log('[AUTH] ✅ Hasło zweryfikowane poprawnie');

      // Pobierz organizacje użytkownika
      console.log('[AUTH] Pobieranie organizacji użytkownika...');
      let organizations = [];
      try {
        organizations = await organizationRepository.getUserOrganizations(user.id);
        console.log('[AUTH] ✅ Pobrano organizacje:', organizations.length);
      } catch (orgError) {
        console.log('[AUTH] ⚠️ Błąd podczas pobierania organizacji:', orgError.message);
        // Kontynuuj mimo błędu organizacji
        organizations = [];
      }

      // Generuj token JWT
      console.log('[AUTH] Generowanie tokenu JWT...');
      const token = this.generateToken(user.id);
      console.log('[AUTH] ✅ Token wygenerowany');

      // Usuń hasło z danych użytkownika przed zwróceniem
      const userToReturn = { ...user };
      delete userToReturn.password;
      
      console.log('[AUTH] 🎉 Logowanie zakończone sukcesem');
      return {
        user: userToReturn,
        organizations,
        token
      };
    } catch (error) {
      console.log('[AUTH] ❌ Błąd podczas logowania:', error.message);
      throw error;
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'amicus_default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Użytkownik nie znaleziony');
    }

    // Pobierz organizacje użytkownika
    const organizations = await organizationRepository.getUserOrganizations(userId);

    // Usuń hasło z obiektu użytkownika
    const userToReturn = { ...user };
    delete userToReturn.password;
    
    return {
      user: userToReturn,
      organizations
    };
  }
}

module.exports = new AuthService();
