import supertest from 'supertest';
import app from '../../../app';
import * as userRepository from '../../../repositories/userRepository';
import * as organizationRepository from '../../../repositories/organizationRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../types/models/user';
import { Organization } from '../../../types/models/organization';

// Mockowanie repozytoriów i modułów
jest.mock('../../../repositories/userRepository');
jest.mock('../../../repositories/organizationRepository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Rozszerzenie mocków dla userRepository
interface MockedUserRepository {
  findByEmail: jest.Mock;
  findById: jest.Mock;
  create: jest.Mock;
  getUserOrganizationsWithRoles: jest.Mock;
}

// Rzutowanie mocka
const mockedUserRepo = userRepository as unknown as MockedUserRepository;

describe('Auth API Endpoints', () => {
  let request: supertest.SuperTest<supertest.Test>;
  
  beforeAll(() => {
    request = supertest(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('rejestruje użytkownika z organizacją', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        first_name: 'Jan',
        last_name: 'Kowalski',
        phone: '123456789',
        organization: {
          name: 'Nowa Organizacja',
          city: 'Warszawa',
          street: 'Ulica',
          house_number: '10'
        }
      };

      mockedUserRepo.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      
      const createdUser = {
        id: 100,
        email: registerData.email,
        first_name: registerData.first_name,
        password: 'hashed_password'
      };
      
      const createdOrg = {
        id: 200,
        name: registerData.organization.name,
        city: registerData.organization.city
      };
      
      mockedUserRepo.create.mockResolvedValue(createdUser);
      (organizationRepository.create as jest.Mock).mockResolvedValue(createdOrg);
      (organizationRepository.addUserToOrganization as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('generated_token');

      // Act
      const response = await request
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      // Assert
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: registerData.email
          }),
          organization: expect.objectContaining({
            name: registerData.organization.name
          }),
          token: 'generated_token'
        })
      }));
      
      expect(mockedUserRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        email: registerData.email,
        password: 'hashed_password'
      }));
      
      expect(organizationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: registerData.organization.name
      }));
      
      expect(organizationRepository.addUserToOrganization).toHaveBeenCalledWith(
        createdUser.id,
        createdOrg.id,
        'admin'
      );
    });

    test('zwraca błąd gdy email jest już zajęty', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        password: 'Password123!',
        first_name: 'Jan',
        last_name: 'Kowalski'
      };
      
      mockedUserRepo.findByEmail.mockResolvedValue({ 
        id: 1, 
        email: registerData.email 
      });

      // Act
      const response = await request
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      // Assert
      expect(response.body).toEqual(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('email jest już zajęty')
      }));
    });
  });

  describe('POST /api/auth/login', () => {
    test('loguje użytkownika i zwraca token', async () => {
      // Arrange
      const loginData = {
        email: 'user@example.com',
        password: 'Password123!'
      };
      
      const user = {
        id: 1,
        email: loginData.email,
        password: 'hashed_password',
        first_name: 'Jan'
      };
      
      const userOrgs = [
        { id: 10, name: 'Org 1', role: 'admin' }
      ];
      
      mockedUserRepo.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockedUserRepo.getUserOrganizationsWithRoles.mockResolvedValue(userOrgs);
      (jwt.sign as jest.Mock).mockReturnValue('login_token');

      // Act
      const response = await request
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: loginData.email
          }),
          token: 'login_token'
        })
      }));
    });

    test('zwraca błąd gdy dane są niepoprawne', async () => {
      // Arrange
      mockedUserRepo.findByEmail.mockResolvedValue(null);

      // Act
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpass'
        })
        .expect(401);

      // Assert
      expect(response.body).toEqual(expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Nieprawidłowy email lub hasło')
      }));
    });
  });

  describe('GET /api/auth/me', () => {
    test('zwraca dane zalogowanego użytkownika', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        first_name: 'Jan'
      };
      
      // Mockujemy middleware uwierzytelniania - normalnie użylibyśmy narzędzie TestApi
      jest.spyOn(jwt, 'verify').mockImplementation(() => ({ id: mockUser.id }));
      mockedUserRepo.findById.mockResolvedValue(mockUser);

      // Act
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      // Assert
      expect(response.body).toEqual(expect.objectContaining({
        status: 'success',
        data: expect.objectContaining({
          user: expect.objectContaining({
            email: mockUser.email
          })
        })
      }));
    });
  });
});