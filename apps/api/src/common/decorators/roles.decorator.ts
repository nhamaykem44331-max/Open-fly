// Port from apg-manager/apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Dùng: @Roles(UserRole.ADMIN) trên route
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
