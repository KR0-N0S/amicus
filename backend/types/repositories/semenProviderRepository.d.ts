declare module '../repositories/semenProviderRepository' {
  export interface SemenProvider {
    id: number;
    owner_id: number;
    organization_id: number | null;
    name: string;
    vet_id_number: string;
    address_street?: string;
    address_city?: string;
    address_postal_code?: string;
    address_province?: string;
    address_country?: string;
    contact_phone?: string;
    contact_email?: string;
    created_at: Date;
    updated_at: Date;
    [key: string]: any;
  }

  export function findById(id: number): Promise<SemenProvider | null>;
  export function create(data: Partial<SemenProvider>): Promise<SemenProvider>;
  export function update(id: number, data: Partial<SemenProvider>): Promise<SemenProvider>;
  export function deleteProvider(id: number): Promise<boolean>;
  export function getProvidersByOwnerId(ownerId: number, page?: number, limit?: number): Promise<{
    providers: SemenProvider[];
    pagination: { currentPage: number; pageSize: number; totalCount: number; totalPages: number; };
  }>;
  export function getProvidersByOrganizationId(organizationId: number, page?: number, limit?: number, includePublic?: boolean): Promise<{
    providers: SemenProvider[];
    pagination: { currentPage: number; pageSize: number; totalCount: number; totalPages: number; };
  }>;
  export function getPublicProviders(page?: number, limit?: number): Promise<{
    providers: SemenProvider[];
    pagination: { currentPage: number; pageSize: number; totalCount: number; totalPages: number; };
  }>;
  export function belongsToOrganization(providerId: number, organizationId: number): Promise<boolean>;
}
