import { z } from 'zod';
import { UserRole } from '../../../core/interfaces/auth.interface.ts';

export const createTenantSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export const updateTenantSchema = createTenantSchema.partial();

export const joinTenantSchema = z.object({
  code: z.string().min(1).max(20),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type JoinTenantInput = z.infer<typeof joinTenantSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
