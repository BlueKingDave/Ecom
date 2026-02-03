# Ecommerce Architecture Diagrams

This directory contains C4-model inspired architecture diagrams for the AI-Enhanced Ecommerce platform (cartoonified photo products).

## Diagram Hierarchy

### 1. Context.d2 - System Context
**Level:** System Context (30,000 ft view)
**Purpose:** Shows the big picture - actors, main systems, and external services

**Key Systems:**
- **Ecommerce Backend** (Node.js monolith) - Core business logic
- **AI Cartoonification Service** (Separate Node.js service) - Image processing pipeline

**External Dependencies:**
- **Google Cloud Platform:** Pub/Sub (job queue), Cloud Storage (media), Cloud Run/GCE (hosting)
- **Printify:** Fulfillment provider (SSoT for product specs, printing, shipping)
- **Stripe:** Payment processing
- **AI Runtime:** Gemini/Replicate (ML inference)
- **Marketing:** TikTok Conversions API, Google Analytics 4, Mailchimp/Klaviyo

**View:** `d2 Context.d2 Context.svg && open Context.svg`

---

### 2. Container.d2 - Ecommerce Backend Containers
**Level:** Container (10,000 ft view)
**Purpose:** Zooms into the Ecommerce Backend monolith, showing internal modules

**Internal Modules:**
- **Catalog Module** - Product catalog SSoT, pricing, variants
- **Order Module** - Order state machine, fulfillment integration
- **Cart Module** - Shopping cart logic, promo codes
- **Asset Module** - Manages user uploads and cartoonified results
- **User Module** - User profiles, preferences
- **Auth Module** - JWT, OAuth, session management
- **Referral Module** - Viral loop, referral tracking
- **A/B Testing Module** - AI style experiments, conversion tracking
- **Job Status Module** - AI job lifecycle management
- **Real-time Module** - SSE/WebSocket for live updates
- **Printify Adapter** - Product mapping table, webhook handler
- **Analytics Module** - TikTok + GA4 event tracking

**Data Stores:**
- **PostgreSQL** - Products, orders, users, jobs, mappings
- **Redis** - Session store, cart cache, job status cache

**View:** `d2 Container.d2 Container.svg && open Container.svg`

---

### 3. Container-AI-Service.d2 - AI Service Containers
**Level:** Container (10,000 ft view)
**Purpose:** Zooms into the AI Cartoonification Service, showing processing pipeline

**Internal Components:**
- **Job Consumer** - Pulls jobs from Pub/Sub, handles retries
- **Processing Orchestrator** - Job lifecycle, pipeline coordination
- **Preprocessor** - Face detection, background removal, validation
- **Inference Engine** - AI model invocation (Gemini/Replicate)
- **Postprocessor** - Generate 4 style variants, optimization
- **Result Manager** - Upload to Cloud Storage, signed URLs
- **A/B Test Tracker** - Assign style variants, log experiments
- **Metrics & Logging** - Performance tracking, cost monitoring

**Processing Flow:**
```
Pub/Sub → Consumer → Orchestrator
  → Preprocessor (fetch from GCS, face detect, resize)
  → A/B Tracker (assign style: anime/pixar/comic/sketch)
  → Inference Engine (call Gemini/Replicate)
  → Postprocessor (generate 4 variants)
  → Result Manager (upload to GCS)
  → Webhook Backend (job complete)
```

**View:** `d2 Container-AI-Service.d2 Container-AI-Service.svg && open Container-AI-Service.svg`

---

## Architecture Principles

### 1. Modularity
- **Hybrid Architecture:** AI service separate (scales independently), core ecommerce logic in modular monolith
- **Clear Boundaries:** Each module has single responsibility, interfaces defined
- **Extensibility:** Can extract modules to microservices later if needed

### 2. Single Source of Truth (SSoT)
- **Product Catalog:** Ecommerce Backend DB (our pricing, marketing metadata, AI configs)
- **Fulfillment Specs:** Printify API (product dimensions, shipping, print specs)
- **Mapping Table:** PostgreSQL (our product ID ↔ Printify product ID + variants)
- **Asset Storage:** Cloud Storage (original photos, cartoonified results)
- **Job State:** Pub/Sub + Redis (job queue and status cache)
- **Order State:** Backend DB (synced to Printify via webhooks)

### 3. Async Processing with Real-time UX
- User uploads photo → gets `asset_id` immediately
- User requests cartoonification → gets `job_id` immediately, status: `queued`
- Worker processes in background (15-30s)
- User receives real-time updates via SSE/WebSocket
- User sees 4 variants instantly when ready

