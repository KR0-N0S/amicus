import axios from './axios';
import { SemenDelivery } from '../types/models';
import { SemenDeliveryCreatePayload, SemenDeliveryUpdatePayload } from '../types/api-payloads';

export const getSemenDeliveries = async (params = {}) => {
  const response = await axios.get('/semen-deliveries', { params });
  return response.data;
};

export const getSemenDelivery = async (id: number) => {
  const response = await axios.get(`/semen-deliveries/${id}`);
  return response.data;
};

export const createSemenDelivery = async (deliveryData: SemenDeliveryCreatePayload) => {
  const response = await axios.post('/semen-deliveries', deliveryData);
  return response.data;
};

export const updateSemenDelivery = async (id: number, deliveryData: SemenDeliveryUpdatePayload) => {
  const response = await axios.put(`/semen-deliveries/${id}`, deliveryData);
  return response.data;
};

export const deleteSemenDelivery = async (id: number) => {
  const response = await axios.delete(`/semen-deliveries/${id}`);
  return response.data;
};