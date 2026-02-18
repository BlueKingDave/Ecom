import { OrderRepo, createOrderSchema } from '../infra/OrderRepo';
import { z } from 'zod';

export { createOrderSchema };

export class OrderService {
  constructor(private repo = new OrderRepo()) {}

  async getOrders(tenantId: string, options?: { limit?: number; offset?: number; userId?: string }) {
    return this.repo.findAll(tenantId, options);
  }

  async getOrder(tenantId: string, orderId: string) {
    return this.repo.findById(tenantId, orderId);
  }

  async createOrder(tenantId: string, data: z.infer<typeof createOrderSchema>) {
    const subtotal = data.items.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;
    return this.repo.create(tenantId, {
      ...data,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2),
    });
  }

  async updateOrderStatus(tenantId: string, orderId: string, status: 'pending' | 'processing' | 'completed' | 'cancelled') {
    return this.repo.updateStatus(tenantId, orderId, status);
  }

  async updateExternalId(tenantId: string, orderId: string, externalId: string, pluginId: string) {
    return this.repo.updateExternalId(tenantId, orderId, externalId, pluginId);
  }

  async cancelOrder(tenantId: string, orderId: string) {
    return this.updateOrderStatus(tenantId, orderId, 'cancelled');
  }

  async getOrderByExternalId(tenantId: string, externalId: string) {
    return this.repo.findByExternalId(tenantId, externalId);
  }

  async updateTrackingInfo(tenantId: string, orderId: string, trackingNumber: string, carrierCode?: string) {
    return this.repo.updateTracking(tenantId, orderId, trackingNumber, carrierCode);
  }
}
