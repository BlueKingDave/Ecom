import { describe, it, expect, beforeEach, vi } from 'vitest';
import PrintifyFulfillmentPlugin from '../index';
import type { Order } from '../index';

// Mock node-fetch (must be before mockFetch declaration due to hoisting)
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

// Import the mocked fetch
import fetch from 'node-fetch';
const mockFetch = fetch as ReturnType<typeof vi.fn>;

describe('PrintifyFulfillmentPlugin - RED Tests', () => {
  let plugin: PrintifyFulfillmentPlugin;

  beforeEach(() => {
    plugin = new PrintifyFulfillmentPlugin();
    // Reset all mocks between tests
    vi.clearAllMocks();
  });

  describe('Plugin Initialization', () => {
    it('should fail when initialized without API token', async () => {
      await expect(
        plugin.initialize({ shopId: 'shop_123' })
      ).rejects.toThrow('Printify API token and Shop ID are required');
    });

    it('should fail when initialized without Shop ID', async () => {
      await expect(
        plugin.initialize({ apiToken: 'token_123' })
      ).rejects.toThrow('Printify API token and Shop ID are required');
    });

    it('should succeed when initialized with valid credentials', async () => {
      await expect(
        plugin.initialize({
          apiToken: 'token_123',
          shopId: 'shop_123',
        })
      ).resolves.not.toThrow();
    });

    it('should store credentials after initialization', async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return false when not initialized', async () => {
      const isHealthy = await plugin.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return true when API is accessible', async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

      const isHealthy = await plugin.healthCheck();
      expect(isHealthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.printify.com/v1/shops.json',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer token_123',
          }),
        })
      );
    });

    it('should return false when API call fails', async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const isHealthy = await plugin.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Sync Products', () => {
    beforeEach(async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });
    });

    it('should fail when plugin is not initialized', async () => {
      const uninitializedPlugin = new PrintifyFulfillmentPlugin();

      await expect(
        uninitializedPlugin.syncProducts()
      ).rejects.toThrow('Printify plugin not initialized');
    });

    it('should sync products and convert price from cents to dollars', async () => {
      const mockProducts = {
        data: [
          {
            id: 'prod_1',
            title: 'Cool T-Shirt',
            description: 'A very cool t-shirt',
            images: [
              { src: 'https://example.com/image1.jpg', variant_ids: [1], position: '1' },
              { src: 'https://example.com/image2.jpg', variant_ids: [1], position: '2' },
            ],
            variants: [
              { id: 1, price: 2999, is_enabled: true },
              { id: 2, price: 3499, is_enabled: false },
            ],
          },
          {
            id: 'prod_2',
            title: 'Awesome Mug',
            description: 'A very awesome mug',
            images: [
              { src: 'https://example.com/mug.jpg', variant_ids: [3], position: '1' },
            ],
            variants: [
              { id: 3, price: 1499, is_enabled: true },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await plugin.syncProducts();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        externalId: 'prod_1',
        name: 'Cool T-Shirt',
        description: 'A very cool t-shirt',
        price: 29.99, // Converted from 2999 cents
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
        metadata: {
          printifyProductId: 'prod_1',
          variants: 2,
          hasImages: true,
        },
      });

      expect(result[1].price).toBe(14.99); // 1499 cents to dollars

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.printify.com/v1/shops/shop_123/products.json',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle products with no enabled variants', async () => {
      const mockProducts = {
        data: [
          {
            id: 'prod_1',
            title: 'Out of Stock Product',
            description: 'No available variants',
            images: [],
            variants: [
              { id: 1, price: 2999, is_enabled: false },
            ],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await plugin.syncProducts();

      expect(result[0].price).toBe(0); // No enabled variant
    });
  });

  describe('Create Order', () => {
    beforeEach(async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });
    });

    it('should fail when plugin is not initialized', async () => {
      const uninitializedPlugin = new PrintifyFulfillmentPlugin();
      const mockOrder: Order = {
        id: 'order_123',
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        total: 29.99,
      };

      await expect(
        uninitializedPlugin.createOrder(mockOrder)
      ).rejects.toThrow('Printify plugin not initialized');
    });

    it('should create order with proper address mapping', async () => {
      const mockOrder: Order = {
        id: 'order_123',
        items: [
          { productId: 'prod_1', externalId: 'ext_prod_1', quantity: 2 },
          { productId: 'prod_2', quantity: 1 },
        ],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        total: 89.97,
      };

      const mockResponse = {
        id: 'printify_order_456',
        status: 'on-hold',
        line_items: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await plugin.createOrder(mockOrder);

      expect(result).toBe('printify_order_456');

      // Verify the request was made with correct data
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.printify.com/v1/shops/shop_123/orders.json',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            external_id: 'order_123',
            label: 'Order order_123',
            line_items: [
              { product_id: 'ext_prod_1', variant_id: 1, quantity: 2 },
              { product_id: 'prod_2', variant_id: 1, quantity: 1 },
            ],
            shipping_method: 1,
            send_shipping_notification: false,
            address_to: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              phone: '1234567890',
              country: 'US',
              region: 'NY',
              address1: '123 Main St',
              city: 'New York',
              zip: '10001',
            },
          }),
        })
      );
    });

    it('should handle API errors when creating order', async () => {
      const mockOrder: Order = {
        id: 'order_123',
        items: [{ productId: 'prod_1', quantity: 1 }],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        total: 29.99,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid order data',
      });

      await expect(
        plugin.createOrder(mockOrder)
      ).rejects.toThrow('Printify API error: 400 - Invalid order data');
    });
  });

  describe('Get Order Status', () => {
    beforeEach(async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });
    });

    it('should fail when plugin is not initialized', async () => {
      const uninitializedPlugin = new PrintifyFulfillmentPlugin();

      await expect(
        uninitializedPlugin.getOrderStatus('order_123')
      ).rejects.toThrow('Printify plugin not initialized');
    });

    it('should map "on-hold" status to "pending"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_123',
          status: 'on-hold',
          line_items: [],
        }),
      });

      const status = await plugin.getOrderStatus('order_123');
      expect(status).toBe('pending');
    });

    it('should map "in-production" status to "processing"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_123',
          status: 'in-production',
          line_items: [],
        }),
      });

      const status = await plugin.getOrderStatus('order_123');
      expect(status).toBe('processing');
    });

    it('should map "shipped" status to "completed"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_123',
          status: 'shipped',
          line_items: [],
        }),
      });

      const status = await plugin.getOrderStatus('order_123');
      expect(status).toBe('completed');
    });

    it('should map "canceled" status to "cancelled"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_123',
          status: 'canceled',
          line_items: [],
        }),
      });

      const status = await plugin.getOrderStatus('order_123');
      expect(status).toBe('cancelled');
    });

    it('should return "failed" on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Order not found',
      });

      const status = await plugin.getOrderStatus('order_123');
      expect(status).toBe('failed');
    });

    it('should map unknown status to "pending"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_123',
          status: 'unknown-status',
          line_items: [],
        }),
      });

      const status = await plugin.getOrderStatus('order_123');
      expect(status).toBe('pending');
    });
  });

  describe('Cancel Order', () => {
    beforeEach(async () => {
      await plugin.initialize({
        apiToken: 'token_123',
        shopId: 'shop_123',
      });
    });

    it('should fail when plugin is not initialized', async () => {
      const uninitializedPlugin = new PrintifyFulfillmentPlugin();

      await expect(
        uninitializedPlugin.cancelOrder('order_123')
      ).rejects.toThrow('Printify plugin not initialized');
    });

    it('should cancel order successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        plugin.cancelOrder('order_123')
      ).resolves.not.toThrow();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.printify.com/v1/shops/shop_123/orders/order_123/cancel.json',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle API errors when cancelling order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Cannot cancel shipped order',
      });

      await expect(
        plugin.cancelOrder('order_123')
      ).rejects.toThrow('Printify API error: 400 - Cannot cancel shipped order');
    });
  });
});
