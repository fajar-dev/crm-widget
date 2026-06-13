import { z } from 'zod';
import { ContactStatus, ContactSource } from '../enums/contact.enum.ts';

/**
 * Create contact request schema.
 */
export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100).openapi({
    description: 'Contact first name',
    example: 'Jane',
  }),
  lastName: z.string().min(1).max(100).openapi({
    description: 'Contact last name',
    example: 'Smith',
  }),
  email: z.string().email().optional().openapi({
    description: 'Contact email',
    example: 'jane@company.com',
  }),
  phone: z.string().max(50).optional().openapi({
    description: 'Contact phone number',
    example: '+62812345678',
  }),
  company: z.string().max(200).optional().openapi({
    description: 'Company name',
    example: 'Acme Corp',
  }),
  jobTitle: z.string().max(100).optional().openapi({
    description: 'Job title',
    example: 'Marketing Manager',
  }),
  status: z.nativeEnum(ContactStatus).optional().default(ContactStatus.LEAD).openapi({
    description: 'Contact status',
    example: ContactStatus.LEAD,
  }),
  source: z.nativeEnum(ContactSource).optional().default(ContactSource.OTHER).openapi({
    description: 'Contact source',
    example: ContactSource.WEBSITE,
  }),
  notes: z.string().optional().openapi({
    description: 'Additional notes',
    example: 'Met at conference 2025',
  }),
  address: z.string().max(500).optional().openapi({
    description: 'Physical address',
    example: '123 Main St, Jakarta',
  }),
}).openapi('CreateContactRequest');

/**
 * Update contact request schema (all fields optional).
 */
export const updateContactSchema = createContactSchema.partial().openapi('UpdateContactRequest');

/**
 * Contact response schema for OpenAPI documentation.
 */
export const contactResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  jobTitle: z.string().nullable(),
  status: z.nativeEnum(ContactStatus),
  source: z.nativeEnum(ContactSource),
  notes: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('ContactResponse');

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
