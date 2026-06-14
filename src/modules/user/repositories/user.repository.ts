import type { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity.ts';

export class UserRepository {
  private readonly repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.repository.findOneBy({ id });
    if (!user) throw new Error('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(data: Partial<User>): Promise<User> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repository.update(id, data as any);
    return this.findByIdOrFail(id);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, { lastLoginAt: new Date() } as any);
  }

  async updateLastActiveTenant(userId: string, tenantId: string): Promise<void> {
    await this.repository.update(userId, { lastActiveTenantId: tenantId } as any);
  }
}
