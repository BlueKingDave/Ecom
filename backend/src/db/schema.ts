import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, jsonb, integer, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tenants (Storefronts)
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  domain: varchar('domain', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  themeConfig: jsonb('theme_config').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('tenant_slug_idx').on(table.slug),
  domainIdx: index('tenant_domain_idx').on(table.domain),
}));

// Users (Customers & Admins)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: varchar('role', { length: 20 }).notNull().default('customer'), // customer | admin | operator
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
  tenantIdx: index('user_tenant_idx').on(table.tenantId),
}));

// Products (Catalog)
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  externalId: varchar('external_id', { length: 255 }),
  pluginId: varchar('plugin_id', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal('compare_at_price', { precision: 10, scale: 2 }),
  images: jsonb('images').default([]),
  metadata: jsonb('metadata').default({}),
  inventoryCount: integer('inventory_count'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('product_tenant_idx').on(table.tenantId),
  externalIdx: index('product_external_idx').on(table.externalId, table.pluginId),
}));

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  externalId: varchar('external_id', { length: 255 }),
  pluginId: varchar('plugin_id', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | processing | completed | cancelled
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  shipping: decimal('shipping', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  items: jsonb('items').notNull(),
  shippingAddress: jsonb('shipping_address'),
  billingAddress: jsonb('billing_address'),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  carrierCode: varchar('carrier_code', { length: 50 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('order_tenant_idx').on(table.tenantId),
  userIdx: index('order_user_idx').on(table.userId),
  statusIdx: index('order_status_idx').on(table.status),
}));

// Assets (Uploaded photos, AI results)
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull(), // original | cartoonified
  storagePath: varchar('storage_path', { length: 500 }).notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('asset_tenant_idx').on(table.tenantId),
  userIdx: index('asset_user_idx').on(table.userId),
  typeIdx: index('asset_type_idx').on(table.type),
}));

// Ad Campaigns
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // google | meta | tiktok | twitter
  pluginId: varchar('plugin_id', { length: 50 }).notNull(),
  externalId: varchar('external_id', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft | active | paused | completed
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('campaign_tenant_idx').on(table.tenantId),
  platformIdx: index('campaign_platform_idx').on(table.platform),
  statusIdx: index('campaign_status_idx').on(table.status),
}));

// Plugin Configurations (per tenant)
export const pluginConfigs = pgTable('plugin_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  pluginId: varchar('plugin_id', { length: 50 }).notNull(),
  enabled: boolean('enabled').default(false),
  config: jsonb('config').notNull(), // Encrypted API keys, settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantPluginIdx: unique('tenant_plugin_unique').on(table.tenantId, table.pluginId),
  tenantIdx: index('plugin_config_tenant_idx').on(table.tenantId),
}));

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  products: many(products),
  orders: many(orders),
  assets: many(assets),
  campaigns: many(campaigns),
  pluginConfigs: many(pluginConfigs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
  assets: many(assets),
}));

export const productsRelations = relations(products, ({ one }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [assets.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  tenant: one(tenants, {
    fields: [campaigns.tenantId],
    references: [tenants.id],
  }),
}));

export const pluginConfigsRelations = relations(pluginConfigs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [pluginConfigs.tenantId],
    references: [tenants.id],
  }),
}));
