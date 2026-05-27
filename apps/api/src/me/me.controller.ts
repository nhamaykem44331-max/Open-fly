import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';

@Controller('me')
export class MeController {
  @Get()
  getMe(@CurrentUser() user: UserPublicDto): UserPublicDto {
    return user;
  }
}
