import { User, UserCreateData } from '../models/user';
import { Organization, OrganizationRole } from '../models/organization';
import { Herd, HerdCreateData } from '../models/herd';

/**
 * Wynik rejestracji użytkownika
 */
export interface RegisterResult {
  user: User;
  organization: Organization | null;
  herd: Herd | null;
  accessToken: string;
  refreshToken: string;
}

/**
 * Wynik logowania użytkownika
 */
export interface LoginResult {
  user: Omit<User, 'password'>;
  organizations: Organization[];
  accessToken: string;
  refreshToken: string;
}

/**
 * Token JWT
 */
export interface TokenResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Profil użytkownika
 */
export interface UserProfileResult {
  user: Omit<User, 'password'>;
  organizations: Organization[];
}