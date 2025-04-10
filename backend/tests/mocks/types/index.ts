import { User } from '../../../types/models/user';
import { Organization } from '../../../types/models/organization';

// Pomocnicze typy dla testów, które uzupełniają brakujące pola wymagane przez interfejsy
export const createMockUser = (userProps: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  password: 'hashed_password',
  first_name: 'Test',
  last_name: 'User',
  status: 'active',
  created_at: new Date(),
  updated_at: new Date(),
  ...userProps
});

export const createMockOrganization = (orgProps: Partial<Organization> = {}): Organization => ({
  id: 1,
  name: 'Test Organization',
  address: 'Test Street', // Poprawione: street -> address
  city: 'Test City',
  created_at: new Date(),
  updated_at: new Date(),
  ...orgProps
});

// Pomocnik do usuwania hasła z obiektu User dla typów zwracanych
export const excludePassword = (user: User): Omit<User, 'password'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};