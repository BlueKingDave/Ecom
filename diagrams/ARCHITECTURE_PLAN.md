# Modular Ecommerce Platform - Architecture Plan

## Vision
A multi-tenant ecommerce platform with pluggable fulfillment providers and ad platforms, enabling operators to run multiple storefronts and ad campaigns from a unified admin dashboard.

## Core Principles

### 1. Plugin Architecture
- **Fulfillment Plugins**: Printify, AliExpress, Shopify, custom providers
- **Ad Platform Plugins**: Google Ads, Meta (FB/IG), TikTok, Twitter/X, Pinterest
- **Payment Plugins**: Stripe, PayPal, Square
- **Each plugin implements a standard interface**

### 2. Multi-Tenancy
- Single backend serves multiple storefront instances
- Each storefront has isolated:
  - Product catalog
  - Customer database
  - Order history
  - Branding/theming
  - Domain mapping

### 3. Event-Driven Architecture
- Core system emits domain events
- Plugins subscribe to relevant events
- Async processing via message queue
- Decoupled communication

### 4. Separation of Concerns
- **Storefront**: Customer-facing React apps (multi-instance)
- **Admin Dashboard**: Unified control plane for all operations
- **Backend API**: Domain logic, orchestration
- **Plugin System**: Extensible integrations
- **AI Service**: Cartoonification processing

---

## System Components

### Frontend Layer

#### 1. Storefront Instances (React + Tailwind)
- **Multi-tenant**: Each storefront is a separate instance
- **Shared codebase**: Common components, different themes
- **Features**:
  - Product browsing with AI preview
  - Photo upload & cartoonification
  - Cart & checkout
  - Order tracking
  - Referral system

#### 2. Admin Dashboard (React + Tailwind)
- **Unified control plane** for all storefronts
- **Modules**:
  - Storefront management (create/configure instances)
  - Ad campaign manager (multi-platform)
  - Product catalog management
  - Order management across all storefronts
  - Analytics dashboard (cross-storefront)
  - Plugin configuration
  - A/B test management
  - Customer support tools

### Backend Layer

#### 1. API Gateway (Node.js)
- Route requests to appropriate services
- Authentication & authorization
- Rate limiting
- Request validation
- Tenant isolation

#### 2. Core Domain Services (Node.js)
- **Catalog Service**: Product management
- **Order Service**: Order lifecycle
- **User Service**: Authentication, profiles
- **Cart Service**: Shopping cart logic
- **Asset Service**: Media management
- **Campaign Service**: Ad campaign orchestration
- **Analytics Service**: Event tracking & reporting
- **Referral Service**: Referral program logic

#### 3. Plugin System (Node.js)
- **Plugin Registry**: Dynamic plugin loading
- **Plugin Interfaces**: Standard contracts for each plugin type
- **Plugin Manager**: Lifecycle management (install/enable/disable/configure)

**Plugin Types:**
```typescript
// Fulfillment Plugin Interface
interface FulfillmentPlugin {
  id: string;
  name: string;

  // Catalog sync
  syncProducts(): Promise<Product[]>;

  // Order operations
  createOrder(order: Order): Promise<ExternalOrderId>;
  getOrderStatus(id: ExternalOrderId): Promise<OrderStatus>;
  cancelOrder(id: ExternalOrderId): Promise<void>;

  // Webhook handling
  handleWebhook(payload: unknown): Promise<void>;
}

// Ad Platform Plugin Interface
interface AdPlatformPlugin {
  id: string;
  name: string;

  // Campaign management
  createCampaign(config: CampaignConfig): Promise<CampaignId>;
  updateCampaign(id: CampaignId, config: Partial<CampaignConfig>): Promise<void>;
  pauseCampaign(id: CampaignId): Promise<void>;

  // Event tracking
  trackConversion(event: ConversionEvent): Promise<void>;

  // Analytics
  getCampaignMetrics(id: CampaignId): Promise<Metrics>;
}

// Payment Plugin Interface
interface PaymentPlugin {
  id: string;
  name: string;

  createPaymentIntent(amount: number, metadata: object): Promise<PaymentIntent>;
  capturePayment(intentId: string): Promise<void>;
  refundPayment(intentId: string, amount?: number): Promise<void>;
  handleWebhook(payload: unknown): Promise<void>;
}
```

#### 4. AI Service (Node.js or Python)
- Consumes jobs from message queue
- Generates cartoonified variants
- Stores results to cloud storage
- Publishes completion events

#### 5. Event Bus (Redis Streams / Google Pub/Sub)
- Domain event publishing
- Plugin event subscriptions
- Async job processing
- Real-time updates

---

## Data Layer

### Database Strategy

#### PostgreSQL (Core Domain Data)
- **Multi-tenant schema**: `tenant_id` on all tables
- **Tables**:
  - `tenants` (storefront instances)
  - `users` (customers & admins)
  - `products` (catalog)
  - `orders` (order history)
  - `assets` (uploaded photos, results)
  - `campaigns` (ad campaigns)
  - `plugin_configs` (plugin settings per tenant)
  - `events` (audit log)

#### Redis (Caching & Sessions)
- Session storage
- Product catalog cache
- Rate limiting
- Real-time feature flags

#### Cloud Storage (GCS / S3)
- User-uploaded photos
- Cartoonified results
- Product assets
- Static storefront assets

---

## Plugin Architecture Design

