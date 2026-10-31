import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { appError } from '../common/errors/app.errors';
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import { AuthPayloadModel } from './dto/auth-payload.model';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

  async requestOtp(identifier: string): Promise<boolean> {
    await this.otpService.requestOtp(identifier);
    return true;
  }

  async verifyOtp(identifier: string, otp: string): Promise<AuthPayloadModel> {
    const isValid = await this.otpService.verifyOtp(identifier, otp);

    if (!isValid) {
      throw appError('INVALID_OTP', 'The OTP provided is incorrect.');
    }

    let user = await this.usersService.findByIdentifier(identifier);

    if (!user) {
      user = await this.usersService.createPatientUser(identifier);
    }

    return this.issueAuthPayload(user);
  }

  async refreshToken(token: string): Promise<AuthPayloadModel> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh'),
      });
    } catch {
      throw appError('UNAUTHENTICATED', 'Refresh token is invalid or expired.');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw appError('UNAUTHENTICATED', 'User no longer exists.');
    }

    return this.issueAuthPayload(user);
  }

  private async issueAuthPayload(user: User): Promise<AuthPayloadModel> {
    const payload: JwtPayload = { sub: user.id, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change-me-access'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
      user: await this.usersService.toModel(user),
    };
  }
}
