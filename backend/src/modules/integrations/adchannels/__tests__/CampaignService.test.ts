import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { CampaignService } from '../application/CampaignService';
import { CampaignRepo } from '../infra/persistence/CampaignRepo';
import { adChannelRegistry } from '../infra/AdChannelRegistry';
import { NotFoundError, ValidationError } from '../../../../shared/domain/errors';

vi.mock('../infra/persistence/CampaignRepo');

const TENANT = 'tenant-1';

function makeCampaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 'camp-1',
    tenantId: TENANT,
    name: 'Test Campaign',
    platform: 'meta',
    pluginId: 'meta-ads',
    externalId: null,
    status: 'draft',
    budget: '100.00',
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('CampaignService', () => {
  let service: CampaignService;
  let repo: Mocked<CampaignRepo>;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new CampaignRepo() as Mocked<CampaignRepo>;
    service = new CampaignService(repo);
  });

  describe('create', () => {
    it('saves as draft without dispatching to platform', async () => {
      const campaign = makeCampaign();
      repo.create = vi.fn().mockResolvedValue(campaign);

      const result = await service.create(TENANT, {
        name: 'Test Campaign',
        platform: 'meta',
        budget: 100,
      });

      expect(repo.create).toHaveBeenCalledWith({
        tenantId: TENANT,
        name: 'Test Campaign',
        platform: 'meta',
        pluginId: 'meta-ads',
        budget: '100',
        config: {},
      });
      expect(result.status).toBe('draft');
    });

    it('rejects unsupported platform (twitter)', async () => {
      await expect(
        service.create(TENANT, { name: 'X Campaign', platform: 'twitter', budget: 100 })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('activate', () => {
    it('dispatches to adapter, stores externalId, sets status=active', async () => {
      const draft = makeCampaign({ status: 'draft', externalId: null });
      const activated = makeCampaign({ status: 'active', externalId: 'meta_camp_abc12345' });

      repo.findById = vi.fn().mockResolvedValue(draft);
      repo.update = vi.fn().mockResolvedValue(activated);

      const result = await service.activate(TENANT, 'camp-1');

      expect(repo.update).toHaveBeenCalledWith(
        TENANT,
        'camp-1',
        expect.objectContaining({ status: 'active', externalId: expect.stringMatching(/^meta_camp_/) })
      );
      expect(result?.status).toBe('active');
    });

    it('is idempotent (already active → returns campaign unchanged)', async () => {
      const active = makeCampaign({ status: 'active', externalId: 'meta_camp_xyz' });
      repo.findById = vi.fn().mockResolvedValue(active);
      repo.update = vi.fn();

      const result = await service.activate(TENANT, 'camp-1');

      expect(repo.update).not.toHaveBeenCalled();
      expect(result!.status).toBe('active');
    });
  });

  describe('pause', () => {
    it('pauses an active campaign', async () => {
      const active = makeCampaign({ status: 'active', externalId: 'meta_camp_xyz' });
      const paused = makeCampaign({ status: 'paused', externalId: 'meta_camp_xyz' });

      repo.findById = vi.fn().mockResolvedValue(active);
      repo.update = vi.fn().mockResolvedValue(paused);

      const result = await service.pause(TENANT, 'camp-1');

      expect(repo.update).toHaveBeenCalledWith(TENANT, 'camp-1', { status: 'paused' });
      expect(result?.status).toBe('paused');
    });

    it('throws if campaign is not active', async () => {
      const draft = makeCampaign({ status: 'draft' });
      repo.findById = vi.fn().mockResolvedValue(draft);

      await expect(service.pause(TENANT, 'camp-1')).rejects.toThrow(ValidationError);
    });
  });

  describe('getMetrics', () => {
    it('returns zeros for draft campaign', async () => {
      const draft = makeCampaign({ status: 'draft', externalId: null });
      repo.findById = vi.fn().mockResolvedValue(draft);

      const metrics = await service.getMetrics(TENANT, 'camp-1', {
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(metrics).toEqual({
        impressions: 0, clicks: 0, conversions: 0,
        spend: 0, cpc: 0, cpa: 0, roas: 0,
      });
    });

    it('returns stub metrics for active campaign', async () => {
      const active = makeCampaign({ status: 'active', externalId: 'meta_camp_xyz' });
      repo.findById = vi.fn().mockResolvedValue(active);

      const metrics = await service.getMetrics(TENANT, 'camp-1', {
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(metrics.impressions).toBeGreaterThan(0);
      expect(metrics.roas).toBeGreaterThan(0);
    });
  });

  describe('get (not found)', () => {
    it('throws NotFoundError when campaign does not exist', async () => {
      repo.findById = vi.fn().mockResolvedValue(null);
      await expect(service.get(TENANT, 'nonexistent')).rejects.toThrow(NotFoundError);
    });
  });
});

describe('AdChannelRegistry', () => {
  it('supports meta, tiktok, google but not twitter', () => {
    expect(adChannelRegistry.isSupported('meta')).toBe(true);
    expect(adChannelRegistry.isSupported('tiktok')).toBe(true);
    expect(adChannelRegistry.isSupported('google')).toBe(true);
    expect(adChannelRegistry.isSupported('twitter')).toBe(false);
  });

  it('returns correct adapter platformId for each platform', () => {
    expect(adChannelRegistry.getAdapter('meta').platformId).toBe('meta');
    expect(adChannelRegistry.getAdapter('tiktok').platformId).toBe('tiktok');
    expect(adChannelRegistry.getAdapter('google').platformId).toBe('google');
  });
});
