import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import type { PluginManifest, BasePlugin } from './interfaces';

export class PluginRegistry {
  private plugins: Map<string, { manifest: PluginManifest; instance?: BasePlugin }> = new Map();
  private pluginsPath: string;

  constructor(pluginsPath: string = join(process.cwd(), '../../plugins')) {
    this.pluginsPath = pluginsPath;
  }

  /**
   * Discover all plugins in the plugins directory
   */
  async discoverPlugins(): Promise<void> {
    try {
      const directories = await readdir(this.pluginsPath, { withFileTypes: true });

      for (const dir of directories) {
        if (dir.isDirectory()) {
          await this.loadPlugin(dir.name);
        }
      }

      console.log(`📦 Discovered ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('Error discovering plugins:', error);
      // Don't fail if plugins directory doesn't exist
    }
  }

  /**
   * Load a single plugin
   */
  async loadPlugin(pluginId: string): Promise<void> {
    try {
      const pluginPath = join(this.pluginsPath, pluginId);
      const manifestPath = join(pluginPath, 'manifest.json');

      // Read manifest
      const manifestContent = await readFile(manifestPath, 'utf-8');
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // Validate manifest
      this.validateManifest(manifest);

      // Store plugin (don't instantiate yet - that happens on enable)
      this.plugins.set(pluginId, { manifest });

      console.log(`✅ Loaded plugin: ${manifest.name} v${manifest.version}`);
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginId}:`, error);
    }
  }

  /**
   * Get plugin manifest
   */
  getManifest(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId)?.manifest;
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }

  /**
   * Get plugins by type
   */
  getPluginsByType(type: PluginManifest['type']): PluginManifest[] {
    return this.getAllPlugins().filter((p) => p.type === type);
  }

  /**
   * Instantiate plugin with configuration
   */
  async instantiatePlugin(pluginId: string, config: Record<string, unknown>): Promise<BasePlugin> {
    const pluginData = this.plugins.get(pluginId);
    if (!pluginData) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // If already instantiated, return existing instance
    if (pluginData.instance) {
      return pluginData.instance;
    }

    // Validate config against manifest
    this.validateConfig(pluginData.manifest, config);

    // Load plugin module
    const pluginPath = join(this.pluginsPath, pluginId, pluginData.manifest.main);
    const PluginClass = await import(pluginPath).then((m) => m.default);

    // Create instance
    const instance: BasePlugin = new PluginClass();
    await instance.initialize(config);

    // Cache instance
    pluginData.instance = instance;

    return instance;
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version || !manifest.type || !manifest.main) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }

    const validTypes = ['fulfillment', 'payment', 'ad_platform', 'analytics'];
    if (!validTypes.includes(manifest.type)) {
      throw new Error(`Invalid plugin type: ${manifest.type}`);
    }
  }

  /**
   * Validate configuration against manifest
   */
  private validateConfig(manifest: PluginManifest, config: Record<string, unknown>): void {
    for (const [key, field] of Object.entries(manifest.config)) {
      if (field.required && config[key] === undefined) {
        throw new Error(`Missing required config field: ${key}`);
      }

      if (config[key] !== undefined) {
        // Basic type checking
        const actualType = typeof config[key];
        if (field.type === 'json' && actualType !== 'object') {
          throw new Error(`Config field ${key} must be of type object`);
        } else if (field.type !== 'json' && actualType !== field.type) {
          throw new Error(`Config field ${key} must be of type ${field.type}`);
        }
      }
    }
  }
}

// Global plugin registry instance
export const pluginRegistry = new PluginRegistry();
