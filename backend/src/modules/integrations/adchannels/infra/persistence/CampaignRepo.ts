import { db } from '../../../../../shared/infra/db';
import { campaigns } from '../../../../../shared/infra/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CampaignStatus } from '../../domain/Campaign';

export class CampaignRepo {
  async findAll(tenantId: string) {
    return db.select().from(campaigns).where(eq(campaigns.tenantId, tenantId));
  }

  async findById(tenantId: string, id: string) {
    const [r] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)))
      .limit(1);
    return r ?? null;
  }

  async create(data: {
    tenantId: string;
    name: string;
    platform: string;
    pluginId: string;
    budget: string;
    config: Record<string, unknown>;
  }) {
    const [r] = await db
      .insert(campaigns)
      .values({ ...data, status: 'draft' })
      .returning();
    return r!;
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      name: string;
      budget: string;
      config: Record<string, unknown>;
      status: CampaignStatus;
      externalId: string;
    }>
  ) {
    const [r] = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)))
      .returning();
    return r ?? null;
  }

  async delete(tenantId: string, id: string) {
    await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)));
  }
}
