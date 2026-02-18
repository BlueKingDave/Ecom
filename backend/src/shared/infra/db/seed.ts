import { db } from './index';
import { tenants, users, products, pluginConfigs } from './schema';
import { hashPassword } from '../password';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create default tenant
    const [defaultTenant] = await db
      .insert(tenants)
      .values({
        slug: 'demo-store',
        domain: 'demo.localhost',
        name: 'Demo Store',
        themeConfig: {
          primaryColor: '#3b82f6',
          logo: '/logo.png',
          theme: 'modern',
        },
      })
      .onConflictDoNothing()
      .returning();

    if (!defaultTenant) {
      throw new Error('Failed to create tenant');
    }

    console.log('✅ Created tenant:', defaultTenant.name);

    // Create admin user (for platform operations)
    const adminPasswordHash = await hashPassword('password');
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@ecom-platform.local',
        passwordHash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'operator',
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    console.log('✅ Created admin user:', adminUser.email);

    // Create demo customer for tenant
    const customerPasswordHash = await hashPassword('password');
    const [demoCustomer] = await db
      .insert(users)
      .values({
        tenantId: defaultTenant.id,
        email: 'customer@demo-store.local',
        passwordHash: customerPasswordHash,
        firstName: 'Demo',
        lastName: 'Customer',
        role: 'customer',
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!demoCustomer) {
      throw new Error('Failed to create demo customer');
    }

    console.log('✅ Created demo customer:', demoCustomer.email);

    // Create sample products
    const sampleProducts = [
      {
        tenantId: defaultTenant.id,
        name: 'Custom T-Shirt',
        description: 'Personalized t-shirt with your cartoonified photo',
        price: '29.99',
        compareAtPrice: '39.99',
        images: ['/products/tshirt-1.jpg', '/products/tshirt-2.jpg'],
        metadata: {
          category: 'apparel',
          sizes: ['S', 'M', 'L', 'XL'],
          colors: ['white', 'black', 'navy'],
        },
      },
      {
        tenantId: defaultTenant.id,
        name: 'Custom Mug',
        description: 'Ceramic mug featuring your AI-generated cartoon',
        price: '19.99',
        images: ['/products/mug-1.jpg'],
        metadata: {
          category: 'home',
          capacity: '11oz',
        },
      },
      {
        tenantId: defaultTenant.id,
        name: 'Custom Poster',
        description: 'High-quality poster print of your cartoonified image',
        price: '24.99',
        images: ['/products/poster-1.jpg'],
        metadata: {
          category: 'decor',
          sizes: ['12x18', '18x24', '24x36'],
        },
      },
    ];

    await db.insert(products).values(sampleProducts);
    console.log(`✅ Created ${sampleProducts.length} sample products`);

    // Configure Stripe plugin for demo tenant (placeholder config)
    await db
      .insert(pluginConfigs)
      .values({
        tenantId: defaultTenant.id,
        pluginId: 'stripe-payment',
        enabled: true,
        config: {
          publishableKey: 'pk_test_placeholder',
          secretKey: 'sk_test_placeholder', // In production, encrypt this
          webhookSecret: 'whsec_placeholder',
        },
      })
      .onConflictDoNothing();

    console.log('✅ Configured Stripe plugin');

    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📝 Default credentials:');
    console.log('   Admin: admin@ecom-platform.local / password');
    console.log('   Customer: customer@demo-store.local / password');
    console.log('   Tenant: demo-store (http://demo.localhost:3000)');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }

  process.exit(0);
}

seed();
