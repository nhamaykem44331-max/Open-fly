// Port from apg-manager/apps/api/src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPublicDto } from '../dto/user-public.dto';

type CurrentUserValue = UserPublicDto | UserPublicDto[keyof UserPublicDto] | undefined;

// Dùng: @CurrentUser() user trong controller
export const CurrentUser = createParamDecorator<
  keyof UserPublicDto | undefined,
  ExecutionContext,
  CurrentUserValue
>(
  (data: keyof UserPublicDto | undefined, ctx: ExecutionContext): CurrentUserValue => {
    const request = ctx.switchToHttp().getRequest<{ user?: UserPublicDto }>();
    const user = request.user;

    // Nếu truyền field cụ thể, chỉ trả về field đó
    if (data) {
      return user?.[data];
    }

    return user;
  },
);
