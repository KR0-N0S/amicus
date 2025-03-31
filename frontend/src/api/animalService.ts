import axiosInstance from './axios';
import { Animal } from '../types/models';

// Funkcja do mapowania typów zwierząt między frontendem a backendem
const mapAnimalTypeToBackend = (type?: string): string | undefined => {
  if (type === 'farm') return 'large';
  if (type === 'companion') return 'small';
  return type;
};

const mapAnimalTypeFromBackend = (animal: any): Animal => {
  if (animal.animal_type === 'large') {
    animal.animal_type = 'farm';
  } else if (animal.animal_type === 'small') {
    animal.animal_type = 'companion';
  }
  return animal;
};

// Funkcja do pobierania listy zwierząt
export const getAnimals = async (page = 1, limit = 10, animalType?: string) => {
  const mappedType = mapAnimalTypeToBackend(animalType);
  
  const response = await axiosInstance.get('/animals', {
    params: {
      page,
      limit,
      animal_type: mappedType
    }
  });
  
  // Mapowanie typów w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = response.data.data.map(mapAnimalTypeFromBackend);
  }
  
  return response.data;
};

// Funkcja do pobierania pojedynczego zwierzęcia
export const getAnimal = async (id: number): Promise<Animal> => {
  const response = await axiosInstance.get(`/animals/${id}`);
  // Mapowanie typu w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = mapAnimalTypeFromBackend(response.data.data);
  }
  return response.data.data;
};

// Funkcja do tworzenia nowego zwierzęcia
export const createAnimal = async (animalData: Partial<Animal>): Promise<Animal> => {
  // Kopiujemy dane, aby nie modyfikować oryginalnego obiektu
  const mappedData = { ...animalData };
  
  // Mapowanie typu przed wysłaniem
  if (mappedData.animal_type) {
    mappedData.animal_type = mapAnimalTypeToBackend(mappedData.animal_type) as 'farm' | 'companion';
  }
  
  const response = await axiosInstance.post('/animals', mappedData);
  
  // Mapowanie typu w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = mapAnimalTypeFromBackend(response.data.data);
  }
  
  return response.data.data;
};

// Funkcja do aktualizacji zwierzęcia
export const updateAnimal = async (id: number, animalData: Partial<Animal>): Promise<Animal> => {
  // Kopiujemy dane, aby nie modyfikować oryginalnego obiektu
  const mappedData = { ...animalData };
  
  // Mapowanie typu przed wysłaniem
  if (mappedData.animal_type) {
    mappedData.animal_type = mapAnimalTypeToBackend(mappedData.animal_type) as 'farm' | 'companion';
  }
  
  const response = await axiosInstance.put(`/animals/${id}`, mappedData);
  
  // Mapowanie typu w odpowiedzi
  if (response.data && response.data.data) {
    response.data.data = mapAnimalTypeFromBackend(response.data.data);
  }
  
  return response.data.data;
};

// Funkcja do usuwania zwierzęcia
export const deleteAnimal = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/animals/${id}`);
};