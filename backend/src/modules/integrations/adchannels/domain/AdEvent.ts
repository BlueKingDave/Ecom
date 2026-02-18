export interface ConversionEvent {
  event: 'AddToCart' | 'Purchase' | 'ViewContent' | 'Lead';
  value: number;
  currency: string;
  userId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}
