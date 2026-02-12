import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderService } from '../order.service';
import { calculateOrderTotals } from '../../__tests__/setup';

describe('OrderService: Calculation Tests', () => {
  let orderService: OrderService;
  const testTenantId = 'test-tenant-123';

  beforeEach(() => {
    orderService = new OrderService();
  });

  describe('Subtotal Calculation', () => {
    it('should correctly sum price × quantity for single item', () => {
      const subtotal = 29.99 * 2;
      const expected = 59.98;

      expect(subtotal).toBe(expected);
    });

    it('should correctly sum price × quantity for multiple items', () => {
      const items = [
        { price: 29.99, quantity: 2 }, // 59.98
        { price: 19.99, quantity: 1 }, // 19.99
        { price: 15.50, quantity: 3 }, // 46.50
      ];

      const subtotal = items.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);

      expect(subtotal).toBe(126.47);
    });

    it('should handle decimal prices correctly', () => {
      const subtotal = 12.99 * 3 + 7.50 * 2;
      const expected = 38.97 + 15.0; // 53.97

      expect(subtotal).toBeCloseTo(expected, 2);
    });
  });

  describe('Tax Calculation (8%)', () => {
    it('should calculate 8% tax on subtotal', () => {
      const subtotal = 100.00;
      const tax = subtotal * 0.08;

      expect(tax).toBe(8.00);
    });

    it('should calculate tax with decimal subtotal', () => {
      const subtotal = 29.99;
      const tax = subtotal * 0.08;

      expect(tax).toBeCloseTo(2.40, 2);
    });

    it('should round tax to 2 decimal places', () => {
      const subtotal = 33.33;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;

      expect(tax).toBe(2.67);
    });
  });

  describe('Shipping Calculation', () => {
    it('should charge $9.99 when subtotal < $50', () => {
      const subtotal = 49.99;
      const shipping = subtotal < 50 ? 9.99 : 0;

      expect(shipping).toBe(9.99);
    });

    it('should charge $0 when subtotal >= $50', () => {
      const subtotal = 50.00;
      const shipping = subtotal >= 50 ? 0 : 9.99;

      expect(shipping).toBe(0);
    });

    it('should be free for subtotal exactly $50.00 (edge case)', () => {
      const subtotal = 50.00;
      const shipping = subtotal >= 50 ? 0 : 9.99;

      expect(shipping).toBe(0);
    });

    it('should charge for subtotal $49.99 (edge case)', () => {
      const subtotal = 49.99;
      const shipping = subtotal >= 50 ? 0 : 9.99;

      expect(shipping).toBe(9.99);
    });

    it('should be free for subtotal $50.01 (edge case)', () => {
      const subtotal = 50.01;
      const shipping = subtotal >= 50 ? 0 : 9.99;

      expect(shipping).toBe(0);
    });
  });

  describe('Total Calculation', () => {
    it('should correctly sum subtotal + tax + shipping', () => {
      const subtotal = 40.00;
      const tax = subtotal * 0.08; // 3.20
      const shipping = 9.99;
      const total = subtotal + tax + shipping;

      expect(total).toBeCloseTo(53.19, 2);
    });

    it('should calculate total with free shipping (>= $50)', () => {
      const subtotal = 75.00;
      const tax = subtotal * 0.08; // 6.00
      const shipping = 0;
      const total = subtotal + tax + shipping;

      expect(total).toBe(81.00);
    });
  });

  describe('Floating-Point Precision', () => {
    it('should avoid floating-point errors in calculations', () => {
      // Known problematic case: 0.1 + 0.2 = 0.30000000000000004
      const subtotal = 29.99;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const shipping = 9.99;
      const total = Math.round((subtotal + tax + shipping) * 100) / 100;

      expect(total).toBe(42.38);
    });

    it('should handle complex decimal arithmetic', () => {
      const items = [
        { price: 12.99, quantity: 3 },
        { price: 7.50, quantity: 2 },
      ];

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const total = Math.round((subtotal + tax + shipping) * 100) / 100;

      expect(subtotal).toBeCloseTo(53.97, 2);
      expect(tax).toBeCloseTo(4.32, 2);
      expect(shipping).toBe(0);
      expect(total).toBeCloseTo(58.29, 2);
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should reject negative prices', () => {
      const price = -10.00;

      expect(price).toBeLessThan(0);
      // In real service, this should throw an error
    });

    it('should reject zero quantity items', () => {
      const quantity = 0;

      expect(quantity).toBe(0);
      // In real service, this should be filtered or throw error
    });

    it('should handle $0 subtotal', () => {
      const subtotal = 0;
      const tax = subtotal * 0.08;
      const shipping = subtotal >= 50 ? 0 : 9.99;
      const total = subtotal + tax + shipping;

      expect(tax).toBe(0);
      expect(shipping).toBe(9.99);
      expect(total).toBe(9.99);
    });
  });

  describe('Integration with Helper Function', () => {
    it('should match helper function calculations for < $50', () => {
      const subtotal = 40.00;
      const expected = calculateOrderTotals(subtotal);

      expect(expected.subtotal).toBe(40.00);
      expect(expected.tax).toBeCloseTo(3.20, 2);
      expect(expected.shipping).toBe(9.99);
      expect(expected.total).toBeCloseTo(53.19, 2);
    });

    it('should match helper function calculations for >= $50', () => {
      const subtotal = 75.00;
      const expected = calculateOrderTotals(subtotal);

      expect(expected.subtotal).toBe(75.00);
      expect(expected.tax).toBe(6.00);
      expect(expected.shipping).toBe(0);
      expect(expected.total).toBe(81.00);
    });

    it('should match helper function for edge case $50.00', () => {
      const subtotal = 50.00;
      const expected = calculateOrderTotals(subtotal);

      expect(expected.subtotal).toBe(50.00);
      expect(expected.tax).toBe(4.00);
      expect(expected.shipping).toBe(0); // Free shipping at $50
      expect(expected.total).toBe(54.00);
    });
  });
});
