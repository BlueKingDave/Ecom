import { db } from '../../../../../shared/infra/db';
import { pluginConfigs } from '../../../../../shared/infra/db/schema';
import { eq, and } from 'drizzle-orm';

export class ProviderConfigRepo {
  async findOne(tenantId: string, pluginId: string) {
    const [r] = await db.select().from(pluginConfigs)
      .where(and(eq(pluginConfigs.tenantId, tenantId), eq(pluginConfigs.pluginId, pluginId))).limit(1);
    return r ?? null;
  }

  async findAllByTenant(tenantId: string) {
    return db.select().from(pluginConfigs).where(eq(pluginConfigs.tenantId, tenantId));
  }

  async findAllByPluginId(pluginId: string) {
    return db.select().from(pluginConfigs).where(eq(pluginConfigs.pluginId, pluginId));
  }

  async upsert(tenantId: string, pluginId: string, config: Record<string, unknown>, enabled = false) {
    const [r] = await db.insert(pluginConfigs).values({ tenantId, pluginId, config, enabled })
      .onConflictDoUpdate({
        target: [pluginConfigs.tenantId, pluginConfigs.pluginId],
        set: { config, updatedAt: new Date() },
      }).returning();
    return r!;
  }

  async setEnabled(tenantId: string, pluginId: string, enabled: boolean) {
    const [r] = await db.update(pluginConfigs).set({ enabled, updatedAt: new Date() })
      .where(and(eq(pluginConfigs.tenantId, tenantId), eq(pluginConfigs.pluginId, pluginId))).returning();
    return r ?? null;
  }
}
