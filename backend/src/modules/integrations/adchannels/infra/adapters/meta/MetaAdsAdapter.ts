import { randomUUID } from 'crypto';
import type { AdChannel, CampaignConfig, CampaignMetrics, DateRange } from '../../../domain/AdChannel';

export class MetaAdsAdapter implements AdChannel {
  readonly platformId = 'meta' as const;
  readonly name = 'Meta Ads';

  async createCampaign(_config: CampaignConfig) {
    return { externalId: `meta_camp_${randomUUID().slice(0, 8)}` };
  }

  async updateCampaign(_id: string, _u: Partial<CampaignConfig>) {}

  async activateCampaign(_id: string) {}

  async pauseCampaign(_id: string) {}

  async deleteCampaign(_id: string) {}

  async getCampaignMetrics(_id: string, _r: DateRange): Promise<CampaignMetrics> {
    return {
      impressions: 12_450,
      clicks: 892,
      conversions: 43,
      spend: 156.78,
      cpc: 0.176,
      cpa: 3.646,
      roas: 4.2,
    };
  }

  async healthCheck() {
    return { status: 'ok' as const };
  }
}
