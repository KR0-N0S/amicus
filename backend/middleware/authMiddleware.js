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
      
      // Zapisz informacje o organizacjach i rolach
      req.userOrganizations = decoded.organizations || [];
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
    req.user = {
      ...userWithoutPassword,
      organizations: req.userOrganizations
    };

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Błąd serwera' });
  }
};

exports.checkOrganizationAccess = async (req, res, next) => {
  try {
    // Pobierz identyfikator organizacji z parametrów, zapytania lub ciała żądania
    const organizationId = req.params.organizationId || req.query.organizationId || req.body.organizationId;
    
    // Jeśli nie podano identyfikatora organizacji, przepuść dalej
    // (może być potrzebne dla endpointów niespecyficznych dla organizacji)
    if (!organizationId) {
      return next();
    }
    
    // Sprawdź, czy użytkownik ma organizacje
    if (!req.userOrganizations || req.userOrganizations.length === 0) {
      return res.status(403).json({ 
        message: 'Brak dostępu do tej organizacji', 
        code: 'NO_ORGANIZATIONS'
      });
    }
    
    // Sprawdź, czy użytkownik należy do tej organizacji (konwertujemy string na number jeśli potrzeba)
    const userBelongsToOrg = req.userOrganizations.some(
      org => org.id === parseInt(organizationId, 10) || org.id === organizationId
    );
    
    if (!userBelongsToOrg) {
      return res.status(403).json({ 
        message: 'Brak dostępu do tej organizacji', 
        code: 'ORGANIZATION_ACCESS_DENIED'
      });
    }
    
    // Opcjonalnie: sprawdź konkretne uprawnienia dla danej organizacji na podstawie ścieżki
    const adminPaths = ['/admin', '/settings', '/users/manage'];
    const medicalPaths = ['/medical', '/insemination', '/visit', '/animals'];
    
    let requiredRoles = [];
    
    // Sprawdź, czy ścieżka wymaga specjalnych uprawnień
    if (adminPaths.some(path => req.path.includes(path))) {
      requiredRoles = ['owner', 'superadmin', 'admin', 'officestaff'];
    } else if (medicalPaths.some(path => req.path.includes(path))) {
      requiredRoles = ['owner', 'superadmin', 'admin', 'vet', 'vettech', 'inseminator'];
    }
    
    // Jeśli zdefiniowano wymagane role, sprawdź uprawnienia
    if (requiredRoles.length > 0) {
      const hasRequiredRole = req.userOrganizations.some(org => {
        return (org.id === parseInt(organizationId, 10) || org.id === organizationId) && 
               org.role && 
               requiredRoles.includes(org.role.toLowerCase());
      });
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          message: 'Brak wymaganych uprawnień w tej organizacji', 
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
    }
    
    // Zapisz identyfikator organizacji w obiekcie żądania do dalszego użytku
    req.organizationId = organizationId;
    
    next();
  } catch (error) {
    console.error('Error in checkOrganizationAccess middleware:', error);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
};