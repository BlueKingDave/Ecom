import { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'operator';
  tenantId?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

/**
 * Authenticate middleware - verifies JWT token
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
    request.user = request.user as JWTPayload;
  } catch (err) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    });
  }
}

/**
 * Authorize middleware - checks user role
 */
export function authorize(...allowedRoles: Array<'customer' | 'admin' | 'operator'>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Check tenant ownership - ensures user belongs to the request tenant
 */
export async function checkTenantOwnership(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  // Operators can access any tenant
  if (request.user.role === 'operator') {
    return;
  }

  // Check if user belongs to the tenant
  if (request.user.tenantId !== request.tenant?.id) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Access denied to this storefront',
    });
  }
}
