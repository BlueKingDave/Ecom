# Modular Ecommerce Platform - Implementation Roadmap

## 🎯 Executive Summary

This document provides a comprehensive roadmap for building a **modular, multi-tenant ecommerce platform** with pluggable fulfillment providers and ad platforms. The architecture enables:

- **Multi-Tenancy**: Single backend serving multiple branded storefronts
- **Plugin Architecture**: Easily swap fulfillment providers (Printify, AliExpress, etc.) and ad platforms (Google, Meta, TikTok, etc.)
- **Unified Admin Dashboard**: Manage all storefronts, run parallel ad campaigns, and analyze cross-platform metrics
- **Event-Driven Design**: Scalable, resilient architecture with decoupled components

---

## 🏗️ Architecture Overview

### Three Core Principles

#### 1. 🔌 Plugin Modularity
Every external integration is a **plugin** with a standard interface:
- **Fulfillment Plugins**: Printify, AliExpress, Shopify, custom providers
- **Ad Platform Plugins**: Google Ads, Meta (FB/IG), TikTok, Twitter/X, Pinterest
- **Payment Plugins**: Stripe, PayPal, Square
- **Analytics Plugins**: GA4, Mixpanel, custom tracking

**Benefit**: Change providers without rewriting core logic. Add new platforms in days, not months.

#### 2. 🏪 Multi-Tenant Architecture
- Single codebase, multiple storefronts (store-a.com, store-b.com, etc.)
- Isolated data per tenant (`tenant_id` on all database tables)
- Shared infrastructure and plugins
- Custom domains, themes, and branding per storefront

**Benefit**: Launch new storefronts in minutes. Centralized management from admin dashboard.

#### 3. 📡 Event-Driven Design
- Core services publish **domain events** (`order.created`, `asset.uploaded`, etc.)
- Plugins **subscribe** to relevant events
- Async processing via message queue (Redis Streams or Google Pub/Sub)
- Decoupled, scalable communication

**Benefit**: Plugins don't block user requests. System scales independently.

---

## 📦 System Components

### Frontend Layer

#### **Multi-Tenant Storefronts** (React + Tailwind)
```
Storefront A (store-a.com)  →  Modern theme, Printify fulfillment
Storefront B (store-b.com)  →  Vintage theme, AliExpress fulfillment
Storefront N (store-n.com)  →  Custom theme, mixed fulfillment
```

**Shared Components**:
- Product gallery with AI preview
- Photo upload & cartoonification flow
- Shopping cart & checkout
- Order tracking
- Referral program UI

**Per-Tenant Configuration**:
- Custom domain & SSL
- Theme (colors, fonts, layout)
- Enabled features (referrals, AI, etc.)
- Fulfillment provider selection

#### **Admin Dashboard** (React + Tailwind + Shadcn)
Unified control plane for platform operators:

**Key Modules**:
1. **Storefront Manager**
   - Create/configure new storefronts
   - Domain mapping & SSL
   - Theme customization
   - Feature toggles per storefront

2. **Ad Campaign Manager** ⭐ Core Feature
   - Create campaigns across multiple platforms (Google, Meta, TikTok, etc.)
   - Run **parallel A/B tests** across platforms
   - Unified dashboard for all campaign metrics
   - Auto-pause underperforming campaigns
   - ROI tracking & attribution modeling

3. **Product Manager**
   - Bulk import from fulfillment providers
   - Trigger AI variant generation
   - Cross-storefront product assignment
   - Pricing rules & margin management

4. **Plugin Marketplace**
   - Browse available plugins
   - Install/configure/enable plugins
   - Per-tenant plugin configuration
   - View plugin health & logs

5. **Analytics Dashboard**
   - Cross-storefront performance
   - Funnel analysis (Upload → Cartoonify → Add to Cart → Purchase)
   - Customer cohort analysis
   - Revenue forecasting
   - Export reports (CSV, PDF)

6. **Order Manager**
   - View orders across all storefronts
   - Process refunds
   - Manage fulfillment status
   - Customer support tools

---

### Backend Layer (Node.js + TypeScript)

#### **API Gateway** (Express/Fastify)
- Routes requests based on `tenant_id` (from subdomain or custom domain)
- JWT authentication & authorization
- Rate limiting (per tenant, per IP)
- Request validation (Zod schemas)
- OpenAPI documentation

#### **Core Domain Services**
Each service is a **bounded context** with clear responsibilities:

| Service | Responsibilities |
|---------|-----------------|
| **Catalog Service** | Product CRUD, sync with fulfillment plugins, pricing |
| **Order Service** | Order lifecycle, fulfillment orchestration, status tracking |
| **Cart Service** | Shopping cart, discounts, tax calculation |
| **User Service** | Authentication, profiles, permissions (RBAC) |
| **Asset Service** | Media upload, cloud storage, AI job creation |
| **Campaign Service** | Ad campaign orchestration, multi-platform management |
| **Analytics Service** | Event tracking, metrics aggregation, reporting |

#### **Plugin System** ⭐ Heart of Modularity

**Plugin Manager**:
- **Registry**: Discover and load plugins dynamically
- **Lifecycle**: Install → Configure → Enable → Disable → Uninstall
- **Validation**: Ensure plugins implement required interfaces
- **Configuration**: Store per-tenant plugin settings (encrypted API keys)

**Plugin Interfaces** (TypeScript):

