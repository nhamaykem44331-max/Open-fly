import { Controller, Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';

@Controller('me')
export class MeController {
  @Get()
  getMe(@CurrentUser() user: User) {
    return UserPublicDto.fromPrisma(user);
  }
}
