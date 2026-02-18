import { FastifyPluginAsync } from 'fastify';
import { db } from '../../../shared/infra/db';
import { storageService } from '../../../shared/infra/storage';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['health'],
        description: 'Health check endpoint',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    }
  );

  fastify.get(
    '/ready',
    {
      schema: {
        tags: ['health'],
        description: 'Readiness check - verifies all services',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  storage: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const services: Record<string, string> = {};
      let allHealthy = true;

      // Check database
      try {
        await db.execute(new String('SELECT 1') as any);
        services.database = 'ok';
      } catch (error) {
        services.database = 'error';
        allHealthy = false;
      }

      // Check GCS
      try {
        const storageHealthy = await storageService.healthCheck();
        services.storage = storageHealthy ? 'ok' : 'error';
        if (!storageHealthy) allHealthy = false;
      } catch (error) {
        services.storage = 'error';
        allHealthy = false;
      }

      if (allHealthy) {
        return {
          status: 'ready',
          services,
        };
      } else {
        reply.status(503).send({
          status: 'not ready',
          services,
        });
      }
    }
  );
};
