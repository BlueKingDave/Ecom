import { FastifyPluginAsync } from 'fastify';
import { CartService } from '../services/cart.service';
import { z } from 'zod';

const cartService = new CartService();

const addItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  price: z.string(),
  quantity: z.number().min(1),
  image: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateQuantitySchema = z.object({
  quantity: z.number().min(0),
});

export const cartRoutes: FastifyPluginAsync = async (fastify) => {
  // Get cart
  fastify.get(
    '/',
    {
      schema: {
        tags: ['cart'],
        description: 'Get current cart',
      },
    },
    async (request) => {
      // Use session ID or user ID as cart identifier
      const sessionId = request.user?.id || request.headers['x-session-id'] as string || 'anonymous';
      const cart = await cartService.getCart(sessionId);

      return cart;
    }
  );

  // Add item to cart
  fastify.post(
    '/items',
    {
      schema: {
        tags: ['cart'],
        description: 'Add item to cart',
      },
    },
    async (request) => {
      const sessionId = request.user?.id || request.headers['x-session-id'] as string || 'anonymous';
      const item = addItemSchema.parse(request.body);
      const cart = await cartService.addItem(sessionId, item);

      return cart;
    }
  );

  // Update item quantity
  fastify.patch(
    '/items/:productId',
    {
      schema: {
        tags: ['cart'],
        description: 'Update item quantity in cart',
      },
    },
    async (request) => {
      const sessionId = request.user?.id || request.headers['x-session-id'] as string || 'anonymous';
      const { productId } = request.params as { productId: string };
      const { quantity } = updateQuantitySchema.parse(request.body);

      const cart = await cartService.updateItemQuantity(sessionId, productId, quantity);

      return cart;
    }
  );

  // Remove item from cart
  fastify.delete(
    '/items/:productId',
    {
      schema: {
        tags: ['cart'],
        description: 'Remove item from cart',
      },
    },
    async (request) => {
      const sessionId = request.user?.id || request.headers['x-session-id'] as string || 'anonymous';
      const { productId } = request.params as { productId: string };

      const cart = await cartService.removeItem(sessionId, productId);

      return cart;
    }
  );

  // Clear cart
  fastify.delete(
    '/',
    {
      schema: {
        tags: ['cart'],
        description: 'Clear cart',
      },
    },
    async (request) => {
      const sessionId = request.user?.id || request.headers['x-session-id'] as string || 'anonymous';
      await cartService.clearCart(sessionId);

      return { message: 'Cart cleared successfully' };
    }
  );
};
