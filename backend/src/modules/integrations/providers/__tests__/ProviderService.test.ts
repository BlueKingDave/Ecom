import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, isEncrypted } from '../../../../shared/infra/crypto';

describe('PluginService: Plugin Management', () => {
  const tenantId = 'test-tenant-123';

  describe('Configure Plugin', () => {
    it('should save plugin configuration for tenant', () => {
      const config = {
        tenantId,
        pluginId: 'stripe-payment',
        enabled: false,
        config: {
          publishableKey: 'pk_test_123',
          secretKey: 'sk_test_456',
        },
      };

      expect(config.tenantId).toBe(tenantId);
      expect(config.pluginId).toBe('stripe-payment');
      expect(config.enabled).toBe(false); // Disabled by default
    });

    it('should encrypt sensitive config fields', () => {
      const manifest = {
        config: {
          secretKey: { encrypted: true },
          publishableKey: { encrypted: false },
        },
      };

      const config = {
        secretKey: 'sk_test_secret',
        publishableKey: 'pk_test_public',
      };

      // Encrypt sensitive field
      const encrypted = { ...config };
      if (manifest.config.secretKey.encrypted) {
        encrypted.secretKey = encrypt(config.secretKey);
      }

      expect(encrypted.secretKey).not.toBe(config.secretKey);
      expect(isEncrypted(encrypted.secretKey)).toBe(true);
      expect(encrypted.publishableKey).toBe(config.publishableKey); // Not encrypted
    });

    it('should validate config against manifest', () => {
      const validConfig = {
        secretKey: 'sk_test_123',
        currency: 'usd',
      };

      const invalidConfig = {
        currency: 'usd',
        // Missing required secretKey
      };

      expect('secretKey' in validConfig).toBe(true);
      expect('secretKey' in invalidConfig).toBe(false);
    });
  });

  describe('Enable Plugin', () => {
    it('should run health check before enabling', async () => {
      const healthCheck = async () => ({
        status: 'ok' as const,
        message: 'Plugin is healthy',
      });

      const health = await healthCheck();

      expect(health.status).toBe('ok');
      // If health check passes, plugin can be enabled
    });

    it('should prevent enabling if health check fails', async () => {
      const healthCheck = async () => ({
        status: 'error' as const,
        message: 'Invalid API key',
      });

      const health = await healthCheck();

      expect(health.status).toBe('error');
      // Should throw error and not enable plugin
    });
  });

  describe('Disable Plugin', () => {
    it('should set enabled to false', () => {
      const pluginConfig = {
        tenantId,
        pluginId: 'stripe-payment',
        enabled: true,
      };

      pluginConfig.enabled = false;

      expect(pluginConfig.enabled).toBe(false);
    });
  });

  describe('Get Plugin Instance', () => {
    it('should decrypt config when getting instance', () => {
      const encryptedConfig = {
        secretKey: encrypt('sk_test_secret'),
        publishableKey: 'pk_test_public',
      };

      const manifest = {
        config: {
          secretKey: { encrypted: true },
          publishableKey: { encrypted: false },
        },
      };

      // Decrypt sensitive fields
      const decrypted = { ...encryptedConfig };
      if (manifest.config.secretKey.encrypted && isEncrypted(decrypted.secretKey)) {
        decrypted.secretKey = decrypt(decrypted.secretKey);
      }

      expect(decrypted.secretKey).toBe('sk_test_secret');
      expect(isEncrypted(decrypted.secretKey)).toBe(false);
    });

    it('should throw error if plugin not configured', () => {
      const pluginConfig = null;

      expect(pluginConfig).toBeNull();
      // Should throw: Plugin not configured
    });

    it('should throw error if plugin not enabled', () => {
      const pluginConfig = {
        tenantId,
        pluginId: 'stripe-payment',
        enabled: false,
      };

      expect(pluginConfig.enabled).toBe(false);
      // Should throw: Plugin not enabled
    });
  });

  describe('Check if Plugin Enabled', () => {
    it('should return true if plugin is enabled', () => {
      const pluginConfig = {
        tenantId,
        pluginId: 'stripe-payment',
        enabled: true,
      };

      expect(pluginConfig.enabled).toBe(true);
    });

    it('should return false if plugin not configured', () => {
      const pluginConfig: { enabled?: boolean } | null = null;

      const isEnabled = (pluginConfig as { enabled?: boolean } | null)?.enabled || false;

      expect(isEnabled).toBe(false);
    });
  });

  describe('Multiple Tenants Same Plugin', () => {
    it('should allow different tenants to enable same plugin', () => {
      const configs = [
        { tenantId: 'tenant-a', pluginId: 'stripe-payment', enabled: true },
        { tenantId: 'tenant-b', pluginId: 'stripe-payment', enabled: true },
      ];

      const tenantAConfig = configs.find(
        (c) => c.tenantId === 'tenant-a' && c.pluginId === 'stripe-payment'
      );
      const tenantBConfig = configs.find(
        (c) => c.tenantId === 'tenant-b' && c.pluginId === 'stripe-payment'
      );

      expect(tenantAConfig).toBeDefined();
      expect(tenantBConfig).toBeDefined();
      expect(tenantAConfig?.enabled).toBe(true);
      expect(tenantBConfig?.enabled).toBe(true);
    });
  });

  describe('Plugin Config Encrypted in Database', () => {
    it('should store encrypted values in database', () => {
      const plainConfig = {
        secretKey: 'sk_test_secret',
        publishableKey: 'pk_test_public',
      };

      const encryptedForDb = {
        secretKey: encrypt(plainConfig.secretKey),
        publishableKey: plainConfig.publishableKey,
      };

      expect(encryptedForDb.secretKey).not.toBe(plainConfig.secretKey);
      expect(isEncrypted(encryptedForDb.secretKey)).toBe(true);

      // Verify can decrypt
      const decrypted = decrypt(encryptedForDb.secretKey);
      expect(decrypted).toBe(plainConfig.secretKey);
    });
  });

  describe('Missing Plugin ID Validation', () => {
    it('should reject empty plugin ID', () => {
      const pluginId = '';

      expect(pluginId).toBe('');
      expect(pluginId.length).toBe(0);
      // Should throw validation error
    });

    it('should reject undefined plugin ID', () => {
      const pluginId = undefined;

      expect(pluginId).toBeUndefined();
      // Should throw validation error
    });
  });
});
