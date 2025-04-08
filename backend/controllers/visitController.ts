/**
 * Kontroler wizyt
 * @author KR0-N0S
 * @date 2025-04-08 16:04:53
 */

import { Response, NextFunction } from 'express';
import * as visitService from '../services/visitService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';

interface VisitData {
  farmer_id?: number;
  vet_id?: number;
  visit_date?: Date | string;
  description?: string;
  status?: string;
  employee_id?: number;
  channel?: string;
}

/**
 * Pobieranie pojedynczej wizyty
 */
export const getVisit: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const visitId = parseInt(req.params.id);
    const visit = await (visitService as any).getVisit(visitId);
    
    // Sprawdzenie czy wizyta dotyczy zalogowanego użytkownika
    // Może być farmerId, vetId lub employeeId
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tej wizyty', 403));
    }

    res.status(200).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pobieranie wizyt rolnika/farmera
 */
export const getFarmerVisits: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const farmerId = req.userId; // Pobieramy wizyty zalogowanego użytkownika
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await (visitService as any).getFarmerVisits(farmerId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result.visits,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pobieranie wizyt weterynarza
 */
export const getVetVisits: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const vetId = req.userId; // Pobieramy wizyty zalogowanego weterynarza
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await (visitService as any).getVetVisits(vetId, page, limit);

    res.status(200).json({
      status: 'success',
      data: result.visits,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tworzenie nowej wizyty
 */
export const createVisit: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const visitData: VisitData = {
      farmer_id: parseInt(req.body.farmer_id),
      vet_id: parseInt(req.body.vet_id),
      visit_date: req.body.visit_date,
      description: req.body.description,
      status: req.body.status || 'Scheduled',
      employee_id: req.body.employee_id ? parseInt(req.body.employee_id) : undefined,
      channel: req.body.channel
    };

    const visit = await (visitService as any).createVisit(visitData);

    res.status(201).json({
      status: 'success',
      data: visit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualizacja istniejącej wizyty
 */
export const updateVisit: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const visitId = parseInt(req.params.id);
    
    // Sprawdzamy, czy wizyta dotyczy zalogowanego użytkownika
    const visit = await (visitService as any).getVisit(visitId);
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tej wizyty', 403));
    }
    
    const visitData: VisitData = {
      visit_date: req.body.visit_date,
      description: req.body.description,
      status: req.body.status,
      vet_id: req.body.vet_id ? parseInt(req.body.vet_id) : undefined,
      employee_id: req.body.employee_id ? parseInt(req.body.employee_id) : undefined,
      channel: req.body.channel
    };

    const updatedVisit = await (visitService as any).updateVisit(visitId, visitData);

    res.status(200).json({
      status: 'success',
      data: updatedVisit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Usuwanie wizyty
 */
export const deleteVisit: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('Brak identyfikatora użytkownika', 401));
    }

    const visitId = parseInt(req.params.id);
    
    // Sprawdzamy, czy wizyta dotyczy zalogowanego użytkownika
    const visit = await (visitService as any).getVisit(visitId);
    if (visit.farmer_id !== req.userId && visit.vet_id !== req.userId && visit.employee_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tej wizyty', 403));
    }

    await (visitService as any).deleteVisit(visitId);

    res.status(200).json({
      status: 'success',
      message: 'Wizyta została usunięta'
    });
  } catch (error) {
    next(error);
  }
};