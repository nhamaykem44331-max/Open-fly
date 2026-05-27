// Port from apg-manager/apps/api/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

// Dùng: @CurrentUser() user trong controller
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;

    // Nếu truyền field cụ thể, chỉ trả về field đó
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
