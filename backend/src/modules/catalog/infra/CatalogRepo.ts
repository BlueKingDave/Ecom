import { db } from '../../../shared/infra/db';
import { products } from '../../../shared/infra/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

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

export class CatalogRepo {
  async findAll(tenantId: string, options?: { limit?: number; offset?: number }) {
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

  async findById(tenantId: string, productId: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .limit(1);
    return product;
  }

  async findByExternalId(tenantId: string, pluginId: string, externalId: string) {
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.pluginId, pluginId),
          eq(products.externalId, externalId)
        )
      )
      .limit(1);
    return product;
  }

  async create(tenantId: string, data: z.infer<typeof createProductSchema>) {
    const [product] = await db.insert(products).values({ tenantId, ...data }).returning();
    if (!product) throw new Error('Failed to create product');
    return product;
  }

  async update(tenantId: string, productId: string, data: z.infer<typeof updateProductSchema>) {
    const [product] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .returning();
    return product;
  }

  async softDelete(tenantId: string, productId: string) {
    const [product] = await db
      .update(products)
      .set({ isActive: false })
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
      .returning();
    return product;
  }

  async upsertExternal(
    tenantId: string,
    pluginId: string,
    extProduct: { externalId: string; name: string; description?: string; price: string; images?: unknown[]; metadata?: Record<string, unknown> }
  ) {
    const existing = await this.findByExternalId(tenantId, pluginId, extProduct.externalId);
    const inventoryCount =
      typeof (extProduct.metadata as any)?.inventoryCount === 'number'
        ? (extProduct.metadata as any).inventoryCount
        : null;

    if (existing) {
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
      return updated;
    } else {
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
      return created;
    }
  }
}
