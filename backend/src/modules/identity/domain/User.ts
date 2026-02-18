export interface User {
  id: string;
  tenantId?: string | null;
  email: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  emailVerified?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}
