// Port from apg-manager/apps/api/src/common/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách role được phép từ decorator @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có yêu cầu role cụ thể, cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: UserRole };
    }>();

    // Kiểm tra user có role được phép không
    const hasRole = requiredRoles.includes(request.user?.role as UserRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Bạn không có quyền thực hiện hành động này. Cần quyền: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
