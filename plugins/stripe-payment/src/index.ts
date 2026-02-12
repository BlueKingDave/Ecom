import Stripe from 'stripe';

export interface BasePlugin {
  id: string;
  name: string;
  version: string;
  initialize(config: Record<string, unknown>): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export interface PaymentPlugin extends BasePlugin {
  createPaymentIntent(amount: number, metadata: Record<string, unknown>): Promise<PaymentIntent>;
  capturePayment(intentId: string): Promise<void>;
  refundPayment(intentId: string, amount?: number): Promise<Refund>;
  handleWebhook(payload: unknown, signature?: string): Promise<void>;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface Refund {
  id: string;
  amount: number;
  status: string | null;
}

export class StripePaymentPlugin implements PaymentPlugin {
  id = 'stripe-payment';
  name = 'Stripe Payment';
  version = '1.0.0';

  private stripe?: Stripe;
  private config?: {
    secretKey: string;
    publishableKey: string;
    webhookSecret?: string;
    currency?: string;
  };

  async initialize(config: Record<string, unknown>): Promise<void> {
    const secretKey = config.secretKey as string;
    const publishableKey = config.publishableKey as string;
    const webhookSecret = config.webhookSecret as string | undefined;
    const currency = (config.currency as string) || 'usd';

    if (!secretKey || !publishableKey) {
      throw new Error('Stripe API keys are required');
    }

    this.config = {
      secretKey,
      publishableKey,
      webhookSecret,
      currency,
    };

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    console.log(`[Stripe Plugin] Initialized with ${currency.toUpperCase()} currency`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.stripe) {
        return false;
      }

      // Verify API key by retrieving account
      await this.stripe.balance.retrieve();
      return true;
    } catch (error) {
      console.error('[Stripe Plugin] Health check failed:', error);
      return false;
    }
  }

  async createPaymentIntent(
    amount: number,
    metadata: Record<string, unknown>
  ): Promise<PaymentIntent> {
    if (!this.stripe || !this.config) {
      throw new Error('Stripe plugin not initialized');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: this.config.currency || 'usd',
        metadata: this.sanitizeMetadata(metadata),
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Payment intent created without client secret');
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('[Stripe Plugin] Failed to create payment intent:', error);
      throw error;
    }
  }

  async capturePayment(intentId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe plugin not initialized');
    }

    try {
      await this.stripe.paymentIntents.capture(intentId);
      console.log(`[Stripe Plugin] Captured payment: ${intentId}`);
    } catch (error) {
      console.error('[Stripe Plugin] Failed to capture payment:', error);
      throw error;
    }
  }

  async refundPayment(intentId: string, amount?: number): Promise<Refund> {
    if (!this.stripe) {
      throw new Error('Stripe plugin not initialized');
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: intentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      };
    } catch (error) {
      console.error('[Stripe Plugin] Failed to create refund:', error);
      throw error;
    }
  }

  async handleWebhook(payload: unknown, signature?: string): Promise<void> {
    if (!this.stripe || !this.config) {
      throw new Error('Stripe plugin not initialized');
    }

    try {
      let event: Stripe.Event;

      if (signature && this.config.webhookSecret) {
        // Verify webhook signature
        event = this.stripe.webhooks.constructEvent(
          payload as string | Buffer,
          signature,
          this.config.webhookSecret
        );
      } else {
        // For testing without signature verification
        event = payload as Stripe.Event;
      }

      console.log(`[Stripe Plugin] Received webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;

        default:
          console.log(`[Stripe Plugin] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('[Stripe Plugin] Webhook handling failed:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`[Stripe Plugin] Payment succeeded: ${paymentIntent.id}`);
    // Emit payment.succeeded event to core system
    // The plugin registry will handle this
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`[Stripe Plugin] Payment failed: ${paymentIntent.id}`);
    // Emit payment.failed event to core system
  }

  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    console.log(`[Stripe Plugin] Refund processed for charge: ${charge.id}`);
    // Emit payment.refunded event to core system
  }

  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string> {
    // Stripe metadata must be string key-value pairs
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        sanitized[key] = value;
      } else if (value !== null && value !== undefined) {
        sanitized[key] = JSON.stringify(value);
      }
    }

    return sanitized;
  }

  // Additional helper methods for common operations
  async getPaymentIntent(intentId: string): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) {
      throw new Error('Stripe plugin not initialized');
    }

    try {
      return await this.stripe.paymentIntents.retrieve(intentId);
    } catch (error) {
      console.error('[Stripe Plugin] Failed to retrieve payment intent:', error);
      return null;
    }
  }

  async createCustomer(
    email: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new Error('Stripe plugin not initialized');
    }

    return await this.stripe.customers.create({
      email,
      metadata: this.sanitizeMetadata(metadata),
    });
  }
}

export default StripePaymentPlugin;
