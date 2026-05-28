import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  MuadiRawFare,
  MuadiRawFlight,
} from '../../integrations/muadi/muadi-provider.interface';

export type PassengerType = 'ADT' | 'CHD' | 'INF';

@ValidatorConstraint({ name: 'hasAdultPassenger', async: false })
class HasAdultPassenger implements ValidatorConstraintInterface {
  validate(passengers: HoldPassengerDto[]): boolean {
    return passengers.some((passenger) => passenger.type === 'ADT');
  }

  defaultMessage(): string {
    return 'Booking phải có ít nhất 1 người lớn';
  }
}

@ValidatorConstraint({ name: 'infantCountNotGreaterThanAdult', async: false })
class InfantCountNotGreaterThanAdult implements ValidatorConstraintInterface {
  validate(passengers: HoldPassengerDto[], args: ValidationArguments): boolean {
    const dto = args.object as HoldBookingDto;
    const adults = dto.passengers.filter(
      (passenger) => passenger.type === 'ADT',
    ).length;
    const infants = dto.passengers.filter(
      (passenger) => passenger.type === 'INF',
    ).length;

    return infants <= adults;
  }

  defaultMessage(): string {
    return 'Số em bé không được vượt quá số người lớn';
  }
}

export class HoldPassengerDto {
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
  type!: PassengerType;
}

export class HoldContactDto {
  @IsString()
  @Matches(/^\+84[0-9]{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;
}

export class HoldBookingDto {
  @IsString()
  offerId!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  sessionId!: number;

  @IsString()
  fareClass!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => HoldPassengerDto)
  @Validate(HasAdultPassenger)
  @Validate(InfantCountNotGreaterThanAdult)
  passengers!: HoldPassengerDto[];

  @ValidateNested()
  @Type(() => HoldContactDto)
  contact!: HoldContactDto;

  @IsOptional()
  @IsObject()
  rawFlight?: MuadiRawFlight;

  @IsOptional()
  @IsObject()
  rawFare?: MuadiRawFare;
}
