export interface CartItem {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  image?: string;
  metadata?: Record<string, unknown>;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
  itemCount: number;
}
