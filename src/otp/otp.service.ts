import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEMO_OTP = '000000';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly configService: ConfigService) {}

  private get demoMode(): boolean {
    return this.configService.get<string>('DEMO_MODE', 'true') === 'true';
  }

  /**
   * No real dispatch in demo mode — every identifier's OTP is the fixed
   * DEMO_OTP. Logged so a developer can see it without an SMS/email provider.
   */
  async requestOtp(identifier: string): Promise<void> {
    if (this.demoMode) {
      this.logger.log(`OTP for ${identifier} is ${DEMO_OTP} (DEMO_MODE)`);
      return;
    }

    throw new Error('Non-demo OTP dispatch is not implemented.');
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    if (this.demoMode) {
      return otp === DEMO_OTP;
    }

    throw new Error('Non-demo OTP verification is not implemented.');
  }
}
