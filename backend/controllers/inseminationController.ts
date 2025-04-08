/**
 * Kontroler operacji na inseminacjach
 * @author KR0-N0S
 * @date 2025-04-08 15:59:04
 */

import { Response, NextFunction } from 'express';
import * as inseminationService from '../services/inseminationService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';

/**
 * Pobieranie pojedynczej inseminacji
 */
export const getInsemination: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const inseminationId = parseInt(req.params.id);
    const insemination = await (inseminationService as any).getInsemination(inseminationId);
    
    // Sprawdzenie czy inseminacja należy do zalogowanego użytkownika
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do tego wpisu inseminacji', 403));
    }

    res.status(200).json({
      status: 'success',
      data: insemination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pobieranie inseminacji dla konkretnego zwierzęcia
 */
export const getAnimalInseminations: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const animalId = parseInt(req.params.animalId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await (inseminationService as any).getAnimalInseminations(animalId, page, limit);
    
    // Tutaj można dodać sprawdzenie czy zwierzę należy do użytkownika
    // W tym przypadku zakładamy, że walidacja jest w serwisie

    res.status(200).json({
      status: 'success',
      data: {
        animal: result.animal,
        inseminations: result.inseminations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Pobieranie inseminacji dla zalogowanego użytkownika
 */
export const getUserInseminations: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.userId as number;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Obsługa filtrów
    const filters: Record<string, any> = {};
    if (req.query.startDate) filters.startDate = req.query.startDate as string;
    if (req.query.endDate) filters.endDate = req.query.endDate as string;
    if (req.query.animalId) filters.animalId = parseInt(req.query.animalId as string);
    
    const result = await (inseminationService as any).getOwnerInseminations(ownerId, page, limit, filters);

    res.status(200).json({
      status: 'success',
      data: result.inseminations,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Tworzenie nowej inseminacji
 */
export const createInsemination: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    // Przypisujemy inseminację do zalogowanego użytkownika
    const inseminationData = {
      animal_id: req.body.animal_id,
      certificate_number: req.body.certificate_number,
      file_number: req.body.file_number,
      procedure_number: req.body.procedure_number,
      re_insemination: req.body.re_insemination,
      procedure_date: req.body.procedure_date,
      herd_number: req.body.herd_number,
      herd_eval_number: req.body.herd_eval_number,
      dam_owner: req.body.dam_owner,
      ear_tag_number: req.body.ear_tag_number,
      last_calving_date: req.body.last_calving_date,
      name: req.body.name,
      bull_type: req.body.bull_type,
      supplier: req.body.supplier,
      inseminator: req.body.inseminator,
      symlek_status: req.body.symlek_status,
      symlek_responsibility: req.body.symlek_responsibility,
      owner_id: req.userId,
      bull_id: req.body.bull_id
    };

    const insemination = await (inseminationService as any).createInsemination(inseminationData);

    res.status(201).json({
      status: 'success',
      data: insemination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aktualizacja istniejącej inseminacji
 */
export const updateInsemination: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const inseminationId = parseInt(req.params.id);
    
    // Sprawdzamy, czy inseminacja należy do zalogowanego użytkownika
    const insemination = await (inseminationService as any).getInsemination(inseminationId);
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do edycji tego wpisu inseminacji', 403));
    }
    
    const inseminationData = {
      certificate_number: req.body.certificate_number,
      file_number: req.body.file_number,
      procedure_number: req.body.procedure_number,
      re_insemination: req.body.re_insemination,
      procedure_date: req.body.procedure_date,
      herd_number: req.body.herd_number,
      herd_eval_number: req.body.herd_eval_number,
      dam_owner: req.body.dam_owner,
      ear_tag_number: req.body.ear_tag_number,
      last_calving_date: req.body.last_calving_date,
      name: req.body.name,
      bull_type: req.body.bull_type,
      supplier: req.body.supplier,
      inseminator: req.body.inseminator,
      symlek_status: req.body.symlek_status,
      symlek_responsibility: req.body.symlek_responsibility,
      bull_id: req.body.bull_id
    };

    const updatedInsemination = await (inseminationService as any).updateInsemination(
      inseminationId, 
      inseminationData
    );

    res.status(200).json({
      status: 'success',
      data: updatedInsemination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Usuwanie inseminacji
 */
export const deleteInsemination: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const inseminationId = parseInt(req.params.id);
    
    // Sprawdzamy, czy inseminacja należy do zalogowanego użytkownika
    const insemination = await (inseminationService as any).getInsemination(inseminationId);
    if (insemination.owner_id !== req.userId) {
      return next(new AppError('Brak uprawnień do usunięcia tego wpisu inseminacji', 403));
    }

    await (inseminationService as any).deleteInsemination(inseminationId);

    res.status(200).json({
      status: 'success',
      message: 'Wpis inseminacji został usunięty'
    });
  } catch (error) {
    next(error);
  }
};