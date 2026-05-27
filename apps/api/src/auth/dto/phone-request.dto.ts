import { IsString, Matches } from 'class-validator';

export class PhoneRequestDto {
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  @Matches(/^\+84[0-9]{9}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone!: string;
}
