import { Response, NextFunction } from 'express';
import keyService from '../services/keyService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';
import { Key } from '../types/models/key';

interface KeyResponse {
  status: string;
  data?: Key | null;
  message?: string;
}

export const getUserKey: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('User ID is missing', 400));
    }

    const key = await keyService.getUserKey(req.userId);
    
    if (!key) {
      return res.status(404).json({
        status: 'fail',
        message: 'Klucz nie znaleziony'
      } as KeyResponse);
    }

    res.status(200).json({
      status: 'success',
      data: key
    } as KeyResponse);
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateUserKey: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('User ID is missing', 400));
    }

    const { public_key, backup_encrypted_private_key } = req.body;
    
    if (!public_key) {
      return next(new AppError('Klucz publiczny jest wymagany', 400));
    }
    
    const keyData = {
      public_key,
      backup_encrypted_private_key
    };
    
    const key = await keyService.createOrUpdateUserKey(req.userId, keyData);

    res.status(200).json({
      status: 'success',
      data: key
    } as KeyResponse);
  } catch (error) {
    next(error);
  }
};