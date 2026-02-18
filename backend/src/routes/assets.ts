import type { FastifyPluginAsync } from 'fastify';
import { db } from '../db';
import { assets } from '../db/schema';
import { storageService } from '../services/storage.service';
import { eq, and } from 'drizzle-orm';

export const assetRoutes: FastifyPluginAsync = async (app) => {
  // Upload asset (photo)
  app.post('/upload', {
    schema: {
      description: 'Upload a photo asset',
      tags: ['assets'],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            storagePath: { type: 'string' },
            publicUrl: { type: 'string' },
            type: { type: 'string' },
          },
        },
      },
    },
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const buffer = await data.toBuffer();
    const tenantId = request.tenant?.id;
    const userId = request.user?.id;

    if (!tenantId) {
      return reply.status(400).send({ error: 'Tenant not found' });
    }

    // Upload to GCS
    const uploadResult = await storageService.uploadFile(
      buffer,
      data.filename,
      data.mimetype,
      tenantId,
      'originals'
    );

    // Save to database
    const [asset] = await db
      .insert(assets)
      .values({
        tenantId,
        userId: userId || null,
        type: 'original',
        storagePath: uploadResult.storagePath,
        metadata: {
          filename: uploadResult.filename,
          contentType: uploadResult.contentType,
          size: uploadResult.size,
          publicUrl: uploadResult.publicUrl,
        },
      })
      .returning();

    return {
      id: asset!.id,
      storagePath: asset!.storagePath,
      publicUrl: uploadResult.publicUrl,
      type: asset!.type,
    };
  });

  // Get assets for tenant
  app.get('/', {
    schema: {
      description: 'Get all assets for current tenant',
      tags: ['assets'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['original', 'cartoonified'] },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { type, limit = 50, offset = 0 } = request.query as {
      type?: 'original' | 'cartoonified';
      limit?: number;
      offset?: number;
    };

    const tenantId = request.tenant?.id;
    if (!tenantId) {
      return reply.status(400).send({ error: 'Tenant not found' });
    }

    const query = db
      .select()
      .from(assets)
      .where(
        type
          ? and(eq(assets.tenantId, tenantId), eq(assets.type, type))
          : eq(assets.tenantId, tenantId)
      )
      .limit(limit)
      .offset(offset)
      .orderBy(assets.createdAt);

    const results = await query;

    return results.map((asset) => ({
      id: asset.id,
      type: asset.type,
      storagePath: asset.storagePath,
      publicUrl: (asset.metadata as { publicUrl?: string })?.publicUrl,
      createdAt: asset.createdAt,
      metadata: asset.metadata,
    }));
  });

  // Delete asset
  app.delete('/:id', {
    schema: {
      description: 'Delete an asset',
      tags: ['assets'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
    onRequest: [app.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.tenant?.id;

    if (!tenantId) {
      return reply.status(400).send({ error: 'Tenant not found' });
    }

    // Find asset
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));

    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }

    // Delete from GCS
    try {
      await storageService.deleteFile(asset.storagePath);
    } catch (error) {
      console.error('Failed to delete from GCS:', error);
      // Continue with DB deletion even if GCS deletion fails
    }

    // Delete from database
    await db.delete(assets).where(eq(assets.id, id));

    return { success: true };
  });
};
