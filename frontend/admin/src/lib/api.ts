const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Tenant {
  id: string;
  slug: string;
  domain?: string;
  name: string;
  themeConfig?: Record<string, unknown>;
  createdAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  externalId?: string;
  pluginId?: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  images: string[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

export interface Order {
  id: string;
  tenantId: string;
  userId?: string;
  externalId?: string;
  pluginId?: string;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    price: string;
    quantity: number;
    image?: string;
  }>;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  shippingAddress: Record<string, string>;
  createdAt: string;
}

export type PluginCapability =
  | 'catalog.sync' | 'inventory.update' | 'price.update'
  | 'order.create' | 'order.status' | 'order.cancel' | 'webhook.inbound';

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
  encrypted?: boolean;
  description?: string;
  default?: unknown;
}

export interface Plugin {
  id: string;          // pluginConfig UUID
  pluginId: string;    // 'printify-fulfillment'
  tenantId: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  manifest?: {
    id: string;
    name: string;
    version: string;
    type: string;
    description?: string;
    capabilities?: PluginCapability[];
    config: Record<string, ConfigField>;
  };
}

class AdminApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Tenants (Note: Backend doesn't have these endpoints yet - will return 404)
  async getTenants(): Promise<{ tenants: Tenant[] }> {
    return this.request('/tenants');
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.request(`/tenants/${id}`);
  }

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    return this.request(`/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Products
  async getProducts(limit = 100, offset = 0): Promise<{ products: Product[] }> {
    return this.request(`/products?limit=${limit}&offset=${offset}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(limit = 50, offset = 0): Promise<{ orders: Order[] }> {
    return this.request(`/orders?limit=${limit}&offset=${offset}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Plugins
  async getPlugins(): Promise<{ plugins: Plugin[] }> {
    return this.request('/plugins');
  }

  async getTenantPlugins(): Promise<{ plugins: Plugin[] }> {
    return this.request('/plugins/tenant');
  }

  async getPlugin(id: string): Promise<Plugin> {
    return this.request(`/plugins/${id}`);
  }

  async updatePluginConfig(pluginId: string, config: Record<string, unknown>): Promise<Plugin> {
    return this.request(`/plugins/${pluginId}/configure`, {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
  }

  async togglePlugin(pluginId: string, enabled: boolean): Promise<Plugin> {
    return this.request(`/plugins/${pluginId}/${enabled ? 'enable' : 'disable'}`, {
      method: 'POST',
    });
  }

  async getPluginHealth(pluginId: string): Promise<{ status: 'ok' | 'error'; message?: string }> {
    return this.request(`/plugins/${pluginId}/health`);
  }

  async syncCatalog(pluginId: string): Promise<{ synced: number }> {
    return this.request(`/plugins/${pluginId}/sync-catalog`, {
      method: 'POST',
    });
  }
}

export const adminApi = new AdminApiClient();
