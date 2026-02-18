import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
});

export class UserService {
  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    return user;
  }

  /**
   * Get users for a tenant
   */
  async getUsers(tenantId: string, options?: { limit?: number; offset?: number }) {
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

  /**
   * Update user
   */
  async updateUser(userId: string, data: z.infer<typeof updateUserSchema>) {
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  /**
   * Delete user (for GDPR compliance)
   */
  async deleteUser(userId: string) {
    await db.delete(users).where(eq(users.id, userId));
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: string) {
    const [user] = await db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }
}
