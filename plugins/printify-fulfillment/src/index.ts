import fetch from 'node-fetch';

export interface BasePlugin {
  id: string;
  name: string;
  version: string;
  initialize(config: Record<string, unknown>): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface Product {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  metadata?: Record<string, unknown>;
}

export interface Order {
  id: string;
  items: Array<{
    productId: string;
    externalId?: string;
    quantity: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  total: number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';

export interface FulfillmentPlugin extends BasePlugin {
  syncProducts(): Promise<Product[]>;
  createOrder(order: Order): Promise<string>;
  getOrderStatus(externalId: string): Promise<OrderStatus>;
  cancelOrder(externalId: string): Promise<void>;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
  }>;
  variants: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
  }>;
}

interface PrintifyOrder {
  id: string;
  status: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
  }>;
}

export class PrintifyFulfillmentPlugin implements FulfillmentPlugin {
  id = 'printify-fulfillment';
  name = 'Printify Fulfillment';
  version = '1.0.0';

  private apiToken?: string;
  private shopId?: string;
  private baseUrl = 'https://api.printify.com/v1';

  async initialize(config: Record<string, unknown>): Promise<void> {
    const apiToken = config.apiToken as string;
    const shopId = config.shopId as string;

    if (!apiToken || !shopId) {
      throw new Error('Printify API token and Shop ID are required');
    }

    this.apiToken = apiToken;
    this.shopId = shopId;
    // autoPublish config available in config but not yet implemented

    console.log(`[Printify Plugin] Initialized for shop ${shopId}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/shops.json');
      return response.ok;
    } catch (error) {
      console.error('[Printify Plugin] Health check failed:', error);
      return false;
    }
  }

  async syncProducts(): Promise<Product[]> {
    if (!this.shopId) {
      throw new Error('Printify plugin not initialized');
    }

    try {
      const response = await this.makeRequest(`/shops/${this.shopId}/products.json`);
      const data = await response.json() as { data: PrintifyProduct[] };

      const products: Product[] = data.data.map((item) => {
        const enabledVariant = item.variants.find((v) => v.is_enabled);
        const price = enabledVariant?.price || 0;

        return {
          externalId: item.id,
          name: item.title,
          description: item.description,
          price: price / 100, // Convert cents to dollars
          images: item.images.map((img) => img.src),
          metadata: {
            printifyProductId: item.id,
            variants: item.variants.length,
            hasImages: item.images.length > 0,
          },
        };
      });

      console.log(`[Printify Plugin] Synced ${products.length} products`);
      return products;
    } catch (error) {
      console.error('[Printify Plugin] Failed to sync products:', error);
      throw error;
    }
  }

  async createOrder(order: Order): Promise<string> {
    if (!this.shopId) {
      throw new Error('Printify plugin not initialized');
    }

    try {
      // Map order items to Printify format
      const lineItems = order.items.map((item) => ({
        product_id: item.externalId || item.productId,
        variant_id: 1, // Default variant, should be configurable
        quantity: item.quantity,
      }));

      // Create Printify order
      const orderData = {
        external_id: order.id,
        label: `Order ${order.id}`,
        line_items: lineItems,
        shipping_method: 1, // Standard shipping
        send_shipping_notification: false,
        address_to: {
          first_name: order.shippingAddress.firstName,
          last_name: order.shippingAddress.lastName,
          email: order.shippingAddress.email,
          phone: order.shippingAddress.phone,
          country: order.shippingAddress.country,
          region: order.shippingAddress.state,
          address1: order.shippingAddress.address,
          city: order.shippingAddress.city,
          zip: order.shippingAddress.postalCode,
        },
      };

      const response = await this.makeRequest(
        `/shops/${this.shopId}/orders.json`,
        'POST',
        orderData
      );

      const result = await response.json() as PrintifyOrder;

      console.log(`[Printify Plugin] Created order: ${result.id}`);
      return result.id;
    } catch (error) {
      console.error('[Printify Plugin] Failed to create order:', error);
      throw error;
    }
  }

  async getOrderStatus(externalId: string): Promise<OrderStatus> {
    if (!this.shopId) {
      throw new Error('Printify plugin not initialized');
    }

    try {
      const response = await this.makeRequest(
        `/shops/${this.shopId}/orders/${externalId}.json`
      );
      const order = await response.json() as PrintifyOrder;

      return this.mapPrintifyStatus(order.status);
    } catch (error) {
      console.error('[Printify Plugin] Failed to get order status:', error);
      return 'failed';
    }
  }

  async cancelOrder(externalId: string): Promise<void> {
    if (!this.shopId) {
      throw new Error('Printify plugin not initialized');
    }

    try {
      await this.makeRequest(
        `/shops/${this.shopId}/orders/${externalId}/cancel.json`,
        'POST'
      );

      console.log(`[Printify Plugin] Cancelled order: ${externalId}`);
    } catch (error) {
      console.error('[Printify Plugin] Failed to cancel order:', error);
      throw error;
    }
  }

  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: unknown
  ): Promise<any> {
    if (!this.apiToken) {
      throw new Error('Printify plugin not initialized');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options: any = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Printify API error: ${response.status} - ${error}`);
    }

    return response;
  }

  private mapPrintifyStatus(printifyStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      'on-hold': 'pending',
      'payment-not-received': 'pending',
      'in-production': 'processing',
      'shipped': 'completed',
      'canceled': 'cancelled',
      'failed': 'failed',
    };

    return statusMap[printifyStatus] || 'pending';
  }
}

export default PrintifyFulfillmentPlugin;