```typescript
// Fulfillment Plugin Interface
interface FulfillmentPlugin {
  id: string;
  name: string;
  version: string;

  // Catalog operations
  syncProducts(): Promise<Product[]>;
  getProduct(externalId: string): Promise<Product>;

  // Order operations
  createOrder(order: Order): Promise<ExternalOrderId>;
  getOrderStatus(externalId: ExternalOrderId): Promise<OrderStatus>;
  cancelOrder(externalId: ExternalOrderId): Promise<void>;

  // Webhook handling
  handleWebhook(payload: unknown): Promise<void>;
}

// Ad Platform Plugin Interface
interface AdPlatformPlugin {
  id: string;
  name: string;
  version: string;

  // Campaign management
  createCampaign(config: CampaignConfig): Promise<CampaignId>;
  updateCampaign(id: CampaignId, updates: Partial<CampaignConfig>): Promise<void>;
  pauseCampaign(id: CampaignId): Promise<void>;
  resumeCampaign(id: CampaignId): Promise<void>;
  deleteCampaign(id: CampaignId): Promise<void>;

  // Conversion tracking
  trackConversion(event: ConversionEvent): Promise<void>;

  // Analytics
  getCampaignMetrics(id: CampaignId, dateRange: DateRange): Promise<Metrics>;
  getAdGroupMetrics(campaignId: CampaignId): Promise<AdGroupMetrics[]>;
}

// Payment Plugin Interface
interface PaymentPlugin {
  id: string;
  name: string;
  version: string;

  createPaymentIntent(amount: number, metadata: object): Promise<PaymentIntent>;
  capturePayment(intentId: string): Promise<void>;
  refundPayment(intentId: string, amount?: number): Promise<Refund>;
  handleWebhook(payload: unknown): Promise<void>;
}
```

**Event-Driven Plugin Integration**:

```typescript
// Core system publishes events
eventBus.publish('order.created', {
  orderId: '123',
  tenantId: 'store-a',
  items: [...],
  total: 99.99,
  customer: {...}
});

// Fulfillment plugin subscribes
printifyPlugin.subscribe('order.created', async (event) => {
  // Only process if this tenant uses Printify
  const config = await getPluginConfig(event.tenantId, 'printify');
  if (!config.enabled) return;

  // Create order in Printify
  const externalId = await printifyPlugin.createOrder(event);

  // Update local order with external ID
  await orderService.updateExternalId(event.orderId, externalId);
});

// Ad platform plugin subscribes
googleAdsPlugin.subscribe('order.created', async (event) => {
  // Track conversion in Google Ads
  await googleAdsPlugin.trackConversion({
    event: 'Purchase',
    value: event.total,
    currency: 'USD',
    userId: event.customer.id
  });
});

// Multiple plugins can react to the same event!
metaAdsPlugin.subscribe('order.created', async (event) => {
  // Track conversion in Meta (Facebook/Instagram)
  await metaAdsPlugin.trackConversion({...});
});
```

#### **AI Cartoonification Service** (Node.js or Python)
- Consumes jobs from Event Bus
- Calls external AI APIs (Gemini, Replicate, Stability AI)
- Generates multiple style variants (4 per photo)
- Stores results to cloud storage
- Publishes `ai.completed` event

#### **Event Bus** (Redis Streams or Google Pub/Sub)
- Central message broker for domain events
- Pub/Sub pattern for decoupled communication
- Persistent queue for async jobs
- At-least-once delivery guarantee

---

### Data Layer

#### **PostgreSQL** (Multi-Tenant Database)
**Schema Strategy**: Single database, `tenant_id` column on all tables

**Key Tables**:
```sql
-- Tenants (storefronts)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,  -- store-a
  domain VARCHAR(255) UNIQUE,         -- store-a.com
  name VARCHAR(255),
  theme_config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users (customers & admins)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- NULL for admin users
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL,  -- customer | admin | operator
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products (catalog)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  external_id VARCHAR(255),  -- ID from fulfillment provider
  plugin_id VARCHAR(50),     -- which plugin manages this product
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  images JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  external_id VARCHAR(255),  -- ID from fulfillment provider
  plugin_id VARCHAR(50),     -- which plugin fulfilled this order
  status VARCHAR(20),
  total DECIMAL(10,2),
  items JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assets (uploaded photos, AI results)
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20),  -- original | cartoonified
  storage_path VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ad Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255),
  platform VARCHAR(50),  -- google | meta | tiktok | twitter
  plugin_id VARCHAR(50),
  external_id VARCHAR(255),  -- ID from ad platform
  status VARCHAR(20),  -- draft | active | paused | completed
  budget DECIMAL(10,2),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plugin Configurations (per tenant)
CREATE TABLE plugin_configs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  plugin_id VARCHAR(50),
  enabled BOOLEAN DEFAULT FALSE,
  config JSONB,  -- encrypted API keys, settings
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, plugin_id)
);
```

**Security**: Row-Level Security (RLS) policies to enforce tenant isolation.

#### **Redis** (Cache + Sessions)
- Product catalog cache (per tenant)
- User session storage
- Rate limiting counters
- Feature flags (per tenant)
- Real-time event counts

#### **Cloud Storage** (GCS or S3)
- User-uploaded photos: `/uploads/{tenant_id}/{user_id}/{photo_id}.jpg`
- Cartoonified results: `/results/{tenant_id}/{asset_id}/variant_{1-4}.jpg`
- Product assets: `/products/{tenant_id}/{product_id}/image.jpg`
- Storefront static assets: `/static/{tenant_id}/logo.png`

---

## 🔌 Plugin Development Guide

### Creating a New Fulfillment Plugin

**Example: Shopify Fulfillment Plugin**

1. **Create Plugin Structure**:
```
plugins/
  shopify-fulfillment/
    package.json
    manifest.json
    src/
      index.ts
      shopify-client.ts
      webhook-handler.ts
    README.md
```

2. **Define Manifest** (`manifest.json`):
```json
{
  "id": "shopify-fulfillment",
  "name": "Shopify Fulfillment",
  "version": "1.0.0",
  "type": "fulfillment",
  "main": "./dist/index.js",
  "author": "Your Name",
  "config": {
    "shopName": {
      "type": "string",
      "required": true,
      "description": "Your Shopify store name (e.g., mystore)"
    },
    "accessToken": {
      "type": "string",
      "required": true,
      "encrypted": true,
      "description": "Shopify Admin API access token"
    },
    "webhookSecret": {
      "type": "string",
      "required": true,
      "encrypted": true,
      "description": "Webhook verification secret"
    }
  },
  "events": {
    "subscribes": ["order.created", "product.updated"],
    "publishes": ["fulfillment.status_changed"]
  }
}
```

