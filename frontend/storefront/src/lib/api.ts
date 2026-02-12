const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  images: string[];
  metadata?: Record<string, unknown>;
}

export interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
  itemCount: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderRequest {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
}

export interface Order {
  id: string;
  status: string;
  items: CartItem[];
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
}

class ApiClient {
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

  // Products
  async getProducts(limit = 50, offset = 0): Promise<{ products: Product[] }> {
    return this.request(`/products?limit=${limit}&offset=${offset}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  // Cart
  async getCart(sessionId?: string): Promise<Cart> {
    return this.request('/cart', {
      headers: sessionId ? { 'X-Session-Id': sessionId } : {},
    });
  }

  async addToCart(item: CartItem, sessionId?: string): Promise<Cart> {
    return this.request('/cart/items', {
      method: 'POST',
      headers: sessionId ? { 'X-Session-Id': sessionId } : {},
      body: JSON.stringify(item),
    });
  }

  async updateCartItem(productId: string, quantity: number, sessionId?: string): Promise<Cart> {
    return this.request(`/cart/items/${productId}`, {
      method: 'PATCH',
      headers: sessionId ? { 'X-Session-Id': sessionId } : {},
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string, sessionId?: string): Promise<Cart> {
    return this.request(`/cart/items/${productId}`, {
      method: 'DELETE',
      headers: sessionId ? { 'X-Session-Id': sessionId } : {},
    });
  }

  async clearCart(sessionId?: string): Promise<Cart> {
    return this.request('/cart', {
      method: 'DELETE',
      headers: sessionId ? { 'X-Session-Id': sessionId } : {},
    });
  }

  // Orders
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id: string): Promise<Order> {
    return this.request(`/orders/${id}`);
  }
}

export const api = new ApiClient();
