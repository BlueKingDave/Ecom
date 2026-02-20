import { CartRepo } from '../infra/CartRepo';
import type { Cart, CartItem } from '../domain/Cart';

export type { CartItem, Cart };

export class CartService {
  constructor(private repo = new CartRepo()) {}

  async getCart(sessionId: string): Promise<Cart> {
    try {
      const cart = await this.repo.get(sessionId);
      return cart ?? { items: [], subtotal: '0.00', itemCount: 0 };
    } catch (error) {
      console.error('Redis error, returning empty cart:', error);
      return { items: [], subtotal: '0.00', itemCount: 0 };
    }
  }

  async addItem(sessionId: string, item: CartItem): Promise<Cart> {
    const cart = await this.getCart(sessionId);
    const existingIndex = cart.items.findIndex((i) => i.productId === item.productId);
    if (existingIndex >= 0) {
      cart.items[existingIndex]!.quantity += item.quantity;
    } else {
      cart.items.push(item);
    }
    this.calculateTotals(cart);
    await this.repo.save(sessionId, cart);
    return cart;
  }

  async updateItemQuantity(sessionId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(sessionId);
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex]!.quantity = quantity;
      }
    }
    this.calculateTotals(cart);
    await this.repo.save(sessionId, cart);
    return cart;
  }

  async removeItem(sessionId: string, productId: string): Promise<Cart> {
    return this.updateItemQuantity(sessionId, productId, 0);
  }

  async clearCart(sessionId: string): Promise<void> {
    await this.repo.delete(sessionId);
  }

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
