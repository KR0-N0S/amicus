import axiosInstance from './axios';
import { AuthResponse } from '../types/models';
import { setToken, setCurrentUser } from '../utils/auth';

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  street?: string;
  house_number?: string;
  city?: string;
  postal_code?: string;
  tax_id?: string;
  organization?: {
    name: string;
    street?: string;
    house_number?: string;
    city?: string;
    postal_code?: string;
    tax_id?: string;
  };
}

interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/register', userData);
  if (response.data.status === 'success') {
    setToken(response.data.data.token);
    
    // Dodaj organizacje do obiektu użytkownika przed zapisaniem
    const userWithOrganizations = {
      ...response.data.data.user,
      organizations: response.data.data.organizations || []
    };
    
    setCurrentUser(userWithOrganizations);
  }
  return response.data;
};

export const loginUser = async (credentials: LoginData): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
  
  // Diagnostyka - sprawdzamy, co dokładnie przychodzi z API po zalogowaniu
  console.log("Odpowiedź z API /auth/login:", response.data);
  console.log("Dane użytkownika z API po logowaniu:", response.data.data?.user);
  console.log("Organizacje użytkownika z API po logowaniu:", response.data.data?.organizations);
  
  if (response.data.status === 'success') {
    setToken(response.data.data.token);
    
    // Dodaj organizacje do obiektu użytkownika przed zapisaniem
    const userWithOrganizations = {
      ...response.data.data.user,
      organizations: response.data.data.organizations || []
    };
    
    setCurrentUser(userWithOrganizations);
    
    // Sprawdzamy, co jest w localStorage po zapisaniu
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    console.log("Dane użytkownika po zapisaniu do localStorage:", savedUser);
    console.log("Organizacje po zapisaniu do localStorage:", savedUser?.organizations);
  }
  return response.data;
};

export const getCurrentUserProfile = async (): Promise<AuthResponse> => {
  const response = await axiosInstance.get<AuthResponse>('/auth/me');
  
  // Diagnostyka - sprawdzamy, co dokładnie przychodzi z API
  console.log("Odpowiedź z API /auth/me:", response.data);
  console.log("Dane użytkownika z API:", response.data.data?.user);
  console.log("Organizacje użytkownika z API:", response.data.data?.organizations);
  
  if (response.data.status === 'success') {
    // Dodaj organizacje do obiektu użytkownika przed zapisaniem
    const userWithOrganizations = {
      ...response.data.data.user,
      organizations: response.data.data.organizations || []
    };
    
    setCurrentUser(userWithOrganizations);
    
    // Sprawdzamy, co jest w localStorage po zapisaniu
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    console.log("Dane użytkownika po zapisaniu do localStorage:", savedUser);
    console.log("Organizacje po zapisaniu do localStorage:", savedUser?.organizations);
  }
  return response.data;
};