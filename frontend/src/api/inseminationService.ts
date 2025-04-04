import axiosInstance from './axios';
import { Insemination } from '../types/models';

// Funkcja pobierająca listę inseminacji
export const getInseminations = async (params: any = {}) => {
  try {
    console.log('API request: GET /inseminations with params:', params);
    const startTime = performance.now();
    
    const response = await axiosInstance.get('/inseminations', { params });
    
    const endTime = performance.now();
    console.log(`API call to /inseminations completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching inseminations:', error);
    throw error;
  }
};

// Funkcja pobierająca dane konkretnego zabiegu inseminacji
export const getInsemination = async (id: number): Promise<Insemination> => {
  try {
    console.log(`API request: GET /inseminations/${id}`);
    const startTime = performance.now();
    
    const response = await axiosInstance.get(`/inseminations/${id}`);
    
    const endTime = performance.now();
    console.log(`API call to /inseminations/${id} completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching insemination with ID ${id}:`, error);
    throw error;
  }
};

// Funkcja tworząca nowy zabieg inseminacji
export const createInsemination = async (inseminationData: Partial<Insemination>): Promise<Insemination> => {
  try {
    console.log('API request: POST /inseminations with data:', inseminationData);
    const startTime = performance.now();
    
    const response = await axiosInstance.post('/inseminations', inseminationData);
    
    const endTime = performance.now();
    console.log(`API call to create insemination completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error creating insemination:', error);
    throw error;
  }
};

// Funkcja aktualizująca dane zabiegu inseminacji
export const updateInsemination = async (id: number, inseminationData: Partial<Insemination>): Promise<Insemination> => {
  try {
    console.log(`API request: PUT /inseminations/${id} with data:`, inseminationData);
    const startTime = performance.now();
    
    const response = await axiosInstance.put(`/inseminations/${id}`, inseminationData);
    
    const endTime = performance.now();
    console.log(`API call to update insemination completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error updating insemination with ID ${id}:`, error);
    throw error;
  }
};

// Funkcja usuwająca zabieg inseminacji
export const deleteInsemination = async (id: number): Promise<void> => {
  try {
    console.log(`API request: DELETE /inseminations/${id}`);
    const startTime = performance.now();
    
    await axiosInstance.delete(`/inseminations/${id}`);
    
    const endTime = performance.now();
    console.log(`API call to delete insemination completed in ${(endTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error(`Error deleting insemination with ID ${id}:`, error);
    throw error;
  }
};