# Ecommerce Platform

A modular, multi-tenant ecommerce platform with pluggable fulfillment providers and ad platforms.

## Architecture

- **Backend**: Fastify + Drizzle ORM + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS + Shadcn/ui
- **AI Service**: Node.js + Gemini API
- **Infrastructure**: PostgreSQL, Redis, Cloud Storage
- **Plugin System**: Modular architecture for fulfillment and ad platforms

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for PostgreSQL and Redis)

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start all services in development
pnpm dev
```

### Development

```bash
# Backend only
pnpm --filter @ecom/backend dev

# Storefront only
pnpm --filter @ecom/storefront dev

# Admin dashboard only
pnpm --filter @ecom/admin dev
```

## Project Structure

```
ecom-platform/
├── backend/              # Fastify API
├── frontend/
│   ├── storefront/      # Customer-facing app
│   └── admin/           # Admin dashboard
├── ai-service/          # AI cartoonification
├── plugins/             # External plugins
└── packages/            # Shared packages
```

## Documentation

- [Architecture Plan](./diagrams/ARCHITECTURE_PLAN.md)
- [Implementation Roadmap](./diagrams/IMPLEMENTATION_ROADMAP.md)

## License

MIT
