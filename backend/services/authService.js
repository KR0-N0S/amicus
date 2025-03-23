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

    // Transakcję możemy dodać w przyszłości, jeśli potrzeba

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
    // Znajdź użytkownika
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Nieprawidłowe dane logowania');
    }

    // Sprawdź hasło
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Nieprawidłowe dane logowania');
    }

    // Pobierz organizacje użytkownika
    const organizations = await organizationRepository.getUserOrganizations(user.id);

    // Generuj token JWT
    const token = this.generateToken(user.id);

    // Usuń hasło z danych użytkownika przed zwróceniem
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      organizations,
      token
    };
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

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
}

module.exports = new AuthService();
