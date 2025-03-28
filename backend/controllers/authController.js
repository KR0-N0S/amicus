const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

// Konfiguracja opcji cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // tylko HTTPS w produkcji
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dni w milisekundach
};

exports.register = async (req, res, next) => {
  try {
    const userData = {
      email: req.body.email,
      password: req.body.password,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const organizationData = req.body.organization || null;
    const herdData = req.body.herd || null;
    
    // Dodajemy obsługę przypisania do organizacji
    const addToOrganizationId = req.body.addToOrganizationId || null;
    const userRole = req.body.role || 'client'; // Domyślnie 'client', ale możemy przyjąć z req.body

    // KLUCZOWA ZMIANA: Dodanie obsługi flagi zachowania bieżącej sesji
    const preserveCurrentSession = req.body.preserveCurrentSession === true;

    // Przekazujemy dodatkowe parametry do serwisu
    const result = await authService.register(
      userData, 
      organizationData, 
      herdData, 
      addToOrganizationId, 
      userRole
    );

    // Dodajemy refresh token do httpOnly cookie tylko jeśli nie zachowujemy bieżącej sesji
    if (!preserveCurrentSession) {
      res.cookie('refreshToken', result.refreshToken, cookieOptions);
    }

    res.status(201).json({
      status: 'success',
      data: {
        user: result.user,
        organization: result.organization,
        herd: result.herd,
        // KLUCZOWA ZMIANA: Zwracamy token tylko jeśli nie zachowujemy bieżącej sesji
        ...(preserveCurrentSession ? {} : { token: result.accessToken })
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log('[CONTROLLER] Rozpoczęcie procesu logowania');
    console.log('[CONTROLLER] Dane z żądania:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('[CONTROLLER] ❌ Brak email lub hasła');
      return next(new AppError('Email i hasło są wymagane', 400));
    }

    try {
      console.log('[CONTROLLER] Wywołanie authService.login...');
      const result = await authService.login(email, password);
      console.log('[CONTROLLER] ✅ Logowanie zakończone sukcesem');
      
      // Dodajemy refresh token do httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      return res.status(200).json({
        status: 'success',
        data: {
          user: result.user,
          organizations: result.organizations,
          token: result.accessToken // zwracamy tylko access token w odpowiedzi
        }
      });
    } catch (serviceError) {
      console.log('[CONTROLLER] ❌ Błąd z authService:', serviceError.message);
      return next(new AppError('Nieprawidłowe dane logowania', 401));
    }
  } catch (error) {
    console.log('[CONTROLLER] ⚠️ Nieoczekiwany błąd:', error.message);
    return next(new AppError('Wystąpił błąd podczas logowania', 500));
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const result = await authService.getUserProfile(req.userId);

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        organizations: result.organizations
      }
    });
  } catch (error) {
    next(error);
  }
};

// Nowy kontroler do odświeżania tokenu
exports.refreshToken = async (req, res, next) => {
  try {
    // Pobierz token z cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Brak refresh tokenu', 401));
    }

    // Odśwież token
    const tokens = await authService.refreshAccessToken(refreshToken);
    
    // Ustaw nowy refresh token w cookie
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    // Zwróć tylko access token
    res.status(200).json({
      status: 'success',
      data: {
        token: tokens.accessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.clearCookie('refreshToken'); // usuń nieprawidłowy refresh token
    return next(new AppError('Refresh token jest nieprawidłowy lub wygasł', 401));
  }
};

// Nowy kontroler do wylogowywania
exports.logout = async (req, res, next) => {
  try {
    // Usuń refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Wylogowano pomyślnie'
    });
  } catch (error) {
    next(error);
  }
};