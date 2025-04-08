import { Response, NextFunction } from 'express';
import organizationService from '../services/organizationService';
import { AppError } from '../middleware/errorHandler';
import { RequestWithUser, ControllerFunction } from '../types/express';
import { Organization } from '../types/models/organization';

interface OrganizationResponse {
  status: string;
  data: Organization | Organization[] | any;
  message?: string;
}

export const getOrganization: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('User ID is missing', 400));
    }

    const organizationId = parseInt(req.params.id);
    
    // Sprawdź czy użytkownik ma dostęp do tej organizacji
    const hasAccess = await organizationService.checkUserPermission(organizationId, req.userId);
    if (!hasAccess) {
      return next(new AppError('Brak dostępu do tej organizacji', 403));
    }
    
    const organization = await organizationService.getOrganization(organizationId);

    res.status(200).json({
      status: 'success',
      data: organization
    } as OrganizationResponse);
  } catch (error) {
    next(error);
  }
};

export const createOrganization: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('User ID is missing', 400));
    }

    const organizationData: Partial<Organization> = {
      name: req.body.name,
      address: req.body.street, // Przystosowanie nazw pól
      city: req.body.city,
      postal_code: req.body.postal_code
    };

    if (req.body.tax_id) {
      organizationData.tax_id = req.body.tax_id;
    }

    const organization = await organizationService.createOrganization(organizationData, req.userId);

    res.status(201).json({
      status: 'success',
      data: organization
    } as OrganizationResponse);
  } catch (error) {
    next(error);
  }
};

export const getUserOrganizations: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('User ID is missing', 400));
    }

    const organizations = await organizationService.getUserOrganizations(req.userId);

    res.status(200).json({
      status: 'success',
      data: organizations
    } as OrganizationResponse);
  } catch (error) {
    next(error);
  }
};

export const addUserToOrganization: ControllerFunction = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return next(new AppError('User ID is missing', 400));
    }

    const organizationId: number = parseInt(req.body.organizationId);
    const userId: number = parseInt(req.body.userId);
    const role: string = req.body.role || 'member';
    
    // Sprawdź czy użytkownik jest administratorem organizacji
    const isAdmin = await organizationService.checkUserPermission(organizationId, req.userId, 'admin');
    if (!isAdmin) {
      return next(new AppError('Tylko administrator może dodawać użytkowników do organizacji', 403));
    }
    
    const result = await organizationService.addUserToOrganization(organizationId, userId, role);

    res.status(201).json({
      status: 'success',
      data: result
    } as OrganizationResponse);
  } catch (error) {
    next(error);
  }
};