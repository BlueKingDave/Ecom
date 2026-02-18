export type TenantId  = string & { readonly __brand: 'TenantId' };
export type UserId    = string & { readonly __brand: 'UserId' };
export type OrderId   = string & { readonly __brand: 'OrderId' };
export type ProductId = string & { readonly __brand: 'ProductId' };
export type CampaignId = string & { readonly __brand: 'CampaignId' };

export const asTenantId   = (id: string): TenantId   => id as TenantId;
export const asUserId     = (id: string): UserId     => id as UserId;
export const asOrderId    = (id: string): OrderId    => id as OrderId;
export const asCampaignId = (id: string): CampaignId => id as CampaignId;
