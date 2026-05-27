import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleSignInDto {
  @IsString({ message: 'Google token không hợp lệ' })
  @IsNotEmpty({ message: 'Google token không hợp lệ' })
  idToken!: string;
}
