import { TenantRepo } from '../infra/TenantRepo';

export class TenantService {
  constructor(private repo = new TenantRepo()) {}

  async getTenant(id: string) {
    return this.repo.findById(id);
  }

  async getAllTenants() {
    return this.repo.findAll();
  }
}
