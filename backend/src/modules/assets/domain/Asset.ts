export interface Asset {
  id: string;
  tenantId: string;
  userId?: string | null;
  type: string;
  storagePath: string;
  metadata: unknown;
  createdAt: Date;
}
