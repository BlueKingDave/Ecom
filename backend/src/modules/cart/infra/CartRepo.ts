import { getRedisClient } from '../../../shared/infra/cache';
import type { Cart } from '../domain/Cart';

const CART_TTL = 60 * 60 * 24 * 7; // 7 days

export class CartRepo {
  private getKey(sessionId: string): string {
    return `cart:${sessionId}`;
  }

  async get(sessionId: string): Promise<Cart | null> {
    const redis = await getRedisClient();
    const data = await redis.get(this.getKey(sessionId));
    return data ? (JSON.parse(data) as Cart) : null;
  }

  async save(sessionId: string, cart: Cart): Promise<void> {
    const redis = await getRedisClient();
    await redis.setEx(this.getKey(sessionId), CART_TTL, JSON.stringify(cart));
  }

  async delete(sessionId: string): Promise<void> {
    const redis = await getRedisClient();
    await redis.del(this.getKey(sessionId));
  }
}
