import type { User } from '../entities/user.entity.ts';

/**
 * Serialized user data safe for API responses.
 */
export interface SerializedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transforms User entities into API-safe response objects.
 */
export class AuthSerializer {
  static serialize(user: User): SerializedUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  static serializeMany(users: User[]): SerializedUser[] {
    return users.map(AuthSerializer.serialize);
  }
}
