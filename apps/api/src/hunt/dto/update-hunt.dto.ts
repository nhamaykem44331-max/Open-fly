import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AutoHoldPassengerDto,
  HUNT_CHANNELS,
} from './create-hunt.dto';

export class UpdateHuntDto {
  // Tạm dừng / chạy lại hunt.
  @IsOptional()
  @IsString()
  @IsIn(['pause', 'resume'])
  action?: 'pause' | 'resume';

  @IsOptional()
  @IsInt()
  @Min(1)
  targetPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMinutes?: number;

  @IsOptional()
  @IsString()
  cabin?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  airlines?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(HUNT_CHANNELS, { each: true })
  channels?: string[];

  @IsOptional()
  @IsBoolean()
  autoHoldEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AutoHoldPassengerDto)
  autoHoldPassengers?: AutoHoldPassengerDto[];

  @IsOptional()
  @Matches(/^\+84[0-9]{9}$/, { message: 'Số điện thoại không hợp lệ' })
  autoHoldContactPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  autoHoldContactEmail?: string;
}
