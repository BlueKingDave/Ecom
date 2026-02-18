import { CatalogRepo, createProductSchema, updateProductSchema } from '../infra/CatalogRepo';
import type { FulfillmentPlugin } from '../../../plugins/interfaces';
import { z } from 'zod';

export { createProductSchema, updateProductSchema };

export class CatalogService {
  constructor(private repo = new CatalogRepo()) {}

  async getProducts(tenantId: string, options?: { limit?: number; offset?: number }) {
    return this.repo.findAll(tenantId, options);
  }

  async getProduct(tenantId: string, productId: string) {
    return this.repo.findById(tenantId, productId);
  }

  async createProduct(tenantId: string, data: z.infer<typeof createProductSchema>) {
    return this.repo.create(tenantId, data);
  }

  async updateProduct(tenantId: string, productId: string, data: z.infer<typeof updateProductSchema>) {
    return this.repo.update(tenantId, productId, data);
  }

  async deleteProduct(tenantId: string, productId: string) {
    return this.repo.softDelete(tenantId, productId);
  }

  async syncFromPlugin(tenantId: string, pluginId: string, externalProducts: any[]) {
    const results = [];
    for (const extProduct of externalProducts) {
      results.push(await this.repo.upsertExternal(tenantId, pluginId, extProduct));
    }
    return results;
  }

  async syncFromPluginInstance(
    tenantId: string,
    pluginId: string,
    plugin: FulfillmentPlugin
  ): Promise<{ synced: number }> {
    const syncFn = plugin.syncCatalog || plugin.syncProducts;
    const externalProducts = await syncFn.call(plugin);
    const normalized = externalProducts.map((p) => ({
      ...p,
      price: String(p.price),
    }));
    const results = await this.syncFromPlugin(tenantId, pluginId, normalized);
    return { synced: results.length };
  }
}
