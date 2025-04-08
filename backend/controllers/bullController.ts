import { Response, NextFunction } from 'express';
import * as bullService from '../services/bullService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';
import { 
  BullCreateData, 
  BullUpdateData, 
  BullFilters, 
  BullSorting, 
  PaginatedBullsResult 
} from '../types/models/bull';

export const getBull: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const bullId = parseInt(req.params.id);
    const bull = await (bullService as any).getBull(bullId);
    
    res.status(200).json({
      status: 'success',
      data: bull
    });
  } catch (error) {
    next(error);
  }
};

export const getBulls: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pobranie parametrów z zapytania
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const ownerId = req.query.owner_id ? parseInt(req.query.owner_id as string) : undefined;
    const userRoleInOrg = req.userRoleInOrg?.toLowerCase();
    
    // Filtry i sortowanie
    const filters: BullFilters = {
      bull_type: req.query.bull_type as string,
      breed: req.query.breed as string,
      owner_id: req.query.owner_id ? parseInt(req.query.owner_id as string) : undefined
    };
    
    const sorting: BullSorting = {
      field: req.query.sort_field as string || 'identification_number',
      direction: ((req.query.sort_direction as string)?.toUpperCase() as 'ASC' | 'DESC') || 'ASC'
    };
    
    // Bezpieczne pobieranie parametru wyszukiwania
    const searchTerm = req.query.search as string || '';
    const trimmedSearchTerm = searchTerm.trim();
    
    // Sprawdzenie czy fraza ma co najmniej 2 znaki - tylko wtedy stosujemy wyszukiwanie
    const hasValidSearchTerm = trimmedSearchTerm.length >= 2;
    
    // Pobranie organizationId z różnych źródeł
    let organizationId = req.organizationId;
    
    // Jeśli brak organizationId w req, próbujemy pobrać z user.organizations
    if (!organizationId && req.user && req.user.organizations && req.user.organizations.length > 0) {
      organizationId = parseInt(req.user.organizations[0].id.toString());
      // Zapisz na req dla ewentualnego dalszego użycia
      req.organizationId = organizationId;
      console.log(`[BULL_CONTROLLER] Pobrano organizationId z user.organizations: ${organizationId}`);
    }
    
    // Wybór strategii pobierania buhajów w zależności od roli, parametrów oraz frazy wyszukiwania
    let result: PaginatedBullsResult | undefined;
    
    // Używamy metod wyszukiwania tylko jeśli fraza ma co najmniej 2 znaki
    if (hasValidSearchTerm) {
      console.log(`[BULL_CONTROLLER] Wyszukiwanie buhajów dla frazy: "${trimmedSearchTerm}" (długość: ${trimmedSearchTerm.length})`);
      
      result = await (bullService as any).searchBulls(trimmedSearchTerm, filters, sorting, page, limit);
    } else {
      // Jeśli fraza jest krótsza niż 2 znaki, używamy standardowych metod pobierania
      if (trimmedSearchTerm.length > 0 && trimmedSearchTerm.length < 2) {
        console.log(`[BULL_CONTROLLER] Fraza wyszukiwania "${trimmedSearchTerm}" jest za krótka (min. 2 znaki). Pobieranie wszystkich danych.`);
      }
      
      if (ownerId) {
        result = await (bullService as any).getOwnerBulls(ownerId, page, limit);
      }
      else if (organizationId) {
        result = await (bullService as any).getOrganizationBulls(organizationId, page, limit);
      }
      else {
        return res.status(400).json({
          status: 'error',
          message: 'Nie można określić organizacji - proszę wybrać organizację'
        });
      }
    }

    // Zabezpieczenie przed undefined result
    if (!result) {
      result = { 
        bulls: [], 
        pagination: { 
          totalCount: 0, 
          totalPages: 0, 
          currentPage: page, 
          pageSize: limit 
        } 
      };
    }
    
    // Zabezpieczenie przed undefined bulls
    if (!result.bulls) {
      result.bulls = [];
    }
    
    // Zabezpieczenie przed undefined pagination
    if (!result.pagination) {
      result.pagination = { 
        totalCount: 0, 
        totalPages: 0, 
        currentPage: page, 
        pageSize: limit 
      };
    }

    // Dodajemy logowanie po bezpiecznym sprawdzeniu result
    console.log(`[BULL_CONTROLLER] Pobrano ${result.bulls.length} buhajów`);

    res.status(200).json({
      status: 'success',
      data: result.bulls,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[BULL_CONTROLLER] Błąd podczas pobierania buhajów:', error);
    next(error);
  }
};

export const createBull: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      throw new AppError('User ID is required', 400);
    }
    
    // Przygotowujemy dane buhaja
    const bullData: BullCreateData & { veterinary_number?: string } = {
      name: req.body.name,
      identification_number: req.body.identification_number,
      veterinary_number: req.body.veterinary_number,
      breed: req.body.breed,
      bull_type: req.body.bull_type,
      owner_id: req.body.owner_id || req.userId,
      birth_date: req.body.birth_date,
      organization_id: req.body.organization_id,
      availability: req.body.availability,
      photo: req.body.photo,
      description: req.body.description
    };

    // Jeśli próbujemy dodać buhaja dla innego użytkownika, sprawdź uprawnienia
    if (bullData.owner_id !== req.userId) {
      // Tutaj można dodać logikę sprawdzania uprawnień
    }

    const bull = await (bullService as any).createBull(bullData);

    res.status(201).json({
      status: 'success',
      data: bull
    });
  } catch (error) {
    next(error);
  }
};

export const updateBull: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const bullId = parseInt(req.params.id);
    
    // Sprawdzamy, czy buhaj istnieje
    const bull = await (bullService as any).getBull(bullId);
    
    // Przygotowujemy dane do aktualizacji
    const bullData: BullUpdateData = {
      name: req.body.name,
      identification_number: req.body.identification_number,
      veterinary_number: req.body.veterinary_number,
      breed: req.body.breed,
      bull_type: req.body.bull_type,
      birth_date: req.body.birth_date,
      availability: req.body.availability,
      photo: req.body.photo,
      description: req.body.description
    };

    // Usuwamy undefined wartości
    Object.keys(bullData).forEach(key => 
      (bullData as any)[key] === undefined && delete (bullData as any)[key]
    );

    const updatedBull = await (bullService as any).updateBull(bullId, bullData);

    res.status(200).json({
      status: 'success',
      data: updatedBull
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBull: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const bullId = parseInt(req.params.id);
    
    await (bullService as any).deleteBull(bullId);

    res.status(200).json({
      status: 'success',
      message: 'Buhaj został usunięty'
    });
  } catch (error) {
    next(error);
  }
};

export const getBullStats: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const bullId = parseInt(req.params.id);
    const stats = await (bullService as any).getBullStats(bullId);
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getBullDeliveries: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const bullId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const deliveries = await (bullService as any).getBullDeliveries(bullId, page, limit);
    
    res.status(200).json({
      status: 'success',
      data: deliveries
    });
  } catch (error) {
    next(error);
  }
};

export const getBullInseminations: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const bullId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const inseminations = await (bullService as any).getBullInseminations(bullId, page, limit);
    
    res.status(200).json({
      status: 'success',
      data: inseminations
    });
  } catch (error) {
    next(error);
  }
};