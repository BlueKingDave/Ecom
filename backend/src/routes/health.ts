import { FastifyPluginAsync } from 'fastify';
import { db } from '../db';

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
        description: 'Readiness check - verifies database connection',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              database: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        // Simple database check
        await db.execute(new String('SELECT 1') as any);
        return {
          status: 'ready',
          database: 'connected',
        };
      } catch (error) {
        reply.status(503).send({
          status: 'not ready',
          database: 'disconnected',
        });
      }
    }
  );
};
