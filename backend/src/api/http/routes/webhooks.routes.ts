import { FastifyPluginAsync } from 'fastify';
import { db } from '../../../shared/infra/db';
import { pluginConfigs } from '../../../shared/infra/db/schema';
import { eq } from 'drizzle-orm';
import { PluginService } from '../../../modules/integrations/providers/application/ProviderService';
import { OrderService } from '../../../modules/orders/application/OrderService';
import type { FulfillmentPlugin } from '../../../modules/integrations/providers/domain/Provider';

const pluginService = new PluginService();
const orderService = new OrderService();

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  // Inbound webhook receiver for fulfillment plugins
  fastify.post(
    '/fulfillment/:pluginId',
    {
      schema: {
        tags: ['webhooks'],
        description: 'Receive inbound webhook from fulfillment provider',
      },
    },
    async (request, reply) => {
      const { pluginId } = request.params as { pluginId: string };
      const body = request.body as unknown;

      // Read signature from provider-specific headers
      const signature =
        (request.headers['x-printify-signature'] as string) ||
        (request.headers['x-webhook-signature'] as string) ||
        undefined;

      // Find all tenants with this plugin enabled
      const configs = await db
        .select()
        .from(pluginConfigs)
        .where(eq(pluginConfigs.pluginId, pluginId));

      for (const config of configs) {
        if (!config.enabled) continue;

        try {
          const instance = await pluginService.getPluginInstance(config.tenantId, pluginId) as FulfillmentPlugin;

          if (typeof instance.handleWebhook !== 'function') continue;

          const result = await instance.handleWebhook(body, signature);

          if (!result.processed) continue;

          if (result.trackingNumber && result.orderId) {
            // Look up local order by external ID
            const order = await orderService.getOrderByExternalId(config.tenantId, result.orderId);
            if (order) {
              await orderService.updateTrackingInfo(
                config.tenantId,
                order.id,
                result.trackingNumber,
                result.carrierCode
              );
            }
          } else if (result.event === 'order.cancelled' && result.orderId) {
            const order = await orderService.getOrderByExternalId(config.tenantId, result.orderId);
            if (order) {
              await orderService.updateOrderStatus(config.tenantId, order.id, 'cancelled');
            }
          }
        } catch (error) {
          // Log but don't fail — prevents provider retries on partial failures
          fastify.log.error({ pluginId, tenantId: config.tenantId, error }, 'Webhook processing error');
        }
      }

      // Always 200 to prevent provider retries
      return reply.status(200).send({ received: true });
    }
  );
};
