/**
 * Kontroler uwierzytelniania
 * @author KR0-N0S1
 * @date 2025-04-08 19:24:56
 */

import { Response, NextFunction, CookieOptions } from 'express';
import authService from '../services/authService';
import * as userRepository from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';
import { User, UserCreateData } from '../types/models/user';
import { Organization } from '../types/models/organization';
import { Herd } from '../types/models/herd';

// Interfejsy dla odpowiedzi
interface RegisterResponseData {
  user: User;
  organization: Organization | null;
  herd: Herd | null;
  token?: string;
}

interface LoginResponseData {
  user: Omit<User, 'password'>;
  organizations: Organization[];
  token: string;
}

interface TokenResponseData {
  token: string;
}

// Konfiguracja opcji cookies
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // tylko HTTPS w produkcji
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dni w milisekundach
};

export const register: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData: UserCreateData = {
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
    const addToOrganizationId: number | null = req.body.addToOrganizationId || null;
    const userRole: string = req.body.role || 'client'; // Domyślnie 'client', ale możemy przyjąć z req.body

    // Flaga zachowania bieżącej sesji
    const preserveCurrentSession: boolean = req.body.preserveCurrentSession === true;

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

    const responseData: RegisterResponseData = {
      user: result.user,
      organization: result.organization,
      herd: result.herd,
      // Zwracamy token tylko jeśli nie zachowujemy bieżącej sesji
      ...(preserveCurrentSession ? {} : { token: result.accessToken })
    };

    res.status(201).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

export const login: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
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

      const responseData: LoginResponseData = {
        user: result.user,
        organizations: result.organizations,
        token: result.accessToken // zwracamy tylko access token w odpowiedzi
      };

      return res.status(200).json({
        status: 'success',
        data: responseData
      });
    } catch (serviceError) {
      console.log('[CONTROLLER] ❌ Błąd z authService:', serviceError);
      return next(serviceError);
    }
  } catch (error) {
    console.log('[CONTROLLER] ⚠️ Nieoczekiwany błąd:', error);
    return next(error);
  }
};

export const getMe: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pobierz dane użytkownika
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Wymagane uwierzytelnienie'
      });
    }
    
    try {
      // Użyj authService do pobrania pełnych danych użytkownika wraz z organizacjami
      const result = await authService.getUserProfile(userId as number);
      
      // Ustaw organizationId w req jeśli użytkownik ma organizacje
      if (result.user.organizations && result.user.organizations.length > 0 && !req.organizationId) {
        req.organizationId = result.user.organizations[0].id;
        
        // Znajdź rolę użytkownika w organizacji
        const userOrg = result.user.organizations[0];
        if (userOrg.role) {
          req.userRoleInOrg = userOrg.role.toLowerCase();
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          user: result.user,
          organizations: result.organizations
        }
      });
    } catch (profileError) {
      console.error('[AUTH_CONTROLLER] Error fetching user profile:', profileError);
      
      // Fallback do podstawowych informacji o użytkowniku, jeśli wystąpił błąd
      const user = await userRepository.findById(userId as number);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'Nie znaleziono użytkownika'
        });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json({
        status: 'success',
        data: {
          user: userWithoutPassword,
          organizations: []
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Kontroler do odświeżania tokenu
export const refreshToken: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pobierz token z cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return next(new AppError('Brak refresh tokenu', 401));
    }

    // Odśwież token
    const tokens = await authService.refreshAccessToken(refreshToken);
    
    // Ustaw nowy refresh token w cookie
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    // Zwróć tylko access token
    const responseData: TokenResponseData = {
      token: tokens.accessToken
    };

    res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.clearCookie('refreshToken'); // usuń nieprawidłowy refresh token
    next(error);
  }
};

// Kontroler do wylogowywania
export const logout: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
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