3. **Implement Interface** (`src/index.ts`):
```typescript
import { FulfillmentPlugin, Order, Product, OrderStatus } from '@platform/plugin-types';
import { ShopifyClient } from './shopify-client';

export default class ShopifyFulfillmentPlugin implements FulfillmentPlugin {
  id = 'shopify-fulfillment';
  name = 'Shopify Fulfillment';
  version = '1.0.0';

  private client: ShopifyClient;

  constructor(config: { shopName: string; accessToken: string }) {
    this.client = new ShopifyClient(config.shopName, config.accessToken);
  }

  async syncProducts(): Promise<Product[]> {
    const shopifyProducts = await this.client.getProducts();
    return shopifyProducts.map(this.mapToInternalProduct);
  }

  async createOrder(order: Order): Promise<string> {
    const shopifyOrder = await this.client.createOrder({
      line_items: order.items.map(item => ({
        product_id: item.externalId,
        quantity: item.quantity
      })),
      customer: {
        email: order.customer.email,
        first_name: order.customer.firstName,
        last_name: order.customer.lastName
      },
      shipping_address: order.shippingAddress
    });

    return shopifyOrder.id.toString();
  }

  async getOrderStatus(externalId: string): Promise<OrderStatus> {
    const order = await this.client.getOrder(externalId);
    return this.mapToInternalStatus(order.fulfillment_status);
  }

  async cancelOrder(externalId: string): Promise<void> {
    await this.client.cancelOrder(externalId);
  }

  async handleWebhook(payload: unknown): Promise<void> {
    // Verify webhook signature
    // Process fulfillment status updates
    // Emit events to core system
  }

  private mapToInternalProduct(shopifyProduct: any): Product {
    return {
      externalId: shopifyProduct.id.toString(),
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: parseFloat(shopifyProduct.variants[0].price),
      images: shopifyProduct.images.map(img => img.src),
      metadata: {
        variants: shopifyProduct.variants
      }
    };
  }

  private mapToInternalStatus(shopifyStatus: string): OrderStatus {
    const statusMap = {
      'pending': 'pending',
      'fulfilled': 'completed',
      'partial': 'processing',
      'cancelled': 'cancelled'
    };
    return statusMap[shopifyStatus] || 'pending';
  }
}
```

4. **Register Event Handlers**:
```typescript
// In core plugin system
pluginManager.on('plugin.loaded', async (plugin) => {
  if (plugin.manifest.events?.subscribes) {
    for (const eventType of plugin.manifest.events.subscribes) {
      eventBus.subscribe(eventType, async (event) => {
        // Filter by tenant
        const config = await getPluginConfig(event.tenantId, plugin.id);
        if (!config.enabled) return;

        // Call plugin handler
        await plugin.handleEvent(eventType, event);
      });
    }
  }
});
```

5. **Install & Configure**:
```bash
# Admin dashboard action
POST /api/admin/plugins/install
{
  "pluginId": "shopify-fulfillment",
  "tenantId": "store-a",
  "config": {
    "shopName": "mystore",
    "accessToken": "shpat_xxxxx",
    "webhookSecret": "whsec_xxxxx"
  }
}

# Enable for tenant
POST /api/admin/plugins/enable
{
  "tenantId": "store-a",
  "pluginId": "shopify-fulfillment"
}
```

### Creating an Ad Platform Plugin

**Example: Pinterest Ads Plugin**

