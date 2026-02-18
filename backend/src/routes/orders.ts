import { FastifyPluginAsync } from 'fastify';
import { OrderService, createOrderSchema } from '../services/order.service';
import { PluginService } from '../services/plugin.service';
import type { FulfillmentPlugin, Order as PluginOrder } from '../plugins/interfaces';

const orderService = new OrderService();
const pluginService = new PluginService();

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all orders (authenticated users only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['orders'],
        description: 'Get orders for authenticated user',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 50 },
            offset: { type: 'number', default: 0 },
          },
        },
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { limit, offset } = request.query as { limit?: number; offset?: number };

      // Customers see only their orders, admins see all
      const userId = request.user.role === 'customer' ? request.user.id : undefined;

      const orders = await orderService.getOrders(request.tenant.id, {
        limit,
        offset,
        userId,
      });

      return { orders };
    }
  );

  // Get single order
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['orders'],
        description: 'Get a single order by ID',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request, reply) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { id } = request.params as { id: string };
      const order = await orderService.getOrder(request.tenant.id, id);

      if (!order) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Order not found',
        });
      }

      // Check if user owns this order (unless admin/operator)
      if (request.user.role === 'customer' && order.userId !== request.user.id) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied to this order',
        });
      }

      return order;
    }
  );

  // Create order
  fastify.post(
    '/',
    {
      schema: {
        tags: ['orders'],
        description: 'Create a new order',
      },
    },
    async (request) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const data = createOrderSchema.parse(request.body);

      // If user is authenticated, use their ID
      if (request.user) {
        data.userId = request.user.id;
      }

      const order = await orderService.createOrder(request.tenant.id, data);

      // Best-effort: dispatch to active fulfillment plugin
      try {
        const tenantPlugins = await pluginService.getTenantPlugins(request.tenant.id);
        const activePlugin = tenantPlugins.find((p) => p.enabled);

        if (activePlugin) {
          const instance = await pluginService.getPluginInstance(
            request.tenant.id,
            activePlugin.pluginId
          ) as FulfillmentPlugin;

          const shippingAddr = order.shippingAddress as Record<string, string> | null;
          const pluginOrder: PluginOrder = {
            id: order.id,
            items: (order.items as Array<{ productId: string; externalId?: string; variantId?: string; quantity: number; price: string }>).map((item) => ({
              productId: item.productId,
              externalId: item.externalId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
            shippingAddress: {
              firstName: shippingAddr?.firstName || '',
              lastName: shippingAddr?.lastName || '',
              address1: shippingAddr?.address1 || '',
              address2: shippingAddr?.address2,
              city: shippingAddr?.city || '',
              state: shippingAddr?.state || '',
              postalCode: shippingAddr?.postalCode || '',
              country: shippingAddr?.country || 'US',
              phone: shippingAddr?.phone,
            },
            customer: {
              email: shippingAddr?.email || '',
              firstName: shippingAddr?.firstName,
              lastName: shippingAddr?.lastName,
            },
          };

          const externalId = await instance.createOrder(pluginOrder);
          await orderService.updateExternalId(request.tenant.id, order.id, externalId, activePlugin.pluginId);
        }
      } catch (pluginError) {
        request.log.warn({ error: pluginError }, 'Plugin order dispatch failed (non-fatal)');
      }

      return order;
    }
  );

  // Cancel order
  fastify.post(
    '/:id/cancel',
    {
      schema: {
        tags: ['orders'],
        description: 'Cancel an order',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request) => {
        await request.jwtVerify();
      },
    },
    async (request, reply) => {
      if (!request.tenant) {
        throw new Error('Tenant not found');
      }

      const { id } = request.params as { id: string };

      // Check order ownership
      const order = await orderService.getOrder(request.tenant.id, id);
      if (!order) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Order not found',
        });
      }

      if (request.user.role === 'customer' && order.userId !== request.user.id) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied to this order',
        });
      }

      const cancelledOrder = await orderService.cancelOrder(request.tenant.id, id);

      // Best-effort: cancel with fulfillment plugin
      if (order.externalId && order.pluginId) {
        try {
          const instance = await pluginService.getPluginInstance(
            request.tenant.id,
            order.pluginId
          ) as FulfillmentPlugin;
          await instance.cancelOrder(order.externalId);
        } catch (pluginError) {
          request.log.warn({ error: pluginError }, 'Plugin order cancel failed (non-fatal)');
        }
      }

      return cancelledOrder;
    }
  );
};
