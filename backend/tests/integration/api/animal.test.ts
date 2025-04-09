/**
 * Testy integracyjne dla API zarządzania zwierzętami
 * @author KR0-N0S1
 * @date 2025-04-09 11:18:30
 */

import { TestApi } from '../../../utils/testApi';
import * as animalRepository from '../../../repositories/animalRepository';
import * as organizationRepository from '../../../repositories/organizationRepository';
import { Animal, AnimalType } from '../../../types/models/animal';
import { OrganizationWithRole } from '../../../types/models/organization';

// Tworzymy rozszerzone typy dla mockowanych danych
interface MockAnimal extends Partial<Animal> {
  id: number;
  name?: string;
  species?: string;
  organization_id: number;
  client_id?: number;
  breed?: string;
  birth_date?: Date;
}

// Mockowanie repozytoriów
jest.mock('../../../repositories/animalRepository');
jest.mock('../../../repositories/organizationRepository');

// Przygotowanie mocków dla metod repozytorium zwierząt
const mockedAnimalRepo = animalRepository as jest.Mocked<typeof animalRepository> & {
  getAllByOrganizationId: jest.Mock;
  getById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
};

// Dodajemy brakujące metody do mocka
mockedAnimalRepo.getAllByOrganizationId = jest.fn();
mockedAnimalRepo.getById = jest.fn();
mockedAnimalRepo.create = jest.fn();
mockedAnimalRepo.update = jest.fn();
mockedAnimalRepo.remove = jest.fn();

describe('Animal API Endpoints', () => {
  let testApi: TestApi;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Inicjalizacja TestApi z uprawnieniami admina
    testApi = new TestApi({
      id: 1,
      organizations: [{
        id: 1, 
        name: 'Test Organization', 
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      } as OrganizationWithRole]
    });
  });

  describe('GET /api/animals', () => {
    test('zwraca listę zwierząt dla organizacji', async () => {
      // Arrange
      const mockAnimals: MockAnimal[] = [
        { 
          id: 1, 
          name: 'Azor', 
          species: 'dog',
          client_id: 10,
          organization_id: 1,
          animal_type: AnimalType.COMPANION,
          owner_id: 10,
          created_at: new Date(),
          updated_at: new Date()
        },
        { 
          id: 2, 
          name: 'Mruczek', 
          species: 'cat',
          client_id: 20,
          organization_id: 1,
          animal_type: AnimalType.COMPANION,
          owner_id: 20,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      mockedAnimalRepo.getAllByOrganizationId.mockResolvedValue(mockAnimals);

      // Act
      const response = await testApi.get('/api/animals', { organizationId: 1 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          animals: expect.arrayContaining([
            expect.objectContaining({
              name: 'Azor',
              species: 'dog'
            }),
            expect.objectContaining({
              name: 'Mruczek',
              species: 'cat'
            })
          ])
        })
      }));
      
      expect(mockedAnimalRepo.getAllByOrganizationId).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe('GET /api/animals/:id', () => {
    test('zwraca szczegóły zwierzęcia po ID', async () => {
      // Arrange
      const mockAnimal: MockAnimal = {
        id: 1,
        name: 'Azor',
        species: 'dog',
        breed: 'Labrador',
        birth_date: new Date('2020-01-15'),
        client_id: 10,
        organization_id: 1,
        animal_type: AnimalType.COMPANION,
        owner_id: 10,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockedAnimalRepo.getById.mockResolvedValue(mockAnimal);
      (organizationRepository.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Test Organization'
      });

      // Act
      const response = await testApi.get('/api/animals/1', { organizationId: 1 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          animal: expect.objectContaining({
            name: 'Azor',
            species: 'dog',
            breed: 'Labrador'
          })
        })
      }));
    });

    test('zwraca błąd gdy zwierzę nie istnieje', async () => {
      // Arrange
      mockedAnimalRepo.getById.mockResolvedValue(null);

      // Act
      const response = await testApi.get('/api/animals/999', { organizationId: 1 });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('nie znaleziono')
      }));
    });
  });

  describe('POST /api/animals', () => {
    test('tworzy nowe zwierzę', async () => {
      // Arrange
      const newAnimalData = {
        name: 'Burek',
        species: 'dog',
        breed: 'Mixed',
        birth_date: '2021-03-10',
        client_id: 15,
        organization_id: 1,
        animal_type: AnimalType.COMPANION,
        owner_id: 15
      };
      
      const createdAnimal: MockAnimal = {
        id: 100,
        ...newAnimalData,
        birth_date: new Date('2021-03-10'),
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockedAnimalRepo.create.mockResolvedValue(createdAnimal);

      // Act
      const response = await testApi.post('/api/animals', newAnimalData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          animal: expect.objectContaining({
            id: 100,
            name: 'Burek'
          })
        })
      }));
      
      expect(mockedAnimalRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Burek',
        species: 'dog'
      }));
    });
  });

  describe('PUT /api/animals/:id', () => {
    test('aktualizuje istniejące zwierzę', async () => {
      // Arrange
      const animalId = 5;
      const updateData = {
        name: 'Rex',
        weight: 25.5
      };
      
      const existingAnimal: MockAnimal = {
        id: animalId,
        name: 'Old Name',
        species: 'dog',
        organization_id: 1,
        animal_type: AnimalType.COMPANION,
        owner_id: 10,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const updatedAnimal: MockAnimal = {
        ...existingAnimal,
        name: 'Rex',
        weight: 25.5,
        updated_at: new Date()
      };
      
      mockedAnimalRepo.getById.mockResolvedValue(existingAnimal);
      mockedAnimalRepo.update.mockResolvedValue(updatedAnimal);

      // Act
      const response = await testApi.put(`/api/animals/${animalId}`, updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          animal: expect.objectContaining({
            id: animalId,
            name: 'Rex',
            weight: 25.5
          })
        })
      }));
    });
  });

  describe('DELETE /api/animals/:id', () => {
    test('usuwa zwierzę', async () => {
      // Arrange
      const animalId = 3;
      
      const animalToDelete: MockAnimal = {
        id: animalId,
        name: 'To Delete',
        species: 'cat',
        organization_id: 1,
        animal_type: AnimalType.COMPANION,
        owner_id: 10,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      mockedAnimalRepo.getById.mockResolvedValue(animalToDelete);
      mockedAnimalRepo.remove.mockResolvedValue(true);

      // Act
      const response = await testApi.delete(`/api/animals/${animalId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        message: expect.stringContaining('usunięto')
      }));
      
      expect(mockedAnimalRepo.remove).toHaveBeenCalledWith(animalId);
    });
  });
});