const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
class ApiClient {
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
    // Products
    async getProducts(limit = 50, offset = 0) {
        return this.request(`/products?limit=${limit}&offset=${offset}`);
    }
    async getProduct(id) {
        return this.request(`/products/${id}`);
    }
    // Cart
    async getCart(sessionId) {
        return this.request('/cart', {
            headers: sessionId ? { 'X-Session-Id': sessionId } : {},
        });
    }
    async addToCart(item, sessionId) {
        return this.request('/cart/items', {
            method: 'POST',
            headers: sessionId ? { 'X-Session-Id': sessionId } : {},
            body: JSON.stringify(item),
        });
    }
    async updateCartItem(productId, quantity, sessionId) {
        return this.request(`/cart/items/${productId}`, {
            method: 'PATCH',
            headers: sessionId ? { 'X-Session-Id': sessionId } : {},
            body: JSON.stringify({ quantity }),
        });
    }
    async removeFromCart(productId, sessionId) {
        return this.request(`/cart/items/${productId}`, {
            method: 'DELETE',
            headers: sessionId ? { 'X-Session-Id': sessionId } : {},
        });
    }
    async clearCart(sessionId) {
        return this.request('/cart', {
            method: 'DELETE',
            headers: sessionId ? { 'X-Session-Id': sessionId } : {},
        });
    }
    // Orders
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }
    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }
}
export const api = new ApiClient();
