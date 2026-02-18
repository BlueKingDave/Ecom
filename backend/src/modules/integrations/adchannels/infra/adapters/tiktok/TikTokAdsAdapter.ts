import { randomUUID } from 'crypto';
import type { AdChannel, CampaignConfig, CampaignMetrics, DateRange } from '../../../domain/AdChannel';

export class TikTokAdsAdapter implements AdChannel {
  readonly platformId = 'tiktok' as const;
  readonly name = 'TikTok Ads';

  async createCampaign(_config: CampaignConfig) {
    return { externalId: `tiktok_camp_${randomUUID().slice(0, 8)}` };
  }

  async updateCampaign(_id: string, _u: Partial<CampaignConfig>) {}

  async activateCampaign(_id: string) {}

  async pauseCampaign(_id: string) {}

  async deleteCampaign(_id: string) {}

  async getCampaignMetrics(_id: string, _r: DateRange): Promise<CampaignMetrics> {
    return {
      impressions: 34_820,
      clicks: 1_204,
      conversions: 67,
      spend: 211.43,
      cpc: 0.176,
      cpa: 3.156,
      roas: 5.1,
    };
  }

  async healthCheck() {
    return { status: 'ok' as const };
  }
}