```typescript
import { AdPlatformPlugin, CampaignConfig, ConversionEvent } from '@platform/plugin-types';

export default class PinterestAdsPlugin implements AdPlatformPlugin {
  id = 'pinterest-ads';
  name = 'Pinterest Ads';
  version = '1.0.0';

  async createCampaign(config: CampaignConfig): Promise<string> {
    // Call Pinterest Ads API
    const campaign = await this.pinterestClient.createCampaign({
      name: config.name,
      daily_spend_cap: config.dailyBudget * 100, // cents
      status: 'PAUSED' // Start paused for review
    });

    return campaign.id;
  }

  async trackConversion(event: ConversionEvent): Promise<void> {
    await this.pinterestClient.sendConversion({
      event_name: event.event,
      event_time: Date.now(),
      user_data: {
        em: [hashEmail(event.email)]
      },
      custom_data: {
        value: event.value,
        currency: event.currency
      }
    });
  }

  async getCampaignMetrics(id: string, dateRange: DateRange): Promise<Metrics> {
    const analytics = await this.pinterestClient.getAnalytics(id, dateRange);
    return {
      impressions: analytics.IMPRESSION,
      clicks: analytics.CLICKTHROUGH,
      conversions: analytics.CHECKOUT,
      spend: analytics.SPEND_IN_MICRO_DOLLAR / 1_000_000,
      cpc: analytics.CPC_IN_MICRO_DOLLAR / 1_000_000,
      roas: analytics.TOTAL_CHECKOUT_VALUE_IN_MICRO_DOLLAR / analytics.SPEND_IN_MICRO_DOLLAR
    };
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Weeks 1-4) - **50% COMPLETE** ✨
**Goal**: Core multi-tenant platform with basic plugin system

**Backend**: ✅ **COMPLETE**
- [x] Multi-tenant database schema ✅
  - Drizzle ORM with PostgreSQL
  - 7 tables: tenants, users, products, orders, assets, campaigns, plugin_configs
  - Row-level security ready, proper indexes and foreign keys
  - Migration: `drizzle/0000_striped_tusk.sql`

- [x] API Gateway with tenant routing ✅
  - Fastify server with plugin architecture
  - Tenant resolution (subdomain/custom domain/header)
  - OpenAPI/Swagger documentation at `/docs`
  - Global error handling and validation

- [x] Core domain services ✅
  - **Catalog Service**: Product CRUD, bulk sync from plugins
  - **Order Service**: Order lifecycle, status management, external ID tracking
  - **User Service**: User management, email verification, GDPR deletion
  - **Cart Service**: Redis-backed cart with 7-day expiry, session support
  - Full REST API: `/api/products`, `/api/orders`, `/api/cart`

- [x] JWT authentication & RBAC ✅
  - Access tokens (15min) + Refresh tokens (7 days)
  - Role-based auth: customer, admin, operator
  - `/api/auth/login`, `/api/auth/register`, `/api/auth/me`

- [x] Plugin registry & loader ✅
  - Plugin interfaces: Fulfillment, Payment, AdPlatform
  - Plugin registry with auto-discovery
  - Per-tenant plugin configuration
  - Health checks, enable/disable, lifecycle management
  - API: `/api/plugins/*`

**Frontend**: 🚧 **IN PROGRESS (2/3 complete)**
- [x] Storefront foundation ✅
  - React 18 + Vite + TypeScript
  - Tailwind CSS 4 with custom design tokens
  - React Router v6 + React Query (TanStack)
  - Shadcn/ui components (Button, Card)

- [x] Core pages ✅
  - **HomePage**: Hero, features, CTA sections
  - **ProductsPage**: Responsive product grid
  - **ProductDetailPage**: Product info, add to cart
  - Layout with header, footer, cart badge

- [ ] Shopping cart & checkout 🚧 **NEXT**
  - Cart page with item management
  - Checkout form with validation
  - Order creation flow

- [ ] Admin dashboard
  - Tenant management UI
  - Product management interface
  - Order management dashboard

**Infrastructure**: ⏳ **PENDING**
- [ ] PostgreSQL setup (Docker Compose ready, needs to run)
- [ ] Redis setup (Docker Compose ready, needs to run)
- [ ] Cloud Storage (GCS/S3) - configuration needed
- [ ] CI/CD pipeline - GitHub Actions

**Plugins**: ⏳ **PENDING**
- [ ] Stripe payment plugin - interfaces defined, needs implementation
- [ ] Printify fulfillment plugin - interfaces defined, needs implementation

---

**Progress**: 6/12 tasks completed (50%) 🎉
**Status**: Backend foundation complete, storefront 66% complete
**Next**: Complete cart/checkout flow, then admin dashboard

**Deliverable**: Single storefront with Printify + Stripe working.

---

### Phase 2: Event-Driven Architecture (Weeks 5-6)
**Goal**: Decouple system with Event Bus

**Backend**:
- [ ] Event Bus implementation (Redis Streams or Pub/Sub)
- [ ] Domain event publishing from core services
- [ ] Plugin event subscriptions
- [ ] Asset Service (photo uploads)
- [ ] AI Service (cartoonification job processor)

**Frontend**:
- [ ] Photo upload UI
- [ ] AI preview & variant selection
- [ ] Real-time job status updates (SSE or polling)

**Plugins**:
- [ ] Update Printify plugin to use events
- [ ] Update Stripe plugin to use events

**Deliverable**: AI cartoonification flow working end-to-end.

---

### Phase 3: Plugin Ecosystem (Weeks 7-9)
**Goal**: Multiple fulfillment providers

**Backend**:
- [ ] Plugin Manager (install/configure/enable/disable)
- [ ] Per-tenant plugin configuration storage
- [ ] Webhook routing to plugins
- [ ] Plugin health monitoring

**Admin Dashboard**:
- [ ] Plugin Marketplace UI
- [ ] Plugin installation flow
- [ ] Plugin configuration UI (per tenant)
- [ ] Plugin logs & debugging

**Plugins**:
- [ ] AliExpress fulfillment plugin
- [ ] Shopify fulfillment plugin
- [ ] PayPal payment plugin

**Deliverable**: Admin can switch fulfillment provider per storefront without code changes.

---

### Phase 4: Ad Platform Integration (Weeks 10-13)
**Goal**: Multi-platform ad campaign management ⭐

**Backend**:
- [ ] Campaign Service (orchestration)
- [ ] Analytics Service (metrics aggregation)

**Admin Dashboard**:
- [ ] Ad Campaign Manager UI
  - [ ] Multi-platform campaign creation
  - [ ] Campaign configuration forms
  - [ ] Budget & scheduling
  - [ ] Audience targeting (per platform)
- [ ] Analytics Dashboard
  - [ ] Unified metrics across platforms
  - [ ] Campaign comparison
  - [ ] ROI calculation
  - [ ] Attribution modeling

**Plugins**:
- [ ] Google Ads plugin
- [ ] Meta Ads plugin (Facebook + Instagram)
- [ ] TikTok Ads plugin
- [ ] Twitter/X Ads plugin
- [ ] GA4 analytics plugin

**Deliverable**: Run parallel campaigns across Google, Meta, and TikTok from admin dashboard.

---

### Phase 5: Advanced Features (Weeks 14-16)
**Goal**: A/B testing, optimization, analytics

**Backend**:
- [ ] A/B testing framework (feature flags per tenant)
- [ ] Campaign auto-optimization (pause low performers)
- [ ] Referral system
- [ ] Email integration

**Admin Dashboard**:
- [ ] A/B test configuration
- [ ] Auto-pause rules for campaigns
- [ ] Advanced analytics (cohorts, funnels)
- [ ] Export reports (CSV, PDF)

**Plugins**:
- [ ] Mailchimp/Klaviyo email plugin
- [ ] Mixpanel analytics plugin
- [ ] Pinterest Ads plugin

**Deliverable**: Platform operators can run sophisticated A/B tests and optimize campaigns automatically.

---

### Phase 6: Scale & Polish (Weeks 17-20)
**Goal**: Production-ready, performant, documented

- [ ] Performance optimization (caching, query optimization)
- [ ] Security audit (penetration testing, OWASP top 10)
- [ ] Comprehensive API documentation (OpenAPI)
- [ ] Plugin developer documentation
- [ ] Load testing & auto-scaling
- [ ] Monitoring & alerting (Prometheus, Grafana)
- [ ] Error tracking (Sentry)
- [ ] Multi-region deployment
- [ ] Disaster recovery plan

**Deliverable**: Production-ready platform with 99.9% uptime SLA.

---

## 📊 Success Metrics

### Platform Performance
- **API Response Time**: p95 < 200ms, p99 < 500ms
- **Uptime**: > 99.9% (no more than 8.76 hours downtime/year)
- **Plugin Failure Rate**: < 0.1%
- **Event Processing Latency**: p95 < 2 seconds
- **AI Processing Time**: p95 < 30 seconds (per photo)

### Business Metrics
- **Time to Launch Storefront**: < 1 hour (from admin dashboard)
- **Time to Add Fulfillment Provider**: < 1 week (plugin development)
- **Time to Add Ad Platform**: < 1 week (plugin development)
- **Campaign ROI**: Trackable across all platforms
- **Customer Acquisition Cost (CAC)**: Calculated per platform
- **Average Order Value (AOV)**: Tracked per storefront

### Developer Experience
- **Plugin Installation**: < 5 minutes
- **API Documentation Coverage**: 100% (all endpoints documented)
- **Plugin Interface Stability**: No breaking changes without major version bump

---

## 🔒 Security Considerations

### Multi-Tenancy Security
- **Row-Level Security (RLS)**: Every query enforces `tenant_id` filtering
- **API Gateway Validation**: Tenant ID from JWT/subdomain cannot be spoofed
- **Plugin Isolation**: Plugins cannot access other tenants' data
- **Encrypted Credentials**: Plugin API keys encrypted at rest (AES-256)

### Plugin Security
- **Manifest Verification**: Plugins signed by developer, verified on install
- **Sandboxed Execution**: Plugins run in isolated environment (VM2 or Worker Threads)
- **API Rate Limiting**: Per-plugin rate limits to prevent abuse
- **Audit Logging**: All plugin actions logged (who, what, when, tenant)
- **Permission Model**: Plugins declare required permissions in manifest

### API Security
- **Authentication**: JWT with short expiration (15 min access token, 7 day refresh token)
- **Authorization**: RBAC (customer, admin, operator roles)
- **Rate Limiting**: Per tenant, per IP, per endpoint
- **CORS**: Strict origin allowlist per tenant
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Prevention**: Parameterized queries (Prisma/Drizzle)
- **XSS Prevention**: Output sanitization, CSP headers

### Infrastructure Security
- **HTTPS Only**: TLS 1.3, automatic cert renewal (Let's Encrypt)
- **Database Encryption**: At-rest encryption enabled
- **Secrets Management**: Google Secret Manager or AWS Secrets Manager
- **Network Isolation**: Backend services in private subnet
- **DDoS Protection**: Cloudflare or Cloud Armor

---

## 🎨 Admin Dashboard Features Deep Dive

### 1. Storefront Manager
**Create New Storefront**:
```
1. Enter store details (name, description)
2. Choose subdomain or custom domain
3. Select theme (Modern, Vintage, Custom)
4. Configure colors, fonts, logo
5. Enable features (AI, referrals, etc.)
6. Select default fulfillment provider
7. Preview storefront
8. Launch → SSL cert auto-provisioned, domain routed
```

**Manage Existing Storefront**:
- Edit theme & branding
- Toggle features on/off
- View analytics (traffic, orders, revenue)
- Duplicate storefront (clone configuration)
- Archive/delete storefront

---

### 2. Ad Campaign Manager ⭐ **Core Feature**

**Multi-Platform Campaign Creation**:

```
┌─────────────────────────────────────────────────┐
│  Create New Campaign                            │
├─────────────────────────────────────────────────┤
│  Campaign Name: [Summer Sale 2024           ]  │
│  Storefronts:   [☑ Store A  ☑ Store B      ]  │
│                                                  │
│  Platforms:                                      │
│    ☑ Google Ads                                 │
│    ☑ Meta (Facebook + Instagram)               │
│    ☑ TikTok Ads                                 │
│    ☐ Twitter/X Ads                              │
│    ☐ Pinterest Ads                              │
│                                                  │
│  Budget:                                         │
│    Total Budget:  [$5,000                    ]  │
│    Daily Budget:  [$200                      ]  │
│    Allocation:    [○ Equal  ● Optimized      ]  │
│                                                  │
│  Schedule:                                       │
│    Start: [2024-06-01 00:00]                    │
│    End:   [2024-06-30 23:59]                    │
│                                                  │
│  Audience:                                       │
│    Age:      [18-45                          ]  │
│    Gender:   [All                            ]  │
│    Location: [United States                  ]  │
│    Interests:[Fashion, Art, Gifts            ]  │
│                                                  │
│  Creative:                                       │
│    [Upload Images] [Write Ad Copy]              │
│                                                  │
│  A/B Testing: [☑ Enable                      ]  │
│    Variants: [3] (will test 3 variations)       │
│                                                  │
│  [Create Campaign] [Save as Draft]              │
└─────────────────────────────────────────────────┘
```

**Campaign Dashboard**:
```
┌───────────────────────────────────────────────────────────────┐
│  Active Campaigns                           [+ New Campaign] │
├───────────────────────────────────────────────────────────────┤
│  Campaign: Summer Sale 2024                  Status: ACTIVE   │
│  Platforms: Google · Meta · TikTok           Budget: $5,000   │
│                                              Spent:  $1,234   │
├───────────────────────────────────────────────────────────────┤
│  Metrics (Last 7 Days):                                       │
│  ┌──────────┬───────────┬──────┬─────────────┬─────────┐    │
│  │ Platform │ Impressions│ Clicks│ Conversions │ ROAS   │    │
│  ├──────────┼───────────┼──────┼─────────────┼─────────┤    │
│  │ Google   │ 145,234   │ 1,823│ 89          │ 4.2x   │    │
│  │ Meta     │ 234,123   │ 2,456│ 112         │ 5.1x   │🏆 │
│  │ TikTok   │ 89,456    │ 723  │ 34          │ 2.8x   │⚠️  │
│  └──────────┴───────────┴──────┴─────────────┴─────────┘    │
│                                                                │
│  💡 Recommendation: TikTok ROAS below target (3.5x).          │
│      [ Pause TikTok ] [ Reallocate Budget to Meta ]          │
│                                                                │
│  [ View Detailed Analytics ] [ Edit Campaign ]                │
└───────────────────────────────────────────────────────────────┘
```

**Parallel A/B Testing**:
- Run 3-5 ad variants simultaneously
- Automatically allocate budget to best performer
- Test different:
  - Ad copy
  - Images/videos
  - Audiences
  - Landing pages
- Statistical significance calculator
- Auto-promote winner after confidence threshold

**Auto-Optimization Rules**:
```javascript
{
  "rules": [
    {
      "name": "Pause Low ROAS Campaigns",
      "condition": "roas < 2.5 AND spend > 500",
      "action": "pause_campaign",
      "notification": "email"
    },
    {
      "name": "Increase Budget for Winners",
      "condition": "roas > 5.0 AND conversions > 50",
      "action": "increase_budget_by_percent(20)",
      "notification": "slack"
    },
    {
      "name": "Alert for High CPA",
      "condition": "cpa > 50",
      "action": "send_alert",
      "notification": "sms"
    }
  ]
}
```

---

### 3. Analytics Dashboard

**Cross-Storefront Performance**:
```
┌─────────────────────────────────────────────────────────┐
│  Platform Overview                         Last 30 Days  │
├─────────────────────────────────────────────────────────┤
│  Total Revenue:        $127,456  (+23% vs last month)   │
│  Total Orders:         1,234     (+18%)                 │
│  Average Order Value:  $103.28   (+4%)                  │
│  Total Customers:      892       (+31%)                 │
│                                                           │
│  Revenue by Storefront:                                  │
│  ┌────────────┬──────────┬────────┬─────┐              │
│  │ Storefront │ Revenue  │ Orders │ AOV │              │
│  ├────────────┼──────────┼────────┼─────┤              │
│  │ Store A    │ $78,234  │ 723    │ $108│ 🏆         │
│  │ Store B    │ $34,567  │ 389    │ $89 │             │
│  │ Store C    │ $14,655  │ 122    │ $120│             │
│  └────────────┴──────────┴────────┴─────┘              │
│                                                           │
│  Ad Spend vs Revenue (ROAS by Platform):                │
│  ┌────────────┬────────┬──────────┬───────┐            │
│  │ Platform   │ Spend  │ Revenue  │ ROAS  │            │
│  ├────────────┼────────┼──────────┼───────┤            │
│  │ Google Ads │ $8,456 │ $38,234  │ 4.5x 🏆│          │
│  │ Meta Ads   │ $6,234 │ $31,123  │ 5.0x 🏆│          │
│  │ TikTok Ads │ $3,123 │ $8,456   │ 2.7x ⚠️│          │
│  │ Organic    │ $0     │ $49,643  │ ∞    │            │
│  └────────────┴────────┴──────────┴───────┘            │
│                                                           │
│  [View Detailed Report] [Export CSV] [Export PDF]        │
└─────────────────────────────────────────────────────────┘
```

**Funnel Analysis**:
```
Upload Photo   →   Cartoonify   →   Add to Cart   →   Purchase
   100%              78%              42%              31%

Drop-off Analysis:
- Upload → Cartoonify: 22% drop (avg wait: 28s) ⚠️
  Recommendation: Optimize AI processing speed

- Cartoonify → Add to Cart: 36% drop
  Recommendation: Test different pricing, add urgency (limited time)

- Add to Cart → Purchase: 11% drop
  Recommendation: Implement cart abandonment email
```

**Customer Cohort Analysis**:
```
Cohort by Acquisition Month:
┌───────────┬──────────┬───────────┬───────────┬───────────┐
│ Month     │ Customers│ Month 1   │ Month 2   │ Month 3   │
├───────────┼──────────┼───────────┼───────────┼───────────┤
│ March 24  │ 234      │ $12,345   │ $8,456    │ $5,234    │
│ April 24  │ 456      │ $23,456   │ $15,234   │ -         │
│ May 24    │ 723      │ $38,234   │ -         │ -         │
└───────────┴──────────┴───────────┴───────────┴───────────┘

Retention Rate:
Month 1: 42%  Month 2: 28%  Month 3: 19%
```

---

### 4. Plugin Marketplace

```
┌───────────────────────────────────────────────────────────┐
│  Plugin Marketplace                      [🔍 Search     ] │
├───────────────────────────────────────────────────────────┤
│  Fulfillment Plugins:                                     │
│                                                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │ 📦 Printify                      ⭐⭐⭐⭐⭐ (42)  │     │
│  │ Print-on-demand fulfillment                      │     │
│  │ [Installed] [Configure] [View Docs]              │     │
│  └─────────────────────────────────────────────────┘     │
│                                                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │ 📦 AliExpress Dropshipping      ⭐⭐⭐⭐ (28)     │     │
│  │ Direct fulfillment from AliExpress suppliers     │     │
│  │ [Install] [View Docs]                            │     │
│  └─────────────────────────────────────────────────┘     │
│                                                            │
│  Ad Platform Plugins:                                     │
│                                                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │ 📢 Google Ads                   ⭐⭐⭐⭐⭐ (156)  │     │
│  │ Campaign management & conversion tracking        │     │
│  │ [Installed] [Configure] [View Docs]              │     │
│  └─────────────────────────────────────────────────┘     │
│                                                            │
│  ┌─────────────────────────────────────────────────┐     │
│  │ 📢 Meta Ads (FB/IG)             ⭐⭐⭐⭐⭐ (134)  │     │
│  │ Facebook & Instagram campaign management         │     │
│  │ [Install] [View Docs]                            │     │
│  └─────────────────────────────────────────────────┘     │
│                                                            │
│  [Show All Plugins] [Create Custom Plugin]                │
└───────────────────────────────────────────────────────────┘
```

---

## 🔍 Example User Journeys

### Journey 1: Platform Operator Launches New Storefront

1. **Login to Admin Dashboard**
   - Navigate to `/admin`
   - Authenticate with Google OAuth

2. **Create Storefront**
   - Click "Create Storefront"
   - Enter details:
     - Name: "Vintage Vibes"
     - Subdomain: `vintage.myplatform.com`
     - Theme: Vintage
   - Customize colors, fonts, logo
   - Enable features: AI cartoonification, referrals
   - Select fulfillment: Printify plugin
   - Save & Launch

3. **Configure Plugins**
   - Navigate to Plugin Manager
   - Configure Printify API key for this storefront
   - Enable Stripe payment plugin
   - Configure Google Ads plugin for conversion tracking

4. **Import Products**
   - Navigate to Product Manager
   - Click "Sync from Printify"
   - Select products to import (t-shirts, mugs, posters)
   - Set pricing (cost + margin %)
   - Publish products

5. **Launch Ad Campaign**
   - Navigate to Ad Campaign Manager
   - Create campaign: "Vintage Launch"
   - Select platforms: Google Ads + Meta Ads
   - Budget: $1,000 total, $50/day
   - Target audience: 25-45, US, interested in vintage art
   - Upload ad creative
   - Launch campaign

6. **Monitor Performance**
   - View unified analytics dashboard
   - See real-time metrics across platforms
   - Adjust budget allocation based on ROAS
   - Export report for stakeholders

---

### Journey 2: Customer Purchases Cartoonified Product

1. **Visit Storefront**
   - Navigate to `vintage.myplatform.com`
   - Browse product gallery (t-shirts, mugs, posters)

2. **Upload Photo**
   - Click "Customize Your Product"
   - Select product (t-shirt)
   - Upload photo of their pet
   - Click "Cartoonify"

3. **AI Processing** (async)
   - Backend publishes `asset.uploaded` event
   - AI Service consumes job from Event Bus
   - Generates 4 style variants (cartoon, sketch, watercolor, pop-art)
   - Stores results to Cloud Storage
   - Publishes `ai.completed` event

4. **Preview & Select**
   - Customer sees 4 variants in real-time (SSE updates)
   - Selects favorite variant (cartoon style)
   - Previews product mockup (t-shirt with cartoon pet)

5. **Add to Cart**
   - Clicks "Add to Cart"
   - Backend publishes `cart.item_added` event
   - Analytics plugin tracks event in GA4
   - Ad plugins track "AddToCart" conversion

6. **Checkout**
   - Enters shipping address
   - Payment via Stripe plugin
   - Order created

7. **Fulfillment** (async, event-driven)
   - Backend publishes `order.created` event
   - Printify plugin subscribes, creates order in Printify
   - Google Ads plugin tracks "Purchase" conversion
   - Meta Ads plugin tracks "Purchase" conversion
   - Email plugin sends order confirmation

8. **Order Updates**
   - Printify sends webhook: "Order In Production"
   - Printify plugin publishes `fulfillment.status_changed` event
   - Customer receives email update

9. **Delivery**
   - Printify sends webhook: "Order Shipped"
   - Customer receives tracking number
   - Order marked as completed

---

## 📚 Technology Recommendations

### Frontend
- **Framework**: React 18 (future: React 19 with Server Components)
- **Styling**: Tailwind CSS 4 (new CSS-first engine)
- **UI Components**: Shadcn/ui (Radix + Tailwind, highly customizable)
- **State Management**:
  - **Server State**: TanStack Query (React Query)
  - **Client State**: Zustand (lightweight, simple API)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Build Tool**: Vite (faster than Webpack, great DX)
- **Type Safety**: TypeScript 5+ (strict mode)

### Backend
- **Runtime**: Node.js 20+ (native TypeScript support coming)
- **Framework**: **Fastify** (faster than Express, better DX)
  - Native TypeScript support
  - Built-in schema validation (JSON Schema)
  - Better error handling
  - Plugin architecture (aligns with our design!)
- **ORM**: **Drizzle ORM** (lightweight, type-safe, better than Prisma for our use case)
  - Edge-ready (for future Cloudflare Workers deployment)
  - SQL-like API (easier to optimize)
  - Better type inference
- **Validation**: Zod (shared with frontend)
- **Authentication**: Passport.js + JWT (refresh token rotation)
- **API Documentation**: OpenAPI (via `@fastify/swagger`)
- **Testing**: Vitest (fast, Vite-native) + Supertest

### Infrastructure
- **Database**: PostgreSQL 16 (native JSON improvements)
- **Cache**: Redis 7+ (Redis Streams for Event Bus)
- **Object Storage**: Google Cloud Storage (or S3 if AWS)
- **Message Queue**: **Redis Streams** (simpler than Pub/Sub, local dev-friendly)
  - Alternative: Google Pub/Sub (if you need multi-region)
- **Hosting**:
  - **Google Cloud Run** (serverless containers, auto-scale)
  - Alternative: Railway (great DX, simpler than GCP)
- **CDN**: Cloudflare (free plan sufficient, great DDoS protection)
- **Monitoring**:
  - Application: Sentry (error tracking)
  - Infrastructure: Grafana Cloud + Prometheus
  - Logs: Better Stack (formerly Logtail)

### AI Service
- **Runtime**: Node.js (keep stack consistent) or Python (if using custom models)
- **ML APIs**:
  - **Gemini 2.0** (Google, multimodal, fast, affordable)
  - **Replicate** (multiple models, good for experimentation)
  - **Stability AI** (Stable Diffusion, high quality)
- **Image Processing**: Sharp (Node.js) - fast, native bindings

### DevOps
- **CI/CD**: GitHub Actions (free for open source, great marketplace)
- **IaC**: Terraform or Pulumi (if complex infrastructure)
- **Secrets**: Google Secret Manager or Doppler (great DX)
- **Database Migrations**: Drizzle Kit (built-in with Drizzle ORM)

---

## 🎓 Developer Onboarding

### For New Developers Joining the Project

1. **Read Architecture Plan** (this document!)
2. **Set up local environment**:
   ```bash
   git clone <repo>
   cd ecom-platform

   # Install dependencies
   pnpm install

   # Start local services (Docker Compose)
   docker-compose up -d  # PostgreSQL, Redis

   # Run database migrations
   pnpm db:migrate

   # Seed database with sample data
   pnpm db:seed

   # Start backend
   cd backend
   pnpm dev

   # Start frontend (in new terminal)
   cd frontend/storefront
   pnpm dev

   # Start admin dashboard (in new terminal)
   cd frontend/admin
   pnpm dev
   ```

3. **Explore the codebase**:
   ```
   ecom-platform/
   ├── backend/
   │   ├── src/
   │   │   ├── api-gateway/       # Request routing
   │   │   ├── services/          # Domain services
   │   │   │   ├── catalog/
   │   │   │   ├── order/
   │   │   │   ├── cart/
   │   │   │   └── ...
   │   │   ├── plugins/           # Plugin system
   │   │   │   ├── registry/
   │   │   │   ├── manager/
   │   │   │   └── interfaces/
   │   │   ├── event-bus/         # Event system
   │   │   └── utils/
   │   └── test/
   ├── frontend/
   │   ├── storefront/            # Customer-facing
   │   └── admin/                 # Admin dashboard
   ├── plugins/                   # External plugins
   │   ├── printify-fulfillment/
   │   ├── aliexpress-fulfillment/
   │   ├── google-ads/
   │   └── ...
   ├── ai-service/                # AI processing
   └── docs/                      # Additional documentation
   ```

4. **Run test suite**:
   ```bash
   pnpm test           # Unit + integration tests
   pnpm test:e2e       # End-to-end tests (Playwright)
   ```

5. **Make your first contribution**:
   - Pick a "good first issue" from GitHub
   - Create a feature branch: `git checkout -b feature/your-feature`
   - Make changes, write tests
   - Submit PR for review

---

## 📞 Support & Contribution

### Getting Help
- **Documentation**: `/docs` directory
- **API Reference**: `http://localhost:3000/docs` (OpenAPI)
- **Plugin Development Guide**: `/docs/plugin-development.md`
- **Slack**: `#ecom-platform-dev` channel
- **GitHub Issues**: Tag questions with `question` label

### Contributing
1. Read `CONTRIBUTING.md`
2. Fork the repository
3. Create a feature branch
4. Write tests for new features
5. Submit PR with clear description
6. Respond to code review feedback

### Plugin Marketplace Submission
1. Develop plugin following interface
2. Write comprehensive README
3. Add tests (coverage > 80%)
4. Submit PR to `plugins/` directory
5. Maintainers review & approve
6. Plugin appears in admin marketplace

---

## 🚦 Deployment Checklist

### Pre-Production
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit completed (OWASP top 10)
- [ ] Load testing completed (1000 req/s sustained)
- [ ] Database migrations tested on staging
- [ ] Monitoring & alerting configured
- [ ] Backup strategy implemented (daily + point-in-time recovery)
- [ ] SSL certificates configured (auto-renewal)
- [ ] CORS policies reviewed
- [ ] Rate limiting tested
- [ ] Plugin sandboxing verified
- [ ] Documentation complete (API, plugins, admin)

### Production Launch
- [ ] DNS configured (A records, CNAME for subdomains)
- [ ] CDN configured (Cloudflare or similar)
- [ ] Environment variables set (secrets in Secret Manager)
- [ ] Database scaling configured (read replicas if needed)
- [ ] Auto-scaling rules configured (Cloud Run or K8s HPA)
- [ ] Incident response plan documented
- [ ] On-call rotation established
- [ ] Marketing site live (explaining platform)
- [ ] Launch announcement (social media, email, etc.)

### Post-Launch
- [ ] Monitor error rates (target: < 0.1%)
- [ ] Monitor response times (p95 < 200ms)
- [ ] Track user feedback
- [ ] Iterate on high-priority bugs
- [ ] Plan next features based on usage data

---

## 🎉 Conclusion

This architecture provides a **solid foundation** for a modular, scalable, multi-tenant ecommerce platform. The plugin system enables **rapid iteration** on fulfillment providers and ad platforms, while the event-driven design ensures **scalability** and **resilience**.

**Key Takeaways**:
1. **Plugin Architecture** = Easy to swap providers (Printify ↔ AliExpress)
2. **Multi-Tenancy** = Single backend, multiple storefronts
3. **Event-Driven** = Scalable, decoupled, resilient
4. **Admin Dashboard** = Unified control plane for all operations
5. **Ad Campaign Manager** = Run parallel campaigns, optimize automatically

**Next Steps**:
1. Review this plan with team
2. Set up project repository
3. Start Phase 1 implementation (Foundation)
4. Iterate based on learnings

**Good luck building! 🚀**
