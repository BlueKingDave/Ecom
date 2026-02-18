# System Architecture

## Overview
E-commerce platform for AI-cartoonified custom products. Users upload photos, preview cartoonified variants, and purchase physical products printed with their chosen designs.

## System Context

### Actors
- **Customer**: Upload photos, preview cartoonified products, customize, and purchase
- **Store Admin**: Manage catalog, orders, AI configurations, and referral programs

## Core Architecture

### Backend Services

#### Ecommerce Backend (Node.js Monolith)
**Purpose**: Central backend service handling all business logic

**Responsibilities**:
- **Catalog Management**: Single Source of Truth (SSoT) for product catalog
- **Order Management**: Order creation, tracking, status updates
- **Cart Management**: Shopping cart operations
- **Asset Management**: User uploads and cartoonified results
- **User Authentication**: OAuth integration
- **Referral System**: Referral tracking and rewards
- **Real-time Updates**: SSE/WebSocket for live status updates
- **A/B Testing**: Experimentation framework

**Key Modules**:
- Catalog
- Orders
- Cart
- Assets
- Users
- Referrals
- A/B Testing

#### AI Cartoonification Service
**Purpose**: Async job processing for AI image generation

**Responsibilities**:
- Consume jobs from Pub/Sub queue
- Image preprocessing and optimization
- Multi-variant generation (4 style variants per upload)
- Style-based A/B testing
- Result storage and status updates

**Processing Flow**:
1. Consume job from Pub/Sub: `{ asset_id, style, crop }`
2. Run inference via AI Runtime (Gemini/Replicate)
3. Generate 4 style variants
4. Store results in Cloud Storage
5. Update backend with job status: `job_id: succeeded + asset refs`

## Infrastructure (Google Cloud Platform)

### Pub/Sub
- **Purpose**: Job queue for async AI processing
- **Pattern**: Publisher-Subscriber for decoupled processing
- **Messages**: Cartoonification job specifications

### Cloud Storage
- **Purpose**: Persistent storage for all media assets
- **Contents**:
  - User uploaded photos
  - Cartoonified results (4 variants per upload)
  - Product assets and templates

### Cloud Run / GCE
- **Purpose**: Application hosting
- **Hosts**:
  - Ecommerce Backend
  - AI Cartoonification Service

## External Integrations

### Fulfillment
**Printify API**
- Single Source of Truth for product specifications
- Print-on-demand fulfillment
- Shipping and logistics
- **Integration**: Product mapping table links internal catalog to Printify products
- **Webhooks**: Order status updates

### Payment Processing
**Stripe API**
- Payment processing
- Refund handling
- Transaction management

### Authentication
**Google OAuth**
- User authentication
- Session management

### AI/ML Runtime
**Gemini / Replicate**
- ML model inference
- Image generation
- Style transfer processing

## Marketing & Analytics

### TikTok Conversions API
- Server-side event tracking
- Attribution modeling
- **Tracked Events**: Upload, Cartoonify, AddToCart, Purchase

### Google Analytics 4
- User behavior analytics
- Funnel tracking
- Conversion optimization

### Email Marketing
**Mailchimp / Klaviyo**
- Transactional emails: Order confirmations
- Automated campaigns: Cart abandonment, referrals
- Marketing campaigns

## Key Workflows

### Core Async AI Processing Workflow
```
1. Customer uploads photo → Backend
2. Backend publishes job → Pub/Sub {asset_id, style, crop}
3. AI Service consumes job ← Pub/Sub
4. AI Service requests inference → AI Runtime (Gemini/Replicate)
5. AI Service stores results → Cloud Storage (4 variants)
6. AI Service updates status → Backend {job_id: succeeded + asset refs}
7. Backend notifies customer → Real-time update (SSE/WebSocket)
```

### Fulfillment Workflow
```
1. Customer completes checkout → Backend
2. Backend processes payment → Stripe
3. Backend creates print order → Printify (via product mapping)
4. Printify fulfills order → Customer
5. Printify sends status updates → Backend (webhook)
6. Backend updates order status → Customer (email + real-time)
```

### Marketing Event Tracking
```
Customer Action → Backend → Parallel tracking:
  - TikTok Conversions API (Upload, Cartoonify, AddToCart, Purchase)
  - Google Analytics 4 (funnel events)
  - Email platform (transactional triggers)
```

## Architecture Principles

### Single Source of Truth (SSoT)
- **Catalog**: Backend owns product definitions
- **Fulfillment**: Printify owns product specifications and shipping
- **Product Mapping**: Backend maintains mapping between internal catalog and Printify products

### Async Processing
- AI cartoonification is fully async via Pub/Sub
- Decouples user experience from slow AI processing
- Enables scalable job processing

### Real-time Updates
- SSE/WebSocket for live status updates
- Immediate feedback on cartoonification progress
- Live order status updates

### External Service Integration
- Backend acts as orchestrator for all external services
- Webhook handlers for async external updates (Printify)
- Server-side event tracking for marketing attribution

## Data Flow Patterns

### Upload & Processing
`Customer → Backend → Storage → Pub/Sub → AI Service → Storage → Backend → Customer`

### Purchase & Fulfillment
`Customer → Backend → Stripe → Backend → Printify → Backend → Customer`

### Analytics & Attribution
`Customer → Backend → {TikTok API, GA4, Email Platform}`

## Scalability Considerations

- **Async AI Processing**: Pub/Sub enables horizontal scaling of AI workers
- **Stateless Backend**: Enables horizontal scaling behind load balancer
- **Cloud Storage**: Managed storage scales automatically
- **Managed Services**: Leverage GCP managed services for operational simplicity

## Technology Stack Summary

- **Backend**: Node.js (Monolith)
- **AI Service**: Python/Node.js with ML frameworks
- **Infrastructure**: Google Cloud Platform
- **Queue**: Google Pub/Sub
- **Storage**: Google Cloud Storage
- **Hosting**: Cloud Run / GCE
- **Auth**: Google OAuth
- **Payments**: Stripe
- **Fulfillment**: Printify API
- **AI/ML**: Gemini / Replicate
- **Analytics**: TikTok Conversions API, Google Analytics 4
- **Email**: Mailchimp / Klaviyo
