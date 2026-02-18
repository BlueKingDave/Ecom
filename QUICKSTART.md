# Quick Start Guide - Phase 1 Foundation

Get the ecommerce platform running in under 5 minutes.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose
- PostgreSQL client (optional, for manual DB access)

## 1. Clone & Install

```bash
# If not already done
cd /home/bkd/Projects/Ecom/.worktrees/phase-1-foundation

# Install dependencies
pnpm install
```

## 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker start ecom-postgres ecom-redis

# Or start via docker-compose if not already created
docker-compose up -d postgres redis
```

## 3. Database Setup

```bash
# Run migrations
pnpm db:migrate

# Seed with test data
pnpm db:seed
```

**Test Data Created**:
- Tenant: "Store One" (slug: `store1`, ID: `cc93937f-78a0-4c09-b54d-5c2e00ccc0d2`)
- Admin User: `admin@store1.com` / `admin123`
- Customer User: `customer@store1.com` / `customer123`
- 3 Products (Cool T-Shirt, Awesome Mug, Epic Hoodie)

## 4. Configure Environment (Optional)

```bash
# Backend environment variables (already set for dev)
cp backend/.env.example backend/.env

# Edit as needed:
# - DATABASE_URL (default: localhost:5432)
# - REDIS_URL (default: localhost:6379)
# - JWT_SECRET (change in production!)
# - GCS_BUCKET_NAME (for file uploads)
```

## 5. Start Development Servers

```bash
# Start all services in parallel (backend + storefront + admin)
pnpm dev
```

This starts:
- **Backend**: http://localhost:3000
- **Storefront**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5174

## 6. Access the Platform

### Storefront (Customer-facing)
- **URL**: http://localhost:5173
- **Features**: Browse products, add to cart, checkout
- **No login required** for browsing and checkout

### Admin Dashboard
- **URL**: http://localhost:5174
- **Login**: `admin@store1.com` / `admin123`
- **Features**: Manage products, view orders, configure plugins

### API Documentation
- **URL**: http://localhost:3000/docs
- **Features**: Interactive Swagger UI, test endpoints

### Health Check
```bash
curl http://localhost:3000/health/ready
```

## 7. Test the Flow

### Customer Journey
1. Go to http://localhost:5173
2. Browse products on homepage or Products page
3. Click a product to view details
4. Add to cart
5. View cart (icon in header)
6. Proceed to checkout
7. Fill shipping address and place order
8. View order confirmation

### Admin Tasks
1. Go to http://localhost:5174
2. Login with admin credentials
3. View dashboard metrics
4. Go to Products → Add new product
5. Go to Orders → View customer orders
6. Go to Plugins → Configure Stripe/Printify

## 8. Build Plugins

```bash
# Build Stripe payment plugin
cd plugins/stripe-payment
pnpm build

# Build Printify fulfillment plugin
cd plugins/printify-fulfillment
pnpm build
```

## 9. Run Tests

```bash
# Backend tests
pnpm --filter @ecom/backend test

# Type checking
pnpm --filter @ecom/backend type-check

# Plugin tests
cd plugins/stripe-payment && pnpm test
cd plugins/printify-fulfillment && pnpm test
```

## 10. Google Cloud Storage (Optional)

For file uploads:

1. Create GCS bucket (see `docs/GCS_SETUP.md`)
2. Set up service account credentials
3. Configure environment:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
   export GCS_BUCKET_NAME="ecom-platform-assets"
   ```
4. Test upload:
   ```bash
   curl -X POST http://localhost:3000/api/assets/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "X-Tenant-ID: cc93937f-78a0-4c09-b54d-5c2e00ccc0d2" \
     -F "file=@/path/to/image.jpg"
   ```

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql postgresql://ecom:ecom_dev_password@localhost:5432/ecom_platform -c "SELECT 1;"
```

### Redis Connection Error
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

### TypeScript Errors
```bash
# Clean and reinstall
rm -rf node_modules
pnpm install

# Rebuild plugins
cd plugins/stripe-payment && pnpm build
cd plugins/printify-fulfillment && pnpm build
```

## API Examples

### Get Products
```bash
curl http://localhost:3000/api/products \
  -H "X-Tenant-ID: cc93937f-78a0-4c09-b54d-5c2e00ccc0d2"
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@store1.com",
    "password": "admin123"
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: cc93937f-78a0-4c09-b54d-5c2e00ccc0d2" \
  -H "X-Session-ID: your-session-id" \
  -d '{
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "US"
    }
  }'
```

## Folder Structure

```
.
├── backend/           # Fastify API server
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   ├── db/       # Database schema & migrations
│   │   └── plugins/  # Plugin registry
│   └── .env          # Environment config
├── frontend/
│   ├── storefront/   # Customer-facing app
│   └── admin/        # Admin dashboard
├── plugins/
│   ├── stripe-payment/
│   └── printify-fulfillment/
├── docs/             # Documentation
└── .github/
    └── workflows/    # CI/CD pipelines
```

## Next Steps

1. **Configure Plugins**: Add Stripe and Printify API keys in admin UI
2. **Customize Branding**: Edit theme config in database or storefront components
3. **Add Products**: Use admin UI or API to add real products
4. **Set Up Production**: Follow deployment guides for your hosting platform
5. **Enable GCS**: Set up Google Cloud Storage for file uploads

## Support & Resources

- **API Docs**: http://localhost:3000/docs
- **Architecture**: `diagrams/ARCHITECTURE_PLAN.md`
- **Roadmap**: `diagrams/IMPLEMENTATION_ROADMAP.md`
- **GCS Setup**: `docs/GCS_SETUP.md`
- **Phase 1 Summary**: `docs/PHASE_1_COMPLETION.md`

---

**Happy Building! 🚀**
