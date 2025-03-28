import axios from './axios';
// Usunięto nieużywany import ApiResponse
import { Animal } from '../types/models';

// Funkcja do pobierania listy zwierząt
export const getAnimals = async (page = 1, limit = 10, animalType?: string) => {
  const response = await axios.get('/api/animals', {
    params: {
      page,
      limit,
      animal_type: animalType // Opcjonalny parametr typu zwierzęcia
    }
  });
  return response.data;
};

// Usunięto nieużywaną definicję interfejsu AnimalResponse

// Funkcja do pobierania pojedynczego zwierzęcia
export const getAnimal = async (id: number): Promise<Animal> => {
  const response = await axios.get(`/api/animals/${id}`);
  return response.data.data;
};

// Funkcja do tworzenia nowego zwierzęcia
export const createAnimal = async (animalData: Partial<Animal>): Promise<Animal> => {
  const response = await axios.post('/api/animals', animalData);
  return response.data.data;
};

// Funkcja do aktualizacji zwierzęcia
export const updateAnimal = async (id: number, animalData: Partial<Animal>): Promise<Animal> => {
  const response = await axios.put(`/api/animals/${id}`, animalData);
  return response.data.data;
};

// Funkcja do usuwania zwierzęcia
export const deleteAnimal = async (id: number): Promise<void> => {
  await axios.delete(`/api/animals/${id}`);
};