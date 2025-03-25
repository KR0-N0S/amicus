const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

exports.verifyToken = async (req, res, next) => {
  try {
    // Pobierz token z nagłówka Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Unauthorized: Token required', 
        code: 'TOKEN_REQUIRED'
      });
    }

    const token = authHeader.split(' ')[1];

    // Weryfikuj token
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_ACCESS_SECRET || 'amicus_access_secret'
      );
      
      // Zapisz ID użytkownika w obiekcie żądania
      req.userId = decoded.id;
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Unauthorized: Token expired', 
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid token', 
        code: 'INVALID_TOKEN'
      });
    }

    // Sprawdź, czy użytkownik istnieje
    const user = await userRepository.findById(req.userId);
    if (!user) {
      return res.status(401).json({ 
        message: 'Unauthorized: User not found', 
        code: 'USER_NOT_FOUND'
      });
    }

    // Dodaj obiekt użytkownika do żądania (bez hasła)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    next();
  } catch (error) {
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