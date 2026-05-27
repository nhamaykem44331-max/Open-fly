import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'destinationDifferentFromOrigin', async: false })
class DestinationDifferentFromOrigin implements ValidatorConstraintInterface {
  validate(destination: string, args: ValidationArguments): boolean {
    const dto = args.object as SearchParamsDto;
    return destination !== dto.origin;
  }

  defaultMessage(): string {
    return 'Điểm đến phải khác điểm khởi hành';
  }
}

@ValidatorConstraint({ name: 'flightDateInRange', async: false })
class FlightDateInRange implements ValidatorConstraintInterface {
  validate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return false;
    }

    const selected = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(selected.getTime())) {
      return false;
    }

    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    );
    const maxDate = new Date(todayUtc);
    maxDate.setUTCFullYear(maxDate.getUTCFullYear() + 1);

    return selected >= todayUtc && selected <= maxDate;
  }

  defaultMessage(): string {
    return 'Ngày bay không hợp lệ';
  }
}

@ValidatorConstraint({ name: 'infantNotGreaterThanAdult', async: false })
class InfantNotGreaterThanAdult implements ValidatorConstraintInterface {
  validate(paxInf: number, args: ValidationArguments): boolean {
    const dto = args.object as SearchParamsDto;
    return paxInf <= dto.paxAdt;
  }

  defaultMessage(): string {
    return 'Số em bé không được vượt quá số người lớn';
  }
}

export class SearchParamsDto {
  @IsString({ message: 'Sân bay khởi hành không hợp lệ' })
  @Matches(/^[A-Z]{3}$/, { message: 'Sân bay khởi hành không hợp lệ' })
  origin!: string;

  @IsString({ message: 'Sân bay đến không hợp lệ' })
  @Matches(/^[A-Z]{3}$/, { message: 'Sân bay đến không hợp lệ' })
  @Validate(DestinationDifferentFromOrigin)
  destination!: string;

  @IsString({ message: 'Ngày bay không hợp lệ' })
  @Validate(FlightDateInRange)
  date!: string;

  @IsInt({ message: 'Số người lớn không hợp lệ' })
  @Type(() => Number)
  @Min(1, { message: 'Số người lớn không hợp lệ' })
  @Max(9, { message: 'Số người lớn không hợp lệ' })
  paxAdt!: number;

  @IsInt({ message: 'Số trẻ em không hợp lệ' })
  @Type(() => Number)
  @Min(0, { message: 'Số trẻ em không hợp lệ' })
  @Max(9, { message: 'Số trẻ em không hợp lệ' })
  paxChd!: number;

  @IsInt({ message: 'Số em bé không hợp lệ' })
  @Type(() => Number)
  @Min(0, { message: 'Số em bé không hợp lệ' })
  @Max(9, { message: 'Số em bé không hợp lệ' })
  @Validate(InfantNotGreaterThanAdult)
  paxInf!: number;
}
