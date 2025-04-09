import * as animalController from '../../../controllers/animalController';
import * as animalService from '../../../services/animalService';
import { AppError } from '../../../middleware/errorHandler';
import { HTTP_STATUS, SEARCH, PAGINATION } from '../../../config/constants';
import { Request, Response, NextFunction } from 'express';

// Importujemy lub definiujemy interfejs RequestWithUser
interface RequestWithUser extends Request {
  userId?: number;
  organizationId?: number;
  userRoleInOrg?: string;
  userOrganizations?: Array<{ id: number; name: string; role: string }>;
}

// Interfejs dla mocka Response
interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
}

// Tworzymy interfejs dla mockowanych metod serwisu
interface AnimalServiceMethods {
  getAnimal: jest.Mock;
  getOrganizationAnimals: jest.Mock;
  searchAnimalsByOrganizationId: jest.Mock;
  searchAnimalsByOwnerId: jest.Mock;
  createAnimal: jest.Mock;
  updateAnimal: jest.Mock;
  deleteAnimal: jest.Mock;
}

// Mock serwisu zwierząt
jest.mock('../../../services/animalService');

// Rzutujemy mockowane serwisy do prawidłowego typu
const mockedAnimalService = animalService as unknown as AnimalServiceMethods;

describe('AnimalController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: jest.Mock;
  
  // Przygotowanie wspólnych obiektów przed każdym testem
  beforeEach(() => {
    // Mock obiektów req, res i next
    req = {
      params: {},
      query: {},
      body: {},
      userId: 10,
      organizationId: 5,
      userRoleInOrg: 'admin',
      userOrganizations: [{ id: 5, name: 'Test Org', role: 'admin' }]
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Resetowanie wszystkich mocków
    jest.clearAllMocks();
  });

  describe('getAnimal', () => {
    test('zwraca zwierzę gdy zostało znalezione', async () => {
      // Arrange
      const mockAnimal = { id: 1, species: 'Cattle' };
      req.params = { id: '1' };
      mockedAnimalService.getAnimal = jest.fn().mockResolvedValue(mockAnimal);
      
      // Act
      await animalController.getAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.getAnimal).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockAnimal
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    test('przekazuje błąd dalej gdy zwierzę nie zostało znalezione', async () => {
      // Arrange
      const mockError = new AppError('Zwierzę nie znalezione', HTTP_STATUS.NOT_FOUND);
      req.params = { id: '999' };
      mockedAnimalService.getAnimal = jest.fn().mockRejectedValue(mockError);
      
      // Act
      await animalController.getAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserAnimals', () => {
    test('pobiera zwierzęta z organizacji gdy nie ma frazy wyszukiwania', async () => {
      // Arrange
      const mockResult = {
        animals: [{ id: 1 }, { id: 2 }],
        pagination: { 
          page: 1, 
          limit: 10, 
          totalCount: 2, 
          totalPages: 1 
        }
      };
      req.query = { page: '1', limit: '10' };
      mockedAnimalService.getOrganizationAnimals = jest.fn().mockResolvedValue(mockResult);
      
      // Act
      await animalController.getUserAnimals(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.getOrganizationAnimals).toHaveBeenCalledWith(
        5, 1, 10, undefined
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult.animals,
        pagination: mockResult.pagination
      });
    });
    
    test('wyszukuje zwierzęta gdy podano wystarczająco długą frazę', async () => {
      // Arrange
      const mockResult = {
        animals: [{ id: 1 }],
        pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 }
      };
      req.query = { search: 'krowa', page: '1', limit: '10' };
      mockedAnimalService.searchAnimalsByOrganizationId = jest.fn().mockResolvedValue(mockResult);
      
      // Act
      await animalController.getUserAnimals(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.searchAnimalsByOrganizationId).toHaveBeenCalledWith(
        'krowa', 5, undefined, 1, 10
      );
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockResult.animals,
        pagination: mockResult.pagination
      });
    });
    
    test('używa zwykłego pobierania gdy fraza jest za krótka', async () => {
      // Arrange
      const mockResult = {
        animals: [{ id: 1 }, { id: 2 }],
        pagination: { page: 1, limit: 10, totalCount: 2, totalPages: 1 }
      };
      req.query = { search: 'kr', page: '1', limit: '10' }; // Za krótka fraza
      mockedAnimalService.getOrganizationAnimals = jest.fn().mockResolvedValue(mockResult);
      
      // Act
      await animalController.getUserAnimals(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.searchAnimalsByOrganizationId).not.toHaveBeenCalled();
      expect(mockedAnimalService.getOrganizationAnimals).toHaveBeenCalledWith(5, 1, 10, undefined);
    });
    
    test('używa searchAnimalsByOwnerId dla użytkownika z rolą client', async () => {
      // Arrange
      req.userRoleInOrg = 'client';
      req.userId = 10;
      req.query = { search: 'krowa' };
      const mockResult = {
        animals: [{ id: 1 }],
        pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 }
      };
      mockedAnimalService.searchAnimalsByOwnerId = jest.fn().mockResolvedValue(mockResult);
      
      // Act
      await animalController.getUserAnimals(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.searchAnimalsByOwnerId).toHaveBeenCalledWith(
        'krowa', 10, undefined, 1, 10
      );
    });
    
    test('obsługuje błędy i zwraca pusty wynik', async () => {
      // Arrange
      mockedAnimalService.getOrganizationAnimals = jest.fn().mockRejectedValue(new Error('Test error'));
      
      // Act
      await animalController.getUserAnimals(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: [],
        pagination: expect.any(Object)
      });
      expect(next).not.toHaveBeenCalled(); // Nie przekazuje błędu dalej
    });
    
    test('zwraca błąd gdy nie można określić organizacji', async () => {
      // Arrange
      req.organizationId = undefined;
      req.userOrganizations = [];
      
      // Act
      await animalController.getUserAnimals(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: expect.stringContaining('organizacji')
      });
    });
  });
  
  describe('createAnimal', () => {
    test('tworzy nowe zwierzę gospodarskie i zwraca 201 Created', async () => {
      // Arrange
      const animalData = {
        species: 'Cattle',
        animal_type: 'farm',
        owner_id: 5,
        farm_animal: {
          identifier: 'PL123456789'
        }
      };
      
      req.body = animalData;
      req.organizationId = 5;
      req.userId = 10;
      
      const createdAnimal = { 
        id: 1, 
        species: 'Cattle', 
        animal_type: 'farm',
        farm_animal: { identifier: 'PL123456789' }
      };
      
      mockedAnimalService.createAnimal = jest.fn().mockResolvedValue(createdAnimal);
      
      // Act
      await animalController.createAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 5,
          organization_id: 5,
          species: 'Cattle',
          animal_type: 'farm',
          farm_animal: expect.objectContaining({
            identifier: 'PL123456789'
          })
        })
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: createdAnimal
      });
    });
    
    test('używa userId jako owner_id gdy nie podano właściciela', async () => {
      // Arrange
      const animalData = {
        species: 'Dog',
        animal_type: 'companion',
        companion_animal: {
          chip_number: '123456789012345'
        }
      };
      
      req.body = animalData;
      req.userId = 10;
      
      const createdAnimal = { id: 1, ...animalData, owner_id: 10 };
      mockedAnimalService.createAnimal = jest.fn().mockResolvedValue(createdAnimal);
      
      // Act
      await animalController.createAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          owner_id: 10,
          species: 'Dog'
        })
      );
    });
    
    test('przenosi registration_date do farm_animal dla zwierząt gospodarskich', async () => {
      // Arrange
      const animalData = {
        species: 'Cattle',
        animal_type: 'farm',
        registration_date: '2025-01-15',
        farm_animal: {}
      };
      
      req.body = animalData;
      
      mockedAnimalService.createAnimal = jest.fn().mockResolvedValue({ id: 1 });
      
      // Act
      await animalController.createAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          farm_animal: expect.objectContaining({
            registration_date: '2025-01-15'
          })
        })
      );
    });
  });
  
  describe('updateAnimal', () => {
    test('aktualizuje zwierzę i przekazuje dane użytkownika', async () => {
      // Arrange
      const animalId = 1;
      const updateData = { 
        species: 'Updated Species',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };
      
      req.params = { id: '1' };
      req.body = updateData;
      req.userId = 10;
      
      const existingAnimal = { 
        id: animalId, 
        animal_type: 'farm',
        farm_animal: { identifier: 'PL123456789' } 
      };
      
      const updatedAnimal = { 
        ...existingAnimal,
        species: 'Updated Species'
      };
      
      mockedAnimalService.getAnimal = jest.fn().mockResolvedValue(existingAnimal);
      mockedAnimalService.updateAnimal = jest.fn().mockResolvedValue(updatedAnimal);
      
      // Act
      await animalController.updateAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.updateAnimal).toHaveBeenCalledWith(
        animalId,
        expect.objectContaining({
          species: 'Updated Species',
          animal_type: 'farm',  // Zachowanie typu z istniejącego zwierzęcia
          currentUserId: 10,
          farm_animal: expect.objectContaining({
            identifier: 'PL123456789'
          })
        })
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: updatedAnimal
      });
    });
    
    test('przekazuje błąd dalej gdy aktualizacja nie powiodła się', async () => {
      // Arrange
      const mockError = new AppError('Błąd aktualizacji', HTTP_STATUS.BAD_REQUEST);
      req.params = { id: '1' };
      req.body = { species: 'Updated' };
      
      mockedAnimalService.getAnimal = jest.fn().mockResolvedValue({ id: 1, animal_type: 'farm' });
      mockedAnimalService.updateAnimal = jest.fn().mockRejectedValue(mockError);
      
      // Act
      await animalController.updateAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteAnimal', () => {
    test('usuwa zwierzę i zwraca komunikat sukcesu', async () => {
      // Arrange
      const animalId = 1;
      req.params = { id: '1' };
      
      mockedAnimalService.getAnimal = jest.fn().mockResolvedValue({ id: animalId });
      mockedAnimalService.deleteAnimal = jest.fn().mockResolvedValue(true);
      
      // Act
      await animalController.deleteAnimal(req as RequestWithUser, res as unknown as Response, next);
      
      // Assert
      expect(mockedAnimalService.getAnimal).toHaveBeenCalledWith(animalId);
      expect(mockedAnimalService.deleteAnimal).toHaveBeenCalledWith(animalId);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Zwierzę zostało usunięte'
      });
    });
  });
});