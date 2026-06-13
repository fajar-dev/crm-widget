import { z } from 'zod';
import { ContactStatus, ContactSource } from './contact.enum.ts';

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(100).optional(),
  status: z.nativeEnum(ContactStatus).optional().default(ContactStatus.LEAD),
  source: z.nativeEnum(ContactSource).optional().default(ContactSource.OTHER),
  notes: z.string().optional(),
  address: z.string().max(500).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
