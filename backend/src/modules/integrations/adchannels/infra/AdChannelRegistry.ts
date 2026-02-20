import type { AdChannel, AdPlatform } from '../domain/AdChannel';
import { MetaAdsAdapter } from './adapters/meta/MetaAdsAdapter';
import { TikTokAdsAdapter } from './adapters/tiktok/TikTokAdsAdapter';
import { GoogleAdsAdapter } from './adapters/google/GoogleAdsAdapter';

class AdChannelRegistry {
  private readonly adapters: Map<AdPlatform, AdChannel> = new Map<AdPlatform, AdChannel>([
    ['meta', new MetaAdsAdapter()],
    ['tiktok', new TikTokAdsAdapter()],
    ['google', new GoogleAdsAdapter()],
  ]);

  getAdapter(platform: AdPlatform): AdChannel {
    const a = this.adapters.get(platform);
    if (!a) throw new Error(`No adapter for platform: ${platform}`);
    return a;
  }

  isSupported(platform: string): platform is AdPlatform {
    return this.adapters.has(platform as AdPlatform);
  }
}

export const adChannelRegistry = new AdChannelRegistry();
