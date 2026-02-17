const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
class AdminApiClient {
    async request(endpoint, options) {
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
    async getTenants() {
        return this.request('/tenants');
    }
    async getTenant(id) {
        return this.request(`/tenants/${id}`);
    }
    async createTenant(data) {
        return this.request('/tenants', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateTenant(id, data) {
        return this.request(`/tenants/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    // Products
    async getProducts(limit = 100, offset = 0) {
        return this.request(`/products?limit=${limit}&offset=${offset}`);
    }
    async getProduct(id) {
        return this.request(`/products/${id}`);
    }
    async createProduct(data) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateProduct(id, data) {
        return this.request(`/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    }
    // Orders
    async getOrders(limit = 50, offset = 0) {
        return this.request(`/orders?limit=${limit}&offset=${offset}`);
    }
    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }
    async updateOrderStatus(id, status) {
        return this.request(`/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }
    // Plugins
    async getPlugins() {
        return this.request('/plugins');
    }
    async getPlugin(id) {
        return this.request(`/plugins/${id}`);
    }
    async updatePluginConfig(id, config) {
        return this.request(`/plugins/${id}/config`, {
            method: 'PATCH',
            body: JSON.stringify({ config }),
        });
    }
    async togglePlugin(id, enabled) {
        return this.request(`/plugins/${id}/${enabled ? 'enable' : 'disable'}`, {
            method: 'POST',
        });
    }
}
export const adminApi = new AdminApiClient();
