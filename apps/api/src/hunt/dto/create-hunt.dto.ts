import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { HuntFlexibility } from '@prisma/client';

export const HUNT_FLEXIBILITIES: HuntFlexibility[] = [
  'EXACT_DATE',
  'DATE_RANGE',
  'WEEK_OF_MONTH',
  'WHOLE_MONTH',
  'ANY_DAY',
];

export const HUNT_CHANNELS = ['telegram', 'email', 'push', 'zalo', 'in_app'];

export class AutoHoldPassengerDto {
  @IsString()
  @IsIn(['MR', 'MRS', 'MS', 'MISS', 'MSTR'])
  title!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsString()
  @IsIn(['ADT', 'CHD', 'INF'])
  type!: 'ADT' | 'CHD' | 'INF';
}

export class CreateHuntDto {
  @IsString()
  @Length(3, 3)
  fromCode!: string;

  @IsString()
  @Length(3, 3)
  toCode!: string;

  @IsString()
  @IsIn(HUNT_FLEXIBILITIES)
  flexibility!: HuntFlexibility;

  @IsISO8601()
  windowStart!: string;

  @IsISO8601()
  windowEnd!: string;

  // Giá mục tiêu: VND nguyên đồng (Q-45), so với GIÁ BÁN.
  @IsInt()
  @Min(1)
  targetPrice!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  pax?: number;

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

  // Sẽ bị ép về tối thiểu theo tier nếu nhỏ hơn (xử lý ở service).
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMinutes?: number;

  @IsOptional()
  @IsBoolean()
  autoHoldEnabled?: boolean;

  // Bắt buộc khi autoHoldEnabled=true (validate cross-field ở service).
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
