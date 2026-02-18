import { FastifyPluginAsync } from 'fastify';
import { CatalogService, createProductSchema, updateProductSchema } from '../services/catalog.service';
import { checkTenantOwnership } from '../middleware/auth';

const catalogService = new CatalogService();

export const productRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all products
  fastify.get(
    '/',
    {
      schema: {
        tags: ['products'],
        description: 'Get all products for the current tenant',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { limit, offset } = request.query as { limit?: number; offset?: number };
      const products = await catalogService.getProducts(request.tenant.id, { limit, offset });

      return { products };
    }
  );

  // Get single product
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['products'],
        description: 'Get a single product by ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { id } = request.params as { id: string };
      const product = await catalogService.getProduct(request.tenant.id, id);

      if (!product) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Product not found',
        });
      }

      return product;
    }
  );

  // Create product (admin only)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['products'],
        description: 'Create a new product',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [
        async (request) => {
          await request.jwtVerify();
        },
        checkTenantOwnership,
      ],
    },
    async (request, _reply) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const data = createProductSchema.parse(request.body);
      const product = await catalogService.createProduct(request.tenant.id, data);

      return product;
    }
  );

  // Update product (admin only)
  fastify.patch(
    '/:id',
    {
      schema: {
        tags: ['products'],
        description: 'Update a product',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [
        async (request) => {
          await request.jwtVerify();
        },
        checkTenantOwnership,
      ],
    },
    async (request, reply) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { id } = request.params as { id: string };
      const data = updateProductSchema.parse(request.body);
      const product = await catalogService.updateProduct(request.tenant.id, id, data);

      if (!product) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Product not found',
        });
      }

      return product;
    }
  );

  // Delete product (admin only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['products'],
        description: 'Delete a product (soft delete)',
        security: [{ bearerAuth: [] }],
      },
      preHandler: [
        async (request) => {
          await request.jwtVerify();
        },
        checkTenantOwnership,
      ],
    },
    async (request, reply) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { id } = request.params as { id: string };
      const product = await catalogService.deleteProduct(request.tenant.id, id);

      if (!product) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Product not found',
        });
      }

      return { message: 'Product deleted successfully' };
    }
  );
};
