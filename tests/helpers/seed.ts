import type { DataSource } from 'typeorm';
import { User } from '../../src/modules/user/entities/user.entity.ts';
import { Contact } from '../../src/modules/contacts/entities/contact.entity.ts';
import { UserRole } from '../../src/core/interfaces/auth.interface.ts';
import { ContactStatus, ContactSource } from '../../src/modules/contacts/enums/contact.enum.ts';
import { TEST_TENANT_ID, TEST_USER_ID } from './test-jwt.ts';

export async function seedUser(ds: DataSource, overrides?: Partial<User>): Promise<User> {
  const repo = ds.getRepository(User);
  const hashedPassword = await Bun.password.hash('TestPass123!', { algorithm: 'bcrypt', cost: 4 });

  const user = repo.create({
    id: TEST_USER_ID,
    tenantId: TEST_TENANT_ID,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
    isActive: true,
    ...overrides,
  });

  return repo.save(user);
}

export async function seedContacts(ds: DataSource, count = 2): Promise<Contact[]> {
  const repo = ds.getRepository(Contact);
  const contacts: Partial<Contact>[] = [];

  for (let i = 0; i < count; i++) {
    contacts.push({
      tenantId: TEST_TENANT_ID,
      firstName: `Contact${i + 1}`,
      lastName: `Test`,
      email: `contact${i + 1}@example.com`,
      phone: `+6281234567${i}`,
      company: `Company ${i + 1}`,
      status: ContactStatus.LEAD,
      source: ContactSource.OTHER,
    });
  }

  return repo.save(repo.create(contacts));
}
