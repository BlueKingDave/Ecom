export interface Product {
  id: string;
  tenantId: string;
  externalId?: string | null;
  pluginId?: string | null;
  name: string;
  description?: string | null;
  price: string;
  compareAtPrice?: string | null;
  images: unknown;
  metadata: unknown;
  inventoryCount?: number | null;
  isActive?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}
