# Printify Fulfillment Plugin

Official Printify print-on-demand fulfillment plugin for Ecom Platform.

## Features

- ✅ Product catalog synchronization
- ✅ Automated order creation and submission
- ✅ Order status tracking
- ✅ Order cancellation support
- ✅ Secure API token handling with encryption
- ✅ Event emission for fulfillment lifecycle
- ✅ Health check for API connectivity

## Installation

This plugin is already included in the monorepo. To use it in your tenant:

1. Get your Printify API credentials:
   - Login to [Printify Dashboard](https://printify.com/)
   - Go to Settings → API → Generate new token
   - Note your Shop ID from the dashboard

2. Configure plugin in admin dashboard or via API:

```typescript
POST /api/plugins/printify-fulfillment/config
{
  "tenantId": "your-tenant-id",
  "config": {
    "apiToken": "your_printify_api_token",
    "shopId": "your_shop_id",
    "autoPublish": true
  }
}
```

3. Enable the plugin:

```typescript
POST /api/plugins/printify-fulfillment/enable
{
  "tenantId": "your-tenant-id"
}
```

## Configuration

| Field | Required | Description |
|-------|----------|-------------|
| `apiToken` | Yes | Printify API Token (encrypted) |
| `shopId` | Yes | Your Printify Shop ID |
| `autoPublish` | No | Auto-publish products (default: true) |

## Usage

### Syncing Products

```typescript
const products = await printifyPlugin.syncProducts();

// Returns array of products:
[
  {
    externalId: "5e16...",
    name: "Custom T-Shirt",
    description: "Personalized t-shirt...",
    price: 29.99,
    images: ["https://..."],
    metadata: {
      printifyProductId: "5e16...",
      variants: 12,
      hasImages: true
    }
  }
]
```

### Creating an Order

```typescript
const externalOrderId = await printifyPlugin.createOrder({
  id: "order_123",
  items: [
    {
      productId: "prod_456",
      externalId: "5e16...", // Printify product ID
      quantity: 2
    }
  ],
  shippingAddress: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "US"
  },
  total: 59.98
});

// Returns Printify order ID
```

### Checking Order Status

```typescript
const status = await printifyPlugin.getOrderStatus("printify_order_id");
// Returns: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed'
```

### Cancelling an Order

```typescript
await printifyPlugin.cancelOrder("printify_order_id");
```

## Events

**Subscribes to:**
- `order.created` - Automatically creates fulfillment order in Printify
- `product.sync_requested` - Syncs products from Printify catalog

**Publishes:**
- `fulfillment.status_changed` - Order status updated
- `product.synced` - Products synchronized successfully

## Printify Order Status Mapping

| Printify Status | Platform Status |
|----------------|-----------------|
| on-hold | pending |
| payment-not-received | pending |
| in-production | processing |
| shipped | completed |
| canceled | cancelled |
| failed | failed |

## Webhook Integration

Printify webhooks will be supported in a future update. For now, use polling to check order status updates.

## Testing

1. Create a test shop in Printify
2. Add sample products to your catalog
3. Use the plugin to sync products
4. Create test orders (Printify has a sandbox mode)

## Production Checklist

- [ ] Obtain production Printify API token
- [ ] Configure correct Shop ID
- [ ] Test product sync with your catalog
- [ ] Verify order creation flow end-to-end
- [ ] Set up proper error handling and logging
- [ ] Monitor Printify API rate limits
- [ ] Configure webhook endpoint (when available)

## API Rate Limits

Printify API has rate limits:
- 120 requests per minute
- Be mindful when syncing large catalogs
- Implement proper retry logic for rate limit errors

## Support

For Printify-specific issues, refer to:
- [Printify API Docs](https://developers.printify.com/)
- [Printify Help Center](https://help.printify.com/)

For plugin issues, open an issue in the monorepo.

## Roadmap

- [ ] Webhook support for real-time order updates
- [ ] Auto-publish feature implementation
- [ ] Variant selection in order creation
- [ ] Custom shipping method selection
- [ ] Product template management
- [ ] Bulk order creation
