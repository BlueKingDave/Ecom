import { db } from '../db';
import { products } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import type { FulfillmentPlugin } from '../plugins/interfaces';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  compareAtPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  images: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  externalId: z.string().optional(),
  pluginId: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export class CatalogService {
  /**
   * Get all products for a tenant
   */
  async getProducts(tenantId: string, options?: { limit?: number; offset?: number }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get a single product by ID
   */
  async getProduct(tenantId: string, productId: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);

    return product;
  }

  /**
   * Create a new product
   */
  async createProduct(tenantId: string, data: z.infer<typeof createProductSchema>) {
    const [product] = await db
      .insert(products)
      .values({
        tenantId,
        ...data,
      })
      .returning();

    if (!product) {
      throw new Error('Failed to create product');
    }

    return product;
  }

  /**
   * Update a product
   */
  async updateProduct(
    tenantId: string,
    productId: string,
    data: z.infer<typeof updateProductSchema>
  ) {
    const [product] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .returning();

    return product;
  }

  /**
   * Delete (soft delete) a product
   */
  async deleteProduct(tenantId: string, productId: string) {
    const [product] = await db
      .update(products)
      .set({ isActive: false })
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .returning();

    return product;
  }

  /**
   * Sync products from external plugin
   */
  async syncFromPlugin(tenantId: string, pluginId: string, externalProducts: any[]) {
    const results = [];

    for (const extProduct of externalProducts) {
      // Check if product already exists
      const [existing] = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            eq(products.pluginId, pluginId),
            eq(products.externalId, extProduct.externalId)
          )
        )
        .limit(1);

      // Extract inventoryCount from metadata if present
      const inventoryCount =
        typeof extProduct.metadata?.inventoryCount === 'number'
          ? extProduct.metadata.inventoryCount
          : null;

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(products)
          .set({
            name: extProduct.name,
            description: extProduct.description,
            price: extProduct.price,
            images: extProduct.images,
            metadata: extProduct.metadata,
            ...(inventoryCount !== null ? { inventoryCount } : {}),
            updatedAt: new Date(),
          })
          .where(eq(products.id, existing.id))
          .returning();

        results.push(updated);
      } else {
        // Create new
        const [created] = await db
          .insert(products)
          .values({
            tenantId,
            pluginId,
            externalId: extProduct.externalId,
            name: extProduct.name,
            description: extProduct.description,
            price: extProduct.price,
            images: extProduct.images || [],
            metadata: extProduct.metadata || {},
            ...(inventoryCount !== null ? { inventoryCount } : {}),
          })
          .returning();

        results.push(created);
      }
    }

    return results;
  }

  /**
   * Orchestrate catalog sync from a plugin instance
   */
  async syncFromPluginInstance(
    tenantId: string,
    pluginId: string,
    plugin: FulfillmentPlugin
  ): Promise<{ synced: number }> {
    const syncFn = plugin.syncCatalog || plugin.syncProducts;
    const externalProducts = await syncFn.call(plugin);
    // Normalize price: plugin may return number (cents/dollars), we need decimal string
    const normalized = externalProducts.map((p) => ({
      ...p,
      price: String(p.price),
    }));
    const results = await this.syncFromPlugin(tenantId, pluginId, normalized);
    return { synced: results.length };
  }
}
