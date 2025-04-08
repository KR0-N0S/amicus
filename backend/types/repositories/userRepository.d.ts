declare module '../repositories/userRepository' {
  export interface User {
    id: number;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    created_at: Date;
    updated_at: Date;
    [key: string]: any;
  }

  export function findById(id: number): Promise<User | null>;
  export function findByEmail(email: string): Promise<User | null>;
  export function create(userData: Partial<User>): Promise<User>;
  export function update(id: number, userData: Partial<User>): Promise<User>;
  export function deleteUser(id: number): Promise<boolean>;
  export function getUsers(page?: number, limit?: number): Promise<{
    users: User[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
    };
  }>;
}
