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
    setCurrentUser(response.data.data.user);
  }
  return response.data;
};

export const loginUser = async (credentials: LoginData): Promise<AuthResponse> => {
  const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
  if (response.data.status === 'success') {
    setToken(response.data.data.token);
    setCurrentUser(response.data.data.user);
  }
  return response.data;
};

export const getCurrentUserProfile = async (): Promise<AuthResponse> => {
  const response = await axiosInstance.get<AuthResponse>('/auth/me');
  if (response.data.status === 'success') {
    setCurrentUser(response.data.data.user);
  }
  return response.data;
};
