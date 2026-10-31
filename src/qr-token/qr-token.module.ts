import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientModule } from '../patient/patient.module';
import { QrTokenService } from './qr-token.service';
import { QrTokenResolver } from './qr-token.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), PatientModule],
  providers: [QrTokenService, QrTokenResolver],
  exports: [QrTokenService],
})
export class QrTokenModule {}
