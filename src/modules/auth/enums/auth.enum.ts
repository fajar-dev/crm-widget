/**
 * User roles for authorization.
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

/**
 * Token types for JWT management.
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
