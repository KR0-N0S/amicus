/**
 * Standardowe role w systemie AmicusApp
 */
export const Roles = {
  OWNER: 'owner',
  CLIENT: 'client',
  EMPLOYEE: 'employee',
  FARMER: 'farmer',
  OFFICE_STAFF: 'office_staff',
  VET: 'vet',
  MEMBER: 'member'
} as const;

// Typ do użycia w parametrach funkcji i interfejsach
export type RoleType = typeof Roles[keyof typeof Roles];