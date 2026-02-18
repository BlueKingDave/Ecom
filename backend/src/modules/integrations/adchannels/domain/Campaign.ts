export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  platform: string;
  pluginId: string;
  externalId?: string | null;
  status: CampaignStatus;
  budget: string;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
