declare module '../repositories/animalRepository' {
  export interface Animal {
    id: number;
    owner_id: number;
    organization_id: number;
    species: string;
    animal_type: string;
    sex: string;
    breed?: string;
    birth_date?: Date;
    weight?: number;
    photo?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    [key: string]: any;
  }

  export interface AnimalWithDetails extends Animal {
    farm_animal?: any;
    companion_animal?: any;
  }

  export function findById(id: number): Promise<AnimalWithDetails | null>;
  export function create(data: Partial<Animal>): Promise<AnimalWithDetails>;
  export function update(id: number, data: Partial<Animal>): Promise<AnimalWithDetails>;
  export function deleteAnimal(id: number): Promise<boolean>;
  export function getAnimalsByOwnerId(ownerId: number, page?: number, limit?: number, animalType?: string): Promise<{
    animals: AnimalWithDetails[];
    pagination: { currentPage: number; pageSize: number; totalCount: number; totalPages: number; };
  }>;
  export function getAnimalsByOrganizationId(organizationId: number, page?: number, limit?: number, animalType?: string): Promise<{
    animals: AnimalWithDetails[];
    pagination: { currentPage: number; pageSize: number; totalCount: number; totalPages: number; };
  }>;
}
