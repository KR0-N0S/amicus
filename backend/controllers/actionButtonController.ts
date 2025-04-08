import { Response, NextFunction } from 'express';
import actionButtonService from '../services/actionButtonService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';
import { ActionButton, ActionButtonCreateData } from '../types/models/actionButton';

// Typy dla danych, które będą używane lokalnie w tym pliku
interface ActionButtonResponse {
  status: string;
  results?: number;
  data: ActionButton | ActionButton[] | null;
}

// Pobierz wszystkie przyciski akcji użytkownika
export const getUserActionButtons: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    const actionButtons = await actionButtonService.getUserActionButtons(req.userId);
    
    res.status(200).json({
      status: 'success',
      results: actionButtons.length,
      data: actionButtons
    } as ActionButtonResponse);
  } catch (error) {
    next(error);
  }
};

// Pobierz pojedynczy przycisk akcji
export const getActionButton: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    const actionButton = await actionButtonService.getActionButtonById(
      parseInt(req.params.buttonId),
      req.userId
    );
    
    res.status(200).json({
      status: 'success',
      data: actionButton
    } as ActionButtonResponse);
  } catch (error) {
    next(error);
  }
};

// Utwórz nowy przycisk akcji – z poprawionym debugowaniem
export const createActionButton: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    console.log('Creating action button with user ID:', req.userId);
    console.log('Request body:', req.body);
    
    const data: ActionButtonCreateData = {
      ...req.body,
      user_id: req.userId
    };
    
    console.log('Data passed to service:', data);
    
    const button = await actionButtonService.createActionButton(data);
    console.log('Created button:', button);
    
    res.status(201).json({
      status: 'success',
      data: button
    } as ActionButtonResponse);
  } catch (error) {
    console.error('Error creating action button:', error);
    next(error);
  }
};

// Aktualizuj przycisk akcji – z poprawionym debugowaniem
export const updateActionButton: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    console.log('Updating action button with ID:', req.params.buttonId, 'for user ID:', req.userId);
    console.log('Request body:', req.body);
    
    req.body.user_id = req.userId;
    
    const actionButton = await actionButtonService.updateActionButton(
      parseInt(req.params.buttonId),
      req.body
    );
    
    res.status(200).json({
      status: 'success',
      data: actionButton
    } as ActionButtonResponse);
  } catch (error) {
    console.error('Error updating action button:', error);
    next(error);
  }
};

// Usuń przycisk akcji
export const deleteActionButton: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) return next(new AppError('User ID is missing', 400));
  try {
    await actionButtonService.deleteActionButton(
      parseInt(req.params.buttonId),
      req.userId
    );
    
    res.status(204).json({
      status: 'success',
      data: null
    } as ActionButtonResponse);
  } catch (error) {
    next(error);
  }
};