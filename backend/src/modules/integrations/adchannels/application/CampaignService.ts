import { CampaignRepo } from '../infra/persistence/CampaignRepo';
import { adChannelRegistry } from '../infra/AdChannelRegistry';
import { NotFoundError, ValidationError } from '../../../../shared/domain/errors';
import type { AdPlatform, CampaignConfig, DateRange } from '../domain/AdChannel';

const PLATFORM_PLUGIN_ID: Record<string, string> = {
  meta: 'meta-ads',
  tiktok: 'tiktok-ads',
  google: 'google-ads',
};

export class CampaignService {
  constructor(private campaigns = new CampaignRepo()) {}

  async list(tenantId: string) {
    return this.campaigns.findAll(tenantId);
  }

  async get(tenantId: string, id: string) {
    const c = await this.campaigns.findById(tenantId, id);
    if (!c) throw new NotFoundError('Campaign', id);
    return c;
  }

  async create(
    tenantId: string,
    data: { name: string; platform: string; budget: number; config?: Record<string, unknown> }
  ) {
    if (!adChannelRegistry.isSupported(data.platform)) {
      throw new ValidationError(`Unsupported ad platform: ${data.platform}`);
    }
    return this.campaigns.create({
      tenantId,
      name: data.name,
      platform: data.platform,
      pluginId: PLATFORM_PLUGIN_ID[data.platform]!,
      budget: String(data.budget),
      config: data.config ?? {},
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; budget?: number; config?: Record<string, unknown> }
  ) {
    await this.get(tenantId, id);
    return this.campaigns.update(tenantId, id, {
      name: data.name,
      budget: data.budget !== undefined ? String(data.budget) : undefined,
      config: data.config,
    });
  }

  async activate(tenantId: string, id: string) {
    const campaign = await this.get(tenantId, id);
    if (campaign.status === 'active') return campaign;
    const adapter = adChannelRegistry.getAdapter(campaign.platform as AdPlatform);
    const config: CampaignConfig = {
      name: campaign.name,
      budget: parseFloat(campaign.budget),
      ...(campaign.config as Record<string, unknown>),
    };
    const { externalId } = await adapter.createCampaign(config);
    return this.campaigns.update(tenantId, id, { status: 'active', externalId });
  }

  async pause(tenantId: string, id: string) {
    const campaign = await this.get(tenantId, id);
    if (campaign.status !== 'active') {
      throw new ValidationError('Only active campaigns can be paused');
    }
    const adapter = adChannelRegistry.getAdapter(campaign.platform as AdPlatform);
    if (campaign.externalId) await adapter.pauseCampaign(campaign.externalId);
    return this.campaigns.update(tenantId, id, { status: 'paused' });
  }

  async delete(tenantId: string, id: string) {
    const campaign = await this.get(tenantId, id);
    if (campaign.externalId) {
      try {
        await adChannelRegistry
          .getAdapter(campaign.platform as AdPlatform)
          .deleteCampaign(campaign.externalId);
      } catch {}
    }
    await this.campaigns.delete(tenantId, id);
    return { deleted: true };
  }

  async getMetrics(tenantId: string, id: string, dateRange: DateRange) {
    const campaign = await this.get(tenantId, id);
    if (campaign.status !== 'active' || !campaign.externalId) {
      return { impressions: 0, clicks: 0, conversions: 0, spend: 0, cpc: 0, cpa: 0, roas: 0 };
    }
    return adChannelRegistry
      .getAdapter(campaign.platform as AdPlatform)
      .getCampaignMetrics(campaign.externalId, dateRange);
  }
}
