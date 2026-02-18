import { randomUUID } from 'crypto';
import type { AdChannel, CampaignConfig, CampaignMetrics, DateRange } from '../../../domain/AdChannel';

export class GoogleAdsAdapter implements AdChannel {
  readonly platformId = 'google' as const;
  readonly name = 'Google Ads';

  async createCampaign(_config: CampaignConfig) {
    return { externalId: `google_camp_${randomUUID().slice(0, 8)}` };
  }

  async updateCampaign(_id: string, _u: Partial<CampaignConfig>) {}

  async activateCampaign(_id: string) {}

  async pauseCampaign(_id: string) {}

  async deleteCampaign(_id: string) {}

  async getCampaignMetrics(_id: string, _r: DateRange): Promise<CampaignMetrics> {
    return {
      impressions: 8_990,
      clicks: 623,
      conversions: 31,
      spend: 98.55,
      cpc: 0.158,
      cpa: 3.179,
      roas: 3.8,
    };
  }

  async healthCheck() {
    return { status: 'ok' as const };
  }
}
