import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { tenantPlugin } from '../api/http/middleware/tenantResolve';
import { authenticate } from '../api/http/middleware/auth';
import { healthRoutes } from '../api/http/routes/health.routes';
import { authRoutes } from '../api/http/routes/identity.routes';
import { productRoutes } from '../api/http/routes/catalog.routes';
import { cartRoutes } from '../api/http/routes/cart.routes';
import { orderRoutes } from '../api/http/routes/orders.routes';
import { pluginRoutes } from '../api/http/routes/providers.routes';
import { assetRoutes } from '../api/http/routes/assets.routes';
import { webhookRoutes } from '../api/http/routes/webhooks.routes';
import { campaignRoutes } from '../api/http/routes/campaigns.routes';
import { pluginRegistry } from '../modules/integrations/providers/infra/registry/ProviderRegistry';
import { db } from '../shared/infra/db';
import { tenants as tenantsTable } from '../shared/infra/db/schema';
import { AppError } from '../shared/domain/errors';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Initialize plugin registry
  await pluginRegistry.discoverPlugins();

  // Helper function to get allowed origins from tenants
  const getAllowedOrigins = async (): Promise<string[]> => {
    const tenants = await db.select().from(tenantsTable);
    const domains = tenants.map((t) => t.domain).filter(Boolean);
    const subdomains = tenants.map(
      (t) => `${t.slug}.${process.env.PLATFORM_DOMAIN || 'localhost'}`
    );
    return [
      ...domains.map((d) => `https://${d}`),
      ...domains.map((d) => `http://${d}`),
      ...subdomains.map((s) => `https://${s}`),
      ...subdomains.map((s) => `http://${s}`),
      'http://localhost:5173', // Storefront dev
      'http://localhost:5174', // Admin dev
      'http://localhost:3000', // Backend dev
    ];
  };

  // CORS with origin validation
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin) {
        cb(null, true);
        return;
      }

      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        cb(null, true);
        return;
      }

      // In production, validate against tenant origins
      getAllowedOrigins().then((allowedOrigins) => {
        if (allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error('Not allowed by CORS'), false);
        }
      }).catch((err) => {
        console.error('Error validating CORS origin:', err);
        cb(new Error('CORS validation error'), false);
      });
    },
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sign: {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    },
  });

  // Multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1, // Only allow 1 file per request
    },
  });

  // Auth decorator
  app.decorate('authenticate', authenticate);

  // Swagger/OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Ecommerce Platform API',
        description: 'Multi-tenant ecommerce platform with plugin architecture',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'health', description: 'Health check endpoints' },
        { name: 'products', description: 'Product management' },
        { name: 'orders', description: 'Order management' },
        { name: 'cart', description: 'Shopping cart' },
        { name: 'assets', description: 'Asset management and file uploads' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Tenant resolution plugin
  await app.register(tenantPlugin);

  // Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(cartRoutes, { prefix: '/api/cart' });
  await app.register(orderRoutes, { prefix: '/api/orders' });
  await app.register(pluginRoutes, { prefix: '/api/plugins' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(webhookRoutes, { prefix: '/api/webhooks' });
  await app.register(campaignRoutes, { prefix: '/api/campaigns' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    // Domain errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code || error.name,
        message: error.message,
      });
    }

    // JWT errors
    if (error.statusCode === 401) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: error.message,
      });
    }

    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    // Default error
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message,
    });
  });

  return app;
}
