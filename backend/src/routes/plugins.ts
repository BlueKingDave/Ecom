import { FastifyPluginAsync } from 'fastify';
import { pluginRegistry } from '../plugins/plugin-registry';
import { PluginService } from '../services/plugin.service';
import { z } from 'zod';

const pluginService = new PluginService();

const configurePluginSchema = z.object({
  config: z.record(z.unknown()),
});

export const pluginRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all available plugins
  fastify.get(
    '/',
    {
      schema: {
        tags: ['plugins'],
        description: 'Get all available plugins',
      },
    },
    async () => {
      const plugins = pluginRegistry.getAllPlugins();
      return { plugins };
    }
  );

  // Get plugins by type
  fastify.get(
    '/type/:type',
    {
      schema: {
        tags: ['plugins'],
        description: 'Get plugins by type',
        params: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: ['fulfillment', 'payment', 'ad_platform', 'analytics'] },
          },
        },
      },
    },
    async (request) => {
      const { type } = request.params as { type: 'fulfillment' | 'payment' | 'ad_platform' | 'analytics' };
      const plugins = pluginRegistry.getPluginsByType(type);
      return { plugins };
    }
  );

  // Get configured plugins for tenant
  fastify.get(
    '/tenant',
    {
      schema: {
        tags: ['plugins'],
        description: 'Get configured plugins for current tenant',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const configs = await pluginService.getTenantPlugins(request.tenant.id);

      // Enrich with manifest data
      const enriched = configs.map((config) => {
        const manifest = pluginRegistry.getManifest(config.pluginId);
        return {
          ...config,
          manifest,
        };
      });

      return { plugins: enriched };
    }
  );

  // Configure plugin for tenant
  fastify.post(
    '/:pluginId/configure',
    {
      schema: {
        tags: ['plugins'],
        description: 'Configure plugin for tenant',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { pluginId } = request.params as { pluginId: string };
      const { config } = configurePluginSchema.parse(request.body);

      const pluginConfig = await pluginService.configurePlugin(request.tenant.id, pluginId, config);

      return pluginConfig;
    }
  );

  // Enable plugin
  fastify.post(
    '/:pluginId/enable',
    {
      schema: {
        tags: ['plugins'],
        description: 'Enable plugin for tenant',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { pluginId } = request.params as { pluginId: string };
      const pluginConfig = await pluginService.enablePlugin(request.tenant.id, pluginId);

      return pluginConfig;
    }
  );

  // Disable plugin
  fastify.post(
    '/:pluginId/disable',
    {
      schema: {
        tags: ['plugins'],
        description: 'Disable plugin for tenant',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { pluginId } = request.params as { pluginId: string };
      const pluginConfig = await pluginService.disablePlugin(request.tenant.id, pluginId);

      return pluginConfig;
    }
  );
};
