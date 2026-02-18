import { AssetRepo } from '../infra/AssetRepo';
import { storageService } from '../../../shared/infra/storage';

export class AssetService {
  constructor(private repo = new AssetRepo()) {}

  async upload(tenantId: string, userId: string | null, buffer: Buffer, filename: string, mimetype: string) {
    const result = await storageService.uploadFile(buffer, filename, mimetype, tenantId, 'originals');
    return this.repo.create(tenantId, userId, 'original', result.storagePath, {
      filename: result.filename,
      contentType: result.contentType,
      size: result.size,
      publicUrl: result.publicUrl,
    });
  }

  async list(tenantId: string, type?: string, limit = 50, offset = 0) {
    return this.repo.findAll(tenantId, { type, limit, offset });
  }

  async delete(tenantId: string, assetId: string) {
    const asset = await this.repo.findById(tenantId, assetId);
    if (!asset) return null;
    try {
      await storageService.deleteFile(asset.storagePath);
    } catch {}
    await this.repo.delete(assetId);
    return { success: true };
  }
}
