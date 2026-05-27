// Port from apg-manager/apps/api/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export type CurrentUserPayload = {
  id: string;
  role: UserRole;
  phone?: string;
  email?: string;
  [key: string]: unknown;
};

// Dùng: @CurrentUser() user trong controller
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    const user = request.user;

    // Nếu truyền field cụ thể, chỉ trả về field đó
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
