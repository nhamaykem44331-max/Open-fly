import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserPublicDto } from '../common/dto/user-public.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateNotificationPrefsDto,
  UpsertPassengerDto,
  UpsertVatProfileDto,
} from './dto/profile.dto';

@Controller('me')
export class ProfileController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Saved passengers ────────────────────────────────────────────
  @Get('passengers')
  passengers(@CurrentUser() user: UserPublicDto) {
    return this.prisma.savedPassenger.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  @Post('passengers')
  async addPassenger(
    @Body() dto: UpsertPassengerDto,
    @CurrentUser() user: UserPublicDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.savedPassenger.updateMany({
          where: { userId: user.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.savedPassenger.create({
        data: { ...passengerData(dto), userId: user.id },
      });
    });
  }

  @Patch('passengers/:id')
  async updatePassenger(
    @Param('id') id: string,
    @Body() dto: UpsertPassengerDto,
    @CurrentUser() user: UserPublicDto,
  ) {
    await this.requireOwned('savedPassenger', id, user.id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.savedPassenger.updateMany({
          where: { userId: user.id, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        });
      }
      return tx.savedPassenger.update({ where: { id }, data: passengerData(dto) });
    });
  }

  @Delete('passengers/:id')
  @HttpCode(200)
  async deletePassenger(
    @Param('id') id: string,
    @CurrentUser() user: UserPublicDto,
  ) {
    await this.requireOwned('savedPassenger', id, user.id);
    await this.prisma.savedPassenger.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ─── VAT profiles ────────────────────────────────────────────────
  @Get('vat-profiles')
  vatProfiles(@CurrentUser() user: UserPublicDto) {
    return this.prisma.savedVatProfile.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  @Post('vat-profiles')
  async addVatProfile(
    @Body() dto: UpsertVatProfileDto,
    @CurrentUser() user: UserPublicDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.savedVatProfile.updateMany({
          where: { userId: user.id, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      return tx.savedVatProfile.create({
        data: { ...vatData(dto), userId: user.id },
      });
    });
  }

  @Patch('vat-profiles/:id')
  async updateVatProfile(
    @Param('id') id: string,
    @Body() dto: UpsertVatProfileDto,
    @CurrentUser() user: UserPublicDto,
  ) {
    await this.requireOwned('savedVatProfile', id, user.id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.savedVatProfile.updateMany({
          where: { userId: user.id, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        });
      }
      return tx.savedVatProfile.update({ where: { id }, data: vatData(dto) });
    });
  }

  @Delete('vat-profiles/:id')
  @HttpCode(200)
  async deleteVatProfile(
    @Param('id') id: string,
    @CurrentUser() user: UserPublicDto,
  ) {
    await this.requireOwned('savedVatProfile', id, user.id);
    await this.prisma.savedVatProfile.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ─── Notification preferences ────────────────────────────────────
  @Get('notification-preferences')
  async notificationPrefs(@CurrentUser() user: UserPublicDto) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });
    return prefs ?? defaultPrefs(user.id);
  }

  @Patch('notification-preferences')
  async updateNotificationPrefs(
    @Body() dto: UpdateNotificationPrefsDto,
    @CurrentUser() user: UserPublicDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...dto },
      update: { ...dto },
    });
  }

  private async requireOwned(
    model: 'savedPassenger' | 'savedVatProfile',
    id: string,
    userId: string,
  ): Promise<void> {
    const row =
      model === 'savedPassenger'
        ? await this.prisma.savedPassenger.findUnique({ where: { id }, select: { userId: true } })
        : await this.prisma.savedVatProfile.findUnique({ where: { id }, select: { userId: true } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Không tìm thấy bản ghi');
    }
  }
}

function passengerData(
  dto: UpsertPassengerDto,
): Omit<Prisma.SavedPassengerUncheckedCreateInput, 'userId' | 'id'> {
  return {
    fullName: dto.fullName,
    gender: dto.gender ?? null,
    dob: dto.dob ? new Date(dto.dob) : null,
    isChild: dto.isChild ?? false,
    cccd: dto.cccd ?? null,
    passport: dto.passport ?? null,
    nationality: dto.nationality ?? 'VN',
    passportExp: dto.passportExp ? new Date(dto.passportExp) : null,
    isPrimary: dto.isPrimary ?? false,
  };
}

function vatData(
  dto: UpsertVatProfileDto,
): Omit<Prisma.SavedVatProfileUncheckedCreateInput, 'userId' | 'id'> {
  return {
    companyName: dto.companyName,
    taxId: dto.taxId,
    address: dto.address,
    email: dto.email ?? null,
    isPrimary: dto.isPrimary ?? false,
  };
}

function defaultPrefs(userId: string) {
  return {
    userId,
    pushEnabled: true,
    telegramEnabled: false,
    emailEnabled: true,
    zaloEnabled: false,
    telegramChatId: null,
    zaloUserId: null,
    quietHoursStart: null,
    quietHoursEnd: null,
  };
}
