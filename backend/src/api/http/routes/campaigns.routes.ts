import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { CampaignService } from '../../../modules/integrations/adchannels/application/CampaignService';

const campaignService = new CampaignService();

const createSchema = z.object({
  name: z.string().min(1).max(255),
  platform: z.enum(['meta', 'tiktok', 'google']),
  budget: z.number().positive(),
  config: z.record(z.unknown()).default({}),
});

const updateSchema = createSchema.partial();

const metricsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const requireAuth = async (request: any) => {
  await request.jwtVerify();
};

export const campaignRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / → list campaigns
  fastify.get(
    '/',
    {
      schema: {
        tags: ['campaigns'],
        description: 'List all campaigns for the current tenant',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const campaigns = await campaignService.list(request.tenant.id);
      return { campaigns };
    }
  );

  // GET /:id → get one campaign
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Get a single campaign',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const { id } = request.params as { id: string };
      try {
        return await campaignService.get(request.tenant.id, id);
      } catch (err: any) {
        if (err.statusCode === 404) return reply.status(404).send({ error: 'Not Found', message: err.message });
        throw err;
      }
    }
  );

  // POST / → create (draft)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Create a new campaign (saved as draft)',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const data = createSchema.parse(request.body);
      const campaign = await campaignService.create(request.tenant.id, data);
      return reply.status(201).send(campaign);
    }
  );

  // PATCH /:id → update
  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Update a campaign',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const { id } = request.params as { id: string };
      const data = updateSchema.parse(request.body);
      try {
        return await campaignService.update(request.tenant.id, id, data);
      } catch (err: any) {
        if (err.statusCode === 404) return reply.status(404).send({ error: 'Not Found', message: err.message });
        throw err;
      }
    }
  );

  // POST /:id/activate → activate (dispatches to platform)
  fastify.post(
    '/:id/activate',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Activate a campaign (dispatches to ad platform)',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const { id } = request.params as { id: string };
      try {
        return await campaignService.activate(request.tenant.id, id);
      } catch (err: any) {
        if (err.statusCode === 404) return reply.status(404).send({ error: 'Not Found', message: err.message });
        throw err;
      }
    }
  );

  // POST /:id/pause → pause
  fastify.post(
    '/:id/pause',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Pause an active campaign',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const { id } = request.params as { id: string };
      try {
        return await campaignService.pause(request.tenant.id, id);
      } catch (err: any) {
        if (err.statusCode === 404) return reply.status(404).send({ error: 'Not Found', message: err.message });
        if (err.statusCode === 400) return reply.status(400).send({ error: 'Bad Request', message: err.message });
        throw err;
      }
    }
  );

  // DELETE /:id → delete
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Delete a campaign',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const { id } = request.params as { id: string };
      try {
        return await campaignService.delete(request.tenant.id, id);
      } catch (err: any) {
        if (err.statusCode === 404) return reply.status(404).send({ error: 'Not Found', message: err.message });
        throw err;
      }
    }
  );

  // GET /:id/metrics → get metrics
  fastify.get(
    '/:id/metrics',
    {
      schema: {
        tags: ['campaigns'],
        description: 'Get campaign metrics',
        security: [{ bearerAuth: [] }],
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.tenant) throw new Error('Tenant not found');
      const { id } = request.params as { id: string };
      const query = metricsQuerySchema.parse(request.query);
      const dateRange = {
        startDate: query.startDate ? new Date(query.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: query.endDate ? new Date(query.endDate) : new Date(),
      };
      try {
        return await campaignService.getMetrics(request.tenant.id, id, dateRange);
      } catch (err: any) {
        if (err.statusDate === 404) return reply.status(404).send({ error: 'Not Found', message: err.message });
        throw err;
      }
    }
  );
};
