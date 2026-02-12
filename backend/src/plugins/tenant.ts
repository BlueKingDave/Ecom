import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { db } from '../db';
import { tenants } from '../db/schema';
import { eq, or } from 'drizzle-orm';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: {
      id: string;
      slug: string;
      name: string;
      domain?: string;
      themeConfig: any;
    };
  }
}

/**
 * Tenant resolution plugin
 * Resolves tenant from:
 * 1. Custom domain (e.g., store-a.com)
 * 2. Subdomain (e.g., store-a.platform.com)
 * 3. X-Tenant-Id header (for admin/operator requests)
 */
const tenantPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('tenant', null);

  fastify.addHook('onRequest', async (request, reply) => {
    // Skip tenant resolution for health checks and docs
    if (request.url.startsWith('/health') || request.url.startsWith('/docs')) {
      return;
    }

    // Check for X-Tenant-Id header (used by admin dashboard)
    const tenantIdHeader = request.headers['x-tenant-id'];
    if (tenantIdHeader) {
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantIdHeader as string))
        .limit(1);

      if (tenant) {
        request.tenant = {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          domain: tenant.domain || undefined,
          themeConfig: tenant.themeConfig || {},
        };
        return;
      }
    }

    // Extract hostname
    const hostname = request.hostname;
    if (!hostname) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Missing hostname',
      });
    }

    // Validate hostname format to prevent SQL injection
    // RFC 1123 compliant hostname validation
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(hostname)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid hostname format',
      });
    }

    // Try to find tenant by custom domain or subdomain
    const subdomain = hostname.split('.')[0];
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(
        or(
          eq(tenants.domain, hostname),
          subdomain ? eq(tenants.slug, subdomain) : undefined
        )
      )
      .limit(1);

    if (!tenant) {
      // For auth endpoints, we might not need a tenant
      if (request.url.startsWith('/api/auth')) {
        return;
      }

      return reply.status(404).send({
        error: 'Tenant Not Found',
        message: 'No storefront found for this domain',
      });
    }

    request.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain || undefined,
      themeConfig: tenant.themeConfig || {},
    };
  });
};

export default fp(tenantPlugin, {
  name: 'tenant',
});

export { tenantPlugin };
