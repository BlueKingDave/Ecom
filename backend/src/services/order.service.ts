import { db } from '../db';
import { orders } from '../db/schema';
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

export class OrderService {
  /**
   * Get all orders for a tenant
   */
  async getOrders(tenantId: string, options?: { limit?: number; offset?: number; userId?: string }) {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let query = db
      .select()
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    if (options?.userId) {
      query = db
        .select()
        .from(orders)
        .where(and(eq(orders.tenantId, tenantId), eq(orders.userId, options.userId)))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return query;
  }

  /**
   * Get a single order by ID
   */
  async getOrder(tenantId: string, orderId: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .limit(1);

    return order;
  }

  /**
   * Create a new order
   */
  async createOrder(tenantId: string, data: z.infer<typeof createOrderSchema>) {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    const tax = subtotal * 0.08; // 8% tax rate (simplified)
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    const [order] = await db
      .insert(orders)
      .values({
        tenantId,
        userId: data.userId || null,
        items: data.items,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress || data.shippingAddress,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        status: 'pending',
        metadata: data.metadata || {},
      })
      .returning();

    if (!order) {
      throw new Error('Failed to create order');
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    tenantId: string,
    orderId: string,
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
  ) {
    const [order] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .returning();

    return order;
  }

  /**
   * Update order with external ID (from fulfillment plugin)
   */
  async updateExternalId(tenantId: string, orderId: string, externalId: string, pluginId: string) {
    const [order] = await db
      .update(orders)
      .set({
        externalId,
        pluginId,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .returning();

    return order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(tenantId: string, orderId: string) {
    return this.updateOrderStatus(tenantId, orderId, 'cancelled');
  }

  /**
   * Get an order by external provider ID
   */
  async getOrderByExternalId(tenantId: string, externalId: string) {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.externalId, externalId)))
      .limit(1);

    return order;
  }

  /**
   * Update tracking info from fulfillment provider
   */
  async updateTrackingInfo(
    tenantId: string,
    orderId: string,
    trackingNumber: string,
    carrierCode?: string
  ) {
    const [order] = await db
      .update(orders)
      .set({
        trackingNumber,
        carrierCode: carrierCode || null,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
      .returning();

    return order;
  }
}
