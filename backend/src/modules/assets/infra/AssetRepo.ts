import { db } from '../../../shared/infra/db';
import { assets } from '../../../shared/infra/db/schema';
import { eq, and } from 'drizzle-orm';

export class AssetRepo {
  async findAll(tenantId: string, options?: { type?: string; limit?: number; offset?: number }) {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    return db
      .select()
      .from(assets)
      .where(
        options?.type
          ? and(eq(assets.tenantId, tenantId), eq(assets.type, options.type))
          : eq(assets.tenantId, tenantId)
      )
      .limit(limit)
      .offset(offset)
      .orderBy(assets.createdAt);
  }

  async findById(tenantId: string, id: string) {
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
    return asset ?? null;
  }

  async create(
    tenantId: string,
    userId: string | null,
    type: string,
    storagePath: string,
    metadata: Record<string, unknown>
  ) {
    const [asset] = await db
      .insert(assets)
      .values({ tenantId, userId, type, storagePath, metadata })
      .returning();
    return asset!;
  }

  async delete(id: string) {
    await db.delete(assets).where(eq(assets.id, id));
  }
}
