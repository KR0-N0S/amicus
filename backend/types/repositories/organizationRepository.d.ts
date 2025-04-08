declare module '../repositories/organizationRepository' {
  export interface Organization {
    id: number;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    created_at: Date;
    updated_at: Date;
    [key: string]: any;
  }

  export function findById(id: number): Promise<Organization | null>;
  export function create(data: Partial<Organization>): Promise<Organization>;
  export function update(id: number, data: Partial<Organization>): Promise<Organization>;
  export function deleteOrganization(id: number): Promise<boolean>;
  export function getUserOrganizationsWithRoles(userId: number): Promise<Array<Organization & { role: string }>>;
  export function addUserToOrganization(organizationId: number, userId: number, role: string): Promise<any>;
  export function removeUserFromOrganization(organizationId: number, userId: number): Promise<boolean>;
}
