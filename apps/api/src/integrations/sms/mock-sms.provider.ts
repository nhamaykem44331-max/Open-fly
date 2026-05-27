import { Injectable } from '@nestjs/common';
import { ISmsProvider } from './sms-provider.interface';

function maskPhone(phone: string) {
  if (phone.startsWith('+84') && phone.length >= 7) {
    return `+84***${phone.slice(-4)}`;
  }

  return `***${phone.slice(-4)}`;
}

@Injectable()
export class MockSmsProvider implements ISmsProvider {
  async sendOtp(phone: string, otp: string): Promise<void> {
    console.log(`📱 [MOCK SMS] To ${maskPhone(phone)}: OTP ${otp}`);
  }

  async sendVoiceOtp(phone: string, otp: string): Promise<void> {
    const spokenOtp = otp.split('').join('-');
    console.log(
      `📞 [MOCK VOICE] Calling ${maskPhone(phone)}: robot reads "Mã OpenFly của bạn là ${spokenOtp}"`,
    );
  }
}
