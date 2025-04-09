import supertest from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { User } from '../types/models/user';
import { OrganizationWithRole } from '../types/models/organization';

interface TestUserOptions {
  id?: number;
  organizations?: OrganizationWithRole[];
  role?: string;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

/**
 * Główna klasa narzędziowa do testów API
 */
export class TestApi {
  private token: string;
  private agent: supertest.SuperAgentTest;

  constructor(options: TestUserOptions = {}) {
    // Ustaw domyślne wartości
    const userId = options.id || 1;
    const organizations = options.organizations || [
      { id: 1, name: 'Test Organization', role: options.role || 'admin' }
    ];
    
    // Wygeneruj token
    this.token = jwt.sign(
      { id: userId, organizations },
      process.env.JWT_ACCESS_SECRET || 'amicus_access_secret',
      { expiresIn: '1h' }
    );
    
    // Utwórz agenta testowego
    this.agent = supertest.agent(app);
  }

  /**
   * Wykonuje żądanie GET
   */
  async get(url: string, params: Record<string, any> = {}): Promise<supertest.Response> {
    const queryString = this.buildQueryString(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    return this.agent
      .get(fullUrl)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * Wykonuje żądanie POST
   */
  async post(url: string, data: Record<string, any> = {}): Promise<supertest.Response> {
    return this.agent
      .post(url)
      .set('Authorization', `Bearer ${this.token}`)
      .send(data);
  }

  /**
   * Wykonuje żądanie PUT
   */
  async put(url: string, data: Record<string, any> = {}): Promise<supertest.Response> {
    return this.agent
      .put(url)
      .set('Authorization', `Bearer ${this.token}`)
      .send(data);
  }

  /**
   * Wykonuje żądanie DELETE
   */
  async delete(url: string): Promise<supertest.Response> {
    return this.agent
      .delete(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * Buduje string zapytania z parametrów
   * @private
   */
  private buildQueryString(params: Record<string, any>): string {
    return Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => {
        const value = typeof params[key] === 'object' 
          ? JSON.stringify(params[key]) 
          : params[key];
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');
  }
}

export default TestApi;