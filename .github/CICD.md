# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for the Ecom Platform.

## Overview

The CI/CD pipeline consists of three main workflows:

1. **CI (Continuous Integration)** - Runs on every pull request and push
2. **Production Deployment** - Deploys to production on main/master branch
3. **Docker Build** - Builds and pushes Docker images to GitHub Container Registry

## Workflows

### 1. CI Workflow (`ci.yml`)

Triggers on:
- Pull requests to main/master/develop
- Pushes to main/master/develop

**Jobs:**

#### Lint & Type Check
- Runs ESLint on all packages
- Type checks backend, storefront, and admin with TypeScript
- Builds all plugins to verify compilation

#### Test Backend
- Spins up PostgreSQL and Redis services
- Runs database migrations
- Executes backend test suite
- Environment: isolated test environment

#### Build Frontend
- Builds both storefront and admin applications
- Uploads build artifacts for review
- Verifies production builds succeed

**Status:** ✅ All checks must pass before merge

### 2. Production Deployment (`deploy-production.yml`)

Triggers on:
- Pushes to main/master branch
- Manual workflow dispatch

**Jobs:**

#### Deploy Backend
- Builds backend application
- Builds all plugins
- Deploys to your chosen platform (configure deployment steps)

#### Deploy Storefront
- Builds storefront application
- Deploys to CDN/hosting platform

#### Deploy Admin
- Builds admin dashboard
- Deploys to secure hosting

**Deployment Platforms** (choose one):
- **Backend**: Google Cloud Run, Railway, AWS ECS, Render
- **Frontend**: Vercel, Netlify, Cloudflare Pages, AWS S3+CloudFront

### 3. Docker Build (`docker-build.yml`)

Triggers on:
- Pushes to main/master/develop
- Pull requests
- Git tags (v*)

**Jobs:**

#### Build Backend Image
- Builds multi-stage Docker image for backend
- Pushes to GitHub Container Registry (ghcr.io)
- Tags: branch name, PR number, semantic version, git SHA

#### Build Storefront Image
- Builds Nginx-based image for storefront
- Includes health checks and caching
- Pushes to GitHub Container Registry

**Image naming:**
```
ghcr.io/your-org/your-repo/backend:main
ghcr.io/your-org/your-repo/storefront:v1.0.0
```

## Docker Images

### Backend Image

**Base:** node:20-alpine
**Multi-stage build:**
1. Builder stage: Installs dependencies and builds plugins
2. Production stage: Copies only necessary files

**Features:**
- Health check on /health endpoint
- Production-optimized (NODE_ENV=production)
- Includes built plugins
- Exposes port 3000

**Usage:**
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e JWT_SECRET=your_secret \
  ghcr.io/your-org/your-repo/backend:latest
```

### Storefront Image

**Base:** nginx:alpine
**Multi-stage build:**
1. Builder stage: Builds React application with Vite
2. Production stage: Serves static files with Nginx

**Features:**
- SPA routing support
- Gzip compression
- Security headers
- Static asset caching (1 year)
- Health check on /health endpoint
- Exposes port 80

**Usage:**
```bash
docker run -p 80:80 \
  ghcr.io/your-org/your-repo/storefront:latest
```

## Environment Variables

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `NODE_ENV` | No | Environment (production/development) |
| `PORT` | No | Server port (default: 3000) |

### Storefront
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

### Admin
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

## Secrets Configuration

Configure these secrets in GitHub repository settings:

1. **GITHUB_TOKEN** - Automatically provided by GitHub Actions
2. **Database credentials** (if deploying)
3. **API keys for deployment platforms**

## Local Docker Development

### Build locally:
```bash
# Backend
docker build -f backend/Dockerfile -t ecom-backend .

# Storefront
docker build -f frontend/storefront/Dockerfile -t ecom-storefront .
```

### Run with docker-compose:
```bash
docker-compose up -d
```

## Deployment Strategies

### Option 1: Serverless (Recommended for Frontend)
- **Vercel** - Zero-config deployment for both frontend apps
- **Netlify** - Alternative with similar features
- **Cloudflare Pages** - Fast global CDN

### Option 2: Container-based (Recommended for Backend)
- **Google Cloud Run** - Serverless containers, auto-scaling
- **Railway** - Simple platform with great DX
- **AWS ECS/Fargate** - Enterprise-grade container orchestration

### Option 3: Traditional VPS
- **DigitalOcean** - Droplets with Docker
- **Linode** - Simple VPS hosting
- **Hetzner** - Cost-effective European hosting

## Monitoring & Observability

Add these integrations:

1. **Error Tracking**
   - Sentry for backend errors
   - LogRocket for frontend issues

2. **Performance Monitoring**
   - New Relic / Datadog
   - Vercel Analytics (if using Vercel)

3. **Uptime Monitoring**
   - UptimeRobot
   - Better Uptime

## Rollback Procedures

### Docker-based deployments:
```bash
# Tag previous version
docker pull ghcr.io/your-org/your-repo/backend:sha-abc123
docker tag ghcr.io/your-org/your-repo/backend:sha-abc123 ghcr.io/your-org/your-repo/backend:latest
docker push ghcr.io/your-org/your-repo/backend:latest
```

### Platform-based deployments:
- Vercel: Revert to previous deployment in dashboard
- Railway: Rollback to previous deployment
- Cloud Run: Revert to previous revision

## Best Practices

1. ✅ Always run tests before merging
2. ✅ Use semantic versioning for releases
3. ✅ Tag production deployments (v1.0.0, v1.0.1, etc.)
4. ✅ Monitor deployment health after each release
5. ✅ Keep secrets in GitHub Secrets, never commit them
6. ✅ Use environment-specific configurations
7. ✅ Implement health check endpoints
8. ✅ Set up log aggregation

## Troubleshooting

### CI failing on type check
- Run `pnpm type-check` locally
- Fix TypeScript errors before pushing

### Docker build failing
- Check Dockerfile syntax
- Verify all dependencies are in package.json
- Test build locally first

### Deployment failing
- Check environment variables are set
- Verify secrets are configured
- Review platform-specific logs

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Implement canary deployments
- [ ] Add performance budgets
- [ ] Set up staging environment
- [ ] Implement blue-green deployments
- [ ] Add automatic database backups
- [ ] Configure CDN caching rules
- [ ] Set up automated security scanning
