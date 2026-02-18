export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain?: string | null;
  themeConfig: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
