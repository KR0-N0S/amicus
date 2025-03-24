import axiosInstance from './axios';
import { Animal, ApiResponse } from '../types/models';

export const getAnimals = async (page = 1, limit = 10): Promise<ApiResponse<Animal[]>> => {
  const response = await axiosInstance.get<ApiResponse<Animal[]>>('/animals', {
    params: { page, limit }
  });
  return response.data;
};

export const getAnimal = async (id: number): Promise<ApiResponse<Animal>> => {
  const response = await axiosInstance.get<ApiResponse<Animal>>(`/animals/${id}`);
  return response.data;
};

export const createAnimal = async (animalData: Omit<Animal, 'id' | 'owner_id' | 'created_at'>): Promise<ApiResponse<Animal>> => {
  const response = await axiosInstance.post<ApiResponse<Animal>>('/animals', animalData);
  return response.data;
};

export const updateAnimal = async (id: number, animalData: Partial<Animal>): Promise<ApiResponse<Animal>> => {
  const response = await axiosInstance.put<ApiResponse<Animal>>(`/animals/${id}`, animalData);
  return response.data;
};

export const deleteAnimal = async (id: number): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete<ApiResponse<null>>(`/animals/${id}`);
  return response.data;
};