### 4. Marketing Funnel Integration
```
TikTok Ad → Landing Page → Upload Photo → Cartoonify → Preview → Add to Cart → Checkout
    ↓            ↓              ↓              ↓            ↓            ↓
TikTok Pixel   PageView    Upload Event   Cartoonify  AddToCart    Purchase
                ↓              ↓           Event (A/B)     ↓            ↓
              GA4            GA4             GA4          GA4      TikTok API
                                                                   + GA4
```

### 5. Viral Loop
- User creates cartoonified product → shares on social media
- Referral link includes referrer ID
- New user signs up via referral → both get discount/credit
- Analytics tracks viral coefficient

---

## Tech Stack

### Frontend
- React (UI framework)
- Tailwind CSS (styling)
- Framer Motion (animations)
- SSE/WebSocket client (real-time updates)

### Backend (Node.js Monolith)
- Express.js (API framework)
- PostgreSQL (primary database)
- Redis (cache, sessions, job status)
- JWT + OAuth (authentication)
- Socket.io or Server-Sent Events (real-time)

### AI Service (Node.js)
- Express.js (webhook API)
- @google-cloud/pubsub (job consumer)
- Gemini API (anime, pixar styles)
- Replicate API (comic, sketch styles)
- Sharp or Jimp (image preprocessing)
- Face-api.js or Cloud Vision (face detection)

### Infrastructure (Google Cloud)
- Cloud Run or GCE (hosting)
- Cloud Storage (media files)
- Pub/Sub (job queue)
- Cloud Monitoring (logs, metrics, alerts)
- Cloud CDN (serve static assets)

### External Services
- **Printify** - Print-on-demand fulfillment
- **Stripe** - Payment processing
- **Google OAuth** - User authentication
- **TikTok Conversions API** - Marketing attribution
- **Google Analytics 4** - User analytics
- **Mailchimp or Klaviyo** - Email marketing

---

## Data Flow Examples

### Example 1: User Creates Cartoonified Product
1. **Upload:** `POST /api/assets/upload` → Store in GCS, return `asset_id`
2. **Cartoonify:** `POST /api/cartoonify` → Create job, publish to Pub/Sub, return `job_id`
3. **Subscribe:** Client establishes SSE connection: `GET /api/jobs/{job_id}/stream`
4. **Process:** AI Service consumes job, runs inference, generates 4 variants
5. **Complete:** AI Service uploads results to GCS, calls `POST /api/jobs/{job_id}/complete`
6. **Notify:** Backend pushes SSE event to client: `{status: 'succeeded', assets: [...]}`
7. **Display:** Client shows 4 variants, user picks one
8. **Order:** `POST /api/cart/add` → `POST /api/orders/checkout`

### Example 2: Order Fulfillment Flow
1. **Checkout:** User completes payment via Stripe
2. **Create Order:** Backend stores order in PostgreSQL
3. **Map Product:** Printify Adapter looks up mapping table (our product → Printify product)
4. **Submit:** `POST printify.com/v1/shops/{shop_id}/orders.json`
5. **Webhook:** Printify sends status updates (`in_production`, `shipped`)
6. **Update:** Backend updates order state, notifies user via email
7. **Track:** Analytics module sends conversion event to TikTok + GA4

### Example 3: Referral Viral Loop
1. **User A** creates product, gets shareable link: `site.com/ref/ABC123`
2. **User B** clicks link, tracked by Referral Module
3. **User B** signs up, Referral Module credits both users
4. **Analytics:** Track viral coefficient, referral sources
5. **Email:** Klaviyo sends "Your friend signed up!" email to User A

---

## Future Considerations

### Potential Extractions (if needed)
- **Asset Service** - If media management becomes complex
- **Analytics Service** - If event tracking needs separate scaling
- **Admin Service** - If admin tools need different tech stack

### Scaling Strategies
- **AI Service:** Horizontal scaling (multiple workers) based on Pub/Sub queue depth
- **Backend:** Vertical scaling initially, then horizontal with load balancer
- **Database:** Read replicas for analytics queries
- **Cache:** Redis cluster for high availability

### Cost Optimization
- **AI Inference:** Cache common transformations, batch similar jobs
- **Storage:** Lifecycle policies (delete old assets after 90 days)
- **Pub/Sub:** Use pull subscriptions with batching

---

## Viewing Diagrams

Install D2: `brew install d2` or [download](https://d2lang.com/tour/install)

Generate SVGs:
```bash
d2 Context.d2 Context.svg
d2 Container.d2 Container.svg
d2 Container-AI-Service.d2 Container-AI-Service.svg
```

Watch for changes:
```bash
d2 --watch Context.d2 Context.svg
```
