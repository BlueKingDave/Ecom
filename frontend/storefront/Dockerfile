# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy frontend package
COPY frontend/storefront/package.json ./frontend/storefront/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY frontend/storefront ./frontend/storefront

WORKDIR /app/frontend/storefront

# Build application
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/frontend/storefront/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/storefront/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
