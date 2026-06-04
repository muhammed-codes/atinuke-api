import { UserRole, UserStatus } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  status: UserStatus;
  bodyId: string | null;
}
