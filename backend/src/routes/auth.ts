import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/password';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Login
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        description: 'Login with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = loginSchema.parse(request.body);

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (!user) {
        return reply.status(401).send({
          error: 'Authentication Failed',
          message: 'Invalid email or password',
        });
      }

      // Verify password hash
      const isValidPassword = await verifyPassword(body.password, user.passwordHash);
      if (!isValidPassword) {
        return reply.status(401).send({
          error: 'Authentication Failed',
          message: 'Invalid email or password',
        });
      }

      // Generate JWT tokens
      const accessToken = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role as 'customer' | 'admin' | 'operator',
        tenantId: user.tenantId || undefined,
      });

      const refreshToken = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role as 'customer' | 'admin' | 'operator',
          tenantId: user.tenantId || undefined,
        },
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }
  );

  // Register
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        description: 'Register a new customer account',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const body = registerSchema.parse(request.body);

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);

      if (existingUser) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(body.password);
      const [newUser] = await db
        .insert(users)
        .values({
          tenantId: request.tenant?.id,
          email: body.email,
          passwordHash: hashedPassword,
          firstName: body.firstName,
          lastName: body.lastName,
          role: 'customer',
        })
        .returning();

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      // Generate tokens
      const accessToken = fastify.jwt.sign({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role as 'customer' | 'admin' | 'operator',
        tenantId: newUser.tenantId || undefined,
      });

      return reply.status(201).send({
        accessToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }
  );

  // Get current user
  fastify.get(
    '/me',
    {
      schema: {
        tags: ['auth'],
        description: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication token',
          });
        }
      },
    },
    async (request) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.user.id))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
      };
    }
  );
};
