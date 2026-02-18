import { UserRepo } from '../infra/UserRepo';
import { hashPassword, verifyPassword } from '../../../shared/infra/password';
import { ConflictError } from '../../../shared/domain/errors';

export class AuthService {
  constructor(private users = new UserRepo()) {}

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    tenantId?: string;
  }) {
    if (await this.users.findByEmail(data.email)) {
      throw new ConflictError('User with this email already exists');
    }
    const { password, ...rest } = data;
    return this.users.create({ ...rest, passwordHash: await hashPassword(password), role: 'customer' });
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    return (user && (await verifyPassword(password, user.passwordHash))) ? user : null;
  }

  async getMe(userId: string) {
    return this.users.findById(userId);
  }
}
