import { pluginRegistry } from '../infra/registry/ProviderRegistry';
import type { BasePlugin } from '../domain/Provider';
import { encrypt, decrypt, isEncrypted } from '../../../../shared/infra/crypto';
import { ProviderConfigRepo } from '../infra/persistence/ProviderConfigRepo';

export class ProviderService {
  constructor(private repo = new ProviderConfigRepo()) {}

  /**
   * Get plugin configuration for a tenant
   */
  async getPluginConfig(tenantId: string, pluginId: string) {
    return this.repo.findOne(tenantId, pluginId);
  }

  /**
   * Get all plugin configurations for a tenant
   */
  async getTenantPlugins(tenantId: string) {
    return this.repo.findAllByTenant(tenantId);
  }

  /**
   * Install/configure plugin for a tenant
   */
  async configurePlugin(tenantId: string, pluginId: string, config: Record<string, unknown>) {
    // Verify plugin exists in registry
    const manifest = pluginRegistry.getManifest(pluginId);
    if (!manifest) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    // Encrypt sensitive fields
    const encryptedConfig = this.encryptSensitiveFields(manifest, config);

    return this.repo.upsert(tenantId, pluginId, encryptedConfig, false);
  }

  /**
   * Enable plugin for a tenant
   */
  async enablePlugin(tenantId: string, pluginId: string) {
    const config = await this.getPluginConfig(tenantId, pluginId);
    if (!config) {
      throw new Error(`Plugin ${pluginId} not configured for tenant ${tenantId}`);
    }

    try {
      const decryptedConfig = this.decryptSensitiveFields(pluginId, config.config as Record<string, unknown>);
      const instance = await pluginRegistry.instantiatePlugin(pluginId, decryptedConfig);
      const health = await instance.healthCheck();

      if (health.status !== 'ok') {
        throw new Error(`Plugin health check failed: ${health.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to initialize plugin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return this.repo.setEnabled(tenantId, pluginId, true);
  }

  /**
   * Disable plugin for a tenant
   */
  async disablePlugin(tenantId: string, pluginId: string) {
    return this.repo.setEnabled(tenantId, pluginId, false);
  }

  /**
   * Get plugin instance for a tenant
   */
  async getPluginInstance(tenantId: string, pluginId: string): Promise<BasePlugin> {
    const config = await this.getPluginConfig(tenantId, pluginId);

    if (!config) {
      throw new Error(`Plugin ${pluginId} not configured for tenant ${tenantId}`);
    }

    if (!config.enabled) {
      throw new Error(`Plugin ${pluginId} is not enabled for tenant ${tenantId}`);
    }

    const decryptedConfig = this.decryptSensitiveFields(pluginId, config.config as Record<string, unknown>);
    return pluginRegistry.instantiatePlugin(pluginId, decryptedConfig);
  }

  /**
   * Check if plugin is enabled for tenant
   */
  async isPluginEnabled(tenantId: string, pluginId: string): Promise<boolean> {
    const config = await this.getPluginConfig(tenantId, pluginId);
    return config?.enabled || false;
  }

  /**
   * Encrypt sensitive configuration fields based on manifest
   */
  private encryptSensitiveFields(manifest: any, config: Record<string, unknown>): Record<string, unknown> {
    const result = { ...config };

    if (manifest.config) {
      for (const [key, field] of Object.entries(manifest.config)) {
        const fieldConfig = field as { encrypted?: boolean };

        if (fieldConfig.encrypted && result[key] && typeof result[key] === 'string') {
          const value = result[key] as string;
          if (!isEncrypted(value)) {
            result[key] = encrypt(value);
          }
        }
      }
    }

    return result;
  }

  /**
   * Decrypt sensitive configuration fields based on manifest
   */
  private decryptSensitiveFields(pluginId: string, config: Record<string, unknown>): Record<string, unknown> {
    const result = { ...config };
    const manifest = pluginRegistry.getManifest(pluginId);

    if (!manifest || !manifest.config) {
      return result;
    }

    for (const [key, field] of Object.entries(manifest.config)) {
      const fieldConfig = field as { encrypted?: boolean };

      if (fieldConfig.encrypted && result[key] && typeof result[key] === 'string') {
        const value = result[key] as string;

        if (isEncrypted(value)) {
          try {
            result[key] = decrypt(value);
          } catch (error) {
            throw new Error(`Failed to decrypt config field '${key}': ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }
    }

    return result;
  }
}
