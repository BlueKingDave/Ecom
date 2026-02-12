import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: redisUrl });
    await redisClient.connect();
  }
  return redisClient;
}

export interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
  metadata?: Record<string, unknown>;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
  itemCount: number;
}

export class CartService {
  private getCartKey(sessionId: string): string {
    return `cart:${sessionId}`;
  }

  /**
   * Get cart for session
   */
  async getCart(sessionId: string): Promise<Cart> {
    try {
      const redis = await getRedisClient();
      const cartData = await redis.get(this.getCartKey(sessionId));

      if (!cartData) {
        return { items: [], subtotal: '0.00', itemCount: 0 };
      }

      const cart = JSON.parse(cartData) as Cart;
      return cart;
    } catch (error) {
      console.error('Redis error, returning empty cart:', error);
      return { items: [], subtotal: '0.00', itemCount: 0 };
    }
  }

  /**
   * Add item to cart
   */
  async addItem(sessionId: string, item: CartItem): Promise<Cart> {
    const cart = await this.getCart(sessionId);

    // Check if item already exists
    const existingIndex = cart.items.findIndex((i) => i.productId === item.productId);

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex]!.quantity += item.quantity;
    } else {
      // Add new item
      cart.items.push(item);
    }

    // Recalculate totals
    this.calculateTotals(cart);

    // Save to Redis with 7 day expiry
    const redis = await getRedisClient();
    await redis.setEx(this.getCartKey(sessionId), 60 * 60 * 24 * 7, JSON.stringify(cart));

    return cart;
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(sessionId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(sessionId);

    const itemIndex = cart.items.findIndex((i) => i.productId === productId);

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item
        cart.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.items[itemIndex]!.quantity = quantity;
      }
    }

    this.calculateTotals(cart);

    const redis = await getRedisClient();
    await redis.setEx(this.getCartKey(sessionId), 60 * 60 * 24 * 7, JSON.stringify(cart));

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(sessionId: string, productId: string): Promise<Cart> {
    return this.updateItemQuantity(sessionId, productId, 0);
  }

  /**
   * Clear cart
   */
  async clearCart(sessionId: string): Promise<void> {
    const redis = await getRedisClient();
    await redis.del(this.getCartKey(sessionId));
  }

  /**
   * Calculate cart totals
   */
  private calculateTotals(cart: Cart): void {
    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      subtotal += parseFloat(item.price) * item.quantity;
      itemCount += item.quantity;
    }

    cart.subtotal = subtotal.toFixed(2);
    cart.itemCount = itemCount;
  }
}
