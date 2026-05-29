import {
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpsertPassengerDto {
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsISO8601()
  dob?: string;

  @IsOptional()
  @IsBoolean()
  isChild?: boolean;

  @IsOptional()
  @IsString()
  cccd?: string;

  @IsOptional()
  @IsString()
  passport?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsISO8601()
  passportExp?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpsertVatProfileDto {
  @IsString()
  @MaxLength(255)
  companyName!: string;

  @IsString()
  @Matches(/^\d{10}(-\d{3})?$/, { message: 'Mã số thuế phải 10 hoặc 13 chữ số' })
  taxId!: string;

  @IsString()
  @MaxLength(500)
  address!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateNotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  zaloEnabled?: boolean;

  @IsOptional()
  @IsString()
  telegramChatId?: string;

  @IsOptional()
  @IsString()
  zaloUserId?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Giờ phải dạng HH:mm' })
  quietHoursStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Giờ phải dạng HH:mm' })
  quietHoursEnd?: string;
}
