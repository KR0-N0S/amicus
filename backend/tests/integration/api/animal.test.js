const request = require('supertest');
// Usunięto import jwt i APP_SECRET z tego poziomu, przeniesiono do fabryki mocka

// Mockowanie modułów
jest.mock('../../../app', () => {
  const express = require('express');
  const bodyParser = require('body-parser');
  // Importujemy jwt i APP_SECRET wewnątrz fabryki mocka
  const jwt = require('jsonwebtoken');
  const { APP_SECRET } = require('../../../config/constants');
  
  const app = express();
  
  app.use(bodyParser.json());
  
  // Mockowane middleware uwierzytelniania
  app.use((req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, APP_SECRET || 'test_secret');
        req.userId = decoded.id;
        req.userOrganizations = decoded.organizations || [];
        req.userRoleInOrg = decoded.role || 'admin';
        req.organizationId = decoded.organizationId || 1;
      } catch (err) {
        return res.status(401).json({ status: 'error', message: 'Nieprawidłowy token' });
      }
    } else {
      return res.status(401).json({ status: 'error', message: 'Brak tokenu autoryzacji' });
    }
    next();
  });
  
  // Dodanie tras dla zwierząt
  const animalRoutes = require('../../../routes/animalRoutes');
  app.use('/api/animals', animalRoutes);
  
  return app;
});

jest.mock('../../../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => next()
}));

jest.mock('../../../middleware/validator', () => ({
  animalValidator: (req, res, next) => next()
}));

jest.mock('../../../middleware/resourceAccessMiddleware', () => ({
  verifyResourceAccess: () => (req, res, next) => next()
}));

jest.mock('../../../services/animalService');
const animalService = require('../../../services/animalService');

// Import jwt i APP_SECRET ponownie, ale tylko dla użycia poza mockiem
const jwt = require('jsonwebtoken');
const { APP_SECRET } = require('../../../config/constants');

describe('Animal API Integration Tests', () => {
  let app;
  let authToken;
  
  beforeAll(() => {
    app = require('../../../app');
    
    // Wygeneruj testowy token JWT
    authToken = jwt.sign({ 
      id: 1, 
      email: 'test@example.com', 
      role: 'admin',
      organizationId: 1,
      organizations: [{ id: 1, name: 'Test Org', role: 'admin' }]
    }, APP_SECRET || 'test_secret');
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/animals/:id', () => {
    test('zwraca pojedyncze zwierzę gdy podano prawidłowe ID', async () => {
      // Arrange
      const mockAnimal = {
        id: 1,
        species: 'Cattle',
        animal_type: 'farm',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };
      
      animalService.getAnimal.mockResolvedValue(mockAnimal);
      
      // Act
      const response = await request(app)
        .get('/api/animals/1')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockAnimal);
      expect(animalService.getAnimal).toHaveBeenCalledWith('1');
    });
    
    test('zwraca 401 gdy nie podano tokenu autoryzacji', async () => {
      // Act
      const response = await request(app).get('/api/animals/1');
      
      // Assert
      expect(response.status).toBe(401);
      expect(animalService.getAnimal).not.toHaveBeenCalled();
    });
    
    test('przekazuje błędy z serwisu', async () => {
      // Arrange
      const mockError = new Error('Test error');
      mockError.statusCode = 404;
      mockError.message = 'Zwierzę nie znalezione';
      
      animalService.getAnimal.mockRejectedValue(mockError);
      
      // Act
      const response = await request(app)
        .get('/api/animals/999')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(404);
      expect(animalService.getAnimal).toHaveBeenCalledWith('999');
    });
  });
  
  describe('GET /api/animals', () => {
    test('zwraca listę zwierząt z organizacji', async () => {
      // Arrange
      const mockAnimals = [
        { id: 1, species: 'Cattle' },
        { id: 2, species: 'Dog' }
      ];
      
      const mockPagination = {
        page: 1,
        limit: 10,
        totalCount: 2,
        totalPages: 1
      };
      
      animalService.getOrganizationAnimals.mockResolvedValue({
        animals: mockAnimals,
        pagination: mockPagination
      });
      
      // Act
      const response = await request(app)
        .get('/api/animals')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockAnimals);
      expect(response.body.pagination).toEqual(mockPagination);
      expect(animalService.getOrganizationAnimals).toHaveBeenCalled();
    });
    
    test('używa wyszukiwania gdy podano odpowiednio długą frazę', async () => {
      // Arrange
      const mockResult = {
        animals: [{ id: 1, species: 'Cattle' }],
        pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 }
      };
      
      animalService.searchAnimalsByOrganizationId.mockResolvedValue(mockResult);
      
      // Act
      const response = await request(app)
        .get('/api/animals?search=cattle')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(animalService.searchAnimalsByOrganizationId).toHaveBeenCalledWith(
        'cattle', 1, undefined, 1, 10
      );
      expect(response.body.data).toEqual(mockResult.animals);
    });
    
    test('respektuje parametry paginacji', async () => {
      // Arrange
      const mockResult = {
        animals: [],
        pagination: { page: 2, limit: 5, totalCount: 0, totalPages: 1 }
      };
      
      animalService.getOrganizationAnimals.mockResolvedValue(mockResult);
      
      // Act
      const response = await request(app)
        .get('/api/animals?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(animalService.getOrganizationAnimals).toHaveBeenCalledWith(
        expect.anything(), 2, 5, undefined
      );
    });
  });
  
  describe('POST /api/animals', () => {
    test('tworzy nowe zwierzę i zwraca 201 Created', async () => {
      // Arrange
      const newAnimal = {
        species: 'Cattle',
        animal_type: 'farm',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };
      
      const createdAnimal = {
        id: 1,
        ...newAnimal
      };
      
      animalService.createAnimal.mockResolvedValue(createdAnimal);
      
      // Act
      const response = await request(app)
        .post('/api/animals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newAnimal);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(createdAnimal);
      expect(animalService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({
          species: 'Cattle',
          animal_type: 'farm'
        })
      );
    });
  });
  
  describe('PUT /api/animals/:id', () => {
    test('aktualizuje istniejące zwierzę', async () => {
      // Arrange
      const animalId = 1;
      const updateData = {
        species: 'Updated Species',
        farm_animal: {
          identifier: 'PL123456789'
        }
      };
      
      const existingAnimal = {
        id: animalId,
        animal_type: 'farm'
      };
      
      const updatedAnimal = {
        ...existingAnimal,
        species: 'Updated Species'
      };
      
      animalService.getAnimal.mockResolvedValue(existingAnimal);
      animalService.updateAnimal.mockResolvedValue(updatedAnimal);
      
      // Act
      const response = await request(app)
        .put(`/api/animals/${animalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(updatedAnimal);
      expect(animalService.updateAnimal).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          species: 'Updated Species',
          animal_type: 'farm'
        })
      );
    });
  });
  
  describe('DELETE /api/animals/:id', () => {
    test('usuwa zwierzę i zwraca komunikat sukcesu', async () => {
      // Arrange
      animalService.getAnimal.mockResolvedValue({ id: 1 });
      animalService.deleteAnimal.mockResolvedValue(true);
      
      // Act
      const response = await request(app)
        .delete('/api/animals/1')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Zwierzę zostało usunięte');
      expect(animalService.deleteAnimal).toHaveBeenCalledWith('1');
    });
  });
});