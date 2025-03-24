const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

exports.verifyToken = async (req, res, next) => {
  try {
    // Pobierz token z nagłówka Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Brak tokenu uwierzytelniającego' });
    }

    const token = authHeader.split(' ')[1];

    // Weryfikuj token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Zapisz ID użytkownika w obiekcie żądania
    req.userId = decoded.id;

    // Sprawdź, czy użytkownik istnieje
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy token' });
    }

    // Dodaj obiekt użytkownika do żądania (bez hasła)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Nieprawidłowy token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token wygasł' });
    }
    return res.status(500).json({ message: 'Błąd serwera' });
  }
};

exports.checkOrganizationAccess = async (req, res, next) => {
  try {
    // Przygotowanie dla przyszłych rozszerzeń - sprawdzanie uprawnień organizacji
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Błąd serwera' });
  }
};
