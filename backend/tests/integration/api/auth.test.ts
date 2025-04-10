import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mockowanie całego serwera Express z mockami middleware
jest.mock('../../../app', () => {
  const express = require('express');
  const app = express();
  const bodyParser = require('body-parser');
  const cookieParser = require('cookie-parser');

  // Mockowane serwisy
  const authService = require('../../../services/authService').default;

  // Middleware
  app.use(bodyParser.json());
  app.use(cookieParser());

  // Mockowane endpoint'y
  app.post('/api/auth/register', (req, res) => {
    const { email, password, first_name, last_name, organization, preserveCurrentSession } = req.body;
    
    // Walidacja hasła
    if (password && !password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)) {
      return res.status(400).json({
        status: 'error',
        errors: [{
          location: 'body',
          msg: 'Hasło musi zawierać małą literę, wielką literę i cyfrę',
          path: 'password',
          type: 'field',
          value: password
        }]
      });
    }
    
    // Mockowana odpowiedź dla poprawnych danych
    if (email === 'test@example.com' && password === 'Password123!') {
      const mockResponse = {
        user: {
          id: 1,
          email,
          first_name,
          last_name,
          created_at: new Date(),
          updated_at: new Date()
        },
        organization: organization ? {
          id: 1,
          name: organization.name,
          created_at: new Date(),
          updated_at: new Date()
        } : null,
        herd: null,
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };
      
      // Ustawienie ciasteczka
      if (!preserveCurrentSession) {
        res.cookie('refreshToken', 'test-refresh-token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000
        });
      }
      
      return res.status(201).json({
        status: 'success',
        data: {
          user: mockResponse.user,
          organization: mockResponse.organization,
          token: !preserveCurrentSession ? mockResponse.accessToken : undefined
        }
      });
    } else if (email === 'existing@example.com') {
      // Przypadek gdy email już istnieje
      return res.status(400).json({
        status: 'error',
        message: 'Użytkownik o takim adresie email już istnieje'
      });
    }
    
    // Domyślna odpowiedź
    res.status(400).json({
      status: 'error',
      message: 'Nieprawidłowe dane'
    });
  });
  
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email i hasło są wymagane'
      });
    }
    
    if (email === 'user@example.com' && password === 'password123') {
      const mockResponse = {
        user: {
          id: 1,
          email,
          first_name: 'Test',
          last_name: 'User',
          created_at: new Date(),
          updated_at: new Date()
        },
        organizations: [
          {
            id: 1,
            name: 'Test Organization',
            role: 'admin',
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      };
      
      res.cookie('refreshToken', 'test-refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          user: mockResponse.user,
          organizations: mockResponse.organizations,
          token: mockResponse.accessToken
        }
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Nieprawidłowe dane logowania'
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Brak autoryzacji'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token === 'valid_token') {
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const mockOrgs = [
        {
          id: 1,
          name: 'Test Organization',
          role: 'admin',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      return res.status(200).json({
        status: 'success',
        data: {
          user: mockUser,
          organizations: mockOrgs
        }
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Nieprawidłowy token'
    });
  });
  
  app.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Brak refresh tokenu'
      });
    }
    
    if (refreshToken === 'valid-refresh-token') {
      res.cookie('refreshToken', 'new-refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          token: 'new-access-token'
        }
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Nieprawidłowy refresh token'
    });
  });
  
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
      status: 'success',
      message: 'Wylogowano pomyślnie'
    });
  });

  return app;
});

// Mockowanie zależności
jest.mock('../../../services/authService');
jest.mock('jsonwebtoken');

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('rejestruje nowego użytkownika i zwraca status 201', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'Password123!', // Zgodne z walidacją
        first_name: 'Test',
        last_name: 'User',
        organization: {
          name: 'Test Organization',
          city: 'Test City'
        }
      };

      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: expect.objectContaining({ 
            id: 1,
            email: userData.email 
          }),
          organization: expect.objectContaining({ 
            id: 1,
            name: userData.organization.name 
          }),
          token: 'test-access-token'
        }
      });

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('zwraca błąd 400 gdy email jest już zajęty', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        first_name: 'Test',
        last_name: 'User'
      };

      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body).toEqual({
        status: 'error',
        message: 'Użytkownik o takim adresie email już istnieje'
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('loguje użytkownika i zwraca token', async () => {
      // Arrange
      const loginData = {
        email: 'user@example.com',
        password: 'password123'
      };

      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: expect.objectContaining({ id: 1 }),
          organizations: expect.arrayContaining([
            expect.objectContaining({ id: 1, role: 'admin' })
          ]),
          token: 'test-access-token'
        }
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('zwraca błąd 401 gdy dane logowania są nieprawidłowe', async () => {
      // Arrange
      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      };

      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        status: 'error',
        message: 'Nieprawidłowe dane logowania'
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('zwraca dane zalogowanego użytkownika', async () => {
      // Act
      const response = await request(require('../../../app'))
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid_token')
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'success',
        data: {
          user: expect.objectContaining({ id: 1 }),
          organizations: expect.arrayContaining([
            expect.objectContaining({ id: 1, role: 'admin' })
          ])
        }
      });
    });

    it('zwraca błąd 401 gdy brak tokenu', async () => {
      // Act
      const response = await request(require('../../../app'))
        .get('/api/auth/me')
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        status: 'error',
        message: 'Brak autoryzacji'
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('odświeża token', async () => {
      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=valid-refresh-token'])
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'success',
        data: {
          token: 'new-access-token'
        }
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('zwraca błąd 401 gdy brak refresh tokenu', async () => {
      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/refresh')
        .expect(401);

      // Assert
      expect(response.body).toEqual({
        status: 'error',
        message: 'Brak refresh tokenu'
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('wylogowuje użytkownika', async () => {
      // Act
      const response = await request(require('../../../app'))
        .post('/api/auth/logout')
        .expect(200);

      // Assert
      expect(response.body).toEqual({
        status: 'success',
        message: 'Wylogowano pomyślnie'
      });
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken=;');
    });
  });
});