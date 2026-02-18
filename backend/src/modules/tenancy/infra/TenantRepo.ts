import { db } from '../../../shared/infra/db';
import { tenants } from '../../../shared/infra/db/schema';
import { eq, or } from 'drizzle-orm';

export class TenantRepo {
  async findById(id: string) {
    const [r] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return r ?? null;
  }

  async findByDomainOrSlug(hostname: string, subdomain: string) {
    const [r] = await db.select().from(tenants)
      .where(or(eq(tenants.domain, hostname), eq(tenants.slug, subdomain))).limit(1);
    return r ?? null;
  }

  async findAll() {
    return db.select().from(tenants);
  }
}
