import { IsString, IsUUID } from 'class-validator';

export class VoiceOtpDto {
  @IsString({ message: 'Mã thử thách không hợp lệ' })
  @IsUUID('4', { message: 'Mã thử thách không hợp lệ' })
  challengeId!: string;
}
