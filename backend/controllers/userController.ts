/**
 * Kontroler profilu użytkownika
 * @author KR0-N0S
 * @date 2025-04-08 16:04:53
 */

import { Response, NextFunction } from 'express';
import * as userService from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';

interface UserProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
}

export const getProfile: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const result = await (userService as any).getUserProfile(req.userId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const userData: UserProfileData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      street: req.body.street,
      house_number: req.body.house_number,
      city: req.body.city,
      postal_code: req.body.postal_code,
      tax_id: req.body.tax_id
    };

    const updatedUser = await (userService as any).updateUserProfile(req.userId, userData);

    res.status(200).json({
      status: 'success',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return next(new AppError('Bieżące i nowe hasło są wymagane', 400));
    }

    await (userService as any).changePassword(req.userId, current_password, new_password);

    res.status(200).json({
      status: 'success',
      message: 'Hasło zostało zmienione'
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchQuery = req.query.query as string;
    const roles = req.query.roles as string;
    const organizationId = req.query.organizationId as string;
    
    if (!organizationId) {
      return next(new AppError('Brak wymaganego ID organizacji', 400));
    }
    
    const users = await (userService as any).searchUsers(searchQuery, roles, parseInt(organizationId));
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};