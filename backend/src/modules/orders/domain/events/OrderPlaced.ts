export interface OrderPlacedEvent {
  orderId: string;
  tenantId: string;
  total: string;
  timestamp: Date;
}
