# Stripe Payment Plugin

Official Stripe payment processing plugin for Ecom Platform.

## Features

- ✅ Payment Intent creation with automatic payment methods
- ✅ Payment capture and authorization
- ✅ Full and partial refunds
- ✅ Webhook signature verification
- ✅ Customer creation and management
- ✅ Secure API key handling with encryption
- ✅ Event emission for payment lifecycle

## Installation

This plugin is already included in the monorepo. To use it in your tenant:

1. Configure plugin in admin dashboard or via API:

```typescript
POST /api/plugins/stripe-payment/config
{
  "tenantId": "your-tenant-id",
  "config": {
    "secretKey": "sk_test_...",
    "publishableKey": "pk_test_...",
    "webhookSecret": "whsec_...",
    "currency": "usd"
  }
}
```

2. Enable the plugin:

```typescript
POST /api/plugins/stripe-payment/enable
{
  "tenantId": "your-tenant-id"
}
```

## Configuration

| Field | Required | Description |
|-------|----------|-------------|
| `secretKey` | Yes | Stripe Secret Key (encrypted) |
| `publishableKey` | Yes | Stripe Publishable Key |
| `webhookSecret` | No | Webhook signing secret |
| `currency` | No | Default currency (default: usd) |

## Usage

### Creating a Payment Intent

```typescript
const paymentIntent = await stripePlugin.createPaymentIntent(29.99, {
  orderId: '123',
  customerId: '456',
  productName: 'Custom T-Shirt'
});

// Returns:
{
  id: 'pi_...',
  clientSecret: 'pi_..._secret_...',
  amount: 2999,
  currency: 'usd',
  status: 'requires_payment_method'
}
```

### Capturing a Payment

```typescript
await stripePlugin.capturePayment('pi_...');
```

### Processing a Refund

```typescript
// Full refund
const refund = await stripePlugin.refundPayment('pi_...');

// Partial refund
const partialRefund = await stripePlugin.refundPayment('pi_...', 10.00);
```

### Webhook Handling

```typescript
app.post('/webhooks/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  await stripePlugin.handleWebhook(req.body, signature);
  
  res.json({ received: true });
});
```

## Events

**Subscribes to:**
- `order.created` - Creates payment intent when order is placed
- `order.cancelled` - Refunds payment if order is cancelled

**Publishes:**
- `payment.succeeded` - Payment completed successfully
- `payment.failed` - Payment failed
- `payment.refunded` - Refund processed

## Testing

Use Stripe test mode credentials:

```bash
# Test cards
4242 4242 4242 4242  # Succeeds
4000 0000 0000 9995  # Fails (insufficient funds)
4000 0025 0000 3155  # Requires authentication
```

See [Stripe Testing Docs](https://stripe.com/docs/testing) for more test cards.

## Security

- API keys are encrypted at rest in the database
- Webhook signatures are verified to prevent tampering
- All communication uses HTTPS (enforced in production)
- Sensitive metadata is sanitized before sending to Stripe

## Health Check

The plugin includes a health check that verifies API connectivity:

```typescript
const isHealthy = await stripePlugin.healthCheck();
// Returns true if Stripe API is accessible
```

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Set up webhook secret for signature verification
- [ ] Enable HTTPS for webhook endpoint
- [ ] Test payment flow end-to-end
- [ ] Configure proper error handling and logging
- [ ] Set up Stripe dashboard monitoring

## Support

For Stripe-specific issues, refer to:
- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)

For plugin issues, open an issue in the monorepo.
