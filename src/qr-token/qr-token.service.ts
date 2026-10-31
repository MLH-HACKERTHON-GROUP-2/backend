import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../common/redis/redis.service';
import { appError } from '../common/errors/app.errors';
import { QrTokenModel } from './models/qr-token.model';

function tokenKey(token: string): string {
  return `qr_token:${token}`;
}

function patientTokenKey(patientId: string): string {
  return `patient_qr_token:${patientId}`;
}

@Injectable()
export class QrTokenService {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private get ttlSeconds(): number {
    return Number(this.configService.get('QR_TOKEN_TTL_SECONDS', 120));
  }

  private get baseUrl(): string {
    return this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
  }

  async generate(patientId: string): Promise<QrTokenModel> {
    const previousToken = await this.redis.get(patientTokenKey(patientId));
    if (previousToken) {
      await this.redis.del(tokenKey(previousToken));
    }

    const token = randomUUID();
    const ttl = this.ttlSeconds;

    await this.redis.set(tokenKey(token), patientId, 'EX', ttl);
    await this.redis.set(patientTokenKey(patientId), token, 'EX', ttl);

    return {
      token,
      qrCodeUrl: `${this.baseUrl}/scan/${token}`,
      expiresAt: new Date(Date.now() + ttl * 1000),
    };
  }

  /**
   * Redis can't distinguish "this token's TTL ran out" from "this token was
   * never issued / already rotated away" once the key is gone — both just
   * look like a miss. We report every miss as TOKEN_EXPIRED since that's
   * the scenario the demo actually exercises (the 2-minute countdown);
   * TOKEN_NOT_FOUND is defined in the contract but not distinguishable here.
   */
  async resolve(token: string): Promise<string> {
    const patientId = await this.redis.get(tokenKey(token));

    if (!patientId) {
      throw appError('TOKEN_EXPIRED', 'This QR code has expired. Ask the patient to refresh it.');
    }

    return patientId;
  }
}
