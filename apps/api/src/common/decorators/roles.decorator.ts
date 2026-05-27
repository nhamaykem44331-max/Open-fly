// Port from apg-manager/apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

// Dùng: @Roles(UserRole.ADMIN, UserRole.MANAGER) trên route
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
