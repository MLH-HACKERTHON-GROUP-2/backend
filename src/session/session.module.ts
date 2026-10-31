import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QrTokenModule } from '../qr-token/qr-token.module';
import { PatientModule } from '../patient/patient.module';
import { DoctorModule } from '../doctor/doctor.module';
import { HospitalModule } from '../hospital/hospital.module';
import { WalletModule } from '../wallet/wallet.module';
import { SessionService } from './session.service';
import { SessionResolver } from './session.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), QrTokenModule, PatientModule, DoctorModule, HospitalModule, WalletModule],
  providers: [SessionService, SessionResolver],
  exports: [SessionService],
})
export class SessionModule {}
