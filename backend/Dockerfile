# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy backend and plugin packages
COPY backend/package.json ./backend/
COPY plugins/stripe-payment/package.json ./plugins/stripe-payment/
COPY plugins/printify-fulfillment/package.json ./plugins/printify-fulfillment/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend ./backend
COPY plugins/stripe-payment ./plugins/stripe-payment
COPY plugins/printify-fulfillment ./plugins/printify-fulfillment

# Build plugins
RUN cd plugins/stripe-payment && pnpm build
RUN cd plugins/printify-fulfillment && pnpm build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/plugins ./plugins

# Copy package files
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/backend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/index.ts"]
