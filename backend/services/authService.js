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

    // Generuj tokeny
    const { accessToken, refreshToken } = this.generateTokens(newUser.id);

    return {
      user: newUser,
      organization: organizationResult,
      accessToken,
      refreshToken
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

      // Generuj tokeny
      console.log('[AUTH] Generowanie tokenów JWT...');
      const { accessToken, refreshToken } = this.generateTokens(user.id);
      console.log('[AUTH] ✅ Tokeny wygenerowane');

      // Usuń hasło z danych użytkownika przed zwróceniem
      const userToReturn = { ...user };
      delete userToReturn.password;
      
      console.log('[AUTH] 🎉 Logowanie zakończone sukcesem');
      return {
        user: userToReturn,
        organizations,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.log('[AUTH] ❌ Błąd podczas logowania:', error.message);
      throw error;
    }
  }

  // Nowa metoda generująca dwa tokeny
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { id: userId },
      process.env.JWT_ACCESS_SECRET || 'amicus_access_secret',
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m' } // krótki czas życia (30 min)
    );
    
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET || 'amicus_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } // długi czas życia (7 dni)
    );
    
    return { accessToken, refreshToken };
  }

  // Stara metoda dla kompatybilności wstecznej
  generateToken(userId) {
    return this.generateTokens(userId).accessToken;
  }

  // Nowa metoda do odświeżania access tokenu
  async refreshAccessToken(refreshToken) {
    try {
      // Weryfikuj refresh token
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'amicus_refresh_secret'
      );
      
      const userId = decoded.id;
      
      // Sprawdź czy użytkownik istnieje
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('Użytkownik nie znaleziony');
      }
      
      // Generuj nowy access token
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(userId);
      
      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Nieprawidłowy refresh token');
    }
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