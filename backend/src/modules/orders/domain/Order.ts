export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  tenantId: string;
  userId?: string | null;
  externalId?: string | null;
  pluginId?: string | null;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  items: unknown;
  shippingAddress?: unknown;
  billingAddress?: unknown;
  trackingNumber?: string | null;
  carrierCode?: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}
