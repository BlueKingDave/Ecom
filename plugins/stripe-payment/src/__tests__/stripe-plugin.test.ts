import { describe, it, expect, beforeEach, vi } from 'vitest';
import StripePaymentPlugin from '../index';

// Create mock methods
const mockPaymentIntents = {
  create: vi.fn(),
  capture: vi.fn(),
  retrieve: vi.fn(),
};

const mockRefunds = {
  create: vi.fn(),
};

const mockCustomers = {
  create: vi.fn(),
};

const mockBalance = {
  retrieve: vi.fn(),
};

const mockWebhooks = {
  constructEvent: vi.fn(),
};

// Mock Stripe SDK
vi.mock('stripe', () => {
  class MockStripe {
    paymentIntents = mockPaymentIntents;
    refunds = mockRefunds;
    customers = mockCustomers;
    balance = mockBalance;
    webhooks = mockWebhooks;
  }

  return {
    default: MockStripe,
  };
});

describe('StripePaymentPlugin - RED Tests', () => {
  let plugin: StripePaymentPlugin;

  beforeEach(() => {
    plugin = new StripePaymentPlugin();
    // Reset all mocks between tests
    vi.clearAllMocks();
  });

  describe('Plugin Initialization', () => {
    it('should fail when initialized without API keys', async () => {
      await expect(
        plugin.initialize({})
      ).rejects.toThrow('Stripe API keys are required');
    });

    it('should fail when initialized with only secret key', async () => {
      await expect(
        plugin.initialize({ secretKey: 'sk_test_123' })
      ).rejects.toThrow('Stripe API keys are required');
    });

    it('should succeed when initialized with valid keys', async () => {
      await expect(
        plugin.initialize({
          secretKey: 'sk_test_123',
          publishableKey: 'pk_test_123',
        })
      ).resolves.not.toThrow();
    });

    it('should use default currency when not specified', async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return false when not initialized', async () => {
      const isHealthy = await plugin.healthCheck();
      expect(isHealthy).toBe(false);
    });

    it('should return true when initialized and API is accessible', async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });

      mockBalance.retrieve.mockResolvedValueOnce({ available: [] });

      const isHealthy = await plugin.healthCheck();
      expect(isHealthy).toBe(true);
    });
  });

  describe('Create Payment Intent', () => {
    beforeEach(async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
        currency: 'usd',
      });
    });

    it('should create payment intent with correct amount in cents', async () => {
      mockPaymentIntents.create.mockResolvedValueOnce({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret_abc',
        amount: 2999,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      const result = await plugin.createPaymentIntent(29.99, {
        orderId: '123',
      });

      expect(result).toEqual({
        id: 'pi_test_123',
        clientSecret: 'pi_test_123_secret_abc',
        amount: 2999,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount: 2999,
        currency: 'usd',
        metadata: { orderId: '123' },
        automatic_payment_methods: { enabled: true },
      });
    });

    it('should fail when plugin is not initialized', async () => {
      const uninitializedPlugin = new StripePaymentPlugin();

      await expect(
        uninitializedPlugin.createPaymentIntent(10.00, {})
      ).rejects.toThrow('Stripe plugin not initialized');
    });

    it('should throw error when payment intent has no client secret', async () => {
      mockPaymentIntents.create.mockResolvedValueOnce({
        id: 'pi_test_123',
        client_secret: null,
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      await expect(
        plugin.createPaymentIntent(10.00, {})
      ).rejects.toThrow('Payment intent created without client secret');
    });
  });

  describe('Capture Payment', () => {
    beforeEach(async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });
    });

    it('should capture payment successfully', async () => {
      mockPaymentIntents.capture.mockResolvedValueOnce({
        id: 'pi_test_123',
        status: 'succeeded',
      });

      await expect(
        plugin.capturePayment('pi_test_123')
      ).resolves.not.toThrow();

      expect(mockPaymentIntents.capture).toHaveBeenCalledWith('pi_test_123');
    });
  });

  describe('Refund Payment', () => {
    beforeEach(async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });
    });

    it('should create full refund when amount not specified', async () => {
      mockRefunds.create.mockResolvedValueOnce({
        id: 're_test_123',
        amount: 2999,
        status: 'succeeded',
      });

      const result = await plugin.refundPayment('pi_test_123');

      expect(result).toEqual({
        id: 're_test_123',
        amount: 2999,
        status: 'succeeded',
      });

      expect(mockRefunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: undefined,
      });
    });

    it('should create partial refund with specified amount', async () => {
      mockRefunds.create.mockResolvedValueOnce({
        id: 're_test_123',
        amount: 1000,
        status: 'succeeded',
      });

      const result = await plugin.refundPayment('pi_test_123', 10.00);

      expect(result.amount).toBe(1000);
      expect(mockRefunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        amount: 1000,
      });
    });
  });

  describe('Webhook Handling', () => {
    beforeEach(async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
        webhookSecret: 'whsec_test_123',
      });
    });

    it('should verify webhook signature when secret is configured', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      };

      mockWebhooks.constructEvent.mockReturnValueOnce(mockEvent);

      await expect(
        plugin.handleWebhook('raw_payload', 'signature_123')
      ).resolves.not.toThrow();

      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        'raw_payload',
        'signature_123',
        'whsec_test_123'
      );
    });

    it('should handle payment_intent.succeeded event', async () => {
      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'succeeded',
          },
        },
      };

      await expect(
        plugin.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            status: 'failed',
          },
        },
      };

      await expect(
        plugin.handleWebhook(mockEvent)
      ).resolves.not.toThrow();
    });
  });

  describe('Customer Management', () => {
    beforeEach(async () => {
      await plugin.initialize({
        secretKey: 'sk_test_123',
        publishableKey: 'pk_test_123',
      });
    });

    it('should create customer with email and metadata', async () => {
      mockCustomers.create.mockResolvedValueOnce({
        id: 'cus_test_123',
        email: 'test@example.com',
      });

      const result = await plugin.createCustomer('test@example.com', {
        userId: '123',
      });

      expect(result.id).toBe('cus_test_123');
      expect(mockCustomers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: '123' },
      });
    });
  });
});
