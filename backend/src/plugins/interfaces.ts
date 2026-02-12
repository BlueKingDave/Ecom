/**
 * Plugin Type Definitions
 * Standard interfaces that all plugins must implement
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: 'fulfillment' | 'payment' | 'ad_platform' | 'analytics';
  description?: string;
  author?: string;
  main: string; // Entry point file
  config: Record<string, ConfigField>;
  events?: {
    subscribes?: string[];
    publishes?: string[];
  };
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
  encrypted?: boolean;
  description?: string;
  default?: unknown;
}

export interface BasePlugin {
  id: string;
  name: string;
  version: string;

  /**
   * Initialize plugin with configuration
   */
  initialize(config: Record<string, unknown>): Promise<void>;

  /**
   * Health check - verify plugin can connect to external service
   */
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;

  /**
   * Handle webhooks from external service
   */
  handleWebhook?(payload: unknown): Promise<void>;
}

/**
 * Fulfillment Plugin Interface
 */
export interface FulfillmentPlugin extends BasePlugin {
  /**
   * Sync product catalog from provider
   */
  syncProducts(): Promise<Product[]>;

  /**
   * Get single product from provider
   */
  getProduct(externalId: string): Promise<Product>;

  /**
   * Create order with provider
   */
  createOrder(order: Order): Promise<string>; // Returns external order ID

  /**
   * Get order status from provider
   */
  getOrderStatus(externalId: string): Promise<OrderStatus>;

  /**
   * Cancel order with provider
   */
  cancelOrder(externalId: string): Promise<void>;
}

/**
 * Payment Plugin Interface
 */
export interface PaymentPlugin extends BasePlugin {
  /**
   * Create payment intent
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, unknown>
  ): Promise<PaymentIntent>;

  /**
   * Capture payment
   */
  capturePayment(intentId: string): Promise<void>;

  /**
   * Refund payment
   */
  refundPayment(intentId: string, amount?: number): Promise<Refund>;
}

/**
 * Ad Platform Plugin Interface
 */
export interface AdPlatformPlugin extends BasePlugin {
  /**
   * Create ad campaign
   */
  createCampaign(config: CampaignConfig): Promise<string>; // Returns external campaign ID

  /**
   * Update campaign
   */
  updateCampaign(id: string, updates: Partial<CampaignConfig>): Promise<void>;

  /**
   * Pause campaign
   */
  pauseCampaign(id: string): Promise<void>;

  /**
   * Resume campaign
   */
  resumeCampaign(id: string): Promise<void>;

  /**
   * Delete campaign
   */
  deleteCampaign(id: string): Promise<void>;

  /**
   * Track conversion event
   */
  trackConversion(event: ConversionEvent): Promise<void>;

  /**
   * Get campaign metrics
   */
  getCampaignMetrics(id: string, dateRange: DateRange): Promise<Metrics>;
}

// Type definitions used by plugins
export interface Product {
  externalId: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  images: string[];
  metadata?: Record<string, unknown>;
}

export interface Order {
  id: string;
  items: Array<{
    productId: string;
    externalId?: string;
    quantity: number;
    price: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  customer: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface OrderStatus {
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  trackingNumber?: string;
  carrierCode?: string;
  estimatedDelivery?: Date;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  clientSecret?: string;
}

export interface Refund {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
}

export interface CampaignConfig {
  name: string;
  budget: number;
  dailyBudget?: number;
  startDate?: Date;
  endDate?: Date;
  targeting: {
    ageMin?: number;
    ageMax?: number;
    gender?: 'all' | 'male' | 'female';
    locations?: string[];
    interests?: string[];
  };
  creative: {
    title: string;
    description: string;
    images: string[];
    callToAction?: string;
  };
}

export interface ConversionEvent {
  event: 'AddToCart' | 'Purchase' | 'ViewContent' | 'Lead';
  value: number;
  currency: string;
  userId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpc: number; // Cost per click
  cpa: number; // Cost per acquisition
  roas: number; // Return on ad spend
}
