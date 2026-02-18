import { db } from '../../../shared/infra/db';
import { users } from '../../../shared/infra/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
});

export class UserRepo {
  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }

  async findByTenant(tenantId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    return db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, tenantId))
      .limit(limit)
      .offset(offset);
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
    tenantId?: string;
    firstName?: string;
    lastName?: string;
  }) {
    const [user] = await db.insert(users).values(data).returning();
    return user!;
  }

  async update(userId: string, data: z.infer<typeof updateUserSchema>) {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async verifyEmail(userId: string) {
    const [user] = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async delete(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
  }
}
