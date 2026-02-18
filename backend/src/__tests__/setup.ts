import { beforeAll, afterAll, beforeEach } from 'vitest';
import { hashPassword } from '../shared/infra/password';

/**
 * Test fixtures - shared test data
 */
export const fixtures = {
  // Test tenant
  tenant: {
    id: 'test-tenant-id-123',
    slug: 'test-store',
    name: 'Test Store',
    domain: 'test.localhost',
    themeConfig: {
      primaryColor: '#3b82f6',
      logo: '/logo.png',
      theme: 'modern',
    },
  },

  // Test users with hashed passwords
  users: {
    admin: {
      id: 'test-admin-id-123',
      email: 'admin@test.local',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'operator' as const,
      emailVerified: true,
    },
    customer: {
      id: 'test-customer-id-123',
      email: 'customer@test.local',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Customer',
      role: 'customer' as const,
      emailVerified: true,
    },
  },

  // Test products
  products: [
    {
      id: 'test-product-1',
      name: 'Test T-Shirt',
      description: 'A test t-shirt product',
      price: '29.99',
      compareAtPrice: '39.99',
      images: ['/products/test-1.jpg'],
      isActive: true,
      metadata: {
        category: 'apparel',
        sizes: ['S', 'M', 'L', 'XL'],
      },
    },
    {
      id: 'test-product-2',
      name: 'Test Mug',
      description: 'A test mug product',
      price: '19.99',
      images: ['/products/test-2.jpg'],
      isActive: true,
      metadata: {
        category: 'home',
      },
    },
    {
      id: 'test-product-3',
      name: 'Expensive Item',
      description: 'For testing shipping thresholds',
      price: '75.00',
      images: ['/products/test-3.jpg'],
      isActive: true,
      metadata: {
        category: 'premium',
      },
    },
  ],

  // Test plugin configs
  plugins: {
    stripe: {
      id: 'stripe-payment',
      config: {
        publishableKey: 'pk_test_placeholder',
        secretKey: 'sk_test_placeholder',
        webhookSecret: 'whsec_placeholder',
        currency: 'usd',
      },
    },
  },
};

/**
 * Helper to generate hashed passwords for test users
 */
export async function getHashedTestPasswords() {
  return {
    admin: await hashPassword(fixtures.users.admin.password),
    customer: await hashPassword(fixtures.users.customer.password),
  };
}

/**
 * Helper to create test JWT token payload
 */
export function createTestTokenPayload(user: {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'operator';
  tenantId?: string;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };
}

/**
 * Helper to calculate expected order totals
 */
export function calculateOrderTotals(subtotal: number) {
  const TAX_RATE = 0.08; // 8%
  const FREE_SHIPPING_THRESHOLD = 50.0;
  const STANDARD_SHIPPING = 9.99;

  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    shipping,
    total,
  };
}

/**
 * Global test setup
 */
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!';
});

/**
 * Global test teardown
 */
afterAll(async () => {
  // Cleanup if needed
});

/**
 * Reset state before each test
 */
beforeEach(async () => {
  // Reset can be implemented per test file as needed
});

/**
 * Mock helpers
 */
export const mocks = {
  /**
   * Mock Redis client
   */
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
  },

  /**
   * Mock Stripe client
   */
  stripe: {
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
    },
    refunds: {
      create: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },

  /**
   * Mock Printify client
   */
  printify: {
    orders: {
      create: vi.fn(),
      get: vi.fn(),
      list: vi.fn(),
      cancel: vi.fn(),
    },
    products: {
      list: vi.fn(),
      get: vi.fn(),
    },
  },
};

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Wait for a condition to be true
   */
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for condition');
  },

  /**
   * Sleep for a duration
   */
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};
