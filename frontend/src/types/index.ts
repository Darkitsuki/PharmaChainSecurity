/**
 * Canonical RBAC Roles matching backend domain (Rule 04).
 */
export type UserRole = 'OWNER' | 'SALES' | 'WAREHOUSE';

/**
 * Authenticated user context received from server.
 */
export interface CurrentUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: number;
}

/**
 * Standard API error response (Rule 08).
 */
export interface ApiProblemDetails {
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
}
