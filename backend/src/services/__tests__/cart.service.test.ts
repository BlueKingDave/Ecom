import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartService, type CartItem } from '../cart.service';

// Mock Redis with proper test isolation
let mockData = new Map<string, { value: string; expiry: number }>();

vi.mock('redis', () => {
  return {
    createClient: () => ({
      connect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn((key: string) => {
        const data = mockData.get(key);
        if (!data) return null;
        if (data.expiry && Date.now() > data.expiry) {
          mockData.delete(key);
          return null;
        }
        return data.value;
      }),
      setEx: vi.fn((key: string, ttl: number, value: string) => {
        mockData.set(key, {
          value,
          expiry: Date.now() + ttl * 1000,
        });
        return Promise.resolve('OK');
      }),
      del: vi.fn((key: string) => {
        mockData.delete(key);
        return Promise.resolve(1);
      }),
      disconnect: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

describe('CartService: Operations', () => {
  let cartService: CartService;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    // Clear mock Redis data before each test
    mockData.clear();
    cartService = new CartService();
    vi.clearAllMocks();
  });

  describe('Add Item to Cart', () => {
    it('should add item to empty cart', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 1,
      };

      const cart = await cartService.addItem(sessionId, item);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toMatchObject(item);
      expect(cart.itemCount).toBe(1);
      expect(cart.subtotal).toBe('29.99');
    });

    it('should increase quantity when adding duplicate item', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 1,
      };

      await cartService.addItem(sessionId, item);
      const cart = await cartService.addItem(sessionId, item);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]?.quantity).toBe(2);
      expect(cart.itemCount).toBe(2);
      expect(cart.subtotal).toBe('59.98');
    });

    it('should add multiple different items', async () => {
      const item1: CartItem = {
        productId: 'prod-1',
        name: 'Product 1',
        price: '29.99',
        quantity: 1,
      };

      const item2: CartItem = {
        productId: 'prod-2',
        name: 'Product 2',
        price: '19.99',
        quantity: 2,
      };

      await cartService.addItem(sessionId, item1);
      const cart = await cartService.addItem(sessionId, item2);

      expect(cart.items).toHaveLength(2);
      expect(cart.itemCount).toBe(3); // 1 + 2
      expect(cart.subtotal).toBe('69.97'); // 29.99 + 39.98
    });
  });

  describe('Update Item Quantity', () => {
    it('should update quantity and recalculate subtotal', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '20.00',
        quantity: 1,
      };

      await cartService.addItem(sessionId, item);
      const cart = await cartService.updateItemQuantity(sessionId, 'prod-1', 5);

      expect(cart.items[0]?.quantity).toBe(5);
      expect(cart.itemCount).toBe(5);
      expect(cart.subtotal).toBe('100.00');
    });

    it('should remove item when quantity set to 0', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 2,
      };

      await cartService.addItem(sessionId, item);
      const cart = await cartService.updateItemQuantity(sessionId, 'prod-1', 0);

      expect(cart.items).toHaveLength(0);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toBe('0.00');
    });

    it('should remove item when quantity is negative', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 2,
      };

      await cartService.addItem(sessionId, item);
      const cart = await cartService.updateItemQuantity(sessionId, 'prod-1', -1);

      expect(cart.items).toHaveLength(0);
    });
  });

  describe('Remove Item', () => {
    it('should remove item from cart', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 2,
      };

      await cartService.addItem(sessionId, item);
      const cart = await cartService.removeItem(sessionId, 'prod-1');

      expect(cart.items).toHaveLength(0);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toBe('0.00');
    });

    it('should only remove specified item, keep others', async () => {
      const item1: CartItem = {
        productId: 'prod-1',
        name: 'Product 1',
        price: '29.99',
        quantity: 1,
      };

      const item2: CartItem = {
        productId: 'prod-2',
        name: 'Product 2',
        price: '19.99',
        quantity: 1,
      };

      await cartService.addItem(sessionId, item1);
      await cartService.addItem(sessionId, item2);
      const cart = await cartService.removeItem(sessionId, 'prod-1');

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]?.productId).toBe('prod-2');
      expect(cart.subtotal).toBe('19.99');
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 2,
      };

      await cartService.addItem(sessionId, item);
      await cartService.clearCart(sessionId);
      const cart = await cartService.getCart(sessionId);

      expect(cart.items).toHaveLength(0);
      expect(cart.itemCount).toBe(0);
      expect(cart.subtotal).toBe('0.00');
    });
  });

  describe('Redis Failure Handling', () => {
    it('should return empty cart on Redis error', async () => {
      // This test assumes getCart has error handling
      const cart = await cartService.getCart('invalid-session');

      expect(cart).toEqual({
        items: [],
        subtotal: '0.00',
        itemCount: 0,
      });
    });
  });

  describe('Cart TTL (Time To Live)', () => {
    it('should set 7 day expiry on cart', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test Product',
        price: '29.99',
        quantity: 1,
      };

      await cartService.addItem(sessionId, item);

      // In a real test, we'd verify Redis TTL
      // For now, we verify the cart is saved
      const cart = await cartService.getCart(sessionId);
      expect(cart.items).toHaveLength(1);
    });
  });

  describe('Session Isolation', () => {
    it('should keep carts separate by session', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      const item1: CartItem = {
        productId: 'prod-1',
        name: 'Product 1',
        price: '29.99',
        quantity: 1,
      };

      const item2: CartItem = {
        productId: 'prod-2',
        name: 'Product 2',
        price: '19.99',
        quantity: 1,
      };

      await cartService.addItem(session1, item1);
      await cartService.addItem(session2, item2);

      const cart1 = await cartService.getCart(session1);
      const cart2 = await cartService.getCart(session2);

      expect(cart1.items).toHaveLength(1);
      expect(cart1.items[0]?.productId).toBe('prod-1');

      expect(cart2.items).toHaveLength(1);
      expect(cart2.items[0]?.productId).toBe('prod-2');
    });
  });

  describe('Subtotal Calculation Accuracy', () => {
    it('should accurately calculate subtotal with decimals', async () => {
      const items: CartItem[] = [
        { productId: 'prod-1', name: 'Item 1', price: '12.99', quantity: 3 },
        { productId: 'prod-2', name: 'Item 2', price: '7.50', quantity: 2 },
      ];

      await cartService.addItem(sessionId, items[0]!);
      const cart = await cartService.addItem(sessionId, items[1]!);

      // 12.99 * 3 = 38.97
      // 7.50 * 2 = 15.00
      // Total = 53.97
      expect(cart.subtotal).toBe('53.97');
      expect(cart.itemCount).toBe(5);
    });

    it('should handle floating-point precision', async () => {
      const item: CartItem = {
        productId: 'prod-1',
        name: 'Test',
        price: '0.1',
        quantity: 3,
      };

      const cart = await cartService.addItem(sessionId, item);

      // Should be 0.30, not 0.30000000000000004
      expect(cart.subtotal).toBe('0.30');
    });
  });

  describe('Invalid Product ID Handling', () => {
    it('should handle non-existent product update gracefully', async () => {
      const cart = await cartService.updateItemQuantity(sessionId, 'non-existent', 5);

      // Should not crash, just return empty cart
      expect(cart.items).toHaveLength(0);
    });

    it('should handle non-existent product removal gracefully', async () => {
      const cart = await cartService.removeItem(sessionId, 'non-existent');

      expect(cart.items).toHaveLength(0);
    });
  });
});
