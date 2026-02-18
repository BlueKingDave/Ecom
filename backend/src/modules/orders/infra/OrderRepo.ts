import { db } from '../../../shared/infra/db';
import { orders } from '../../../shared/infra/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

export const createOrderSchema = z.object({
  userId: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      price: z.string(),
      name: z.string(),
      image: z.string().optional(),
    })
  ),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
    phone: z.string().optional(),
  }),
  billingAddress: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export class OrderRepo {
  async findAll(tenantId: string, options?: { limit?: number; offset?: number; userId?: string }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    if (options?.userId) {
      return db
        .select()
        .from(orders)
        .where(and(eq(orders.tenantId, tenantId), eq(orders.userId, options.userId)))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);
    }
    return db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findById(tenantId: string, orderId: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);
    return order;
  }

  async findByExternalId(tenantId: string, externalId: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.externalId, externalId)))
      .limit(1);
    return order;
  }

  async create(tenantId: string, data: z.infer<typeof createOrderSchema> & {
    subtotal: string; tax: string; shipping: string; total: string;
  }) {
    const [order] = await db
      .insert(orders)
      .values({
        tenantId,
        userId: data.userId || null,
        items: data.items,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        subtotal: data.subtotal,
        tax: data.tax,
        shipping: data.shipping,
        total: data.total,
        status: 'pending',
        metadata: data.metadata || {},
      })
      .returning();
    if (!order) throw new Error('Failed to create order');
    return order;
  }

  async updateStatus(tenantId: string, orderId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .returning();
    return order;
  }

  async updateExternalId(tenantId: string, orderId: string, externalId: string, pluginId: string) {
    const [order] = await db
      .update(orders)
      .set({ externalId, pluginId, updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .returning();
    return order;
  }

  async updateTracking(tenantId: string, orderId: string, trackingNumber: string, carrierCode?: string) {
    const [order] = await db
      .update(orders)
      .set({ trackingNumber, carrierCode: carrierCode || null, status: 'completed', updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .returning();
    return order;
  }
}
