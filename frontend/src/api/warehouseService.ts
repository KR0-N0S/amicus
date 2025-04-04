import axiosInstance from './axios';

// Funkcja pobierająca listę magazynów
export const getWarehouses = async (params: any = {}) => {
  try {
    console.log('API request: GET /warehouses with params:', params);
    const startTime = performance.now();
    
    const response = await axiosInstance.get('/warehouses', { params });
    
    const endTime = performance.now();
    console.log(`API call to /warehouses completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    throw error;
  }
};

// Funkcja pobierająca dane konkretnego magazynu
export const getWarehouse = async (id: number): Promise<any> => {
  try {
    console.log(`API request: GET /warehouses/${id}`);
    const startTime = performance.now();
    
    const response = await axiosInstance.get(`/warehouses/${id}`);
    
    const endTime = performance.now();
    console.log(`API call to /warehouses/${id} completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error fetching warehouse with ID ${id}:`, error);
    throw error;
  }
};

// Funkcja tworząca nowy magazyn
export const createWarehouse = async (warehouseData: any): Promise<any> => {
  try {
    console.log('API request: POST /warehouses with data:', warehouseData);
    const startTime = performance.now();
    
    const response = await axiosInstance.post('/warehouses', warehouseData);
    
    const endTime = performance.now();
    console.log(`API call to create warehouse completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error creating warehouse:', error);
    throw error;
  }
};

// Funkcja aktualizująca dane magazynu
export const updateWarehouse = async (id: number, warehouseData: any): Promise<any> => {
  try {
    console.log(`API request: PUT /warehouses/${id} with data:`, warehouseData);
    const startTime = performance.now();
    
    const response = await axiosInstance.put(`/warehouses/${id}`, warehouseData);
    
    const endTime = performance.now();
    console.log(`API call to update warehouse completed in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('API response received:', response.data);
    
    return response.data.data || response.data;
  } catch (error) {
    console.error(`Error updating warehouse with ID ${id}:`, error);
    throw error;
  }
};

// Funkcja usuwająca magazyn
export const deleteWarehouse = async (id: number): Promise<void> => {
  try {
    console.log(`API request: DELETE /warehouses/${id}`);
    const startTime = performance.now();
    
    await axiosInstance.delete(`/warehouses/${id}`);
    
    const endTime = performance.now();
    console.log(`API call to delete warehouse completed in ${(endTime - startTime).toFixed(2)}ms`);
    
  } catch (error) {
    console.error(`Error deleting warehouse with ID ${id}:`, error);
    throw error;
  }
};