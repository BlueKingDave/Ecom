export type AdPlatform = 'meta' | 'tiktok' | 'google';

export interface AdChannel {
  readonly platformId: AdPlatform;
  readonly name: string;
  createCampaign(config: CampaignConfig): Promise<{ externalId: string }>;
  updateCampaign(externalId: string, updates: Partial<CampaignConfig>): Promise<void>;
  activateCampaign(externalId: string): Promise<void>;
  pauseCampaign(externalId: string): Promise<void>;
  deleteCampaign(externalId: string): Promise<void>;
  getCampaignMetrics(externalId: string, dateRange: DateRange): Promise<CampaignMetrics>;
  healthCheck(): Promise<{ status: 'ok' | 'error'; message?: string }>;
}

export interface CampaignConfig {
  name: string;
  budget: number;
  targeting?: Record<string, unknown>;
  creative?: Record<string, unknown>;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}
