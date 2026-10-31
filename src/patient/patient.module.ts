import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { WalletModule } from '../wallet/wallet.module';
import { PatientService } from './patient.service';
import { PatientResolver } from './patient.resolver';

@Module({
  imports: [forwardRef(() => AuthModule), UsersModule, WalletModule],
  providers: [PatientService, PatientResolver],
  exports: [PatientService],
})
export class PatientModule {}
