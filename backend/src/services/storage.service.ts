import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

export interface UploadResult {
  id: string;
  storagePath: string;
  publicUrl: string;
  bucket: string;
  filename: string;
  contentType: string;
  size: number;
}

export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    // Initialize GCS client
    // If GOOGLE_APPLICATION_CREDENTIALS env var is set, it will use that
    // Otherwise, it will use default credentials from GCE/Cloud Run
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || 'ecom-platform-assets';
  }

  /**
   * Upload file to Google Cloud Storage
   */
  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    contentType: string,
    tenantId: string,
    folder: 'originals' | 'cartoonified' | 'products' = 'originals'
  ): Promise<UploadResult> {
    const fileId = randomUUID();
    const extension = originalFilename.split('.').pop() || 'jpg';
    const filename = `${fileId}.${extension}`;
    const storagePath = `${tenantId}/${folder}/${filename}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(storagePath);

    // Upload file
    await file.save(buffer, {
      contentType,
      metadata: {
        originalFilename,
        tenantId,
        folder,
        uploadedAt: new Date().toISOString(),
      },
      resumable: false, // For small files, use simple upload
    });

    // Make file publicly accessible (optional - remove if you want private files)
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${storagePath}`;

    return {
      id: fileId,
      storagePath,
      publicUrl,
      bucket: this.bucketName,
      filename: originalFilename,
      contentType,
      size: buffer.length,
    };
  }

  /**
   * Delete file from Google Cloud Storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(storagePath);
    await file.delete();
  }

  /**
   * Get signed URL for temporary private access
   */
  async getSignedUrl(storagePath: string, expiresInMinutes: number = 60): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(storagePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return url;
  }

  /**
   * Check if bucket exists and is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.exists();
      return true;
    } catch (error) {
      console.error('GCS health check failed:', error);
      return false;
    }
  }
}

// Global storage service instance
export const storageService = new StorageService();
