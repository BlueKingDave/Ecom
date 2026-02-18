# Infrastructure Setup

## Running Services

### Start Infrastructure
```bash
# Start PostgreSQL and Redis containers
docker run -d \
  --name ecom-postgres \
  --network ecom-network \
  -e POSTGRES_USER=ecom \
  -e POSTGRES_PASSWORD=ecom_dev_password \
  -e POSTGRES_DB=ecom_platform \
  -p 5432:5432 \
  -v ecom_postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

docker run -d \
  --name ecom-redis \
  --network ecom-network \
  -p 6379:6379 \
  -v ecom_redis_data:/data \
  redis:7-alpine
```

### Check Status
```bash
docker ps --filter "name=ecom-"
```

### Stop Services
```bash
docker stop ecom-postgres ecom-redis
```

### Remove Containers (keeps data)
```bash
docker rm ecom-postgres ecom-redis
```

### Remove All (including data)
```bash
docker rm -f ecom-postgres ecom-redis
docker volume rm ecom_postgres_data ecom_redis_data
```

## Database Management

### Run Migrations
```bash
cd backend
pnpm drizzle-kit push
```

### Seed Database
```bash
cd backend
pnpm tsx src/db/seed.ts
```

### Reset Database
```bash
docker exec ecom-postgres psql -U ecom -d ecom_platform -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd backend
pnpm drizzle-kit push
pnpm tsx src/db/seed.ts
```

## Default Credentials

After seeding, use these credentials:
- **Admin**: admin@ecom-platform.local / password
- **Customer**: customer@demo-store.local / password
- **Tenant**: demo-store (slug)

## Environment Variables

All `.env` files are configured with:
- Database: PostgreSQL on localhost:5432
- Redis: localhost:6379
- API: http://localhost:3000

## Cloud Storage

For development, files can be stored locally. For production:
- Google Cloud Storage (recommended)
- AWS S3
- Azure Blob Storage

Configuration will be added when implementing file upload features.

## Health Checks

```bash
# PostgreSQL
docker exec ecom-postgres pg_isready -U ecom

# Redis
docker exec ecom-redis redis-cli ping

# API
curl http://localhost:3000/health
```

## Ports

- **Backend API**: 3000
- **Storefront**: 5173
- **Admin Dashboard**: 5174
- **PostgreSQL**: 5432
- **Redis**: 6379
