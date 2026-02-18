import { db } from '../db';
import { pluginConfigs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { pluginRegistry } from '../plugins/plugin-registry';
import type { BasePlugin } from '../plugins/interfaces';
import { encrypt, decrypt, isEncrypted } from '../utils/crypto';

export class PluginService {
  /**
   * Get plugin configuration for a tenant
   */
  async getPluginConfig(tenantId: string, pluginId: string) {
    const [config] = await db
      .select()
      .from(pluginConfigs)
      .where(and(eq(pluginConfigs.tenantId, tenantId), eq(pluginConfigs.pluginId, pluginId)))
      .limit(1);

    return config;
  }

  /**
   * Get all plugin configurations for a tenant
   */
  async getTenantPlugins(tenantId: string) {
    return db.select().from(pluginConfigs).where(eq(pluginConfigs.tenantId, tenantId));
  }

  /**
   * Install/configure plugin for a tenant
   */
  async configurePlugin(
    tenantId: string,
    pluginId: string,
    config: Record<string, unknown>
  ) {
    // Verify plugin exists in registry
    const manifest = pluginRegistry.getManifest(pluginId);
    if (!manifest) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    // Encrypt sensitive fields (in production, use proper encryption)
    // For now, we'll just mark them as encrypted
    const encryptedConfig = this.encryptSensitiveFields(manifest, config);

    // Upsert configuration
    const [pluginConfig] = await db
      .insert(pluginConfigs)
      .values({
        tenantId,
        pluginId,
        config: encryptedConfig,
        enabled: false, // Disabled by default
      })
      .onConflictDoUpdate({
        target: [pluginConfigs.tenantId, pluginConfigs.pluginId],
        set: {
          config: encryptedConfig,
          updatedAt: new Date(),
        },
      })
      .returning();

    return pluginConfig;
  }

  /**
   * Enable plugin for a tenant
   */
  async enablePlugin(tenantId: string, pluginId: string) {
    // Get config
    const config = await this.getPluginConfig(tenantId, pluginId);
    if (!config) {
      throw new Error(`Plugin ${pluginId} not configured for tenant ${tenantId}`);
    }

    // Test plugin initialization with decrypted config
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

    // Enable in database
    const [updated] = await db
      .update(pluginConfigs)
      .set({
        enabled: true,
        updatedAt: new Date(),
      })
      .where(and(eq(pluginConfigs.tenantId, tenantId), eq(pluginConfigs.pluginId, pluginId)))
      .returning();

    return updated;
  }

  /**
   * Disable plugin for a tenant
   */
  async disablePlugin(tenantId: string, pluginId: string) {
    const [updated] = await db
      .update(pluginConfigs)
      .set({
        enabled: false,
        updatedAt: new Date(),
      })
      .where(and(eq(pluginConfigs.tenantId, tenantId), eq(pluginConfigs.pluginId, pluginId)))
      .returning();

    return updated;
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

    // Decrypt sensitive fields
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

    // Iterate through manifest config fields
    if (manifest.config) {
      for (const [key, field] of Object.entries(manifest.config)) {
        const fieldConfig = field as { encrypted?: boolean };

        // If field is marked as encrypted and has a value
        if (fieldConfig.encrypted && result[key] && typeof result[key] === 'string') {
          const value = result[key] as string;

          // Only encrypt if not already encrypted
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

    // Iterate through manifest config fields
    for (const [key, field] of Object.entries(manifest.config)) {
      const fieldConfig = field as { encrypted?: boolean };

      // If field is marked as encrypted and has a value
      if (fieldConfig.encrypted && result[key] && typeof result[key] === 'string') {
        const value = result[key] as string;

        // Only decrypt if it appears to be encrypted
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
