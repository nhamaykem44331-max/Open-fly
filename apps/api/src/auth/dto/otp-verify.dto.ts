import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class OtpVerifyDto {
  @IsString({ message: 'Mã thử thách không hợp lệ' })
  @IsUUID('4', { message: 'Mã thử thách không hợp lệ' })
  challengeId!: string;

  @IsString({ message: 'Mã OTP phải 6 chữ số' })
  @Length(6, 6, { message: 'Mã OTP phải 6 chữ số' })
  @Matches(/^[0-9]{6}$/, { message: 'Mã OTP phải 6 chữ số' })
  otp!: string;
}
