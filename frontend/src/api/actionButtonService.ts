import axiosInstance from './axios';
import { AxiosResponse } from 'axios';

export interface ActionButton {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  action_type: string;
  default_values: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ActionButtonCreateUpdateDto {
  name: string;
  description?: string;
  action_type: string;
  default_values: Record<string, any>;
}

/**
 * Pobiera wszystkie przyciski akcji użytkownika
 */
export const getUserActionButtons = async (): Promise<ActionButton[]> => {
  const response = await axiosInstance.get('/action-buttons');
  return response.data.data;
};

/**
 * Pobiera pojedynczy przycisk akcji
 */
export const getActionButtonById = async (id: number): Promise<ActionButton> => {
  const response = await axiosInstance.get(`/action-buttons/${id}`);
  return response.data.data;
};

/**
 * Tworzy nowy przycisk akcji
 */
export const createActionButton = async (data: ActionButtonCreateUpdateDto): Promise<ActionButton> => {
  const response = await axiosInstance.post('/action-buttons', data);
  return response.data.data;
};

/**
 * Aktualizuje istniejący przycisk akcji
 */
export const updateActionButton = async (id: number, data: ActionButtonCreateUpdateDto): Promise<ActionButton> => {
  const response = await axiosInstance.put(`/action-buttons/${id}`, data);
  return response.data.data;
};

/**
 * Usuwa przycisk akcji
 */
export const deleteActionButton = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/action-buttons/${id}`);
};