### Plugin Discovery & Registration
```typescript
// Plugin manifest
{
  "id": "printify-fulfillment",
  "name": "Printify",
  "version": "1.0.0",
  "type": "fulfillment",
  "main": "./dist/index.js",
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "encrypted": true
    },
    "webhookSecret": {
      "type": "string",
      "required": true,
      "encrypted": true
    }
  }
}
```

### Plugin Lifecycle
1. **Install**: Copy plugin to `/plugins` directory
2. **Register**: Load plugin manifest, validate interface
3. **Configure**: Admin provides API keys, settings (per tenant)
4. **Enable**: Activate plugin for specific tenant
5. **Disable**: Deactivate without removing
6. **Uninstall**: Remove plugin

### Event-Driven Plugin Integration
```typescript
// Core system emits events
eventBus.publish('order.created', { orderId, tenantId, items });

// Fulfillment plugin subscribes
fulfillmentPlugin.on('order.created', async (event) => {
  const externalOrderId = await this.createOrder(event);
  await orderService.updateExternalId(event.orderId, externalOrderId);
});

// Ad platform plugin subscribes
adPlugin.on('order.created', async (event) => {
  await this.trackConversion({
    event: 'Purchase',
    value: event.totalAmount,
    userId: event.userId
  });
});
```

---

## Admin Dashboard Features

### 1. Storefront Management
- Create new storefront instances
- Configure domains & SSL
- Manage themes & branding
- Enable/disable features per storefront
- View per-storefront analytics

### 2. Ad Campaign Manager
- **Multi-platform campaign creation**
  - Select platforms (Google, Meta, TikTok, etc.)
  - Configure budget, audience, creative
  - Schedule campaigns
- **Parallel campaign testing**
  - Run A/B tests across platforms
  - Compare performance metrics
  - Auto-pause underperforming campaigns
- **Campaign analytics dashboard**
  - Unified metrics across all platforms
  - ROI tracking
  - Attribution modeling

### 3. Product Management
- Bulk import from fulfillment providers
- AI variant generation triggers
- Cross-storefront product assignment
- Pricing rules & margins

### 4. Plugin Marketplace
- Browse available plugins
- Install/uninstall plugins
- Configure plugin settings per storefront
- View plugin health & logs

### 5. Analytics & Reporting
- Cross-storefront performance
- Funnel analysis
- Customer cohort analysis
- Revenue forecasting
- Export reports

---

## Technology Stack

### Frontend
- **Framework**: React 18 (with Suspense, Server Components future-ready)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand + React Query
- **Routing**: React Router v6
- **Build**: Vite
- **Component Library**: Shadcn/ui (Radix + Tailwind)

### Backend
- **Runtime**: Node.js 20+ (TypeScript)
- **Framework**: Express or Fastify
- **ORM**: Prisma or Drizzle
- **Validation**: Zod
- **Auth**: Passport.js + JWT
- **API Docs**: OpenAPI/Swagger

### Infrastructure
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Message Queue**: Google Pub/Sub or Redis Streams
- **Storage**: Google Cloud Storage
- **Hosting**: Google Cloud Run or Railway
- **CDN**: Cloudflare

### AI Service
- **Runtime**: Node.js or Python
- **ML APIs**: Gemini, Replicate, Stability AI
- **Image Processing**: Sharp (Node) or Pillow (Python)

---

## Deployment Architecture

### Multi-Region Strategy
- **Primary Region**: us-central1 (Iowa)
- **CDN**: Global (Cloudflare)
- **Database**: Primary + read replicas
- **Storage**: Multi-region buckets

### Scalability
- **API Gateway**: Auto-scale (Cloud Run)
- **Domain Services**: Auto-scale (Cloud Run)
- **AI Service**: Auto-scale with GPU instances
- **Database**: Connection pooling (PgBouncer)
- **Cache**: Redis cluster

---

## Security Considerations

### Multi-Tenancy Security
- Row-level security (RLS) in database
- Tenant ID validation in all queries
- Isolated plugin configurations
- Encrypted credentials storage

### Plugin Security
- Sandboxed execution environment
- API rate limiting per plugin
- Audit logging for all plugin actions
- Manifest signature verification

### API Security
- JWT authentication
- API key rotation
- Rate limiting
- CORS configuration
- SQL injection prevention (parameterized queries)
- XSS prevention (output sanitization)

---

## Migration Path

### Phase 1: Core Platform
- Multi-tenant backend
- Single storefront instance
- Basic plugin system
- Stripe integration
- One fulfillment provider (Printify)

### Phase 2: Plugin Ecosystem
- Plugin registry & marketplace
- Multiple fulfillment plugins
- Payment plugin system
- Analytics plugins

### Phase 3: Ad Platform Integration
- Ad campaign service
- Google Ads plugin
- Meta Ads plugin
- TikTok Ads plugin
- Unified analytics

### Phase 4: Advanced Features
- A/B testing framework
- Predictive analytics
- Auto-optimization algorithms
- Multi-region deployment

---

## Success Metrics

### Platform Health
- API response time < 200ms (p95)
- Uptime > 99.9%
- Plugin failure rate < 0.1%

### Business Metrics
- Time to launch new storefront < 1 hour
- Ad campaign ROI tracking
- Customer acquisition cost per platform
- Average order value per storefront

### Developer Experience
- Plugin installation time < 5 minutes
- API documentation completeness
- Time to add new fulfillment provider < 1 week
